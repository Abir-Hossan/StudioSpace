import type { Express } from "express";
import * as controller from "../controllers/health.js";

export function mountHealthRoutes(app: Express) {
  app.get("/api/health", controller.health);
}
