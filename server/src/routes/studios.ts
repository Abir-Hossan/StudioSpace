import type { Express } from "express";
import * as controller from "../controllers/studios.js";
import { auth } from "../middleware/auth.js";

export function mountStudiosRoutes(app: Express) {
  app.get("/api/studios/featured", controller.featured);
  app.get("/api/studios/catalog.pdf", controller.catalog);
  app.get("/api/studios/network", controller.network);
  app.get("/api/studios/mine", auth, controller.mine);
  app.get("/api/studios", controller.search);
  app.post("/api/studios", auth, controller.create);
  app.get("/api/studios/:id", controller.details);
  app.patch("/api/studios/:id", auth, controller.update);
  app.delete("/api/studios/:id", auth, controller.remove);
}
