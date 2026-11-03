import mongoose from "mongoose";
import { Booking, Review, Studio } from "../models/index.js";
import { fail } from "../utils/http-error.js";

// Keep the review and the studio rating summary in the same transaction.
export async function publishReview(studioId: string, userId: string, data: { rating: number; comment: string }) {
  await mongoose.connection.transaction(async (session) => {
    if (
      !(await Booking.exists({
        studioId: studioId,
        userId: userId,
        status: "Completed",
      }).session(session))
    )
      fail(403, "Complete a booking before reviewing");
    await Studio.updateOne(
      { _id: studioId },
      { $inc: { revision: 1 } },
      { session },
    );
    await Review.create([{ ...data, studioId: studioId, userId: userId }], {
      session,
    });
    const reviews = await Review.find({ studioId: studioId }).session(session);
    await Studio.updateOne(
      { _id: studioId },
      {
        $set: {
          reviewCount: reviews.length,
          averageRating:
            reviews.reduce((a, r) => a + r.rating!, 0) / reviews.length,
        },
      },
      { session },
    );
  });
}
