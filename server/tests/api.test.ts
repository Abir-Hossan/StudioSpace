import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from "vitest";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/app";
import { User, Studio, Booking, AuthSession } from "../src/models/index";
import { bookingTimes } from "../src/validators/schemas";
import fs from "node:fs";
import path from "node:path";
let mongo: MongoMemoryReplSet;
const owner = request.agent(app),
  creator = request.agent(app),
  stranger = request.agent(app);
const h = { "x-studiospace": "1" };
let sid = "",
  bid = "";
const studio = {
  title: "Integration Test Space",
  category: "Photo Studios",
  hourlyRate: 75,
  securityDeposit: 100,
  maxCapacity: 8,
  address: "12 Creative Avenue",
  city: "Dhaka",
  country: "Bangladesh",
  images: ["/images/studio-photo.png"],
  amenities: ["Wi-Fi"],
  overview: "A flexible daylight studio for creative productions.",
};
const future = (hours: number) =>
  new Date(Date.now() + hours * 3600000).toISOString();
beforeAll(async () => {
  Object.defineProperty(process.env, "NODE_ENV", {
    value: "test",
    configurable: true,
    enumerable: true,
    writable: true,
  });
  process.env.MONGOMS_DOWNLOAD_DIR = process.cwd() + "/work/mongodb-binaries";
  process.env.JWT_SECRET = "test-secret-only-32-characters-minimum";
  if (
    process.platform === "win32" &&
    fs.existsSync(path.resolve("work/mongodb-binaries/mongod.exe"))
  )
    process.env.MONGOMS_SYSTEM_BINARY = path.resolve(
      "work/mongodb-binaries/mongod.exe",
    );
  fs.mkdirSync(path.resolve("work"), { recursive: true });
  const dbPath = fs.mkdtempSync(path.resolve("work/api-test-"));
  mongo = await MongoMemoryReplSet.create({
    instanceOpts: [{ dbPath }],
    replSet: { count: 1 },
  });
  await mongoose.connect(mongo.getUri());
  await Promise.all([User.init(), Studio.init(), Booking.init()]);
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
describe("StudioSpace API", () => {
  it("rejects new passwords that bcrypt would silently truncate", async () => {
    const email = "long-password@test.local";
    const response = await request(app).post("/api/auth/register").set(h).send({
      name: "Long Password",
      email,
      password: "Aa" + "é".repeat(36),
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toContain("72 UTF-8 bytes");
    expect(await User.exists({ email })).toBeNull();
  });
  it("rejects unauthorized access and missing CSRF header", async () => {
    expect((await request(app).get("/api/studios/mine")).status).toBe(401);
    expect((await request(app).post("/api/auth/logout")).status).toBe(403);
  });
  it("rejects weak passwords and registers accounts", async () => {
    expect(
      (
        await owner
          .post("/api/auth/register")
          .set(h)
          .send({ name: "Host", email: "host@test.local", password: "weak" })
      ).status,
    ).toBe(400);
    for (const [agent, email, name] of [
      [owner, "host@test.local", "Host"],
      [creator, "creator@test.local", "Creator"],
      [stranger, "other@test.local", "Other"],
    ] as const)
      expect(
        (
          await agent
            .post("/api/auth/register")
            .set(h)
            .send({ name, email, password: "StrongPass1" })
        ).status,
      ).toBe(201);
  });
  it("rejects whitespace-only studio location and overview fields", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").set(h).send({
      name: "Validation Host",
      email: "validation-host@test.local",
      password: "StrongPass1",
    });
    await agent.post("/api/auth/login").set(h).send({
      email: "validation-host@test.local",
      password: "StrongPass1",
    });
    for (const field of ["address", "city", "country", "overview"] as const) {
      expect(
        (
          await agent
            .post("/api/studios")
            .set(h)
            .send({ ...studio, [field]: "   " })
        ).status,
      ).toBe(400);
    }
  });
  it("rejects duplicate email and invalid credentials", async () => {
    expect(
      (
        await owner.post("/api/auth/register").set(h).send({
          name: "Host",
          email: "host@test.local",
          password: "StrongPass1",
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await owner
          .post("/api/auth/login")
          .set(h)
          .send({ email: "host@test.local", password: "Wrong1" })
      ).status,
    ).toBe(401);
  });
  it("logs in and retains sessions", async () => {
    for (const [agent, email] of [
      [owner, "host@test.local"],
      [creator, "creator@test.local"],
      [stranger, "other@test.local"],
    ] as const)
      expect(
        (
          await agent
            .post("/api/auth/login")
            .set(h)
            .send({ email, password: "StrongPass1" })
        ).status,
      ).toBe(200);
    expect((await owner.get("/api/auth/me")).body.email).toBe(
      "host@test.local",
    );
  });
  it("creates and queries studios with server-derived ownership", async () => {
    const r = await owner
      .post("/api/studios")
      .set(h)
      .send({ ...studio, ownerId: "forged" });
    expect(r.status).toBe(201);
    sid = r.body._id;
    expect(r.body.ownerEmail).toBe("host@test.local");
    expect(
      (
        await creator.get(
          "/api/studios?search=Integration&category=Photo%20Studios&sort=price-asc",
        )
      ).body.total,
    ).toBe(1);
    expect((await creator.get("/api/studios/featured")).body).toHaveLength(1);
  });
  it("validates IDs and enforces editing ownership", async () => {
    expect((await creator.get("/api/studios/not-an-id")).status).toBe(404);
    expect(
      (
        await creator
          .patch("/api/studios/" + sid)
          .set(h)
          .send(studio)
      ).status,
    ).toBe(403);
    expect(
      (
        await owner
          .patch("/api/studios/" + sid)
          .set(h)
          .send({ ...studio, title: "Updated Test Space" })
      ).status,
    ).toBe(200);
    expect((await creator.delete("/api/studios/" + sid).set(h)).status).toBe(
      403,
    );
  });
  it("rejects invalid and past booking times", async () => {
    expect(() => bookingTimes(future(3), future(2))).toThrow();
    expect(() => bookingTimes(future(-3), future(-2))).toThrow();
    expect(
      (
        await creator
          .post("/api/bookings")
          .set(h)
          .send({ studioId: sid, startTime: future(-2), endTime: future(-1) })
      ).status,
    ).toBe(400);
  });
  it("uses authoritative pricing and creates Pending requests", async () => {
    const start = future(48),
      end = new Date(+new Date(start) + 2 * 3600000).toISOString();
    const r = await creator
      .post("/api/bookings")
      .set(h)
      .send({ studioId: sid, startTime: start, endTime: end, totalPrice: 1 });
    expect(r.status).toBe(201);
    bid = r.body._id;
    expect(r.body.totalPrice).toBe(250);
    expect(r.body.status).toBe("Pending");
  });
  it("prevents unauthorized confirmation", async () => {
    expect(
      (
        await stranger
          .patch("/api/bookings/" + bid + "/status")
          .set(h)
          .send({ status: "Confirmed" })
      ).status,
    ).toBe(403);
  });
  it("atomically prevents concurrent conflicting confirmations", async () => {
    const b = await Booking.findById(bid);
    const r = await stranger.post("/api/bookings").set(h).send({
      studioId: sid,
      startTime: b!.startTime!.toISOString(),
      endTime: b!.endTime!.toISOString(),
    });
    expect(r.status).toBe(201);
    const results = await Promise.all([
      owner
        .patch("/api/bookings/" + bid + "/status")
        .set(h)
        .send({ status: "Confirmed" }),
      owner
        .patch("/api/bookings/" + r.body._id + "/status")
        .set(h)
        .send({ status: "Confirmed" }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await Booking.countDocuments({ status: "Confirmed" })).toBe(1);
  });
  it("protects booking history from deletion and rejects confirmed overlap", async () => {
    expect((await owner.delete("/api/studios/" + sid).set(h)).status).toBe(409);
    const b = await Booking.findOne({ status: "Confirmed" });
    expect(
      (
        await creator.post("/api/bookings").set(h).send({
          studioId: sid,
          startTime: b!.startTime!.toISOString(),
          endTime: b!.endTime!.toISOString(),
        })
      ).status,
    ).toBe(409);
  });
  it("produces an actual PDF booking summary", async () => {
    const b = await Booking.findOne({ status: "Confirmed" });
    const r = await owner.get("/api/bookings/" + b!._id + "/invoice");
    expect(r.status).toBe(200);
    expect(r.headers["content-type"]).toContain("application/pdf");
    expect(r.body.subarray(0, 4).toString()).toBe("%PDF");
  });
  it("cancels pending requests and rejects unauthorized cancellation", async () => {
    const start = future(80);
    const r = await creator
      .post("/api/bookings")
      .set(h)
      .send({
        studioId: sid,
        startTime: start,
        endTime: new Date(+new Date(start) + 3600000).toISOString(),
      });
    expect(
      (
        await stranger
          .patch("/api/bookings/" + r.body._id + "/cancel")
          .set(h)
          .send({})
      ).status,
    ).toBe(409);
    expect(
      (
        await creator
          .patch("/api/bookings/" + r.body._id + "/cancel")
          .set(h)
          .send({})
      ).body.status,
    ).toBe("Cancelled");
  });
  it("persists unique wishlist records, profile updates and dashboard values", async () => {
    await creator.post("/api/wishlist").set(h).send({ studioId: sid });
    await creator.post("/api/wishlist").set(h).send({ studioId: sid });
    expect((await creator.get("/api/wishlist")).body).toHaveLength(1);
    expect(
      (
        await creator
          .patch("/api/users/me")
          .set(h)
          .send({ name: "Updated Creator", photoURL: "" })
      ).body.name,
    ).toBe("Updated Creator");
    expect((await owner.get("/api/dashboard")).body.listings).toBe(1);
    await creator.delete("/api/wishlist/" + sid).set(h);
    expect((await creator.get("/api/wishlist")).body).toHaveLength(0);
  });
  it("only allows reviews after completed bookings", async () => {
    expect(
      (
        await creator
          .post("/api/studios/" + sid + "/reviews")
          .set(h)
          .send({ rating: 5, comment: "Great experience" })
      ).status,
    ).toBe(403);
  });
  it("completes ended sessions and persists a verified review", async () => {
    const host = await User.findOne({ email: "host@test.local" });
    const renter = await User.findOne({ email: "creator@test.local" });
    const ended = await Booking.create({
      studioId: sid,
      ownerId: host!._id,
      userId: renter!._id,
      userEmail: renter!.email,
      startTime: new Date(Date.now() - 7200000),
      endTime: new Date(Date.now() - 3600000),
      status: "Confirmed",
      totalHours: 1,
      hourlyRateSnapshot: 75,
      securityDeposit: 100,
      totalPrice: 175,
    });
    expect(
      (
        await owner
          .patch(`/api/bookings/${ended._id}/status`)
          .set(h)
          .send({ status: "Completed" })
      ).status,
    ).toBe(200);
    expect(
      (
        await creator
          .post(`/api/studios/${sid}/reviews`)
          .set(h)
          .send({ rating: 5, comment: "A thoughtful and well-equipped space." })
      ).status,
    ).toBe(201);
    expect(
      (
        await creator
          .post(`/api/studios/${sid}/reviews`)
          .set(h)
          .send({ rating: 4, comment: "Duplicate review rejected." })
      ).status,
    ).toBe(409);
    const result = await creator.get(`/api/studios/${sid}`);
    expect(result.body.averageRating).toBe(5);
    expect(result.body.reviewCount).toBe(1);
  });
  it("persists production specifications and applies precision filters", async () => {
    const data = {
      ...studio,
      title: "Precision Production Space",
      amenities: ["Wi-Fi", "Lighting kit"],
      specs: {
        usableArea: 3500,
        gridHeight: 24,
        powerSupply: "200A distribution",
        soundproofRating: "Host-listed acoustic treatment",
        access: "Ground-floor access",
        parking: "Four spaces",
      },
      rules: ["Confirm haze equipment before arrival"],
    };
    const created = await owner.post("/api/studios").set(h).send(data);
    expect(created.status).toBe(201);
    const sid2 = created.body._id;
    expect(created.body.specs.gridHeight).toBe(24);
    const found = await creator.get(
      "/api/studios?search=Precision&amenities=Lighting%20kit&crew=8&minHeight=20",
    );
    expect(found.body.total).toBe(1);
    expect(
      (await creator.get("/api/studios?search=Precision&crew=100")).body.total,
    ).toBe(0);
    expect(
      (
        await owner
          .patch("/api/studios/" + sid2)
          .set(h)
          .send({ ...data, status: "paused" })
      ).status,
    ).toBe(200);
    expect(
      (await creator.get("/api/studios?search=Precision")).body.total,
    ).toBe(0);
    expect(
      (
        await creator
          .post("/api/bookings")
          .set(h)
          .send({
            studioId: sid2,
            startTime: future(100),
            endTime: future(102),
          })
      ).status,
    ).toBe(409);
    expect(
      (
        await owner
          .patch("/api/studios/" + sid2)
          .set(h)
          .send({ ...data, status: "active" })
      ).status,
    ).toBe(200);
    expect(
      (await creator.get("/api/studios?search=Precision")).body.total,
    ).toBe(1);
    await owner.delete("/api/studios/" + sid2).set(h);
  });
  it("exports actual catalogs and booking PDFs and returns database location counts", async () => {
    const catalog = await creator.get("/api/studios/catalog.pdf");
    expect(catalog.status).toBe(200);
    expect(catalog.body.subarray(0, 4).toString()).toBe("%PDF");
    const summaries = await owner.get("/api/bookings/summary.pdf");
    expect(summaries.status).toBe(200);
    expect(summaries.body.subarray(0, 4).toString()).toBe("%PDF");
    const network = await creator.get("/api/studios/network");
    expect(network.status).toBe(200);
    expect(network.body.total).toBe(1);
    expect(network.body.cities[0].city).toBe("Dhaka");
  });
  it("persists the expanded creative profile without changing the account email", async () => {
    const r = await creator
      .patch("/api/users/me")
      .set(h)
      .send({
        name: "Updated Creator",
        photoURL: "",
        email: "forged@test.local",
        professionalTitle: "Independent Producer",
        bio: "Film and audio production.",
        phone: "+880 100000000",
        website: "https://example.com",
        portfolio: "https://example.com/reel",
        bookingPreference: "Full-day production",
        crewPreference: "11–25 people",
      });
    expect(r.status).toBe(200);
    expect(r.body.professionalTitle).toBe("Independent Producer");
    expect(r.body.email).toBe("creator@test.local");
    expect((await creator.get("/api/users/me")).body.bookingPreference).toBe(
      "Full-day production",
    );
  });
  it("deletes a studio without booking history", async () => {
    const r = await owner.post("/api/studios").set(h).send(studio);
    expect(
      (await owner.delete("/api/studios/" + r.body._id).set(h)).status,
    ).toBe(200);
  });
  it("logs out and revokes browser session access", async () => {
    expect((await creator.post("/api/auth/logout").set(h)).status).toBe(200);
    expect((await creator.get("/api/auth/me")).status).toBe(401);
  });
});

describe("authentication regression audit", () => {
  afterEach(() => { vi.restoreAllMocks(); delete process.env.GOOGLE_CLIENT_ID; delete process.env.GOOGLE_CLIENT_SECRET; });
  const state = "audit-oauth-state";
  const callback = (query: string) => request(app).get("/api/auth/google/callback?state=" + state + "&" + query).set("Cookie", "oauth_state=" + state);
  it("reports missing OAuth configuration without creating a fake session", async () => {
    delete process.env.GOOGLE_CLIENT_ID; delete process.env.GOOGLE_CLIENT_SECRET;
    const r = await request(app).get("/api/auth/google");
    expect(r.status).toBe(302); expect(r.headers.location).toContain("requires%20server%20credentials"); expect(r.headers["set-cookie"]).toBeUndefined();
  });
  it("starts Google OAuth with a short-lived state cookie", async () => {
    process.env.GOOGLE_CLIENT_ID = "audit-client"; process.env.GOOGLE_CLIENT_SECRET = "audit-secret";
    const r = await request(app).get("/api/auth/google");
    const url = new URL(r.headers.location); expect(url.hostname).toBe("accounts.google.com"); expect(url.searchParams.get("state")).toHaveLength(48); expect(String(r.headers["set-cookie"])).toContain("HttpOnly"); expect(String(r.headers["set-cookie"])).toContain("Max-Age=600");
  });
  it("rejects invalid state and handles cancelled or incomplete authorization", async () => {
    expect((await request(app).get("/api/auth/google/callback?state=wrong&code=x")).status).toBe(400);
    const cancelled = await callback("error=access_denied"); expect(cancelled.status).toBe(302); expect(decodeURIComponent(cancelled.headers.location)).toContain("was cancelled"); expect(String(cancelled.headers["set-cookie"])).toContain("oauth_state=;");
    const missing = await callback(""); expect(missing.status).toBe(302); expect(decodeURIComponent(missing.headers.location)).toContain("could not be completed");
  });
  it("handles provider token exchange failures without leaking details", async () => {
    vi.spyOn(OAuth2Client.prototype, "getToken").mockRejectedValue(new Error("private provider details"));
    const r = await callback("code=invalid"); expect(r.status).toBe(302); expect(r.headers.location).not.toContain("private");
  });
  it("creates and reuses a verified Google account with persistent sessions (mocked provider)", async () => {
    vi.spyOn(OAuth2Client.prototype, "getToken").mockResolvedValue({ tokens: { id_token: "mock-id-token" } } as never);
    vi.spyOn(OAuth2Client.prototype, "verifyIdToken").mockResolvedValue({ getPayload: () => ({ email: "GOOGLE-AUDIT@example.com", email_verified: true, name: "Google Audit" }) } as never);
    const first = await callback("code=mock-code"); expect(first.status).toBe(302); expect(first.headers.location).toContain("/dashboard");
    const cookie = (first.headers["set-cookie"] as unknown as string[]).find(c => c.startsWith("session="))!.split(";")[0];
    const me = await request(app).get("/api/auth/me").set("Cookie", cookie); expect(me.status).toBe(200); expect(me.body.email).toBe("google-audit@example.com"); expect(me.body.passwordHash).toBeUndefined();
    await callback("code=mock-code"); expect(await User.countDocuments({ email: "google-audit@example.com" })).toBe(1);
  });
  it("rejects unverified Google identity and does not silently link password accounts", async () => {
    vi.spyOn(OAuth2Client.prototype, "getToken").mockResolvedValue({ tokens: { id_token: "mock" } } as never);
    const verify = vi.spyOn(OAuth2Client.prototype, "verifyIdToken");
    verify.mockResolvedValue({ getPayload: () => ({ email: "unverified@example.com", email_verified: false }) } as never);
    expect((await callback("code=mock")).status).toBe(401); expect(await User.exists({ email: "unverified@example.com" })).toBeNull();
    const existing = await User.findOne({ authenticationProvider: "credentials" });
    verify.mockResolvedValue({ getPayload: () => ({ email: existing!.email, email_verified: true }) } as never);
    expect(decodeURIComponent((await callback("code=mock")).headers.location)).toContain("existing password");
  });
  it("revokes a copied token on logout and rejects expired and forged sessions", async () => {
    const r = await request(app).post("/api/auth/login").set(h).send({ email: "google-audit@example.com", password: "WrongPass1" }); expect(r.status).toBe(401);
    const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString() }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    expect((await request(app).get("/api/auth/me").set("Cookie", "session=" + token)).status).toBe(401);
    const google = await AuthSession.findOne(); expect(google).not.toBeNull();
    const u = await User.findOne({ email: "google-audit@example.com" });
    const valid = jwt.sign({ sub: String(u!._id) }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    const crypto = await import("node:crypto"); const hash = crypto.createHash("sha256").update(valid).digest("hex");
    await AuthSession.create({ userId: u!._id, tokenHash: hash, expiresAt: new Date(Date.now() + 60000) });
    const copied = "session=" + valid;
    expect((await request(app).get("/api/auth/me").set("Cookie", copied)).status).toBe(200);
    await request(app).post("/api/auth/logout").set(h).set("Cookie", copied);
    expect((await request(app).get("/api/auth/me").set("Cookie", copied)).status).toBe(401);
    await AuthSession.create({ userId: u!._id, tokenHash: hash, expiresAt: new Date(Date.now() - 60000) });
    expect((await request(app).get("/api/auth/me").set("Cookie", copied)).status).toBe(401);
    const expired = jwt.sign({ sub: String(u!._id) }, process.env.JWT_SECRET!, { expiresIn: -60 });
    await AuthSession.create({ userId: u!._id, tokenHash: crypto.createHash("sha256").update(expired).digest("hex"), expiresAt: new Date(Date.now() + 60000) });
    expect((await request(app).get("/api/auth/me").set("Cookie", "session=" + expired)).status).toBe(401);
  });
});


describe("request and upload security audit", () => {
  it("rejects cross-origin mutations outside test-mode bypass", async () => {
    const previous=process.env.NODE_ENV;
    try {
      process.env.NODE_ENV="development";
      expect((await request(app).post("/api/auth/logout").set(h).set("Origin","https://untrusted.invalid")).status).toBe(403);
      expect((await request(app).post("/api/auth/logout").set(h).set("Origin","http://localhost:3000")).status).toBe(200);
    } finally { process.env.NODE_ENV=previous; }
  });
  it("rejects malformed and oversized JSON without exposing a stack", async () => {
    const malformed=await request(app).post("/api/auth/login").set(h).set("Content-Type","application/json").send('{"email":'); expect(malformed.status).toBe(400); expect(malformed.body.stack).toBeUndefined();
    const large=await request(app).post("/api/auth/login").set(h).send({email:"a".repeat(1100000)}); expect(large.status).toBe(413); expect(large.body.stack).toBeUndefined();
  });
  it("treats search metacharacters literally and validates query types", async () => {
    const r=await request(app).get("/api/studios").query({search:".*"}); expect(r.status).toBe(200); expect(r.body.total).toBe(0);
    expect((await request(app).get("/api/studios?page=-1")).status).toBe(400);
    expect((await request(app).get("/api/studios?minRating=999")).status).toBe(400);
    expect((await request(app).get("/api/studios?availableDate=2026-02-31")).status).toBe(400);
  });
  it("rejects invalid image uploads as user input and converts valid images", async () => {
    const agent=request.agent(app); await agent.post("/api/auth/register").set(h).send({name:"Upload Test",email:"upload-limit@test.local",password:"StrongPass1"}); await agent.post("/api/auth/login").set(h).send({email:"upload-limit@test.local",password:"StrongPass1"});
    const invalid=await agent.post("/api/uploads").set(h).attach("image",Buffer.from("not an image"),"invalid.png"); expect(invalid.status).toBe(400); expect(invalid.body.message).toContain("valid image");
    const oversized=await agent.post("/api/uploads").set(h).attach("image",Buffer.alloc(10*1024*1024+1),"large.png"); expect(oversized.status).toBe(413); expect(oversized.body.message).toBe("Uploaded file exceeds the 10 MB limit"); expect(oversized.body.stack).toBeUndefined();
    const valid=await agent.post("/api/uploads").set(h).attach("image",path.resolve("client/public/images/studio-photo.png")); expect(valid.status).toBe(201); expect(valid.body.url).toMatch(/^\/images\/upload-.*\.png$/);
    const result=fs.readFileSync(path.resolve("client/public"+valid.body.url)); expect(result.subarray(1,4).toString()).toBe("PNG"); fs.unlinkSync(path.resolve("client/public"+valid.body.url));
  });
});
