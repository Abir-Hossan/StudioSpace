import type { Express } from "express";
import * as controller from "../controllers/auth.js";
import { auth, authLimit } from "../middleware/auth.js";

export function mountAuthRoutes(app: Express) {
  app.post("/api/auth/register", authLimit, controller.register);
  app.post("/api/auth/login", authLimit, controller.login);
  app.post("/api/auth/logout", controller.logout);
  app.get(["/api/auth/me", "/api/users/me"], auth, controller.me);
  app.patch("/api/users/me", auth, controller.updateProfile);
  app.get("/api/auth/google", controller.startGoogle);
  app.get("/api/auth/google/callback", controller.finishGoogle);
}
