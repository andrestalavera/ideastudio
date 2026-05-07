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

const T = {
  fr: {
    now: "aujourd'hui",
    title: "Curriculum Vitae",
    docTitle: "Parcours",
    overview: "Mission",
    responsibilities: "Responsabilités clés",
    skills: "Compétences",
  },
  en: {
    now: "now",
    title: "Curriculum Vitae",
    docTitle: "Resume",
    overview: "Overview",
    responsibilities: "Key Responsibilities",
    skills: "Skills",
  },
} as const;

function formatPeriod(exp: Experience, culture: Culture): string {
  const start = exp.startDate.slice(0, 7).replace("-", ".");
  const end = exp.endDate ? exp.endDate.slice(0, 7).replace("-", ".") : T[culture].now;
  return `${start} → ${end}`;
}

function logoUrl(company: string, baseUrl: string): string {
  return `${baseUrl}/images/${generateSlug(company)}.png`;
}

function contactLink(label: string, value: string, href: string): string {
  return `<span><span class="label">${label}</span><a href="${href}">${escape(value)}</a></span>`;
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

  const contacts = [
    pi.email && contactLink("Email", pi.email, `mailto:${escape(pi.email)}`),
    pi.linkedin && contactLink("LinkedIn", pi.linkedin, `https://www.linkedin.com/in/${escape(pi.linkedin)}/`),
    pi.github && contactLink("GitHub", pi.github, `https://github.com/${escape(pi.github)}`),
    pi.website && contactLink("Web", pi.website, `https://${escape(pi.website)}`),
  ]
    .filter(Boolean)
    .join("");

  return `
  <section class="page">
    <div class="cover__top">
      <img class="cover__photo" src="${photoUrl}" alt="${escape(pi.name)}" />
      <div>
        <div class="kicker">— ${T[culture].title}</div>
        <div class="cover__name">${escape(pi.name)}</div>
        <div class="cover__title">${escape(pi.title)}</div>
      </div>
    </div>
    <hr class="divider" />
    <div class="cover__hero">${escape(pi.hero)}</div>
    <p class="cover__intro">${escape(pi.introduction)}</p>

    <div class="cover__meta">${langs}</div>

    <div class="cover__contact">${contacts}</div>

    <div class="about-grid">${aboutCards}</div>
  </section>`;
}

function renderExperience(
  exp: Experience,
  index: number,
  total: number,
  baseUrl: string,
  culture: Culture,
  authorName: string,
): string {
  const t = T[culture];
  const period = formatPeriod(exp, culture);
  const locations = (exp.locations ?? []).join(" · ");

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

  const section = (title: string, body: string, tag = "div") =>
    body
      ? `<div class="exp__section">
           <div class="exp__section-title">${title}</div>
           <${tag} class="exp__${tag === "ul" ? "list" : "description"}">${body}</${tag}>
         </div>`
      : "";

  return `
  <section class="page">
    <div class="exp__head">
      <img class="exp__logo" src="${logoUrl(exp.company, baseUrl)}" alt="${escape(exp.company)}" />
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

    ${section(t.overview, description)}
    ${section(t.responsibilities, responsibilities, "ul")}

    ${
      skills
        ? `<div class="exp__skills">
             <div class="exp__section-title">${t.skills}</div>
             <div>${skills}</div>
           </div>`
        : ""
    }

    <div class="page__footer">
      <span class="page__footer-name">${escape(authorName)}</span>
      <span>${escape(exp.company)} · ${escape(period)}</span>
    </div>
  </section>`;
}

export function renderResumeHtml(
  resume: Resume,
  culture: Culture,
  baseUrl: string,
): string {
  const cssUrl = `${baseUrl}/css/styles.min.css`;
  const authorName = resume.personalInformation.name;
  const total = resume.experiences.length;

  const cover = renderCover(resume, baseUrl, culture);
  const experiences = resume.experiences
    .map((exp, i) => renderExperience(exp, i, total, baseUrl, culture, authorName))
    .join("");

  return `<!DOCTYPE html>
<html lang="${culture}">
<head>
<meta charset="utf-8" />
<title>${escape(authorName)} — ${T[culture].docTitle}</title>
<link rel="stylesheet" href="${cssUrl}" />
</head>
<body class="resume-pdf">
${cover}
${experiences}
</body>
</html>`;
}
