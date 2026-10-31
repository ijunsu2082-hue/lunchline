// send a test email: npm run mailtest -- you@example.com
import { sendMail, mailConfigured } from "../netlify/lib/mail.mjs";

try { process.loadEnvFile(new URL("../.env", import.meta.url)); } catch { /* use the environment as it is */ }

// need an address
const to = process.argv[2];
if (!to || !/.+@.+\..+/.test(to)) { console.error("Usage: npm run mailtest -- you@example.com"); process.exit(1); }
// no email key set
if (!mailConfigured()) {
  console.error("No email service is set. Put BREVO_API_KEY (or RESEND_API_KEY) and FROM_EMAIL in .env first. See .env.example.");
  process.exit(1);
}
try {
  await sendMail({ to, subject: "LunchLine test email", text: "If you can read this, LunchLine can send email.", html: "<p>If you can read this, LunchLine can send email.</p>" });
  console.log(`Sent to ${to}. Check the inbox (and spam).`);
} catch (e) {
  console.error("Sending failed:", e.message, "\nThe provider's reason is printed above (look for 'mail:').");
  process.exit(1);
}
