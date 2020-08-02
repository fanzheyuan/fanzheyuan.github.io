'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "index.html": "2249825b6cc62f97a60a2f5253a8aeda",
"/": "2249825b6cc62f97a60a2f5253a8aeda",
"css/styles.css": "1d1f4b090bebd27e4969c4ff37235242",
"main.dart.js": "13e62a3e33bf7868e644116a34548a6e",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "acbee043ecb2ed80998d7f4570a32da9",
"assets/AssetManifest.json": "58cdb02ac7bf99a36f64ce8c6c872345",
"assets/NOTICES": "862ae2955515527908b250462657db65",
"assets/FontManifest.json": "01700ba55b08a6141f33e168c4a6c22f",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"assets/fonts/MaterialIcons-Regular.ttf": "56d3ffdef7a25659eab6a68a3fbfaf16",
"assets/assets/images/flutter-mark-square-64.png": "2b3a04c5b89764f4eb09b2581ff1ea91",
"assets/assets/images/banner.jpg": "3cae9dc0ecce1fb00bbee7eaa92f2462",
"assets/assets/images/pic01.jpg": "796e286ade01a7082f1f5c600ce6a0b6",
"assets/assets/images/pic02.jpg": "6515e3a35dc23f7cb7e8771a2099726e",
"assets/assets/images/pic03.jpg": "d139282d9d540aeec63d1ee85dbbc332",
"assets/assets/images/header.jpg": "46580872ab559e65b9541f2d29c1f5dd",
"assets/assets/images/about.png": "76586fb5fe30fc4d2624b3690d7628a1",
"assets/assets/videos/Butterfly-209.mp4": "7b38560e7dbf868e58e29984509f2f96",
"assets/assets/videos/bumble_bee_captions.srt": "f978716fd8d682b305d5dd9246016cdb",
"assets/assets/icons/icon02.png": "a567acb0f0b95b260be6778b7cef8ded",
"assets/assets/icons/icon03.png": "9260d22a5db122e89e2c988020641636",
"assets/assets/icons/icon01.png": "5f26acced04349c501d0d2018f02c770",
"assets/assets/icons/instagram.png": "b538ff1a34773166b333acc5f2f7e8a6",
"assets/assets/icons/search_icon.png": "6f8263f66bdd5cce6c56ff72a2e5c02a",
"assets/assets/icons/logo.png": "faced78b9ae56a68c476b0821a8e2579",
"assets/assets/icons/twitter.png": "7385e8a0e1b7c71221b6b5003aaceccf",
"assets/assets/icons/arrow_icon.png": "52473835666793129f558978aefef47a",
"assets/assets/icons/youtube.png": "280e47fda3668fa4b6b7002afde9df59",
"assets/assets/icons/whatsapp.png": "efb56647a54dd3d3d02cd96e354c72fd",
"assets/assets/icons/facebook.png": "61a0c6968743d6eae6cf3cd1f0f7070e"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/LICENSE",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      // Provide a no-cache param to ensure the latest version is downloaded.
      return cache.addAll(CORE.map((value) => new Request(value, {'cache': 'no-cache'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');

      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }

      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#')) {
    key = '/';
  }
  // If the URL is not the the RESOURCE list, skip the cache.
  if (!RESOURCES[key]) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache. Ensure the resources are not cached
        // by the browser for longer than the service worker expects.
        var modifiedRequest = new Request(event.request, {'cache': 'no-cache'});
        return response || fetch(modifiedRequest).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.message == 'skipWaiting') {
    return self.skipWaiting();
  }

  if (event.message = 'downloadOffline') {
    downloadOffline();
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.add(resourceKey);
    }
  }
  return Cache.addAll(resources);
}
