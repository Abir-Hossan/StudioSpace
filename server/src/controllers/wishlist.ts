import type { RequestHandler } from "express";
import { Studio, Wishlist } from "../models/index.js";
import { id } from "../validators/object-id.js";
import { z } from "zod";
import { fail } from "../utils/http-error.js";
export const list: RequestHandler = async (req, res) =>
  res.json(await Wishlist.find({ userId: req.userId }).populate("studioId"));

export const add: RequestHandler = async (req, res) => {
  const sid = id(z.object({ studioId: z.string() }).parse(req.body).studioId);
  if (!(await Studio.exists({ _id: sid }))) fail(404, "Studio not found");
  res.json(
    await Wishlist.findOneAndUpdate(
      { userId: req.userId, studioId: sid },
      { $setOnInsert: { userId: req.userId, studioId: sid } },
      { upsert: true, new: true },
    ),
  );
};

export const remove: RequestHandler = async (req, res) => {
  await Wishlist.deleteOne({
    userId: req.userId,
    studioId: id(String(req.params.id)),
  });
  res.json({ message: "Removed from saved spaces" });
};
