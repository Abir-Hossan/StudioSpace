import type { Express } from "express";
import * as controller from "../controllers/bookings.js";
import { auth } from "../middleware/auth.js";

export function mountBookingsRoutes(app: Express) {
  app.post("/api/bookings", auth, controller.create);
  app.get("/api/bookings/summary.pdf", auth, controller.summary);
  app.get("/api/bookings/mine", auth, controller.mine);
  app.get("/api/bookings/host", auth, controller.host);
  app.get("/api/studios/:id/availability", controller.availability);
  app.patch("/api/bookings/:id/cancel", auth, controller.cancel);
  app.patch("/api/bookings/:id/status", auth, controller.updateStatus);
  app.get("/api/bookings/:id/invoice", auth, controller.invoice);
}
