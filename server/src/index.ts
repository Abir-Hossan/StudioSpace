import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Load environment variables from the project root
dotenv.config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
});

// Import application modules after loading environment variables
const { default: mongoose } = await import("mongoose");
const { app } = await import("./app.js");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Set MONGODB_URI in the project root .env file");
}

try {
  await mongoose.connect(MONGODB_URI);

  console.log("MongoDB connected successfully");

  const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`StudioSpace API running on port ${PORT}`);
});
} catch (error) {
  console.error("Failed to start StudioSpace API:", error);
  process.exit(1);
}
