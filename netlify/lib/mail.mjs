// Outgoing email through Resend. With no RESEND_API_KEY the server refuses to
// send, except in local dev (scripts/dev.mjs sets __LL_DEV) where the message is
// printed to the console so sign-in still works with no setup.

import { HttpError } from "./util.mjs";

export const escHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Which way out is configured?
//   RESEND_API_KEY  -> Resend   (free test sender only reaches the account owner; verify a domain to email anyone)
//   BREVO_API_KEY   -> Brevo    (free; works with one verified sender address, no domain needed)
//   neither         -> local dev prints the email, or ALLOW_DEMO_LOGIN_LINKS=true shows the link on screen
// Returns { sent: true } when an email went out, { dev: true } when it was only shown / printed.
export const mailConfigured = () => !!(process.env.RESEND_API_KEY || process.env.BREVO_API_KEY);
export const demoLinks = () => !!globalThis.__LL_DEV || process.env.ALLOW_DEMO_LOGIN_LINKS === "true";

function sender() {
  const raw = process.env.FROM_EMAIL || "LunchLine <onboarding@resend.dev>";
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || "LunchLine", email: m[2], raw } : { name: "LunchLine", email: raw.trim(), raw: `LunchLine <${raw.trim()}>` };
}

async function post(url, headers, body, label) {
  let res;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
  } catch (e) {
    console.error(`mail: ${label} network error`, e);
    throw new HttpError(502, "We couldn't send that email. Try again in a minute.");
  }
  if (!res.ok) {
    console.error(`mail: ${label} said`, res.status, await res.text().catch(() => ""));
    throw new HttpError(502, "We couldn't send that email. Ask whoever runs LunchLine to check the email settings.");
  }
}

