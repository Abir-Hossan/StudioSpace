import type { Express } from "express";
import * as controller from "../controllers/reviews.js";
import { auth } from "../middleware/auth.js";

export function mountReviewsRoutes(app: Express) {
  app.get("/api/studios/:id/reviews", controller.list);
  app.post("/api/studios/:id/reviews", auth, controller.create);
}
