import type { RequestHandler } from "express";
import { z } from "zod";
import { Booking, Review, Studio, User, Wishlist } from "../models/index.js";
import PDFDocument from "pdfkit";
import { fail } from "../utils/http-error.js";
import { studioSchema } from "../validators/schemas.js";
import { id } from "../validators/object-id.js";
import mongoose from "mongoose";
export const featured: RequestHandler = async (req, res) => {
  const { category } = z
    .object({ category: z.string().max(80).optional() })
    .parse(req.query);
  res.json(
    await Studio.find({
      status: { $ne: "paused" },
      ...(category ? { category } : {}),
    })
      .sort({ createdAt: -1 })
      .limit(6),
  );
};

export const catalog: RequestHandler = async (_req, res) => {
  const studios = await Studio.find().sort({ title: 1 }).limit(100);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="StudioSpace-studio-catalog.pdf"',
  );
  const pdf = new PDFDocument({ margin: 50 });
  pdf.pipe(res);
  pdf.fontSize(24).text("StudioSpace / Studio specification catalog");
  pdf
    .fontSize(10)
    .text(
      "Live local listings. Availability and equipment must be confirmed with the host.",
    );
  for (const s of studios) {
    if (pdf.y > 650) pdf.addPage();
    pdf
      .moveDown()
      .fontSize(16)
      .text(s.title || "Studio");
    pdf
      .fontSize(11)
      .text(`${s.category} / ${s.city}, ${s.country}`)
      .text(
        `$${s.hourlyRate}/hour | Deposit $${s.securityDeposit} | Capacity ${s.maxCapacity}`,
      )
      .text(s.amenities.join(", "));
    if (s.specs?.powerSupply) pdf.text("Power: " + s.specs.powerSupply);
  }
  pdf.end();
};

export const network: RequestHandler = async (_req, res) => {
  const [total, cities, categories] = await Promise.all([
    Studio.countDocuments({ status: { $ne: "paused" } }),
    Studio.aggregate([
      { $match: { status: { $ne: "paused" } } },
      {
        $group: {
          _id: { city: "$city", country: "$country" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Studio.distinct("category", { status: { $ne: "paused" } }),
  ]);
  res.json({
    total,
    cities: cities.map((c) => ({
      city: c._id.city,
      country: c._id.country,
      count: c.count,
    })),
    categories,
  });
};

export const mine: RequestHandler = async (req, res) =>
  res.json(await Studio.find({ ownerId: req.userId }).sort({ createdAt: -1 }));

export const search: RequestHandler = async (req, res) => {
  const q = z
    .object({
      search: z.string().max(100).optional(),
      category: z.string().optional(),
      location: z.string().max(100).optional(),
      min: z.coerce.number().min(0).optional(),
      max: z.coerce.number().min(0).optional(),
      amenities: z.string().max(500).optional(),
      minRating: z.coerce.number().min(0).max(5).optional(),
      crew: z.coerce.number().int().positive().optional(),
      availableDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      minHeight: z.coerce.number().min(0).optional(),
      page: z.coerce.number().int().min(1).max(10000).default(1),
      sort: z
        .enum(["newest", "price-asc", "price-desc", "rating"])
        .default("newest"),
    })
    .parse(req.query);
  const filter: Record<string, unknown> = { status: { $ne: "paused" } };
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (q.search) filter.title = { $regex: esc(q.search), $options: "i" };
  if (q.category) filter.category = q.category;
  if (q.location) filter.city = { $regex: esc(q.location), $options: "i" };
  if (q.amenities)
    filter.amenities = {
      $all: q.amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  if (q.minRating) filter.averageRating = { $gte: q.minRating };
  if (q.crew) filter.maxCapacity = { $gte: q.crew };
  if (q.minHeight) filter["specs.gridHeight"] = { $gte: q.minHeight };
  if (q.availableDate) {
    const start = new Date(q.availableDate + "T00:00:00.000Z");
    if (!Number.isFinite(+start)) fail(400, "Invalid availability date");
    const end = new Date(+start + 86400000);
    filter._id = {
      $nin: await Booking.distinct("studioId", {
        status: "Confirmed",
        startTime: { $lt: end },
        endTime: { $gt: start },
      }),
    };
  }
  if (q.min !== undefined || q.max !== undefined)
    filter.hourlyRate = {
      ...(q.min !== undefined ? { $gte: q.min } : {}),
      ...(q.max !== undefined ? { $lte: q.max } : {}),
    };
  const sorts: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    "price-asc": { hourlyRate: 1 },
    "price-desc": { hourlyRate: -1 },
    rating: { averageRating: -1 },
  };
  const [items, total] = await Promise.all([
    Studio.find(filter)
      .sort(sorts[q.sort])
      .skip((q.page - 1) * 9)
      .limit(9),
    Studio.countDocuments(filter),
  ]);
  res.json({ items, total, page: q.page, pages: Math.ceil(total / 9) });
};

export const create: RequestHandler = async (req, res) => {
  const data = studioSchema.parse(req.body);
  const u = await User.findById(req.userId).orFail();
  res.status(201).json(
    await Studio.create({
      ...data,
      ownerId: u._id,
      ownerName: u.name,
      ownerEmail: u.email,
    }),
  );
};

export const details: RequestHandler = async (req, res) => {
  const s = await Studio.findById(id(String(req.params.id)));
  if (!s) fail(404, "Studio not found");
  res.json(s);
};

export const update: RequestHandler = async (req, res) => {
  const s = await Studio.findOneAndUpdate(
    { _id: id(String(req.params.id)), ownerId: req.userId },
    { $set: studioSchema.parse(req.body) },
    { new: true },
  );
  if (!s) fail(403, "Only the host may edit this studio");
  res.json(s);
};

export const remove: RequestHandler = async (req, res) => {
  await mongoose.connection.transaction(async (session) => {
    const s = await Studio.findOneAndUpdate(
      { _id: id(String(req.params.id)), ownerId: req.userId },
      { $inc: { revision: 1 } },
      { session, new: true },
    );
    if (!s) fail(403, "Only the host may delete this studio");
    if (await Booking.exists({ studioId: s._id }).session(session))
      fail(
        409,
        "Studios with booking history cannot be deleted. Preserve the booking record.",
      );
    await Wishlist.deleteMany({ studioId: s._id }, { session });
    await Review.deleteMany({ studioId: s._id }, { session });
    await s.deleteOne({ session });
  });
  res.json({ message: "Studio deleted" });
};
