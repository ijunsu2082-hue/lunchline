# LunchLine

School lunch menus with allergen info. Students rate what they ate (Good / Mid / Bad) and suggest dishes; cafeteria staff see what's working.

- Front end: plain HTML/CSS/JS in `public/`
- API: one Netlify Function (`netlify/functions/api.mjs` → `netlify/lib/api.mjs`) storing data in Netlify Blobs

## Run locally

```
npm install
node scripts/dev.mjs                      # http://localhost:8888
LL_TODAY=2026-10-19 node scripts/dev.mjs  # pretend "today" is a given date
```

## Branches

- `development`: work in progress, never deployed
- `main`: production; Netlify deploys only this branch (see `ignore` in `netlify.toml`)
