import { startLocalMongo } from "./local-mongo.js";
import mongoose from "mongoose";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
// Persistent local replica set. The binary is downloaded on first run.
const dbPath = path.resolve(process.env.LOCAL_MONGO_DB_PATH||"work/local-mongo");
fs.mkdirSync(dbPath, { recursive: true });
console.log('Starting the persistent local MongoDB database…');
const runtime = await startLocalMongo(dbPath, Number(process.env.LOCAL_MONGO_PORT || 27018));
const mongo = runtime.server;
process.env.MONGODB_URI = runtime.uri;
process.env.JWT_SECRET ||= crypto.randomBytes(48).toString("hex");
const frontendPort=Number(process.env.PORT||3000);
const apiPort=Number(process.env.API_PORT||4000);
process.env.CLIENT_URL ||= `http://localhost:${frontendPort}`;
process.env.SERVER_URL ||= `http://127.0.0.1:${apiPort}`;
const { app } = await import("./app.js");
const { seed } = await import("./seed.js");
await mongoose.connect(process.env.MONGODB_URI);
await seed();
const server = app.listen(apiPort, () =>
  console.log(`API ready at http://localhost:${apiPort}`),
);
const next = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "client",'--port',String(frontendPort)],
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

