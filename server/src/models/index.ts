import mongoose, { Schema } from "mongoose";
const options = { timestamps: true };
export const AuthSession = mongoose.model("AuthSession", new Schema({
  tokenHash: { type: String, unique: true, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}));
export const User = mongoose.model(
  "User",
  new Schema(
    {
      name: String,
      email: { type: String, unique: true },
      photoURL: String,
      professionalTitle: String,
      bio: String,
      phone: String,
      website: String,
      portfolio: String,
      bookingPreference: String,
      crewPreference: String,
      passwordHash: { type: String, select: false },
      authenticationProvider: { type: String, default: "credentials" },
      role: { type: String, default: "user" },
      accountIntent: {
        type: String,
        enum: ["creator", "host"],
        default: "creator",
      },
    },
    options,
  ),
);
export const Studio = mongoose.model(
  "Studio",
  new Schema(
    {
      title: String,
      status: { type: String, enum: ["active", "paused"], default: "active" },
      category: String,
      hourlyRate: Number,
      securityDeposit: Number,
      maxCapacity: Number,
      address: String,
      city: String,
      country: String,
      images: [String],
      amenities: [String],
      overview: String,
      specs: {
        usableArea: Number,
        gridHeight: Number,
        powerSupply: String,
        soundproofRating: String,
        access: String,
        parking: String,
      },
      rules: [String],
      ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      ownerEmail: String,
      ownerName: String,
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      revision: { type: Number, default: 0 },
    },
    options,
  )
    .index({ category: 1, city: 1, hourlyRate: 1 })
    .index({ createdAt: -1 }),
);
export const Booking = mongoose.model(
  "Booking",
  new Schema(
    {
      studioId: { type: Schema.Types.ObjectId, ref: "Studio" },
      userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      userEmail: String,
      startTime: Date,
      endTime: Date,
      totalHours: Number,
      hourlyRateSnapshot: Number,
      securityDeposit: Number,
      totalPrice: Number,
      status: {
        type: String,
        enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
        default: "Pending",
      },
    },
    options,
  ).index({ studioId: 1, status: 1, startTime: 1, endTime: 1 }),
);
export const Wishlist = mongoose.model(
  "Wishlist",
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      studioId: { type: Schema.Types.ObjectId, ref: "Studio" },
    },
    options,
  ).index({ userId: 1, studioId: 1 }, { unique: true }),
);
export const Review = mongoose.model(
  "Review",
  new Schema(
    {
      studioId: { type: Schema.Types.ObjectId, ref: "Studio" },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      rating: Number,
      comment: String,
    },
    options,
  ).index({ studioId: 1, userId: 1 }, { unique: true }),
);
export const Newsletter = mongoose.model(
  "Newsletter",
  new Schema({ email: { type: String, unique: true } }, options),
);
