import fs from "node:fs";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
const require = createRequire(import.meta.url);
// Prepare the nested output directory before Next's static-export worker starts.
// Windows restricted child processes cannot always create this nested folder.
if (process.platform === "win32")
  fs.mkdirSync(".next/server/app/_not-found.segments/_not-found", {
    recursive: true,
  });
const result = spawnSync(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "build"],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
