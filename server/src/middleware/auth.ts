import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { secret } from "../config/environment.js";
import { fail } from "../utils/http-error.js";
import { AuthSession } from "../models/index.js";
import { tokenHash } from "../services/session.js";
import rateLimit from "express-rate-limit";
export const auth: RequestHandler = async (req, _res, next) => {
  const signed = req.cookies.session;
  if (typeof signed !== "string") fail(401, "Sign in to continue");

  const signingKey = secret();
  let token: string | JwtPayload;
  try {
    token = jwt.verify(signed, signingKey);
  } catch {
    fail(401, "Sign in to continue");
  }
  if (typeof token === "string" || !token.sub) fail(401, "Sign in to continue");

  const active = await AuthSession.exists({
    tokenHash: tokenHash(signed),
    userId: token.sub,
    expiresAt: { $gt: new Date() },
  });
  if (!active) fail(401, "Sign in to continue");
  req.userId = token.sub;
  next();
};

export const authLimit = rateLimit({ windowMs: 900000, limit: 30 });
