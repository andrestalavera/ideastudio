import type { Config, Context } from "@netlify/functions";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { resolveChromiumExecutable } from "./_lib/chromium.mjs";
import { renderResumeHtml } from "./_lib/render.mjs";
import type { Culture, Resume } from "./_lib/types.mjs";

// chromium-min ships without the Chromium binary so the deployed function
// stays well under Netlify's size ceiling. The matching binary is fetched and
// integrity-verified at cold start (see _lib/chromium.mts). Pinned to the
// version installed in package.json — bumping one without the other will
// produce a protocol mismatch.
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ??
  "https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar";

// Hosts the function is allowed to render from. The fetch target is never
// derived from an attacker-controllable Host header: a spoofed Host would
// otherwise make the function fetch and render attacker-controlled "resume"
// data (SSRF). Netlify injects the real deploy origin via URL / DEPLOY_PRIME_URL
// at runtime; those are added to the set below and preferred over the request
// host when building the fetch base.
const STATIC_ALLOWED_HOSTS = [
  "ideastud.io",
  "www.ideastud.io",
  "localhost",
  "localhost:8888",
  "127.0.0.1",
  "127.0.0.1:8888",
] as const;

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;

function trustedBaseUrl(requestUrl: URL): string | null {
  const allowed = new Set<string>(STATIC_ALLOWED_HOSTS);
  for (const envOrigin of [process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL]) {
    if (!envOrigin) continue;
    try {
      allowed.add(new URL(envOrigin).host);
    } catch {
      // Ignore malformed env origins.
    }
  }

  if (!allowed.has(requestUrl.host)) {
    return null;
  }

  const canonical = process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  if (canonical) {
    try {
      return new URL(canonical).origin;
    } catch {
      // Fall through to the allowlisted request origin.
    }
  }
  return requestUrl.origin;
}

function textResponse(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS },
  });
}

export default async (req: Request, _context: Context): Promise<Response> => {
  const url = new URL(req.url);

  // Strict allowlist — only the literal strings "fr" and "en" ever reach the
  // data URL, so no caller value can traverse out of wwwroot/data.
  const cultureParam = url.searchParams.get("culture")?.toLowerCase();
  const culture: Culture = cultureParam === "en" ? "en" : "fr";

  const baseUrl = trustedBaseUrl(url);
  if (!baseUrl) {
    return textResponse(400, "Invalid request host.");
  }

  const dataUrl = `${baseUrl}/data/resume-${culture}.json`;

  const dataRes = await fetch(dataUrl, { signal: AbortSignal.timeout(10_000) });
  if (!dataRes.ok) {
    return textResponse(502, "Failed to load resume data.");
  }
  const resume = (await dataRes.json()) as Resume;

  const html = renderResumeHtml(resume, culture, baseUrl);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await resolveChromiumExecutable(CHROMIUM_PACK_URL),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 20_000 });
    const pdf = await page.pdf({
      format: "Legal",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0cm", bottom: "0cm", left: "0cm" },
    });

    const body = pdf.buffer.slice(
      pdf.byteOffset,
      pdf.byteOffset + pdf.byteLength,
    ) as ArrayBuffer;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="resume-andres-talavera-${culture}.pdf"`,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        ...SECURITY_HEADERS,
      },
    });
  } finally {
    await browser.close();
  }
};

// Edge-enforced rate limiting for this public, unauthenticated endpoint. Each
// request launches a headless Chromium render, so it is a prime cost/DoS
// amplification target. Caps each client IP to 10 requests per 60s window;
// excess requests get a 429 before the function runs.
export const config: Config = {
  rateLimit: {
    action: "rate_limit",
    aggregateBy: "ip",
    windowSize: 60,
    windowLimit: 10,
  },
};
