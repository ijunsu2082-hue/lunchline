// Every Monday morning: build each school's weekly report and email it to the
// staff who haven't turned it off. Schools with no ratings that week are skipped.

import { getStore } from "@netlify/blobs";
import { buildWeeklyReport, emailReportTo } from "../lib/api.mjs";
import { listKeys, getAll } from "../lib/util.mjs";

export default async () => {
  const store = getStore({ name: "lunchline", consistency: "strong" });
  const origin = process.env.SITE_URL || process.env.URL || "";
  const schoolKeys = (await listKeys(store, "school/"));
  let sent = 0;
  for (const school of await getAll(store, schoolKeys)) {
    try {
      const members = await getAll(store, await listKeys(store, `staff/${school.id}/`));
      const to = members.filter(m => m.reports !== false && m.email);
      if (!to.length) continue;
      const report = await buildWeeklyReport(store, school);
      if (!report.ratings) continue;
      for (const m of to) { await emailReportTo(store, school, m.email, report, origin); sent++; }
    } catch (e) {
      console.error(`weekly report failed for ${school.id}`, e);
    }
  }
  console.log(`weekly reports: ${sent} emails sent`);
};

export const config = { schedule: "0 13 * * 1" }; // Mondays 13:00 UTC
