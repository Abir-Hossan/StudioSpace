import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const env = { ...process.env };
if (process.platform === "win32") {
  const preload = fileURLToPath(new URL("./windows-segment-mkdir.cjs", import.meta.url))
    .replaceAll("\\", "/");
  env.STUDIOSPACE_BUILD_OUTPUT = path.resolve(env.NEXT_DIST_DIR || ".next");
  env.NODE_OPTIONS = [env.NODE_OPTIONS, `--require="${preload}"`].filter(Boolean).join(" ");
}
const result = spawnSync(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "build"],
  { stdio: "inherit", env },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
