import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FIELD_LIMITS,
  isHoneypotTripped,
  stripCrlf,
  validateContact,
} from "./contact-validation.mjs";

test("stripCrlf collapses CR/LF to a space and trims", () => {
  assert.equal(stripCrlf("Ada\r\nLovelace"), "Ada Lovelace");
  assert.equal(stripCrlf("  spaced  "), "spaced");
  assert.equal(stripCrlf("a\nb\r\nc"), "a b c");
  // Header-injection attempt: the injected header must not survive as a newline.
  assert.equal(stripCrlf("me@x.com\r\nBcc: victim@y.com"), "me@x.com Bcc: victim@y.com");
});

test("isHoneypotTripped detects a filled hidden field", () => {
  assert.equal(isHoneypotTripped({ website: "http://spam" }), true);
  assert.equal(isHoneypotTripped({ website: "   " }), false);
  assert.equal(isHoneypotTripped({}), false);
});

test("validateContact accepts a well-formed payload", () => {
  const result = validateContact({
    name: "Ada",
    email: "ada@example.com",
    subject: "Hello",
    message: "This is long enough.",
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.fields.name, "Ada");
});

test("validateContact rejects bad email or too-short message", () => {
  assert.equal(validateContact({ name: "A", email: "nope", message: "long enough here" }).ok, false);
  assert.equal(validateContact({ name: "A", email: "a@b.co", message: "short" }).ok, false);
  assert.equal(validateContact({ name: "", email: "a@b.co", message: "long enough here" }).ok, false);
});

test("validateContact caps oversized fields (relay-amplification guard)", () => {
  const huge = "x".repeat(FIELD_LIMITS.message + 1);
  const result = validateContact({ name: "A", email: "a@b.co", message: huge });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 422);
    assert.equal(result.error, "Field too long");
  }

  const longName = validateContact({
    name: "n".repeat(FIELD_LIMITS.name + 1),
    email: "a@b.co",
    message: "long enough here",
  });
  assert.equal(longName.ok, false);
});
