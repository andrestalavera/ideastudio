import { test } from "node:test";
import assert from "node:assert/strict";
import { trustedBaseUrl } from "./host.mjs";

test("trustedBaseUrl allows a static allowlisted host", () => {
  const base = trustedBaseUrl(new URL("https://ideastud.io/.netlify/functions/resume-pdf"), {});
  assert.equal(base, "https://ideastud.io");
});

test("trustedBaseUrl rejects an unknown / spoofed host (SSRF guard)", () => {
  assert.equal(trustedBaseUrl(new URL("https://evil.example/resume-pdf"), {}), null);
  assert.equal(trustedBaseUrl(new URL("https://ideastud.io.attacker.com/x"), {}), null);
});

test("trustedBaseUrl trusts and prefers the Netlify-injected deploy origin", () => {
  const env = { URL: "https://deploy--ideastudio.netlify.app" };
  const base = trustedBaseUrl(new URL("https://deploy--ideastudio.netlify.app/x"), env);
  assert.equal(base, "https://deploy--ideastudio.netlify.app");
});

test("trustedBaseUrl returns the canonical URL origin even when the request host differs but is allowlisted", () => {
  const env = { URL: "https://ideastud.io" };
  // A request to the www host, with canonical env pointing at the apex.
  const base = trustedBaseUrl(new URL("https://www.ideastud.io/x"), env);
  assert.equal(base, "https://ideastud.io");
});

test("trustedBaseUrl ignores a malformed env origin", () => {
  const base = trustedBaseUrl(new URL("https://ideastud.io/x"), { URL: "not a url" });
  assert.equal(base, "https://ideastud.io");
});
