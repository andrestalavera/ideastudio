// Pure SSRF guard for resume-pdf: resolves the origin the function is allowed to
// fetch resume data from, never trusting an attacker-controllable Host header.
// Kept import-free so it can be unit-tested without launching Chromium.

// Hosts the function may render from. Netlify injects the real deploy origin via
// URL / DEPLOY_PRIME_URL / DEPLOY_URL at runtime; those are added and preferred
// over the request host when building the fetch base.
export const STATIC_ALLOWED_HOSTS = [
  "ideastud.io",
  "www.ideastud.io",
  "localhost",
  "localhost:8888",
  "127.0.0.1",
  "127.0.0.1:8888",
] as const;

export interface HostEnv {
  URL?: string;
  DEPLOY_PRIME_URL?: string;
  DEPLOY_URL?: string;
}

// Returns a trusted origin string, or null if the request host is not allowlisted.
export function trustedBaseUrl(requestUrl: URL, env: HostEnv = process.env): string | null {
  const allowed = new Set<string>(STATIC_ALLOWED_HOSTS);
  for (const envOrigin of [env.URL, env.DEPLOY_PRIME_URL, env.DEPLOY_URL]) {
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

  const canonical = env.URL ?? env.DEPLOY_PRIME_URL;
  if (canonical) {
    try {
      return new URL(canonical).origin;
    } catch {
      // Fall through to the allowlisted request origin.
    }
  }
  return requestUrl.origin;
}
