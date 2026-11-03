import mongoose from "mongoose";
import { fail } from "../utils/http-error.js";
export function id(value: string) {
  if (!mongoose.isValidObjectId(value)) fail(404, "Resource not found");
  return value;
}
