import type { RequestHandler } from "express";
import { fail } from "../utils/http-error.js";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import sharp from "sharp";
import path from "node:path";
export const uploadImage: RequestHandler = async (req, res) => {
  if (!req.file) fail(400, "Choose an image");
  const filename = "upload-" + crypto.randomUUID() + ".png";
  const dir = fileURLToPath(
    new URL("../../../client/public/images/", import.meta.url),
  );
  await fs.mkdir(dir, { recursive: true });
  let image: Buffer;
  try {
    image = await sharp(req.file.buffer, { limitInputPixels: 40000000 })
      .resize({ width: 1920, withoutEnlargement: true })
      .png({ compressionLevel: 9 }).toBuffer();
  } catch { fail(400, "Choose a valid image within the supported size limits"); }
  await fs.writeFile(path.join(dir, filename), image);
  res.status(201).json({ url: "/images/" + filename });
};
