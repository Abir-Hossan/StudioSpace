import mongoose from "mongoose";
import { Booking, Studio, User } from "../models/index.js";
import { id } from "../validators/object-id.js";
import type { bookingTimes } from "../validators/schemas.js";
import { fail } from "../utils/http-error.js";

// Updating the studio revision serializes competing booking writes before overlap checks.
export async function requestBooking(studioId: string, userId: string, times: ReturnType<typeof bookingTimes>) {
  return mongoose.connection.transaction(async (session) => {
    const s = await Studio.findOneAndUpdate(
      { _id: id(studioId) },
      { $inc: { revision: 1 } },
      { new: true, session },
    );
    if (!s) fail(404, "Studio not found");
    if (s.status === "paused")
      fail(
        409,
        "This studio is temporarily paused and is not accepting new requests",
      );
    if (String(s.ownerId) === userId)
      fail(400, "You cannot book your own studio");
    if (
      await Booking.exists({
        studioId: s._id,
        status: "Confirmed",
        startTime: { $lt: times.endTime },
        endTime: { $gt: times.startTime },
      }).session(session)
    )
      fail(409, "This time is already reserved");
    const u = await User.findById(userId).session(session).orFail();
    const [booking] = await Booking.create(
      [
        {
          ...times,
          studioId: s._id,
          userId: u._id,
          userEmail: u.email,
          ownerId: s.ownerId,
          hourlyRateSnapshot: s.hourlyRate,
          securityDeposit: s.securityDeposit,
          totalPrice:
            Math.round(
              (times.totalHours * s.hourlyRate! + s.securityDeposit!) * 100,
            ) / 100,
          status: "Pending",
        },
      ],
      { session },
    );
    return booking;
  });
}

export async function changeBookingStatus(bookingId: string, userId: string, status: "Confirmed" | "Cancelled" | "Completed") {
  return mongoose.connection.transaction(async (session) => {
    const b = await Booking.findOne({
      _id: id(bookingId),
      ownerId: userId,
    }).session(session);
    if (!b) fail(403, "Only the studio host may manage this request");
    await Studio.updateOne(
      { _id: b.studioId },
      { $inc: { revision: 1 } },
      { session },
    );
    if (status === "Completed") {
      if (b.status !== "Confirmed" || b.endTime! > new Date())
        fail(409, "Only an ended confirmed booking can be completed");
    } else if (b.status !== "Pending")
      fail(409, "This request is no longer pending");
    if (status === "Confirmed") {
      if (b.startTime! <= new Date())
        fail(409, "Booking start time has passed");
      if (
        await Booking.exists({
          _id: { $ne: b._id },
          studioId: b.studioId,
          status: "Confirmed",
          startTime: { $lt: b.endTime },
          endTime: { $gt: b.startTime },
        }).session(session)
      )
        fail(409, "Another confirmed booking overlaps");
    }
    b.status = status;
    await b.save({ session });
    return b;
  });
}
