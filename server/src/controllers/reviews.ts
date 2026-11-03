import type { RequestHandler } from "express";
import { Review } from "../models/index.js";
import { id } from "../validators/object-id.js";
import { z } from "zod";
import { publishReview } from "../services/reviews.js";
export const list: RequestHandler = async (req, res) =>
  res.json(
    await Review.find({ studioId: id(String(req.params.id)) })
      .populate("userId", "name")
      .sort({ createdAt: -1 }),
  );

export const create: RequestHandler = async (req, res) => {
  const sid = id(String(req.params.id));
  const data = z
    .object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().min(5).max(2000),
    })
    .parse(req.body);
  await publishReview(sid, req.userId!, data);
  res.status(201).json({ message: "Review published" });
};
