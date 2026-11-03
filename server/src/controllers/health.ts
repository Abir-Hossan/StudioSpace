import type { RequestHandler } from "express";
import mongoose from "mongoose";
export const health: RequestHandler = (_req, res) =>
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 });
