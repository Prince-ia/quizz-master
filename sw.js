/*
 * Quiz Master — service worker.
 * Met en cache l'application pour un usage hors ligne ; les appels /api/*
 * passent toujours par le réseau (génération IA impossible hors ligne).
 */
'use strict';

const VERSION = 'v3';
const CACHE = 'quiz-master-' + VERSION;

const PRECACHE = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'ai-connector.js',
  'docx-reader.js',
  'progress-manager.js',
  'question-generator.js',
  'quiz-engine.js',
  'data/preset-course.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navigation : réseau d'abord, cache en secours (mode hors ligne).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('index.html', copy));
          return response;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Ressources : cache d'abord, mise à jour silencieuse en arrière-plan.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
