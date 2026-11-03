import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import multer from "multer";
import sharp from "sharp";
import PDFDocument from "pdfkit";
import { OAuth2Client } from "google-auth-library";
import { z, ZodError } from "zod";
import {
  User,
  Studio,
  Booking,
  Review,
  Wishlist,
  Newsletter,
  AuthSession,
} from "./models.js";
import { registerSchema, studioSchema, bookingTimes } from "./validation.js";
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}
function fail(status: number, message: string): never {
  throw Object.assign(new Error(message), { status });
}
function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 characters");
  return process.env.JWT_SECRET;
}
const client = () => process.env.CLIENT_URL || "http://localhost:3000";
const cookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 86400000,
};
const tokenHash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
async function session(res: Response, id: string, remember = true) {
  const token = jwt.sign({ sub: id }, secret(), { expiresIn: "7d", jwtid: crypto.randomUUID() });
  await AuthSession.create({ tokenHash: tokenHash(token), userId: id, expiresAt: new Date(Date.now() + 7 * 86400000) });
  res.cookie("session", token, {
    ...cookie,
    ...(!remember ? { maxAge: undefined } : {}),
  });
}
const auth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = jwt.verify(req.cookies.session || "", secret());
    if (typeof token === "string" || !token.sub)
      fail(401, "Sign in to continue");
    if (!await AuthSession.exists({ tokenHash: tokenHash(req.cookies.session), userId: token.sub, expiresAt: { $gt: new Date() } }))
      fail(401, "Sign in to continue");
    req.userId = String(token.sub);
    next();
  } catch {
    next(Object.assign(new Error("Sign in to continue"), { status: 401 }));
  }
};
function id(value: string) {
  if (!mongoose.isValidObjectId(value)) fail(404, "Resource not found");
  return value;
}
export const app = express();
app.disable("x-powered-by");
app.use(
  helmet(),
  cors({ origin: client(), credentials: true }),
  express.json({ limit: "1mb" }),
  cookieParser(),
  rateLimit({ windowMs: 60000, limit: 500 }),
);
app.use("/api", (req, _res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (req.get("origin") !== client() && process.env.NODE_ENV !== "test")
      return next(
        Object.assign(new Error("Invalid request origin"), { status: 403 }),
      );
    if (req.get("x-studiospace") !== "1")
      return next(
        Object.assign(new Error("Missing request protection header"), {
          status: 403,
        }),
      );
  }
  next();
});
const authLimit = rateLimit({ windowMs: 900000, limit: 30 });
app.post("/api/auth/register", authLimit, async (req, res) => {
  const data = registerSchema.parse(req.body);
  if (await User.exists({ email: data.email }))
    fail(409, "Email already registered");
  await User.create({
    ...data,
    password: undefined,
    passwordHash: await bcrypt.hash(data.password, 12),
  });
  res.status(201).json({ message: "Account created. Please sign in." });
});
app.post("/api/auth/login", authLimit, async (req, res) => {
  const data = z
    .object({
      email: z.string().email(),
      password: z.string().max(128),
      remember: z.boolean().optional(),
    })
    .parse(req.body);
  const u = await User.findOne({ email: data.email.toLowerCase() }).select(
    "+passwordHash",
  );
  if (
    !u?.passwordHash ||
    !(await bcrypt.compare(data.password, u.passwordHash))
  )
    fail(401, "Email or password is incorrect");
  await session(res, String(u._id), data.remember !== false);
  res.json({ message: "Welcome back" });
});
app.post("/api/auth/logout", async (req, res) => {
  if (typeof req.cookies.session === "string")
    await AuthSession.deleteOne({ tokenHash: tokenHash(req.cookies.session) });
  res.clearCookie("session", cookie);
  res.json({ message: "Signed out" });
});
app.get(["/api/auth/me", "/api/users/me"], auth, async (req, res) => {
  const u = await User.findById(req.userId);
  if (!u) fail(401, "Account no longer exists");
  res.json(u);
});
app.patch("/api/users/me", auth, async (req, res) => {
  const data = z
    .object({
      name: z.string().trim().min(2).max(100),
      photoURL: z.union([z.string().url(), z.literal("")]),
      professionalTitle: z.string().max(100).optional(),
      bio: z.string().max(1200).optional(),
      phone: z.string().max(40).optional(),
      website: z.union([z.string().url(), z.literal("")]).optional(),
      portfolio: z.union([z.string().url(), z.literal("")]).optional(),
      bookingPreference: z.string().max(100).optional(),
      crewPreference: z.string().max(100).optional(),
    })
    .parse(req.body);
  res.json(await User.findByIdAndUpdate(req.userId, data, { new: true }));
});
const oauth = () =>
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:4000/api/auth/google/callback",
  );
