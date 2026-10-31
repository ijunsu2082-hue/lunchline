// sending emails (resend or brevo)
import { HttpError } from "./util.mjs";
import { inkOn } from "./logo.mjs";

// make text safe for html
export const escHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// is an email key set up
export const mailConfigured = () => !!(process.env.RESEND_API_KEY || process.env.BREVO_API_KEY);

// who the email is from
function sender() {
  const raw = process.env.FROM_EMAIL || "LunchLine <onboarding@resend.dev>";
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || "LunchLine", email: m[2], raw } : { name: "LunchLine", email: raw.trim(), raw: `LunchLine <${raw.trim()}>` };
}

// send the request to the email service
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

// send one email
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
  throw new HttpError(503, "This server can't send email yet. Whoever runs LunchLine needs to add an email key (see .env.example).");
}

// email look and feel
const SITE = () => (process.env.SITE_URL || "https://lunchline.netlify.app").replace(/\/$/, "");
const INK = "#1F1A17", ORANGE = "#FF5A1F", CREAM = "#FFF8EF";
const HEXRE = /^#[0-9a-fA-F]{6}$/;
// logo in the school's color
const logoUrl = color => `${SITE()}/api/logo.png?c=${(HEXRE.test(color || "") ? color : ORANGE).slice(1).toUpperCase()}`;

// shared email wrapper
function layout(title, inner, preheader = "", color = ORANGE) {
  return `<!doctype html><html><body style="margin:0;background:${CREAM};font-family:Arial,Helvetica,sans-serif;color:${INK}">
<span style="display:none;max-height:0;overflow:hidden">${escHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;border:1px solid #EADFD0">
<tr><td style="padding:22px 28px 0"><span style="display:inline-block;width:32px;height:32px;border-radius:9px;background:${HEXRE.test(color || "") ? color : ORANGE};vertical-align:middle;overflow:hidden"><img src="${logoUrl(color)}" width="32" height="32" alt="" style="display:block;width:32px;height:32px;border:0"></span>
<span style="font-weight:800;font-size:18px;vertical-align:middle;margin-left:8px">LunchLine</span></td></tr>
<tr><td style="padding:18px 28px 28px"><h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">${escHtml(title)}</h1>${inner}</td></tr>
</table>
<p style="font-size:12px;color:#7A6F66;margin:14px 0 0">Sent by LunchLine.</p>
</td></tr></table></body></html>`;
}

// the big button
const button = (href, label, color = ORANGE) => {
  const c = HEXRE.test(color || "") ? color : ORANGE;
  return `<p style="margin:20px 0"><a href="${escHtml(href)}" style="background:${c};color:${inkOn(c)};text-decoration:none;font-weight:700;padding:13px 22px;border-radius:12px;display:inline-block">${escHtml(label)}</a></p>`;
};

// sign in / create school email
export function magicLinkEmail({ link, purpose, schoolName, color }) {
  const create = purpose === "create";
  const title = create ? `Finish setting up ${schoolName}` : "Your LunchLine sign-in link";
  const lead = create
    ? `Tap the button to confirm this email and open the dashboard for <strong>${escHtml(schoolName)}</strong>.`
    : "Tap the button to sign in to your LunchLine staff dashboard.";
  return {
    subject: create ? `Finish setting up ${schoolName} on LunchLine` : "Your LunchLine sign-in link",
    html: layout(title, `<p style="font-size:15px;line-height:1.55;margin:0">${lead}</p>${button(link, create ? "Open my dashboard" : "Sign in", color)}
      <p style="font-size:13px;color:#7A6F66;line-height:1.5;margin:0">This link works once and expires in 15 minutes. If you didn't ask for it, you can ignore this email.</p>`, title, color),
    text: `${title}\n\n${create ? `Confirm this email and open the dashboard for ${schoolName}:` : "Sign in to your LunchLine staff dashboard:"}\n${link}\n\nThis link works once and expires in 15 minutes. If you didn't ask for it, ignore this email.`,
  };
}

// team invite email
export function inviteEmail({ link, schoolName, role, by, color }) {
  const title = `${by} added you to ${schoolName}`;
  return {
    subject: `You're on the ${schoolName} team on LunchLine`,
    html: layout(title, `<p style="font-size:15px;line-height:1.55;margin:0">You can now sign in as <strong>${escHtml(role)}</strong> for ${escHtml(schoolName)}. Tap the button to open the dashboard. There's no password to remember; next time, just ask for a new link.</p>${button(link, "Open the dashboard", color)}
      <p style="font-size:13px;color:#7A6F66;line-height:1.5;margin:0">This link works once and expires in 7 days. If you weren't expecting it, you can ignore this email.</p>`, title, color),
    text: `${title}\n\nOpen the dashboard (works once, expires in 7 days):\n${link}`,
  };
}

// weekly report email
export function reportEmail({ schoolName, link, report, color }) {
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
    ${button(link, "Open the full dashboard", color)}
    <p style="font-size:12px;color:#7A6F66;margin:0">You get this every Friday. Turn it off in School settings.</p>`;
  const textLines = [title, "", `${report.good_pct}% rated Good · ${report.ratings} ratings · ${report.students} students`, "", report.summary, "",
    "Make more of these:", ...report.loved.map(d => `- ${d.name} (${d.pct}% Good, ${d.n})`), "", "Fix or drop these:", ...report.needs.map(d => `- ${d.name} (${d.pct}% disliked, ${d.n})`), "", link];
  return { subject: title, html: layout(title, inner, report.summary.slice(0, 90), color), text: textLines.join("\n") };
}
