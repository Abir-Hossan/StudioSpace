import { defineConfig } from "@playwright/test";
import * as fs from "node:fs";
import path from "path";
const temp = path.resolve("work/browser-temp");
fs.mkdirSync(temp, { recursive: true });
process.env.TEMP = temp;
process.env.TMP = temp;
export default defineConfig({
  testDir: "client/tests",
  timeout: 180000,
  use: {
    baseURL: process.env.STUDIOSPACE_TEST_URL||"http://localhost:3000",
    headless: true,
    channel: process.platform === "win32" ? "chrome" : undefined,
  },
  webServer: {
    command: "npm run local",
    url: process.env.STUDIOSPACE_TEST_URL||"http://localhost:3000",
    reuseExistingServer: true,
    timeout: 240000,
  },
  workers: 1,
});
