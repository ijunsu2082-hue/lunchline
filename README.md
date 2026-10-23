# LunchLine

Students rate each school lunch in one tap. Cafeteria staff see which dishes get eaten and which ones end up in the trash.

## The problem

In a 2019 World Wildlife Fund audit that weighed cafeteria trash at 46 U.S. schools, students wasted about 39 pounds of food each per school year, on average. From that sample, WWF estimates U.S. schools could be wasting about 530,000 tons of food a year ([Food Waste Warriors report](https://www.worldwildlife.org/publications/food-waste-warrior-report-2019/)).

The people who cook school lunch see full trash cans at the end of the period, but not which dish was in them or why it was left. Menus get planned without that information. LunchLine collects it: one rating per student per dish, with an optional note.

## What it does

**Students** (no account, no app to install)

- Join a school with a 6-character code, an invite link, or by searching the school name.
- See breakfast and lunch for the week, with photos, ingredients, and the nine major allergens for every dish.
- Tell LunchLine their allergies once. Dishes that contain them are flagged in red, and "may contain" warnings in amber.
- Rate each dish Good, Mid, or Bad on the day it's served and for the six days after, and add a note for the kitchen.
- Suggest dishes and upvote classmates' suggestions.

**Cafeteria staff**

- Create a school and get a student join code plus a private staff key.
- Post the menu: each dish gets a photo, ingredients, allergens, cross-contact notes, diet tags, and calories. A sample menu fills four weeks so a new school can try everything right away.
- Read the dashboard: ratings by day, the dishes to make more of and the ones to fix or drop, breakfast vs. lunch, cuisines, every comment, and the top student suggestions.

## Privacy and accessibility

- A student's name and allergies are stored only in their own browser. Ratings are sent with a random device id, and the dashboard only sees a hashed version of it, so staff can count students but can't identify them.
- The staff key is stored as a SHA-256 hash. The rating window is enforced on the server, not just in the UI.
- Semantic HTML, labelled controls, visible keyboard focus, 44px touch targets on phones, text contrast that meets WCAG AA, and no animation when the device asks for reduced motion.
- No third-party requests: the font (Public Sans) is self-hosted and there are no trackers or analytics.

## How it's built

- **Front end:** plain HTML, CSS, and JavaScript in `public/`, no framework and no build step. `app.js` renders every screen from state; `sample.js` holds the sample menu.
- **API:** one Netlify Function (`netlify/functions/api.mjs` → `netlify/lib/api.mjs`) routed by path, storing data in Netlify Blobs with one key per record so writes never need a read-modify-write on shared data. The key layout is documented at the top of `api.mjs`.
- **Photos** are resized in the browser to at most 1600px and re-encoded as JPEG before upload; the server checks type and size.
- **Rankings** use a small prior, `(good + 1) / (total + 2)`, so a dish rated 3-for-3 doesn't outrank one rated 12-for-13. The percentage shown is still the real one.

## Run locally

```
npm install
node scripts/dev.mjs                      # http://localhost:8888
LL_TODAY=2026-10-19 node scripts/dev.mjs  # pretend "today" is a given date
node scripts/seed-demo.mjs                # with the server running: a demo school with a week of ratings
```

`seed-demo.mjs` prints a join code and a staff key for the demo school. Its ratings and comments are made up, so only run it against a local server.

## Branches

- `development`: work in progress, never deployed
- `main`: production; Netlify deploys only this branch (see `ignore` in `netlify.toml`)

## Credits

- Dish photos: see [public/samples/CREDITS.md](public/samples/CREDITS.md) for each photo's author and license.
- Typeface: [Public Sans](https://public-sans.digital.gov/) by the U.S. Web Design System, SIL Open Font License 1.1 ([public/fonts/LICENSE.md](public/fonts/LICENSE.md)).
- Icons: paths from [Lucide](https://lucide.dev/) (ISC License).
- Built for Neighborhood Hacks 2026 with help from Claude Code (Anthropic); commits made with it are marked `Co-Authored-By`.
