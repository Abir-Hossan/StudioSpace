import type { Express } from "express";
import * as controller from "../controllers/wishlist.js";
import { auth } from "../middleware/auth.js";

export function mountWishlistRoutes(app: Express) {
  app.get("/api/wishlist", auth, controller.list);
  app.post("/api/wishlist", auth, controller.add);
  app.delete("/api/wishlist/:id", auth, controller.remove);
}
