import express from "express";
import mongoose from "mongoose";
import { app } from "./src/app.js";

const hosted = express();
hosted.disable("x-powered-by");
app.set("trust proxy", 1);

let connecting: Promise<unknown> | undefined;

hosted.use(async (_req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error("MONGODB_URI is required");
      connecting ??= mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      }).finally(() => { connecting = undefined; });
      await connecting;
    }
  } catch {
    console.error("StudioSpace could not connect to its database");
    res.status(503).json({ message: "Database unavailable. Please try again." });
    return;
  }
  next();
});

hosted.use(app);
export default hosted;
