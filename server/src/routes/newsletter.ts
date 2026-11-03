import type { Express } from "express";
import * as controller from "../controllers/newsletter.js";

export function mountNewsletterRoutes(app: Express) {
  app.post("/api/newsletter", controller.subscribe);
}
