import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { client } from "./config/environment.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { requestProtection } from "./middleware/request-protection.js";
import { handleNotFound, handleError } from "./middleware/errors.js";
import { mountAuthRoutes } from "./routes/auth.js";
import { mountHealthRoutes } from "./routes/health.js";
import { mountStudiosRoutes } from "./routes/studios.js";
import { mountUploadsRoutes } from "./routes/uploads.js";
import { mountBookingsRoutes } from "./routes/bookings.js";
import { mountWishlistRoutes } from "./routes/wishlist.js";
import { mountReviewsRoutes } from "./routes/reviews.js";
import { mountNewsletterRoutes } from "./routes/newsletter.js";
import { mountDashboardRoutes } from "./routes/dashboard.js";

export const app = express();

app.disable("x-powered-by");

app.use(
  helmet(),
  cors({ origin: client(), credentials: true }),
  express.json({ limit: "1mb" }),
  cookieParser(),
  rateLimit({ windowMs: 60000, limit: 500 }),
);

app.use("/api", requestProtection);
mountAuthRoutes(app);
mountHealthRoutes(app);
mountStudiosRoutes(app);
mountUploadsRoutes(app);
mountBookingsRoutes(app);
mountWishlistRoutes(app);
mountReviewsRoutes(app);
mountNewsletterRoutes(app);
mountDashboardRoutes(app);
app.use(handleNotFound);
app.use(handleError);
