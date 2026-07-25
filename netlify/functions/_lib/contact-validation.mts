// Pure validation + sanitization for the contact form. Kept free of any heavy
// imports (no nodemailer) so it can be unit-tested in isolation.

export interface ContactPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  website?: string; // honeypot
}

export interface ContactFields {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type ContactValidation =
  | { ok: true; fields: ContactFields }
  | { ok: false; status: number; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Upper bounds on each field so a caller cannot relay a multi-megabyte body over
// SMTP (relay-amplification / abuse), even within Netlify's request-size limit.
export const FIELD_LIMITS = {
  name: 200,
  email: 254, // RFC 5321 max address length
  subject: 300,
  message: 5000,
} as const;

const MESSAGE_MIN = 10;

// Strip CR/LF so attacker-supplied values cannot inject extra SMTP/MIME headers
// when interpolated into address fields. Internal newlines collapse to a single
// space; surrounding whitespace is trimmed. Spaces are preserved so display
// names like "Ada Lovelace" stay intact.
export const stripCrlf = (value: string): string => value.replace(/[\r\n]+/g, " ").trim();

// Returns true when the honeypot field was filled — a bot. The caller should
// pretend success and send nothing.
export const isHoneypotTripped = (payload: ContactPayload): boolean =>
  (payload.website ?? "").trim().length > 0;

export function validateContact(payload: ContactPayload): ContactValidation {
  const name = (payload.name ?? "").trim();
  const email = (payload.email ?? "").trim();
  const subject = (payload.subject ?? "").trim();
  const message = (payload.message ?? "").trim();

  if (!name || !EMAIL_RE.test(email) || message.length < MESSAGE_MIN) {
    return { ok: false, status: 422, error: "Validation failed" };
  }

  if (
    name.length > FIELD_LIMITS.name ||
    email.length > FIELD_LIMITS.email ||
    subject.length > FIELD_LIMITS.subject ||
    message.length > FIELD_LIMITS.message
  ) {
    return { ok: false, status: 422, error: "Field too long" };
  }

  return { ok: true, fields: { name, email, subject, message } };
}
