/* Scope-specific cache: never delete caches belonging to other GitHub Pages games. */
const VERSION = "1.3.1-ux1";
const PREFIX = `pih:${new URL(self.registration.scope).pathname}:`;
const CACHE_NAME = `${PREFIX}${VERSION}-story`;
const APP_SHELL = [
  "./", "./index.html", `./styles.css?v=${VERSION}`, `./css/story.css?v=${VERSION}`, `./css/iphone-ux.css?v=${VERSION}`,
  ...["difficulty", "hint-system", "defense-analyzer", "companion", "epilogue", "story-data", "story", "ux-guide", "app"].map(name => `./js/${name}.js?v=${VERSION}`),
  "./manifest.webmanifest", "./assets/favicon.svg", "./assets/icon-180.png", "./assets/icon-192.png", "./assets/icon-512.png"
];
self.addEventListener("install", event => {
  // Atomic install: missing files must fail the new cache, not replace a working offline build.
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    try { await cache.addAll(APP_SHELL.map(url => new Request(url, { cache: "reload" }))); }
    catch (error) { await caches.delete(CACHE_NAME); throw error; }
  }));
  // Do not force takeover while the player is in an active session.
});
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(PREFIX) && key !== CACHE_NAME)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const relative = url.pathname.slice(new URL(self.registration.scope).pathname.length);
    if (request.mode === "navigate" && (relative === "" || relative === "index.html")) {
      return await cache.match("./index.html") || fetch(request);
    }
    const cached = await cache.match(request);
    if (cached) return cached;
    return fetch(request);
  }));
});
