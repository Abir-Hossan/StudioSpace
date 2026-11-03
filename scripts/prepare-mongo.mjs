import fs from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";
if (process.platform !== "win32") {
  console.log("The local runner downloads MongoDB for your platform.");
  process.exit(0);
}
const output = path.resolve("work/mongodb-binaries/mongod.exe");
// SHA-256 of mongod.exe extracted from the official 7.0.24 Windows archive.
const expectedHash =
  "9c229fea5d7b5a5b83aa9445a0a7d50faf8e244a80cc051df6deb8a9c648791f";
const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
let existing;
try {
  existing = await fs.readFile(output);
} catch {
  /* Download on first use. */
}
if (existing) {
  if (digest(existing) !== expectedHash)
    throw new Error("Existing MongoDB executable failed its checksum");
  console.log("MongoDB server is already prepared and checksum-verified.");
  process.exit(0);
}
const url =
  "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.24.zip";
async function range(start, end) {
  const response = await fetch(url, {
    headers: { Range: `bytes=${start}-${end}` },
  });
  if (response.status !== 206)
    throw new Error("Server did not honor range: " + response.status);
  return Buffer.from(await response.arrayBuffer());
}
const head = await fetch(url, { method: "HEAD" });
const size = Number(head.headers.get("content-length"));
console.log("Archive bytes", size);
const tail = await range(size - 65557, size - 1);
let eocd = -1;
for (let i = tail.length - 22; i >= 0; i--) {
  if (tail.readUInt32LE(i) === 0x06054b50) {
    eocd = i;
    break;
  }
}
if (eocd < 0) throw new Error("ZIP directory missing");
const directorySize = tail.readUInt32LE(eocd + 12),
  directoryOffset = tail.readUInt32LE(eocd + 16);
const directory = await range(
  directoryOffset,
  directoryOffset + directorySize - 1,
);
let entry;
for (let i = 0; i < directory.length; ) {
  if (directory.readUInt32LE(i) !== 0x02014b50) break;
  const nameLength = directory.readUInt16LE(i + 28),
    extraLength = directory.readUInt16LE(i + 30),
    commentLength = directory.readUInt16LE(i + 32),
    name = directory.subarray(i + 46, i + 46 + nameLength).toString();
  if (name.endsWith("/mongod.exe"))
    entry = {
      name,
      compressed: directory.readUInt32LE(i + 20),
      size: directory.readUInt32LE(i + 24),
      offset: directory.readUInt32LE(i + 42),
      method: directory.readUInt16LE(i + 10),
    };
  i += 46 + nameLength + extraLength + commentLength;
}
if (!entry) throw new Error("mongod not found");
console.log(entry);
const header = await range(entry.offset, entry.offset + 29);
const offset =
  entry.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
const chunk = 1024 * 1024;
const chunks = await Promise.all(
  Array.from({ length: Math.ceil(entry.compressed / chunk) }, async (_, i) => {
    const data = await range(
      offset + i * chunk,
      Math.min(offset + (i + 1) * chunk - 1, offset + entry.compressed - 1),
    );
    console.log("Chunk", i + 1);
    return data;
  }),
);
const data = Buffer.concat(chunks);
const binary = entry.method === 8 ? inflateRawSync(data) : data;
if (binary.length !== entry.size) throw new Error("Length mismatch");
if (digest(binary) !== expectedHash)
  throw new Error("MongoDB executable checksum mismatch");
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, binary);
console.log("Saved", output, binary.length);
