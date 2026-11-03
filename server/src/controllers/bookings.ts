import type { RequestHandler } from "express";
import { z } from "zod";
import { bookingTimes } from "../validators/schemas.js";
import { changeBookingStatus, requestBooking } from "../services/bookings.js";
import { Booking, User } from "../models/index.js";
import { id } from "../validators/object-id.js";
import { fail } from "../utils/http-error.js";
import PDFDocument from "pdfkit";
export const create: RequestHandler = async (req, res) => {
  const d = z
    .object({
      studioId: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    })
    .parse(req.body);
  const times = bookingTimes(d.startTime, d.endTime);
  const result = await requestBooking(d.studioId, req.userId!, times);
  res.status(201).json(result);
};

export const summary: RequestHandler = async (req, res) => {
  const bookings = await Booking.find({
    $or: [{ userId: req.userId }, { ownerId: req.userId }],
  })
    .populate<{ studioId: { title: string } }>("studioId")
    .sort({ startTime: -1 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="StudioSpace-booking-summaries.pdf"',
  );
  const pdf = new PDFDocument({ margin: 50 });
  pdf.pipe(res);
  pdf.fontSize(24).text("StudioSpace / Production bookings");
  pdf
    .fontSize(11)
    .text(
      "Booking summaries only. Not proof of payment. All times shown in UTC.",
    );
  if (!bookings.length) pdf.moveDown().text("No bookings to export yet.");
  for (const b of bookings) {
    if (pdf.y > 640) pdf.addPage();
    const s = b.studioId;
    pdf
      .moveDown()
      .fontSize(15)
      .text(s?.title || "Studio");
    pdf
      .fontSize(10)
      .text(`Reference: ${b._id} | Status: ${b.status}`)
      .text(`${b.startTime?.toISOString()} to ${b.endTime?.toISOString()}`)
      .text(
        `Duration: ${b.totalHours} hours | Rate: $${b.hourlyRateSnapshot}/hr | Deposit: $${b.securityDeposit} | Total: $${b.totalPrice}`,
      );
  }
  pdf.end();
};

export const mine: RequestHandler = async (req, res) =>
  res.json(
    await Booking.find({ userId: req.userId })
      .populate<{ studioId: { title: string } }>("studioId")
      .sort({ createdAt: -1 }),
  );

export const host: RequestHandler = async (req, res) =>
  res.json(
    await Booking.find({ ownerId: req.userId })
      .populate<{ studioId: { title: string } }>("studioId")
      .sort({ createdAt: -1 }),
  );

export const availability: RequestHandler = async (req, res) =>
  res.json(
    await Booking.find({
      studioId: id(String(req.params.id)),
      status: "Confirmed",
      endTime: { $gte: new Date() },
    }).select("startTime endTime"),
  );

export const cancel: RequestHandler = async (req, res) => {
  const b = await Booking.findOneAndUpdate(
    { _id: id(String(req.params.id)), userId: req.userId, status: "Pending" },
    { $set: { status: "Cancelled" } },
    { new: true },
  );
  if (!b) fail(409, "Only your pending requests can be cancelled");
  res.json(b);
};

export const updateStatus: RequestHandler = async (req, res) => {
  const { status } = z
    .object({ status: z.enum(["Confirmed", "Cancelled", "Completed"]) })
    .parse(req.body);
  const result = await changeBookingStatus(String(req.params.id), req.userId!, status);
  res.json(result);
};

export const invoice: RequestHandler = async (req, res) => {
  const b = await Booking.findById(id(String(req.params.id))).populate<{ studioId: { title: string } }>(
    "studioId",
  );
  if (!b || ![String(b.userId), String(b.ownerId)].includes(req.userId!))
    fail(403, "Access denied");
  if (!["Confirmed", "Completed"].includes(b.status!))
    fail(409, "A confirmed booking is required");
  const u = await User.findById(b.userId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="booking-${b._id}.pdf"`,
  );
  const pdf = new PDFDocument({ margin: 50 });
  pdf.pipe(res);
  pdf.fontSize(26).text("StudioSpace");
  pdf.fontSize(17).text("Booking summary - not proof of payment");
  const studio = b.studioId;
  for (const line of [
    `Reference: ${b._id}`,
    `Studio: ${studio.title}`,
    `Customer: ${u?.name}`,
    `Start (UTC): ${b.startTime?.toISOString()}`,
    `End (UTC): ${b.endTime?.toISOString()}`,
    `Rate: $${b.hourlyRateSnapshot}/hour`,
    `Duration: ${b.totalHours} hours`,
    `Security deposit: $${b.securityDeposit}`,
    `Total: $${b.totalPrice}`,
    `Status: ${b.status}`,
  ])
    pdf.moveDown().fontSize(12).text(line);
  pdf.end();
};
