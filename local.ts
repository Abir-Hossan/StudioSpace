import { startLocalMongo } from "./local-mongo.js";
import mongoose from "mongoose";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
// Persistent local replica set. The binary is downloaded on first run.
const dbPath = path.resolve("work/local-mongo");
fs.mkdirSync(dbPath, { recursive: true });
console.log('Starting the persistent local MongoDB database…');
const runtime = await startLocalMongo(dbPath, Number(process.env.LOCAL_MONGO_PORT || 27018));
const mongo = runtime.server;
process.env.MONGODB_URI = runtime.uri;
process.env.JWT_SECRET ||= crypto.randomBytes(48).toString("hex");
process.env.CLIENT_URL ||= "http://localhost:3000";
const appModulePath = "./app.js";
const { app } = await import(appModulePath);
const seedModulePath = "./seed";
const { seed } = await import(seedModulePath);
await mongoose.connect(process.env.MONGODB_URI);
await seed();
const server = app.listen(4000, () =>
  console.log("API ready at http://localhost:4000"),
);
const next = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "client"],
  { stdio: "inherit", env: process.env },
);
async function stop() {
  next.kill();
  server.close();
  await mongoose.disconnect();
  await mongo.stop({ doCleanup: false });
  process.exit();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

