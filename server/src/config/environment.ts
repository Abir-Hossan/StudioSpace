export function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 characters");
  return process.env.JWT_SECRET;
}

export const client = () => process.env.CLIENT_URL || "http://localhost:3000";

export const cookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 86400000,
};
