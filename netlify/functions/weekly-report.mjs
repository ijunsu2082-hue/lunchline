// Every Friday afternoon: build each school's weekly report so it's waiting in the
// Reports tab. Schools with no staff are skipped.

import { getStore } from "@netlify/blobs";
import { buildWeeklyReport } from "../lib/api.mjs";
import { listKeys, getAll } from "../lib/util.mjs";

export default async () => {
  const store = getStore({ name: "lunchline", consistency: "strong" });
  const schoolKeys = (await listKeys(store, "school/"));
  let built = 0;
  for (const school of await getAll(store, schoolKeys)) {
    try {
      if (!(await listKeys(store, `staff/${school.id}/`)).length) continue;
      await buildWeeklyReport(store, school);
      built++;
    } catch (e) {
      console.error(`weekly report failed for ${school.id}`, e);
    }
  }
  console.log(`weekly reports: ${built} built`);
};

export const config = { schedule: "0 20 * * 5" }; // Fridays 20:00 UTC, after lunch