export async function sendMail({ to, subject, html, text }) {
  const from = sender();
  if (process.env.RESEND_API_KEY) {
    await post("https://api.resend.com/emails", { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, { from: from.raw, to: [to], subject, html, text }, "Resend");
    return { sent: true };
  }
  if (process.env.BREVO_API_KEY) {
    await post("https://api.brevo.com/v3/smtp/email", { "api-key": process.env.BREVO_API_KEY }, { sender: { name: from.name, email: from.email }, to: [{ email: to }], subject, htmlContent: html, textContent: text }, "Brevo");
    return { sent: true };
  }
  if (demoLinks()) {
    if (globalThis.__LL_DEV) console.log(`\n--- email to ${to} ---\nSubject: ${subject}\n\n${text}\n--- end email ---\n`);
    return { dev: true };
  }
  throw new HttpError(503, "This server can't send email yet. Whoever runs LunchLine needs to add an email key (see .env.example).");
}

const INK = "#1F1A17", ORANGE = "#FF5A1F", CREAM = "#FFF8EF";

function layout(title, inner, preheader = "") {
  return `<!doctype html><html><body style="margin:0;background:${CREAM};font-family:Arial,Helvetica,sans-serif;color:${INK}">
<span style="display:none;max-height:0;overflow:hidden">${escHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;border:1px solid #EADFD0">
<tr><td style="padding:22px 28px 0"><span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:${ORANGE};vertical-align:middle"></span>
<span style="font-weight:800;font-size:18px;vertical-align:middle;margin-left:8px">LunchLine</span></td></tr>
<tr><td style="padding:18px 28px 28px"><h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">${escHtml(title)}</h1>${inner}</td></tr>
</table>
<p style="font-size:12px;color:#7A6F66;margin:14px 0 0">Sent by LunchLine, a student project built for Neighborhood Hacks.</p>
</td></tr></table></body></html>`;
}

const button = (href, label) =>
  `<p style="margin:20px 0"><a href="${escHtml(href)}" style="background:${ORANGE};color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:12px;display:inline-block">${escHtml(label)}</a></p>`;

export function magicLinkEmail({ link, purpose, schoolName }) {
  const create = purpose === "create";
  const title = create ? `Finish setting up ${schoolName}` : "Your LunchLine sign-in link";
  const lead = create
    ? `Tap the button to confirm this email and open the dashboard for <strong>${escHtml(schoolName)}</strong>.`
    : "Tap the button to sign in to your LunchLine staff dashboard.";
  return {
    subject: create ? `Finish setting up ${schoolName} on LunchLine` : "Your LunchLine sign-in link",
    html: layout(title, `<p style="font-size:15px;line-height:1.55;margin:0">${lead}</p>${button(link, create ? "Open my dashboard" : "Sign in")}
      <p style="font-size:13px;color:#7A6F66;line-height:1.5;margin:0">This link works once and expires in 15 minutes. If you didn't ask for it, you can ignore this email.</p>`, title),
    text: `${title}\n\n${create ? `Confirm this email and open the dashboard for ${schoolName}:` : "Sign in to your LunchLine staff dashboard:"}\n${link}\n\nThis link works once and expires in 15 minutes. If you didn't ask for it, ignore this email.`,
  };
}

export function inviteEmail({ link, schoolName, role, by, reset = false }) {
  const title = reset ? `Reset your LunchLine password for ${schoolName}` : `${by} added you to ${schoolName}`;
  const lead = reset
    ? `Tap the button to choose a new password for <strong>${escHtml(schoolName)}</strong>.`
    : `You can now sign in as <strong>${escHtml(role)}</strong> for ${escHtml(schoolName)}. Tap the button to choose your password.`;
  return {
    subject: reset ? `Reset your password for ${schoolName} on LunchLine` : `You're invited to ${schoolName} on LunchLine`,
    html: layout(title, `<p style="font-size:15px;line-height:1.55;margin:0">${lead}</p>${button(link, "Choose a password")}
      <p style="font-size:13px;color:#7A6F66;line-height:1.5;margin:0">This link works once and expires in 7 days. If you weren't expecting it, you can ignore this email.</p>`, title),
    text: `${title}\n\n${reset ? "Choose a new password" : "Choose your password"} here (works once, expires in 7 days):\n${link}`,
  };
}

// `report` comes from reports.mjs. Everything user-written is escaped here.
export function reportEmail({ schoolName, link, report }) {
  const b = report.bullets || [];
  const title = `${schoolName}: your week in lunch`;
  const stat = (n, l) => `<td style="padding:10px 14px;background:${CREAM};border-radius:12px;text-align:center"><div style="font-size:24px;font-weight:800">${escHtml(n)}</div><div style="font-size:12px;color:#7A6F66">${escHtml(l)}</div></td>`;
  const list = (items, empty) => items.length
    ? `<ul style="padding-left:18px;margin:6px 0 14px;line-height:1.6;font-size:14px">${items.map(i => `<li>${escHtml(i)}</li>`).join("")}</ul>`
    : `<p style="font-size:14px;color:#7A6F66;margin:6px 0 14px">${escHtml(empty)}</p>`;
  const inner = `
    <table role="presentation" width="100%" cellspacing="6" cellpadding="0"><tr>${stat(report.good_pct + "%", "rated Good")}${stat(String(report.ratings), "ratings")}${stat(String(report.students), "students")}</tr></table>
    <p style="font-size:15px;line-height:1.6;margin:16px 0">${escHtml(report.summary).replace(/\n\n/g, "</p><p style=\"font-size:15px;line-height:1.6;margin:0 0 12px\">")}</p>
    <h2 style="font-size:15px;margin:18px 0 0">Make more of these</h2>${list(report.loved.map(d => `${d.name} · ${d.pct}% Good (${d.n})`), "Not enough ratings yet.")}
    <h2 style="font-size:15px;margin:0">Fix or drop these</h2>${list(report.needs.map(d => `${d.name} · ${d.pct}% disliked (${d.n})`), "Nothing is standing out.")}
    ${b.length ? `<h2 style="font-size:15px;margin:0">Worth knowing</h2>${list(b, "")}` : ""}
    ${button(link, "Open the full dashboard")}
    <p style="font-size:12px;color:#7A6F66;margin:0">You get this every Monday. Turn it off in School settings.</p>`;
  const textLines = [title, "", `${report.good_pct}% rated Good · ${report.ratings} ratings · ${report.students} students`, "", report.summary, "",
    "Make more of these:", ...report.loved.map(d => `- ${d.name} (${d.pct}% Good, ${d.n})`), "", "Fix or drop these:", ...report.needs.map(d => `- ${d.name} (${d.pct}% disliked, ${d.n})`), "", link];
  return { subject: title, html: layout(title, inner, report.summary.slice(0, 90)), text: textLines.join("\n") };
}
