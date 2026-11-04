import multer from "multer";
import type { RequestHandler } from "express";
import { hostedUploadLimitMb, usesDatabaseUploads } from "../config/uploads.js";

const imageUpload = (limitMb: number) => multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: limitMb * 1024 * 1024, files: 1 },
}).single("image");

const hosted = imageUpload(hostedUploadLimitMb);
const local = imageUpload(10);

export const uploadImage: RequestHandler = (req, res, next) =>
  (usesDatabaseUploads() ? hosted : local)(req, res, next);
