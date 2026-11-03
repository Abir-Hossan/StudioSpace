import type { RequestHandler } from "express";
import { fail } from "../utils/http-error.js";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import sharp from "sharp";
import path from "node:path";
import mongoose from "mongoose";
import { hostedUploadLimitMb, usesDatabaseUploads } from "../config/uploads.js";

const images = () => mongoose.connection.collection("studio_uploads");

export const uploadImage: RequestHandler = async (req, res) => {
  if (!req.file) fail(400, "Choose an image");
  const filename = "upload-" + crypto.randomUUID() + ".png";
  const dir = fileURLToPath(
    new URL("../../../client/public/images/", import.meta.url),
  );
  let image: Buffer;
  try {
    image = await sharp(req.file.buffer, { limitInputPixels: 40000000 })
      .resize({ width: 1920, withoutEnlargement: true })
      .png({ compressionLevel: 9 }).toBuffer();
  } catch { fail(400, "Choose a valid image within the supported size limits"); }
  if (usesDatabaseUploads()) {
    if (image.length > hostedUploadLimitMb * 1024 * 1024)
      fail(413, "The converted image is too large. Choose a smaller image.");
    await images().insertOne({ filename, image: new mongoose.mongo.Binary(image) });
    res.status(201).json({ url: "/api/uploads/" + filename });
    return;
  }
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), image);
  res.status(201).json({ url: "/images/" + filename });
};

export const readImage: RequestHandler = async (req, res) => {
  const filename = req.params.filename;
  if (typeof filename !== "string" || !/^upload-[a-f0-9-]{36}\.png$/.test(filename))
    fail(404, "Image not found");
  const stored = await images().findOne({ filename });
  if (!stored) fail(404, "Image not found");
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.type("png").send(Buffer.from(stored.image.value()));
};
