import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { secret } from "../config/environment.js";
import { fail } from "../utils/http-error.js";
import { AuthSession } from "../models/index.js";
import { tokenHash } from "../services/session.js";
import rateLimit from "express-rate-limit";
export const auth = async (req: Request, _res: Response, next: NextFunction) => {
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

export const authLimit = rateLimit({ windowMs: 900000, limit: 30 });
