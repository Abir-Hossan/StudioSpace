import { z } from "zod";
export const categories = [
  "Photo Studios",
  "Film Stages",
  "Podcast Rooms",
  "Music Suites",
  "Art Workshops",
] as const;
export const registerSchema = z.object({
  accountIntent: z.enum(["creator", "host"]).optional(),
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .email()
    .transform((s) => s.toLowerCase()),
  password: z.string().min(6).max(128).regex(/[A-Z]/).regex(/[a-z]/)
    .refine(password => Buffer.byteLength(password, "utf8") <= 72, {
      message: "Password must be at most 72 UTF-8 bytes",
    }),
  photoURL: z.union([z.string().url(), z.literal("")]).optional(),
});
export const studioSchema = z.object({
  status: z.enum(["active", "paused"]).optional(),
  specs: z
    .object({
      usableArea: z.number().positive().max(1000000).optional(),
      gridHeight: z.number().positive().max(200).optional(),
      powerSupply: z.string().max(150).optional(),
      soundproofRating: z.string().max(150).optional(),
      access: z.string().max(300).optional(),
      parking: z.string().max(150).optional(),
    })
    .optional(),
  rules: z.array(z.string().max(300)).max(20).optional(),
  title: z.string().trim().min(3).max(150),
  category: z.enum(categories),
  hourlyRate: z.number().finite().positive().max(100000),
  securityDeposit: z.number().finite().min(0).max(100000),
  maxCapacity: z.number().int().positive().max(10000),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  images: z
    .array(z.string().regex(/^(?:\/images\/[a-zA-Z0-9_-]+|\/api\/uploads\/upload-[a-f0-9-]{36})\.png$/))
    .min(1)
    .max(12),
  amenities: z.array(z.string().max(60)).max(30),
  overview: z.string().trim().min(20).max(10000),
});
export function bookingTimes(start: string, end: string) {
  const a = new Date(start),
    b = new Date(end);
  if (
    !Number.isFinite(+a) ||
    !Number.isFinite(+b) ||
    a <= new Date() ||
    b <= a ||
    +b - +a > 86400000
  )
    throw Object.assign(
      new Error("Choose a future booking lasting up to 24 hours"),
      { status: 400 },
    );
  return { startTime: a, endTime: b, totalHours: (+b - +a) / 3600000 };
}
