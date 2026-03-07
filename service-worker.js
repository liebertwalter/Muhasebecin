/* SERVICE WORKER */

const CACHE_NAME = "muhasebecin-cache-v1";

const FILES_TO_CACHE = [
"/",
"/index.html",
"/style.css",
"/app.js",
"/database.js",
"/voice.js",
"/notifications.js",
"/charts.js",
"/export.js",
"/backup.js",
"/auth.js",
"/utils.js",
"/manifest.json"
];

/* CACHE OLUŞTUR */

self.addEventListener("install", event => {

event.waitUntil(

caches.open(CACHE_NAME).then(cache => {

return cache.addAll(FILES_TO_CACHE);

})

);

});

/* CACHE KULLAN */

self.addEventListener("fetch", event => {

event.respondWith(

caches.match(event.request).then(response => {

return response || fetch(event.request);

})

);

});
