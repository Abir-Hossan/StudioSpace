import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
export const handleNotFound = (_req: Request, res: Response) => res.status(404).json({ message: "Endpoint not found" });

export const handleError = (err: unknown, _req: Request, res: Response, next: NextFunction) => {
  // Express must handle errors once a response, such as a PDF stream, has started.
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooLarge ? 413 : 400).json({
      message: tooLarge
        ? "Uploaded file exceeds the 10 MB limit"
        : "Invalid upload request",
    });
  }
  const e = err as {
    status?: number;
    code?: number;
    message?: string;
    name?: string;
  };
  if (err instanceof ZodError)
    return res.status(400).json({
      message: err.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
  const status =
    e.status || (e.code === 11000 ? 409 : e.name === "CastError" ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({
    message:
      status === 500
        ? "The request could not be completed"
        : e.code === 11000
          ? "This record already exists"
          : e.message,
  });
};
