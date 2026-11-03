import type { RequestHandler } from "express";
import { client } from "../config/environment.js";
export const requestProtection: RequestHandler = (req, _res, next) => {
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
};
