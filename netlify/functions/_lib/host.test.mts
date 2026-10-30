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

// Netlify does not expose URL / DEPLOY_PRIME_URL to functions at runtime, but
// context.site.name is always set, and only this site's deploys answer on
// <site>.netlify.app and <prefix>--<site>.netlify.app.
test("trustedBaseUrl allows this site's deploy previews and branch deploys", () => {
  for (const host of [
    "deploy-preview-90--ideastud-io.netlify.app",
    "main--ideastud-io.netlify.app",
    "6720f1c2a3b4c5d6e7f8a9b0--ideastud-io.netlify.app",
    "ideastud-io.netlify.app",
  ]) {
    assert.equal(trustedBaseUrl(new URL(`https://${host}/x`), {}, "ideastud-io"), `https://${host}`);
  }
});

test("trustedBaseUrl renders a preview from its own origin, not the canonical one", () => {
  const base = trustedBaseUrl(
    new URL("https://deploy-preview-90--ideastud-io.netlify.app/x"),
    { URL: "https://ideastud.io" },
    "ideastud-io",
  );
  assert.equal(base, "https://deploy-preview-90--ideastud-io.netlify.app");
});

test("trustedBaseUrl rejects other Netlify sites and look-alike hosts", () => {
  for (const host of [
    "deploy-preview-1--evil.netlify.app",
    "evil-ideastud-io.netlify.app",
    "ideastud-io.netlify.app.attacker.com",
    "x--ideastud-io.netlify.app.evil.example",
    "a.b--ideastud-io.netlify.app",
  ]) {
    assert.equal(trustedBaseUrl(new URL(`https://${host}/x`), {}, "ideastud-io"), null, host);
  }
});

test("trustedBaseUrl ignores the Netlify pattern when the site name is unknown", () => {
  assert.equal(trustedBaseUrl(new URL("https://main--ideastud-io.netlify.app/x"), {}), null);
});
