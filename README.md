# LunchLine

**Tell the kitchen what you actually ate.**

LunchLine is a school-lunch rating app. Students scan a QR code on the tray line and tap Good, Mid or Bad under each dish. Kitchen staff see which dishes get eaten and which get thrown away, reply to students, and get a weekly summary. Built for Neighborhood Hacks 2026.

## Mission

School cafeterias throw away a lot of food, and the people who cook it rarely find out why. A 2019 World Wildlife Fund audit found about 39 lb of food wasted per student per school year at 46 U.S. schools (WWF, Food Waste Warriors, 2019). Kitchens see the full trash cans, but not which dish was in them or what was wrong with it.

Our mission is to give every cafeteria that missing half of the picture, at no cost and with no friction for students: no app, no account, no name. One tap per dish, and the kitchen can make more of what students eat and less of what they throw away.

## Tech stack

| Layer | What we use |
| --- | --- |
| Front end | Vanilla JavaScript (ES modules, no framework, no bundler), hand-written CSS, Public Sans (self-hosted) |
| Back end | One Netlify Function that routes `/api/*`, plus a scheduled Netlify Function for the weekly report |
| Storage | Netlify Blobs (one key per record) |
| Auth | Emailed one-time sign-in links (no passwords), cookie sessions and roles (cook, admin, owner) |
| Weekly report summary | Plain text built from the week's numbers |
| Anti-abuse | Signed device tokens, SHA-256 proof-of-work in a Web Worker, rate limits, suspicious-rating detection |
| Offline and install | Service worker, offline rating queue, web app manifest |
| QR codes | Client-side generator in `public/vendor/qrcode.mjs`, no third-party service |
| Tests and CI | `node:test`, a repo check script, GitHub Actions |
| Hosting | Netlify (Node 22) |

## How it works

**Students.** Scan the poster QR code (or type the 6-character school code). No account, no install needed. The week's menu shows with photos and allergen flags. Tap Good, Mid or Bad on a dish, optionally add a note, and suggest dishes or upvote classmates' suggestions.

**Staff.** Sign in with an emailed link. Cooks edit the menu, reply to students, log waste, hide comments and manage suggestions; admins can also change school settings (grades, enrollment), invite or remove people and see the activity log; owners can do everything, including deleting the school. The dashboard shows what is liked, what is disliked, and how that lines up with the waste log.

**Parents.** Staff can print a Family menu card or copy a family link (`/?parent=CODE`). It opens a read-only menu with allergens and ingredients and needs no sign-in.

## Features

- QR join with no student accounts
- Breakfast, snack and lunch menus, with allergens and nutrition facts (calories, protein, fat, saturated fat, carbs, fiber, sodium) per dish. The sample menu is Irvine High School's snack and lunch flyer for the week of October 19, 2026, with nutrition and allergen text taken as written from the district's 2026-27 high school nutrition sheet. Dishes the sheet doesn't list are left blank and say to ask nutrition services
- Staff sign in with an emailed one-time link, with roles: cook, admin, owner. Admins add teammates by email; the invite is a link that is emailed and can also be copied
- A dozen demo schools (plus the master school) whose photo menus fill themselves, so there's always something to try
- Device tokens with proof-of-work, rate limits, and suspicious-rating detection
- Allergen flagging
- Suggestions leaderboard with fuzzy "did you mean" matching and merging of duplicates
- Optional grade level, shown only for groups of 5 or more
- Waste log
- Weekly report with a short summary, built every Friday or on demand
- English and Spanish
- Offline queue and installable PWA
- Printable QR posters

## Architecture

Vanilla ES modules on the front end (no bundler), one Netlify Function for the API, and Netlify Blobs for storage. The key layout for Blobs is documented at the top of [`netlify/lib/api.mjs`](netlify/lib/api.mjs).

