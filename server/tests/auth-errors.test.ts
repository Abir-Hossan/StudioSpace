import { afterEach, expect, it, vi } from "vitest";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../src/app";
import { AuthSession } from "../src/models/index";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it("rejects an invalid Google ID token without exposing verification details", async () => {
  vi.spyOn(OAuth2Client.prototype, "getToken")
    .mockResolvedValue({ tokens: { id_token: "mock-token" } } as never);
  vi.spyOn(OAuth2Client.prototype, "verifyIdToken")
    .mockRejectedValue(new Error("provider verification details"));

  const response = await request(app)
    .get("/api/auth/google/callback?state=test-state&code=mock-code")
    .set("Cookie", "oauth_state=test-state");

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Google identity could not be verified");
  expect(response.headers["set-cookie"]).not.toEqual(
    expect.arrayContaining([expect.stringMatching(/^session=/)]),
  );
});

it("reports session-store failures as server errors rather than expired sessions", async () => {
  const signingKey = "test-only-session-key-at-least-32-characters";
  vi.stubEnv("JWT_SECRET", signingKey);
  vi.spyOn(AuthSession, "exists").mockRejectedValue(new Error("test store outage"));
  vi.spyOn(console, "error").mockImplementation(() => {});

  const session = jwt.sign({ sub: "507f1f77bcf86cd799439011" }, signingKey);
  const response = await request(app)
    .get("/api/auth/me")
    .set("Cookie", `session=${session}`);

  expect(response.status).toBe(500);
  expect(response.body.message).toBe("The request could not be completed");
});
