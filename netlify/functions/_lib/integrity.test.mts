import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { digestsMatch, isHttpsUrl } from "./integrity.mjs";

test("isHttpsUrl only accepts https", () => {
  assert.equal(isHttpsUrl("https://example.com/x.tar"), true);
  assert.equal(isHttpsUrl("http://example.com/x.tar"), false);
  assert.equal(isHttpsUrl("/local/bin"), false);
  assert.equal(isHttpsUrl("not a url"), false);
});

test("digestsMatch is true only for an exact digest", () => {
  const digest = createHash("sha256").update("payload").digest("hex");
  assert.equal(digestsMatch(digest, digest), true);
  assert.equal(digestsMatch(digest, digest.replace(/.$/, "0")), false);
});

test("digestsMatch is false on length mismatch or empty input", () => {
  assert.equal(digestsMatch("", "abcd"), false);
  assert.equal(digestsMatch("ab", "abcd"), false);
  assert.equal(digestsMatch("", ""), false);
});
