import type { Context } from "@netlify/functions";
import nodemailer from "nodemailer";

// Contact-form handler. Receives the JSON posted by Pages/Contact.razor and
// relays it to an inbox over SMTP. Configure via environment variables in the
// Netlify dashboard (Site settings → Environment variables):
//
//   SMTP_HOST      e.g. mail.infomaniak.com
//   SMTP_PORT      465 (implicit TLS) or 587 (STARTTLS)        [default 465]
//   SMTP_USER      the SMTP account login
//   SMTP_PASS      the SMTP account password / app password
//   CONTACT_TO     destination inbox      [default andres.talavera@ideastud.io]
//   CONTACT_FROM   envelope From address  [default SMTP_USER]
//
// Until these are set the function returns 503 and the form shows its error
// state (with a mailto fallback), so nothing breaks before configuration.

interface ContactPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  website?: string; // honeypot
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const json = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== "POST") {
    return json(405, { success: false, error: "Method not allowed" });
  }

  let payload: ContactPayload;
  try {
    payload = (await req.json()) as ContactPayload;
  } catch {
    return json(400, { success: false, error: "Invalid JSON" });
  }

  // Honeypot — a bot filled the hidden field. Pretend success, send nothing.
  if (payload.website && payload.website.trim().length > 0) {
    return json(200, { success: true });
  }

  const name = (payload.name ?? "").trim();
  const email = (payload.email ?? "").trim();
  const subject = (payload.subject ?? "").trim();
  const message = (payload.message ?? "").trim();

  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return json(422, { success: false, error: "Validation failed" });
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return json(503, { success: false, error: "Mail transport not configured" });
  }

  const port = Number(process.env.SMTP_PORT ?? "465");
  const to = process.env.CONTACT_TO ?? "andres.talavera@ideastud.io";
  const from = process.env.CONTACT_FROM ?? user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // implicit TLS on 465, STARTTLS otherwise
    auth: { user, pass },
  });

  const safeSubject = subject || `Contact ideastud.io — ${name}`;
  const text =
    `Nouveau message depuis ideastud.io\n\n` +
    `Nom : ${name}\n` +
    `Email : ${email}\n` +
    `Sujet : ${subject || "(aucun)"}\n\n` +
    `${message}\n`;

  try {
    await transporter.sendMail({
      from,
      to,
      replyTo: `${name} <${email}>`,
      subject: safeSubject,
      text,
    });
    return json(200, { success: true });
  } catch (err) {
    console.error("contact: sendMail failed", err);
    return json(502, { success: false, error: "Send failed" });
  }
};
