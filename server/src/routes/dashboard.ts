import type { Express } from "express";
import * as controller from "../controllers/dashboard.js";
import { auth } from "../middleware/auth.js";

export function mountDashboardRoutes(app: Express) {
  app.get("/api/dashboard", auth, controller.dashboard);
}
