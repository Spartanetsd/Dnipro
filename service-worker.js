/* BASE — service-worker.js
   Офлайн-режим: оболочка приложения кэшируется при первом посещении.
   Все пути относительные — работает в подпапке GitHub Pages (https://user.github.io/repo/). */
'use strict';

var VERSION = 'base-v1.0.1';
var SHELL = [
  './',
  './index.html',
  './styles.css',
  './finance.js',
  './charts.js',
  './app.js',
  './manifest.webmanifest',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  './tests.html',
  './finance.test.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION).then(function (cache) {
      return cache.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); }));
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('base-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // внешние ссылки (Booking, OLX) не кэшируем

  // Навигация: сначала сеть (свежая версия), при отсутствии сети — кэш.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        if (res && res.ok) caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Статика: из кэша сразу, параллельно обновляем (stale-while-revalidate).
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
