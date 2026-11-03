import crypto from "node:crypto";
import { Response } from "express";
import jwt from "jsonwebtoken";
import { cookie, secret } from "../config/environment.js";
import { AuthSession } from "../models/index.js";
export const tokenHash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function session(res: Response, id: string, remember = true) {
  const token = jwt.sign({ sub: id }, secret(), { expiresIn: "7d", jwtid: crypto.randomUUID() });
  await AuthSession.create({ tokenHash: tokenHash(token), userId: id, expiresAt: new Date(Date.now() + 7 * 86400000) });
  res.cookie("session", token, {
    ...cookie,
    ...(!remember ? { maxAge: undefined } : {}),
  });
}
