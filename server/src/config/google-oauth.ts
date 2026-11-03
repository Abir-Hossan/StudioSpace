import { OAuth2Client } from "google-auth-library";
export const oauth = () =>
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:4000/api/auth/google/callback",
  );
