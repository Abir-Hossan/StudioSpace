import type { RequestHandler } from "express";
import { Booking, Studio } from "../models/index.js";
export const dashboard: RequestHandler = async (req, res) => {
  const [listings, bookings, host] = await Promise.all([
    Studio.countDocuments({ ownerId: req.userId }),
    Booking.find({ userId: req.userId })
      .populate("studioId")
      .sort({ createdAt: -1 }),
    Booking.find({ ownerId: req.userId }).sort({ createdAt: -1 }),
  ]);
  res.json({
    listings,
    totalBookings: bookings.length,
    upcoming: bookings.filter(
      (b) => b.status === "Confirmed" && b.startTime! > new Date(),
    ).length,
    pending: host.filter((b) => b.status === "Pending").length,
    recent: bookings.slice(0, 5),
  });
};
