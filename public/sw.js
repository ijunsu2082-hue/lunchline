// LunchLine service worker. Goal: the app opens and this week's menu shows
// even with no signal on the lunch line. Votes, sign-in and staff data are
// never cached; they always go to the network.
//
// The app's own files go to the network first, so a new version shows on the
// very next visit after a deploy (serving a saved copy first left people on an
// old version for a visit). The cache is the fallback when there's no signal.
const CACHE = "ll-v32";

// The app shell: every file the page needs to start.
const SHELL = [
  "/", "/styles.css?v=32", "/landing.css?v=32", "/flat.css?v=32", "/js/main.js?v=32",
  "/js/api.js", "/js/i18n.js", "/js/icons.js", "/js/pow-worker.js", "/js/session.js",
  "/js/state.js", "/js/theme.js", "/js/ui.js", "/js/util.js",
  "/js/views/flows.js", "/js/views/ideas.js", "/js/views/me.js", "/js/views/menu-editor.js",
  "/js/views/qr.js", "/js/views/reports.js", "/js/views/settings.js", "/js/views/staff.js",
  "/js/views/student.js", "/js/views/welcome.js",
  "/vendor/qrcode.mjs", "/i18n/en.js", "/i18n/es.js",
  "/fonts/public-sans-latin-wght-normal.woff2", "/fonts/public-sans-latin-ext-wght-normal.woff2",
  "/fonts/public-sans-latin-wght-italic.woff2", "/fonts/fraunces-latin-wght-normal.woff2", "/fonts/fraunces-latin-wght-italic.woff2",
  "/logo.svg", "/icon.svg", "/img/app-student.jpg", "/img/app-staff.jpg",
];

self.addEventListener("install", event => {
  // Add files one by one so a single missing file doesn't block the install.
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  // Throw away caches from older versions, then take over open pages.
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const save = (req, res) => {
  if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
};

// Try the network first; if it fails, fall back to the last good copy. Offline, a page
// opened from a link (/?join=…) falls back to the saved app page.
async function networkFirst(req) {
  try { return save(req, await fetch(req)); }
  catch (e) {
    const page = req.mode === "navigate";
    return (await caches.match(req, { ignoreSearch: page })) || (page && await caches.match("/")) || Response.error();
  }
}

// Photos never change under the same URL, so the cache wins.
async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || save(req, await fetch(req));
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return; // never touch writes
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const path = url.pathname;

  if (path === "/api/menu") return event.respondWith(networkFirst(req));
  if (path.startsWith("/api/photos/") || path.startsWith("/samples/")) return event.respondWith(cacheFirst(req));
  if (path.startsWith("/api/")) return; // votes, auth, insights, tokens: network only
  if (path === "/sw.js") return;
  event.respondWith(networkFirst(req));
});
