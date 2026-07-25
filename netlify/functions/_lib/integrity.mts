// Pure integrity helpers for the Chromium-pack supply-chain check. Only depends
// on node:crypto so it can be unit-tested without tar-fs / chromium-min.
import { timingSafeEqual } from "node:crypto";

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// Constant-time compare of two hex digests. False on length mismatch or empty
// input, so a malformed/absent digest can never match.
export function digestsMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  if (actualBytes.length === 0 || actualBytes.length !== expectedBytes.length) {
    return false;
  }
  return timingSafeEqual(actualBytes, expectedBytes);
}
