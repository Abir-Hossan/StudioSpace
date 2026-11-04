import type { Express } from "express";
import * as controller from "../controllers/uploads.js";
import { auth } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";

export function mountUploadsRoutes(app: Express) {
  app.post("/api/uploads", auth, uploadImage, controller.uploadImage);
  app.get("/api/uploads/:filename", controller.readImage);
}
