/* La Beer Road PWA — cache public uniquement, jamais les données familiales privées. */
const CACHE_VERSION = "beer-road-pwa-v1-5-1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
  "/apple-touch-icon.png",
  "/beer-road-icon.svg",
  "/beer-road.jpeg",
  "/Beer_road.png",
  "/Livret_de_la_Beer_Road.pdf"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.all(PRECACHE_URLS.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok && response.type === "basic") await cache.put(url, response);
      } catch {
        // Un seul asset absent ne doit pas bloquer l'installation de la PWA.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("beer-road-pwa-") && !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

function isSensitiveRequest(url, request) {
  if (url.origin !== self.location.origin) return true; // Supabase et Google Drive restent hors cache.
  if (request.method !== "GET" || request.headers.has("authorization")) return true;
  if (/^\/(auth|rest|storage|functions)\/v1\//i.test(url.pathname)) return true;
  if (/^\/api\//i.test(url.pathname)) return true;
  if (url.pathname.includes("_rsc") || url.searchParams.has("_rsc")) return true;
  if (["code", "token", "token_hash", "access_token", "refresh_token", "error_description"].some((key) => url.searchParams.has(key))) return true;
  return false;
}

function isHashedNextAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isSmallPublicAsset(url) {
  if (url.pathname.endsWith(".mp3") || url.pathname.endsWith(".wav") || url.pathname.endsWith(".mp4") || url.pathname.endsWith(".mov")) return false;
  if (url.pathname.endsWith(".pdf")) return false;
  return /\.(?:css|js|mjs|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|webmanifest)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (isSensitiveRequest(url, request)) return;

  if (request.mode === "navigate") {
    // Cache uniquement la page d'accueil publique. Aucun callback d'authentification ne passe ici.
    if (url.pathname !== "/" || url.search) {
      event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error()));
      return;
    }
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const contentType = response.headers.get("content-type") || "";
        if (response.ok && contentType.includes("text/html")) {
          const cache = await caches.open(PAGE_CACHE);
          await cache.put("/", response.clone());
        }
        return response;
      } catch {
        const pages = await caches.open(PAGE_CACHE);
        const assets = await caches.open(STATIC_CACHE);
        return (await pages.match("/")) || (await assets.match("/")) || (await assets.match(OFFLINE_URL)) || Response.error();
      }
    })());
    return;
  }

  if (isHashedNextAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return Response.error();
      }
    })());
    return;
  }

  if (isSmallPublicAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") await cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request)) || Response.error();
      }
    })());
  }
});