app.get("/api/auth/google", (_req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    return res.redirect(
      client() +
        "/login?error=Google%20OAuth%20requires%20server%20credentials",
    );
  const state = crypto.randomBytes(24).toString("hex");
  res.cookie("oauth_state", state, { ...cookie, maxAge: 600000 });
  res.redirect(
    oauth().generateAuthUrl({ scope: ["openid", "email", "profile"], state }),
  );
});
app.get("/api/auth/google/callback", async (req, res) => {
  if (!req.query.state || req.query.state !== req.cookies.oauth_state)
    fail(400, "Invalid OAuth state");
  res.clearCookie("oauth_state", cookie);
  if (req.query.error === "access_denied")
    return res.redirect(client() + "/login?error=" + encodeURIComponent("Google sign-in was cancelled. You can try again or use your email."));
  if (typeof req.query.code !== "string" || !req.query.code || req.query.error)
    return res.redirect(client() + "/login?error=" + encodeURIComponent("Google sign-in could not be completed. Please try again."));
  const o = oauth();
  let tokens;
  try { ({ tokens } = await o.getToken(req.query.code)); }
  catch { return res.redirect(client() + "/login?error=" + encodeURIComponent("Google sign-in could not be completed. Please try again.")); }
  if (!tokens.id_token) fail(401, "Google identity could not be verified");
  const ticket = await o.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const p = ticket.getPayload();
  if (!p?.email_verified || !p.email)
    fail(401, "Google identity could not be verified");
  const email = p.email.toLowerCase();
  let u = await User.findOne({ email });
  if (u && u.authenticationProvider !== "google")
    return res.redirect(
      client() +
        "/login?error=Use%20your%20existing%20password%20to%20sign%20in",
    );
  if (!u)
    u = await User.create({
      email,
      name: p.name || p.email,
      photoURL: p.picture,
      authenticationProvider: "google",
    });
  await session(res, String(u._id));
  res.redirect(client() + "/dashboard");
});
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 }),
);
app.get("/api/studios/featured", async (req, res) => {
  const { category } = z
    .object({ category: z.string().max(80).optional() })
    .parse(req.query);
  res.json(
    await Studio.find({
      status: { $ne: "paused" },
      ...(category ? { category } : {}),
    })
      .sort({ createdAt: -1 })
      .limit(6),
  );
});
app.get("/api/studios/catalog.pdf", async (_req, res) => {
  const studios = await Studio.find().sort({ title: 1 }).limit(100);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="StudioSpace-studio-catalog.pdf"',
  );
  const pdf = new PDFDocument({ margin: 50 });
  pdf.pipe(res);
  pdf.fontSize(24).text("StudioSpace / Studio specification catalog");
  pdf
    .fontSize(10)
    .text(
      "Live local listings. Availability and equipment must be confirmed with the host.",
    );
  for (const s of studios) {
    if (pdf.y > 650) pdf.addPage();
    pdf
      .moveDown()
      .fontSize(16)
      .text(s.title || "Studio");
    pdf
      .fontSize(11)
      .text(`${s.category} / ${s.city}, ${s.country}`)
      .text(
        `$${s.hourlyRate}/hour | Deposit $${s.securityDeposit} | Capacity ${s.maxCapacity}`,
      )
      .text(s.amenities.join(", "));
    if (s.specs?.powerSupply) pdf.text("Power: " + s.specs.powerSupply);
  }
  pdf.end();
});
app.get("/api/studios/network", async (_req, res) => {
  const [total, cities, categories] = await Promise.all([
    Studio.countDocuments({ status: { $ne: "paused" } }),
    Studio.aggregate([
      { $match: { status: { $ne: "paused" } } },
      {
        $group: {
          _id: { city: "$city", country: "$country" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Studio.distinct("category", { status: { $ne: "paused" } }),
  ]);
  res.json({
    total,
    cities: cities.map((c) => ({
      city: c._id.city,
      country: c._id.country,
      count: c.count,
    })),
    categories,
  });
});
app.get("/api/studios/mine", auth, async (req, res) =>
  res.json(await Studio.find({ ownerId: req.userId }).sort({ createdAt: -1 })),
);
app.get("/api/studios", async (req, res) => {
  const q = z
    .object({
      search: z.string().max(100).optional(),
      category: z.string().optional(),
      location: z.string().max(100).optional(),
      min: z.coerce.number().min(0).optional(),
      max: z.coerce.number().min(0).optional(),
      amenities: z.string().max(500).optional(),
      minRating: z.coerce.number().min(0).max(5).optional(),
      crew: z.coerce.number().int().positive().optional(),
      availableDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      minHeight: z.coerce.number().min(0).optional(),
      page: z.coerce.number().int().min(1).max(10000).default(1),
      sort: z
        .enum(["newest", "price-asc", "price-desc", "rating"])
        .default("newest"),
    })
    .parse(req.query);
  const filter: Record<string, unknown> = { status: { $ne: "paused" } };
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (q.search) filter.title = { $regex: esc(q.search), $options: "i" };
  if (q.category) filter.category = q.category;
  if (q.location) filter.city = { $regex: esc(q.location), $options: "i" };
  if (q.amenities)
    filter.amenities = {
      $all: q.amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  if (q.minRating) filter.averageRating = { $gte: q.minRating };
  if (q.crew) filter.maxCapacity = { $gte: q.crew };
  if (q.minHeight) filter["specs.gridHeight"] = { $gte: q.minHeight };
  if (q.availableDate) {
    const start = new Date(q.availableDate + "T00:00:00.000Z");
    if (!Number.isFinite(+start)) fail(400, "Invalid availability date");
    const end = new Date(+start + 86400000);
    filter._id = {
      $nin: await Booking.distinct("studioId", {
        status: "Confirmed",
        startTime: { $lt: end },
        endTime: { $gt: start },
      }),
    };
  }
  if (q.min !== undefined || q.max !== undefined)
    filter.hourlyRate = {
      ...(q.min !== undefined ? { $gte: q.min } : {}),
      ...(q.max !== undefined ? { $lte: q.max } : {}),
    };
  const sorts: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    "price-asc": { hourlyRate: 1 },
    "price-desc": { hourlyRate: -1 },
    rating: { averageRating: -1 },
  };
  const [items, total] = await Promise.all([
    Studio.find(filter)
      .sort(sorts[q.sort])
      .skip((q.page - 1) * 9)
      .limit(9),
    Studio.countDocuments(filter),
  ]);
  res.json({ items, total, page: q.page, pages: Math.ceil(total / 9) });
});
app.post("/api/studios", auth, async (req, res) => {
  const data = studioSchema.parse(req.body);
  const u = await User.findById(req.userId).orFail();
  res.status(201).json(
    await Studio.create({
      ...data,
      ownerId: u._id,
      ownerName: u.name,
      ownerEmail: u.email,
    }),
  );
});
app.get("/api/studios/:id", async (req, res) => {
  const s = await Studio.findById(id(String(req.params.id)));
  if (!s) fail(404, "Studio not found");
  res.json(s);
});
app.patch("/api/studios/:id", auth, async (req, res) => {
  const s = await Studio.findOneAndUpdate(
    { _id: id(String(req.params.id)), ownerId: req.userId },
    { $set: studioSchema.parse(req.body) },
    { new: true },
  );
  if (!s) fail(403, "Only the host may edit this studio");
  res.json(s);
});
app.delete("/api/studios/:id", auth, async (req, res) => {
  await mongoose.connection.transaction(async (session) => {
    const s = await Studio.findOneAndUpdate(
      { _id: id(String(req.params.id)), ownerId: req.userId },
      { $inc: { revision: 1 } },
      { session, new: true },
    );
    if (!s) fail(403, "Only the host may delete this studio");
    if (await Booking.exists({ studioId: s._id }).session(session))
      fail(
        409,
        "Studios with booking history cannot be deleted. Preserve the booking record.",
      );
    await Wishlist.deleteMany({ studioId: s._id }, { session });
    await Review.deleteMany({ studioId: s._id }, { session });
    await s.deleteOne({ session });
  });
  res.json({ message: "Studio deleted" });
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});
app.post("/api/uploads", auth, upload.single("image"), async (req, res) => {
  if (!req.file) fail(400, "Choose an image");
  const filename = "upload-" + crypto.randomUUID() + ".png";
  const dir = fileURLToPath(
    new URL("../../client/public/images/", import.meta.url),
  );
  await fs.mkdir(dir, { recursive: true });
  let image: Buffer;
  try {
    image = await sharp(req.file.buffer, { limitInputPixels: 40000000 })
      .resize({ width: 1920, withoutEnlargement: true })
      .png({ compressionLevel: 9 }).toBuffer();
  } catch { fail(400, "Choose a valid image within the supported size limits"); }
  await fs.writeFile(path.join(dir, filename), image);
  res.status(201).json({ url: "/images/" + filename });
});
app.post("/api/bookings", auth, async (req, res) => {
  const d = z
    .object({
      studioId: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    })
    .parse(req.body);
  const times = bookingTimes(d.startTime, d.endTime);
  let result;
  await mongoose.connection.transaction(async (session) => {
    const s = await Studio.findOneAndUpdate(
      { _id: id(d.studioId) },
      { $inc: { revision: 1 } },
      { new: true, session },
    );
    if (!s) fail(404, "Studio not found");
    if (s.status === "paused")
      fail(
        409,
        "This studio is temporarily paused and is not accepting new requests",
      );
    if (String(s.ownerId) === req.userId)
      fail(400, "You cannot book your own studio");
    if (
      await Booking.exists({
        studioId: s._id,
        status: "Confirmed",
        startTime: { $lt: times.endTime },
        endTime: { $gt: times.startTime },
      }).session(session)
    )
      fail(409, "This time is already reserved");
    const u = await User.findById(req.userId).session(session).orFail();
    [result] = await Booking.create(
      [
        {
          ...times,
          studioId: s._id,
          userId: u._id,
          userEmail: u.email,
          ownerId: s.ownerId,
          hourlyRateSnapshot: s.hourlyRate,
          securityDeposit: s.securityDeposit,
          totalPrice:
            Math.round(
              (times.totalHours * s.hourlyRate! + s.securityDeposit!) * 100,
            ) / 100,
          status: "Pending",
        },
      ],
      { session },
    );
  });
  res.status(201).json(result);
});
app.get("/api/bookings/summary.pdf", auth, async (req, res) => {
  const bookings = await Booking.find({
    $or: [{ userId: req.userId }, { ownerId: req.userId }],
  })
    .populate("studioId")
    .sort({ startTime: -1 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="StudioSpace-booking-summaries.pdf"',
  );
  const pdf = new PDFDocument({ margin: 50 });
  pdf.pipe(res);
  pdf.fontSize(24).text("StudioSpace / Production bookings");
  pdf
    .fontSize(11)
    .text(
      "Booking summaries only. Not proof of payment. All times shown in UTC.",
    );
  if (!bookings.length) pdf.moveDown().text("No bookings to export yet.");
  for (const b of bookings) {
    if (pdf.y > 640) pdf.addPage();
    const s = b.studioId as unknown as { title?: string };
    pdf
      .moveDown()
      .fontSize(15)
      .text(s?.title || "Studio");
    pdf
      .fontSize(10)
      .text(`Reference: ${b._id} | Status: ${b.status}`)
      .text(`${b.startTime?.toISOString()} to ${b.endTime?.toISOString()}`)
      .text(
        `Duration: ${b.totalHours} hours | Rate: $${b.hourlyRateSnapshot}/hr | Deposit: $${b.securityDeposit} | Total: $${b.totalPrice}`,
      );
  }
  pdf.end();
});
app.get("/api/bookings/mine", auth, async (req, res) =>
  res.json(
    await Booking.find({ userId: req.userId })
      .populate("studioId")
      .sort({ createdAt: -1 }),
  ),
);
app.get("/api/bookings/host", auth, async (req, res) =>
  res.json(
    await Booking.find({ ownerId: req.userId })
      .populate("studioId")
      .sort({ createdAt: -1 }),
  ),
);
app.get("/api/studios/:id/availability", async (req, res) =>
  res.json(
    await Booking.find({
      studioId: id(String(req.params.id)),
      status: "Confirmed",
      endTime: { $gte: new Date() },
    }).select("startTime endTime"),
  ),
);
app.patch("/api/bookings/:id/cancel", auth, async (req, res) => {
  const b = await Booking.findOneAndUpdate(
    { _id: id(String(req.params.id)), userId: req.userId, status: "Pending" },
    { $set: { status: "Cancelled" } },
    { new: true },
  );
  if (!b) fail(409, "Only your pending requests can be cancelled");
  res.json(b);
});
app.patch("/api/bookings/:id/status", auth, async (req, res) => {
  const { status } = z
    .object({ status: z.enum(["Confirmed", "Cancelled", "Completed"]) })
    .parse(req.body);
  let result;
  await mongoose.connection.transaction(async (session) => {
    const b = await Booking.findOne({
      _id: id(String(req.params.id)),
      ownerId: req.userId,
    }).session(session);
    if (!b) fail(403, "Only the studio host may manage this request");
    await Studio.updateOne(
      { _id: b.studioId },
      { $inc: { revision: 1 } },
      { session },
    );
    if (status === "Completed") {
      if (b.status !== "Confirmed" || b.endTime! > new Date())
        fail(409, "Only an ended confirmed booking can be completed");
    } else if (b.status !== "Pending")
      fail(409, "This request is no longer pending");
    if (status === "Confirmed") {
      if (b.startTime! <= new Date())
        fail(409, "Booking start time has passed");
      if (
        await Booking.exists({
          _id: { $ne: b._id },
          studioId: b.studioId,
          status: "Confirmed",
          startTime: { $lt: b.endTime },
          endTime: { $gt: b.startTime },
        }).session(session)
      )
        fail(409, "Another confirmed booking overlaps");
    }
    b.status = status;
    await b.save({ session });
    result = b;
  });
  res.json(result);
});
app.get("/api/bookings/:id/invoice", auth, async (req, res) => {
  const b = await Booking.findById(id(String(req.params.id))).populate(
    "studioId",
  );
  if (!b || ![String(b.userId), String(b.ownerId)].includes(req.userId!))
    fail(403, "Access denied");
  if (!["Confirmed", "Completed"].includes(b.status!))
    fail(409, "A confirmed booking is required");
  const u = await User.findById(b.userId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="booking-${b._id}.pdf"`,
  );
  const pdf = new PDFDocument({ margin: 50 });
  pdf.pipe(res);
  pdf.fontSize(26).text("StudioSpace");
  pdf.fontSize(17).text("Booking summary - not proof of payment");
  const studio = b.studioId as unknown as { title: string };
  for (const line of [
    `Reference: ${b._id}`,
    `Studio: ${studio.title}`,
    `Customer: ${u?.name}`,
    `Start (UTC): ${b.startTime?.toISOString()}`,
    `End (UTC): ${b.endTime?.toISOString()}`,
    `Rate: $${b.hourlyRateSnapshot}/hour`,
    `Duration: ${b.totalHours} hours`,
    `Security deposit: $${b.securityDeposit}`,
    `Total: $${b.totalPrice}`,
    `Status: ${b.status}`,
  ])
    pdf.moveDown().fontSize(12).text(line);
  pdf.end();
});
app.get("/api/wishlist", auth, async (req, res) =>
  res.json(await Wishlist.find({ userId: req.userId }).populate("studioId")),
);
app.post("/api/wishlist", auth, async (req, res) => {
  const sid = id(z.object({ studioId: z.string() }).parse(req.body).studioId);
  if (!(await Studio.exists({ _id: sid }))) fail(404, "Studio not found");
  res.json(
    await Wishlist.findOneAndUpdate(
      { userId: req.userId, studioId: sid },
      { $setOnInsert: { userId: req.userId, studioId: sid } },
      { upsert: true, new: true },
    ),
  );
});
app.delete("/api/wishlist/:id", auth, async (req, res) => {
  await Wishlist.deleteOne({
    userId: req.userId,
    studioId: id(String(req.params.id)),
  });
  res.json({ message: "Removed from saved spaces" });
});
app.get("/api/studios/:id/reviews", async (req, res) =>
  res.json(
    await Review.find({ studioId: id(String(req.params.id)) })
      .populate("userId", "name")
      .sort({ createdAt: -1 }),
  ),
);
app.post("/api/studios/:id/reviews", auth, async (req, res) => {
  const sid = id(String(req.params.id));
  const data = z
    .object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().min(5).max(2000),
    })
    .parse(req.body);
  await mongoose.connection.transaction(async (session) => {
    if (
      !(await Booking.exists({
        studioId: sid,
        userId: req.userId,
        status: "Completed",
      }).session(session))
    )
      fail(403, "Complete a booking before reviewing");
    await Studio.updateOne(
      { _id: sid },
      { $inc: { revision: 1 } },
      { session },
    );
    await Review.create([{ ...data, studioId: sid, userId: req.userId }], {
      session,
    });
    const reviews = await Review.find({ studioId: sid }).session(session);
    await Studio.updateOne(
      { _id: sid },
      {
        $set: {
          reviewCount: reviews.length,
          averageRating:
            reviews.reduce((a, r) => a + r.rating!, 0) / reviews.length,
        },
      },
      { session },
    );
  });
  res.status(201).json({ message: "Review published" });
});
app.post("/api/newsletter", async (req, res) => {
  const { email } = z
    .object({
      email: z
        .string()
        .email()
        .transform((s) => s.toLowerCase()),
    })
    .parse(req.body);
  await Newsletter.updateOne(
    { email },
    { $setOnInsert: { email } },
    { upsert: true },
  );
  res.json({
    message: "Interest saved locally. Email delivery is not enabled.",
  });
});
app.get("/api/dashboard", auth, async (req, res) => {
  const [listings, bookings, host] = await Promise.all([
    Studio.countDocuments({ ownerId: req.userId }),
    Booking.find({ userId: req.userId })
      .populate("studioId")
      .sort({ createdAt: -1 }),
    Booking.find({ ownerId: req.userId }).sort({ createdAt: -1 }),
  ]);
  res.json({
    listings,
    totalBookings: bookings.length,
    upcoming: bookings.filter(
      (b) => b.status === "Confirmed" && b.startTime! > new Date(),
    ).length,
    pending: host.filter((b) => b.status === "Pending").length,
    recent: bookings.slice(0, 5),
  });
});
app.use((_req, res) => res.status(404).json({ message: "Endpoint not found" }));
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err as {
    status?: number;
    code?: number;
    message?: string;
    name?: string;
  };
  if (err instanceof ZodError)
    return res.status(400).json({
      message: err.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
  const status =
    e.status || (e.code === 11000 ? 409 : e.name === "CastError" ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({
    message:
      status === 500
        ? "The request could not be completed"
        : e.code === 11000
          ? "This record already exists"
          : e.message,
  });
});
