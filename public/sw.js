// service worker: the app opens offline, api calls are never cached
const CACHE = "ll-v47";

// files needed to start
const SHELL = [
  "/", "/styles.css?v=47", "/landing.css?v=47", "/flat.css?v=47", "/js/main.js?v=47",
  "/js/api.js", "/js/i18n.js", "/js/icons.js", "/js/pow-worker.js", "/js/session.js",
  "/js/state.js", "/js/theme.js", "/js/ui.js", "/js/util.js",
  "/js/views/flows.js", "/js/views/ideas.js", "/js/views/me.js", "/js/views/menu-editor.js", "/js/views/presets.js", "/js/views/tour.js",
  "/js/views/qr.js", "/js/views/reports.js", "/js/views/settings.js", "/js/views/staff.js",
  "/js/views/student.js", "/js/views/welcome.js",
  "/vendor/qrcode.mjs", "/i18n/en.js", "/i18n/es.js",
  "/fonts/public-sans-latin-wght-normal.woff2", "/fonts/public-sans-latin-ext-wght-normal.woff2",
  "/fonts/public-sans-latin-wght-italic.woff2", "/fonts/fraunces-latin-wght-normal.woff2", "/fonts/fraunces-latin-wght-italic.woff2",
  "/logo.svg", "/icon.svg", "/img/app-student.jpg", "/img/app-staff.jpg",
];

self.addEventListener("install", event => {
  // add one by one so a missing file doesn't block install
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  // delete old caches
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

// network first, saved copy if offline
async function networkFirst(req) {
  try { return save(req, await fetch(req)); }
  catch (e) {
    const page = req.mode === "navigate";
    return (await caches.match(req, { ignoreSearch: page })) || (page && await caches.match("/")) || Response.error();
  }
}

// photos never change, cache first
async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || save(req, await fetch(req));
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return; // leave writes alone
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const path = url.pathname;

  if (path === "/api/menu") return event.respondWith(networkFirst(req));
  if (path.startsWith("/api/photos/") || path.startsWith("/samples/")) return event.respondWith(cacheFirst(req));
  if (path.startsWith("/api/")) return; // api is network only
  if (path === "/sw.js") return;
  event.respondWith(networkFirst(req));
});
