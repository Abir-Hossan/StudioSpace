import "dotenv/config";
import mongoose from "mongoose";
import { app } from "./app.js";
if (!process.env.MONGODB_URI)
  throw new Error("Set MONGODB_URI in the environment");
await mongoose.connect(process.env.MONGODB_URI);
app.listen(4000, () => console.log("StudioSpace API http://localhost:4000"));
