export default {
  devIndicators: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async rewrites() {
    const serverUrl = process.env.SERVER_URL || "http://127.0.0.1:4000";
    if (process.env.VERCEL === "1" && !serverUrl.startsWith("https://")) {
      throw new Error("Set SERVER_URL to the deployed HTTPS StudioSpace API origin.");
    }
    return [
      {
        source: "/api/:path*",
        destination: serverUrl.replace(/\/+$/, "") + "/api/:path*",
      },
    ];
  },
  images: { unoptimized: true },
};
