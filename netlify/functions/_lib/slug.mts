// Port of IdeaStudio.Website/Services/ISlugService.cs (SlugService).
// Behaviour mirrors the C# regexes so that company names map to the
// same logo filenames already shipped under wwwroot/images/.

const DIACRITICS = /\p{Mn}/gu;
const SPECIAL_CHARS = /[ .:,'"\/()&\-_@]+/g;
const CONSECUTIVE_HYPHENS = /-+/g;

export function generateSlug(input?: string | null): string {
  if (!input || !input.trim()) return "";

  const lower = input.toLowerCase();
  const normalized = lower.normalize("NFD");
  const withoutDiacritics = normalized.replace(DIACRITICS, "");

  const withSpecialHandled = withoutDiacritics
    .replaceAll(".", "dot")
    .replaceAll("#", "sharp");

  const cleaned = withSpecialHandled.trim().replace(SPECIAL_CHARS, "-");
  let slug = cleaned.replace(CONSECUTIVE_HYPHENS, "-").replace(/^-+|-+$/g, "");

  if (slug.length > 0 && slug[0] >= "0" && slug[0] <= "9") {
    slug = "id-" + slug;
  }
  return slug;
}
