import type { Context } from "@netlify/functions";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { renderResumeHtml } from "./_lib/render.mjs";
import type { Culture, Resume } from "./_lib/types.mjs";

// chromium-min ships without the Chromium binary so the deployed function
// stays well under Netlify's 45 MB ceiling. The matching binary is fetched
// at cold start from the upstream Sparticuz GitHub release. Pinned to the
// version installed in package.json — bumping one without the other will
// produce a protocol mismatch.
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ??
  "https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar";

export default async (req: Request, _context: Context): Promise<Response> => {
  const url = new URL(req.url);
  const cultureParam = url.searchParams.get("culture")?.toLowerCase();
  const culture: Culture = cultureParam === "en" ? "en" : "fr";

  const baseUrl = `${url.protocol}//${url.host}`;
  const dataUrl = `${baseUrl}/data/resume-${culture}.json`;

  const dataRes = await fetch(dataUrl);
  if (!dataRes.ok) {
    return new Response(
      `Failed to load resume data from ${dataUrl}: ${dataRes.status} ${dataRes.statusText}`,
      { status: 502 },
    );
  }
  const resume = (await dataRes.json()) as Resume;

  const html = renderResumeHtml(resume, culture, baseUrl);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
    headless: true,
    defaultViewport: chromium.defaultViewport,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 20_000 });
    const pdf = await page.pdf({
      format: "Legal",
      printBackground: true,
      preferCSSPageSize: true,
      scale: 0.9,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
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
      },
    });
  } finally {
    await browser.close();
  }
};
