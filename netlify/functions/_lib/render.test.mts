import { test } from "node:test";
import assert from "node:assert/strict";
import { escape } from "./render.mjs";

test("escape neutralizes every HTML-significant character", () => {
  assert.equal(
    escape(`<script>alert("x") & 'y'</script>`),
    "&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;",
  );
});

test("escape leaves plain text untouched", () => {
  assert.equal(escape("Andrés Talavera — .NET"), "Andrés Talavera — .NET");
});
