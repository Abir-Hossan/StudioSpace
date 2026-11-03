import type { RequestHandler } from "express";
import { z } from "zod";
import { Newsletter } from "../models/index.js";
export const subscribe: RequestHandler = async (req, res) => {
  const { email } = z
    .object({
      email: z
        .string()
        .email()
        .transform((s) => s.toLowerCase()),
    })
    .parse(req.body);
  await Newsletter.updateOne(
    { email },
    { $setOnInsert: { email } },
    { upsert: true },
  );
  res.json({
    message: "Interest saved locally. Email delivery is not enabled.",
  });
};