```
public/
  index.html, sample.js               page shell, sample menu
  styles.css, flat.css, landing.css   base styles, the white-and-black layer, the landing page
  js/                                 front-end modules
    main.js        boot, routing, rendering, the click/input handler
    api.js         fetch wrapper, device token, proof-of-work solver
    pow-worker.js  proof-of-work in a Web Worker
    session.js     joining a school, student vs staff mode
    state.js       shared app state
    i18n.js        t() lookup and language choice
    theme.js       the fixed brand color
    ui.js, icons.js, util.js
    views/         one file per screen (student, ideas, me, staff, menu-editor, settings, reports, qr, welcome, flows)
  i18n/en.js, es.js                   strings (English is the source of truth)
  vendor/qrcode.mjs                   QR code generator
  sw.js, manifest.webmanifest         offline support and install
netlify/
  functions/api.mjs                   entry point for /api/*
  functions/weekly-report.mjs         scheduled function, Fridays 20:00 UTC
  lib/
    api.mjs         router and all endpoints
    vocab.mjs       shared constants (allergens, roles, limits)
    util.mjs        errors, text cleaning, dates, Blobs helpers
    tokens.mjs      signed device tokens and proof-of-work
    ratelimit.mjs   fixed-window rate limits
    staff.mjs       sign-in links, sessions, roles
    insights.mjs    turns ratings into what the kitchen sees
    similarity.mjs  fuzzy matching for suggestions
    reports.mjs     weekly report data and summary
scripts/  dev.mjs (local server), mailtest.mjs, check.mjs
test/     node:test suites
```

## Run locally

```
npm install
npm run dev        # http://localhost:8888
npm run seed       # in another terminal: a clearly simulated demo school (about 2 minutes)
npm test           # server tests
npm run check      # translations, imports, offline file list
```

Staff have no passwords. They enter their email and get a one-time link that lasts 15 minutes (an invite from an admin lasts 7 days). The email service is required in production; locally, with no key set, the sign-in screen shows the link instead of emailing it. To add someone, an admin adds their email under School > Your team. Local settings go in a `.env` file (git ignores it); the dev server reads it.


**Testing the QR code from a phone.** A QR made at `localhost` can't be opened by a phone. Run `npm run dev:lan`, then open the app from the "On your phone" address it prints (on your computer too). The QR codes in the School tab then point at an address your phone can reach, on the same wifi.

If `npm run dev` says the port is in use, an older dev server is still running with old code. Close it, or use another port: `PORT=8899 npm run dev`.

## Configuration

All settings are environment variables and all are optional locally. See [`.env.example`](.env.example) for what each one does and what happens when it is unset.

## Tests

```
npm test          # node --test test/*.test.mjs (Node 20+)
npm run check     # i18n keys, Spanish coverage, imports/exports, service worker file list
```

CI runs both on every push and pull request.

## Security and privacy

What is and is not guaranteed:

- Ratings are per anonymous device, not per verified student. One person with several devices, or a cleared browser, can vote more than once.
- Proof-of-work and rate limits raise the cost of fake votes. They cannot make fake votes impossible, and the suspicious-rating detection is a heuristic that can miss things or flag honest ones.
- Students have no accounts and LunchLine does not collect names. Votes are stored against a hash of the device id.
- Grade level is optional. A grade group with fewer than 5 students is hidden so no one can be picked out.
- Staff identity is a verified email address. Sign-in links are single use and expire (15 minutes, or 7 days for invites); sessions are cookie-based. Asking for a link gives the same answer whether or not the address is on a team.
- Student comments are shown to staff only; they are not sent to any other service.
- Security headers (strict Content-Security-Policy and others) are set in `netlify.toml`.

## Deployment

**Optional email.** Set `BREVO_API_KEY` (free, one verified sender address is enough) or `RESEND_API_KEY`, plus `FROM_EMAIL`, and teammate setup links are also emailed. Check it with `npm run mailtest -- you@example.com`. Without a key, admins copy the link as before.

Deploy on Netlify. The `main` branch builds production; other branches and previews are skipped (see `netlify.toml`). Set the environment variables from `.env.example` in the Netlify dashboard: `SITE_URL` (so emailed links point at the live site) and an email key, `BREVO_API_KEY` or `RESEND_API_KEY` with `FROM_EMAIL`. Without an email key, staff cannot sign in on the live site.

## Known limitations and roadmap

- The Spanish translation needs review by a native speaker.
- No district-level rollup yet; each school is separate.
- More languages.

## Credits

Sample dish photo credits are in [`public/samples/CREDITS.md`](public/samples/CREDITS.md). Fonts: Public Sans (see `public/fonts/LICENSE.md`).
