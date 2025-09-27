addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("encre").then((cache) => {
      return cache.addAll(["/"]);
    })
  );
});
