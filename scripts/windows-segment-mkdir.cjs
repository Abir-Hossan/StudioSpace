const { promises: fs } = require("node:fs");
const path = require("node:path");

const output = process.env.STUDIOSPACE_BUILD_OUTPUT;

if (process.platform === "win32" && output) {
  const mkdir = fs.mkdir.bind(fs);
  let pending = Promise.resolve();

  // The Next exporter starts parent and child mkdir calls in parallel.
  // Some Windows filesystems return EPERM in that race. Queue only segment
  // directories inside this build's output and propagate each caller's error.
  fs.mkdir = (directory, options) => {
    if (typeof directory !== "string" || !options?.recursive) {
      return mkdir(directory, options);
    }

    const relative = path.relative(output, directory);
    const parts = relative.split(path.sep);
    if (path.isAbsolute(relative) || parts[0] === ".." ||
        !parts.some(part => part.endsWith(".segments"))) {
      return mkdir(directory, options);
    }

    const result = pending.then(() => mkdir(directory, options));
    pending = result.then(() => undefined, () => undefined);
    return result;
  };
}
