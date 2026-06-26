import { createHash, timingSafeEqual } from "node:crypto";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { extract } from "tar-fs";
import chromium from "@sparticuz/chromium-min";

// SHA-256 of the upstream Sparticuz Chromium pack that matches the
// @sparticuz/chromium-min version pinned in package.json
// (v148.0.0 -> chromium-v148.0.0-pack.x64.tar). The pack is fetched at cold
// start from a GitHub release addressed only by a *mutable* version tag, so a
// swapped upstream artifact would be arbitrary code executing inside the
// function. We download it ourselves, verify the digest, and fail closed on
// mismatch instead of trusting the tag. Recompute when bumping the version:
//   curl -sL <pack-url> | shasum -a 256
const EXPECTED_PACK_SHA256 =
  "b8050d5477a9c000681c85ccbe95df17a1e69a6a776bb1db144b5d236c9cfb8f";

const PACK_DOWNLOAD_TIMEOUT_MS = 300_000;

const cachedBinaryPath = join(tmpdir(), "chromium");
const packTarPath = join(tmpdir(), "chromium-pack.tar");
const packDir = join(tmpdir(), "chromium-pack");

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function expectedDigest(): string {
  return (process.env.CHROMIUM_PACK_SHA256 ?? EXPECTED_PACK_SHA256).toLowerCase();
}

function digestsMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  if (actualBytes.length === 0 || actualBytes.length !== expectedBytes.length) {
    return false;
  }
  return timingSafeEqual(actualBytes, expectedBytes);
}

async function sha256File(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk as Buffer);
  }
  return hash.digest("hex");
}

async function downloadAndVerifyPack(packUrl: string): Promise<string> {
  const response = await fetch(packUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(PACK_DOWNLOAD_TIMEOUT_MS),
  });
  if (!response.ok || !response.body) {
    throw new Error(`Chromium pack download failed: HTTP ${String(response.status)}`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(packTarPath));

  const actual = await sha256File(packTarPath);
  if (!digestsMatch(actual, expectedDigest())) {
    await rm(packTarPath, { force: true });
    throw new Error("Chromium pack integrity check failed: unexpected SHA-256 digest");
  }

  await rm(packDir, { recursive: true, force: true });
  await pipeline(createReadStream(packTarPath), extract(packDir));
  await rm(packTarPath, { force: true });
  return packDir;
}

// Resolves the Chromium executable, verifying the integrity of the remote pack
// before it is extracted and used. Warm invocations reuse the inflated binary
// in /tmp. A non-HTTPS pack location (a local bin directory or a localhost URL
// used in development) is trusted as-is and handed straight to the library; the
// integrity gate only guards bytes fetched over the network.
export async function resolveChromiumExecutable(packUrl: string): Promise<string> {
  if (existsSync(cachedBinaryPath)) {
    return chromium.executablePath();
  }
  if (!isHttpsUrl(packUrl)) {
    return chromium.executablePath(packUrl);
  }
  const verifiedDir = await downloadAndVerifyPack(packUrl);
  return chromium.executablePath(verifiedDir);
}
