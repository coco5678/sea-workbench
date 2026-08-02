var CACHE = "sea-workbench-offline-v3";
var ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/icons.js",
  "./js/app.js",
  "./js/qrcode.min.js",
  "./fonts/PressStart2P.woff2",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/stickers/nav-home.jpg",
  "./icons/stickers/nav-purchase.jpg",
  "./icons/stickers/nav-sale.jpg",
  "./icons/stickers/nav-daily.jpg",
  "./icons/stickers/nav-stats.jpg",
  "./icons/stickers/nav-more.jpg",
  "./icons/stickers/sec-haul.jpg",
  "./icons/stickers/sec-daily.jpg",
  "./icons/stickers/sec-recent.jpg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  if (e.request.url.indexOf("https://fonts.googleapis.com") === 0 || e.request.url.indexOf("https://fonts.gstatic.com") === 0 || e.request.url.indexOf("cdn.jsdelivr.net") >= 0) return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      if (res.ok && e.request.url.indexOf(self.location.origin) === 0) {
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) { return hit || caches.match("./index.html"); });
    })
  );
});
