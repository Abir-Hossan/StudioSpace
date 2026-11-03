import type { Express } from "express";
import * as controller from "../controllers/uploads.js";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

export function mountUploadsRoutes(app: Express) {
  app.post("/api/uploads", auth, upload.single("image"), controller.uploadImage);
}
