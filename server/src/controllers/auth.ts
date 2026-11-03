import type { RequestHandler } from "express";
import { registerSchema } from "../validators/schemas.js";
import { AuthSession, User } from "../models/index.js";
import { fail } from "../utils/http-error.js";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { session, tokenHash } from "../services/session.js";
import { client, cookie } from "../config/environment.js";
import crypto from "node:crypto";
import { oauth } from "../config/google-oauth.js";
export const register: RequestHandler = async (req, res) => {
  const data = registerSchema.parse(req.body);
  if (await User.exists({ email: data.email }))
    fail(409, "Email already registered");
  await User.create({
    ...data,
    password: undefined,
    passwordHash: await bcrypt.hash(data.password, 12),
  });
  res.status(201).json({ message: "Account created. Please sign in." });
};

export const login: RequestHandler = async (req, res) => {
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
};

export const logout: RequestHandler = async (req, res) => {
  if (typeof req.cookies.session === "string")
    await AuthSession.deleteOne({ tokenHash: tokenHash(req.cookies.session) });
  res.clearCookie("session", cookie);
  res.json({ message: "Signed out" });
};

export const me: RequestHandler = async (req, res) => {
  const u = await User.findById(req.userId);
  if (!u) fail(401, "Account no longer exists");
  res.json(u);
};

export const updateProfile: RequestHandler = async (req, res) => {
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
};

export const startGoogle: RequestHandler = (_req, res) => {
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
};

export const finishGoogle: RequestHandler = async (req, res) => {
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
};
