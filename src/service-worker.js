const APP_CACHE = "encre-app-v1";
const STATIC_CACHE = "encre-static-v1";
const FONT_CACHE = "encre-fonts-v1";

const APP_SHELL = [
  "/", // main shell
  "/src/manifest.json",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      await cache.addAll(APP_SHELL);
      // Activate new SW immediately
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![APP_CACHE, STATIC_CACHE, FONT_CACHE].includes(k))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isSameOrigin(url) {
  try {
    const u = new URL(url);
    return u.origin === self.location.origin;
  } catch {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation: network-first with offline fallback to app shell
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          // Optionally update cached shell with latest index via navigation preload
          const cache = await caches.open(APP_CACHE);
          await cache.put("/", res.clone());
          return res;
        } catch {
          const cache = await caches.open(APP_CACHE);
          const cached = await cache.match("/");
          if (cached) return cached;
          // Final fallback: try any cached app shell
          const keys = await cache.keys();
          return (keys.length && cache.match(keys[0])) || Response.error();
        }
      })(),
    );
    return;
  }

  // Fonts from Google: cache-first
  if (
    url.origin.includes("fonts.googleapis.com") ||
    url.origin.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FONT_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        cache.put(request, res.clone());
        return res;
      })(),
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate
  if (
    isSameOrigin(request.url) &&
    [
      "style",
      "script",
      "image",
      "font",
      "worker",
      "document", // in case of partial document loads
    ].includes(request.destination)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((res) => {
            cache.put(request, res.clone());
            return res;
          })
          .catch(() => undefined);
        return cached || (await fetchPromise) || fetch(request);
      })(),
    );
    return;
  }
});

// Support promptless update via postMessage('skipWaiting')
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
