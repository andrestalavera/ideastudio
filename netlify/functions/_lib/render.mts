import type { Resume, Experience, Culture, AboutSection } from "./types.mjs";
import { generateSlug } from "./slug.mjs";

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

function formatPeriod(exp: Experience, culture: Culture): string {
  const start = exp.startDate.slice(0, 7).replace("-", ".");
  if (!exp.endDate) {
    return `${start} → ${culture === "fr" ? "aujourd'hui" : "now"}`;
  }
  const end = exp.endDate.slice(0, 7).replace("-", ".");
  return `${start} → ${end}`;
}

function logoUrl(company: string, baseUrl: string): string {
  const slug = generateSlug(company);
  return `${baseUrl}/images/${slug}.png`;
}

function renderCss(): string {
  return `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

@page {
  size: A4;
  margin: 0;
}

html, body {
  background: #ffffff;
  color: #05161a;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 11pt;
  line-height: 1.55;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

a { color: #007a86; text-decoration: none; }

.page {
  page-break-after: always;
  width: 210mm;
  min-height: 297mm;
  padding: 18mm 20mm;
  display: flex;
  flex-direction: column;
}
.page:last-child { page-break-after: auto; }
/* Very long experiences may span more than one printed page;
   keep section blocks together to avoid awkward splits. */
.exp__section { page-break-inside: avoid; }
.exp__head    { page-break-after: avoid; }

.kicker {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #00808a;
  font-weight: 500;
}

.divider {
  height: 2px;
  background: linear-gradient(90deg, #00c2d4 0%, #2d44ff 50%, #ff3670 100%);
  border: 0;
  margin: 0;
}

/* ---------- Cover ---------- */

.cover__top {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 20px;
  align-items: center;
  margin-bottom: 18px;
}
.cover__photo {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #00c2d4;
}
.cover__name {
  font-size: 26pt;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: #05161a;
}
.cover__title {
  font-size: 11pt;
  color: #5e7a77;
  margin-top: 6px;
}
.cover__hero {
  font-size: 18pt;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #0a2328;
  margin: 14px 0 12px;
}
.cover__intro {
  font-size: 10.5pt;
  color: #2a3d3a;
  line-height: 1.55;
  margin-bottom: 14px;
}

.cover__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(10, 35, 40, 0.1);
}
.cover__lang {
  display: inline-block;
  padding: 3px 10px;
  border: 1px solid rgba(0, 194, 212, 0.4);
  border-radius: 999px;
  font-size: 9pt;
  color: #00808a;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.04em;
}
.cover__contact {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 9.5pt;
  color: #2a3d3a;
}
.cover__contact .label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8pt;
  color: #5e7a77;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-right: 4px;
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 18px;
  margin-top: 14px;
}
.about-card {
  border-left: 2px solid #00c2d4;
  padding: 2px 0 2px 12px;
}
.about-card__title {
  font-size: 9.5pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #00808a;
  margin-bottom: 4px;
}
.about-card__body p {
  font-size: 9.5pt;
  line-height: 1.45;
  color: #2a3d3a;
  margin-bottom: 3px;
}

/* ---------- Experience pages ---------- */

.exp__head {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  gap: 16px;
  align-items: center;
  margin-bottom: 14px;
}
.exp__logo {
  width: 70px;
  height: 70px;
  object-fit: contain;
  background: #ffffff;
  padding: 4px;
}
.exp__title {
  font-size: 18pt;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: #05161a;
}
.exp__company {
  font-size: 12pt;
  color: #00808a;
  font-weight: 500;
  margin-top: 2px;
}
.exp__index {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
  color: #5e7a77;
  letter-spacing: 0.1em;
}

.exp__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5pt;
  color: #5e7a77;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin: 12px 0 14px;
  padding: 8px 0;
  border-top: 1px solid rgba(10, 35, 40, 0.1);
  border-bottom: 1px solid rgba(10, 35, 40, 0.1);
}
.exp__meta-item {
  margin-right: 16px;
}
.exp__meta-item::before {
  content: "—";
  color: #00c2d4;
  margin-right: 6px;
}

.exp__description p {
  font-size: 10.5pt;
  line-height: 1.55;
  color: #2a3d3a;
  margin-bottom: 8px;
}

.exp__section {
  margin-top: 14px;
}
.exp__section-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #00808a;
  margin-bottom: 8px;
  font-weight: 500;
}
.exp__list {
  list-style: none;
  padding: 0;
}
.exp__list li {
  position: relative;
  padding-left: 16px;
  font-size: 10pt;
  line-height: 1.5;
  color: #2a3d3a;
  margin-bottom: 5px;
}
.exp__list li::before {
  content: "—";
  position: absolute;
  left: 0;
  color: #00c2d4;
  font-weight: 500;
}

.exp__skills {
  margin-top: auto;
  padding-top: 14px;
}
.skill-pill {
  display: inline-block;
  margin: 0 4px 5px 0;
  padding: 3px 9px;
  border: 1px solid rgba(0, 194, 212, 0.4);
  border-radius: 999px;
  font-size: 8.5pt;
  font-family: 'JetBrains Mono', monospace;
  color: #00808a;
  background: rgba(0, 194, 212, 0.05);
  letter-spacing: 0.02em;
}

/* Footer signature on each experience page */
.page__footer {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(10, 35, 40, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 7.5pt;
  color: #5e7a77;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.page__footer-name { color: #00808a; font-weight: 500; }
`;
}

