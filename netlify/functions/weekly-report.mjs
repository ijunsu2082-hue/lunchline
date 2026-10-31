// friday report job
import { getStore } from "@netlify/blobs";
import { buildWeeklyReport } from "../lib/api.mjs";
import { listKeys, getAll } from "../lib/util.mjs";

// build every school's report
export default async () => {
  const store = getStore({ name: "lunchline", consistency: "strong" });
  const schoolKeys = (await listKeys(store, "school/"));
  let built = 0;
  for (const school of await getAll(store, schoolKeys)) {
    try {
      // no staff, skip it
      if (!(await listKeys(store, `staff/${school.id}/`)).length) continue;
      await buildWeeklyReport(store, school);
      built++;
    } catch (e) {
      console.error(`weekly report failed for ${school.id}`, e);
    }
  }
  console.log(`weekly reports: ${built} built`);
};

export const config = { schedule: "0 20 * * 5" }; // fridays 8pm utc