function renderCover(resume: Resume, baseUrl: string, culture: Culture): string {
  const pi = resume.personalInformation;
  const photoUrl = `${baseUrl}/images/andres-talavera.jpeg`;
  const langs = Object.entries(pi.languages ?? {})
    .map(([code, label]) => `<span class="cover__lang">${escape(code)} · ${escape(label)}</span>`)
    .join("");

  const aboutCards = (resume.aboutSections ?? [])
    .map(
      (s: AboutSection) => `
      <div class="about-card">
        <div class="about-card__title">${escape(s.title)}</div>
        <div class="about-card__body">
          ${(s.paragraphs ?? []).map((p) => `<p>${escape(p)}</p>`).join("")}
        </div>
      </div>`,
    )
    .join("");

  const labelEmail = culture === "fr" ? "Email" : "Email";
  const labelLinkedIn = "LinkedIn";
  const labelGithub = "GitHub";
  const labelWeb = culture === "fr" ? "Web" : "Web";

  return `
  <section class="page">
    <div class="cover__top">
      <img class="cover__photo" src="${photoUrl}" alt="${escape(pi.name)}" />
      <div>
        <div class="kicker">— ${culture === "fr" ? "Curriculum Vitae" : "Curriculum Vitae"}</div>
        <div class="cover__name">${escape(pi.name)}</div>
        <div class="cover__title">${escape(pi.title)}</div>
      </div>
    </div>
    <hr class="divider" />
    <div class="cover__hero">${escape(pi.hero)}</div>
    <p class="cover__intro">${escape(pi.introduction)}</p>

    <div class="cover__meta">
      ${langs}
    </div>

    <div class="cover__contact">
      ${pi.email ? `<span><span class="label">${labelEmail}</span><a href="mailto:${escape(pi.email)}">${escape(pi.email)}</a></span>` : ""}
      ${pi.linkedin ? `<span><span class="label">${labelLinkedIn}</span><a href="https://www.linkedin.com/in/${escape(pi.linkedin)}/">${escape(pi.linkedin)}</a></span>` : ""}
      ${pi.github ? `<span><span class="label">${labelGithub}</span><a href="https://github.com/${escape(pi.github)}">${escape(pi.github)}</a></span>` : ""}
      ${pi.website ? `<span><span class="label">${labelWeb}</span><a href="https://${escape(pi.website)}">${escape(pi.website)}</a></span>` : ""}
    </div>

    <div class="about-grid">
      ${aboutCards}
    </div>
  </section>`;
}

function renderExperience(
  exp: Experience,
  index: number,
  total: number,
  baseUrl: string,
  culture: Culture,
  resume: Resume,
): string {
  const period = formatPeriod(exp, culture);
  const locations = (exp.locations ?? []).join(" · ");
  const responsibilitiesTitle = culture === "fr" ? "Responsabilités clés" : "Key Responsibilities";
  const overviewTitle = culture === "fr" ? "Mission" : "Overview";
  const skillsTitle = culture === "fr" ? "Compétences" : "Skills";

  const description = (exp.description ?? [])
    .filter((p) => p && p.trim())
    .map((p) => `<p>${escape(p)}</p>`)
    .join("");

  const responsibilities = (exp.responsibilities ?? [])
    .filter((r) => r && r.trim())
    .map((r) => `<li>${escape(r)}</li>`)
    .join("");

  const skills = (exp.skills ?? [])
    .filter((s) => s && s.trim())
    .map((s) => `<span class="skill-pill">${escape(s)}</span>`)
    .join("");

  const indexLabel = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const logo = logoUrl(exp.company, baseUrl);

  return `
  <section class="page">
    <div class="exp__head">
      <img class="exp__logo" src="${logo}" alt="${escape(exp.company)}" />
      <div>
        <div class="exp__title">${escape(exp.title)}</div>
        <div class="exp__company">${escape(exp.company)}</div>
      </div>
      <div class="exp__index">${indexLabel}</div>
    </div>

    <div class="exp__meta">
      ${exp.mode ? `<span class="exp__meta-item">${escape(exp.mode)}</span>` : ""}
      <span class="exp__meta-item">${escape(period)}</span>
      ${locations ? `<span class="exp__meta-item">${escape(locations)}</span>` : ""}
    </div>

    ${
      description
        ? `<div class="exp__section">
             <div class="exp__section-title">${overviewTitle}</div>
             <div class="exp__description">${description}</div>
           </div>`
        : ""
    }

    ${
      responsibilities
        ? `<div class="exp__section">
             <div class="exp__section-title">${responsibilitiesTitle}</div>
             <ul class="exp__list">${responsibilities}</ul>
           </div>`
        : ""
    }

    ${
      skills
        ? `<div class="exp__skills">
             <div class="exp__section-title">${skillsTitle}</div>
             <div>${skills}</div>
           </div>`
        : ""
    }

    <div class="page__footer">
      <span class="page__footer-name">${escape(resume.personalInformation.name)}</span>
      <span>${escape(exp.company)} · ${escape(period)}</span>
    </div>
  </section>`;
}

export function renderResumeHtml(
  resume: Resume,
  culture: Culture,
  baseUrl: string,
): string {
  const cover = renderCover(resume, baseUrl, culture);
  const total = resume.experiences.length;
  const experiences = resume.experiences
    .map((exp, i) => renderExperience(exp, i, total, baseUrl, culture, resume))
    .join("");

  return `<!DOCTYPE html>
<html lang="${culture}">
<head>
<meta charset="utf-8" />
<title>${escape(resume.personalInformation.name)} — ${culture === "fr" ? "Parcours" : "Resume"}</title>
<style>${renderCss()}</style>
</head>
<body>
${cover}
${experiences}
</body>
</html>`;
}
