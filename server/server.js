/*
 * Quiz Master — serveur local (Node.js 18+, aucune dépendance)
 *
 * Rôle :
 *   1. Servir l'application :        http://localhost:8787
 *   2. Exposer /api/generate         génération de questions (opencode ou OpenAI)
 *   3. Exposer /api/ai/status        état des moteurs disponibles
 *
 * Lancement (PowerShell) :
 *   node server/server.js
 *
 * Fournisseurs (facultatifs) :
 *   AI_PROVIDER=auto|opencode|openai   auto par défaut
 *   OPENCODE_MODEL=opencode/deepseek-v4.1-flash-free
 *   OPENAI_API_KEY=sk-...              uniquement pour le mode openai
 *   OPENAI_MODEL=gpt-4o-mini
 *   PORT=8787
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const ai = require('./ai');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const BODY_LIMIT = 5 * 1024 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

/* ------------------------------- Utilitaires ---------------------------- */

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self' http: https:",
      "manifest-src 'self'",
      "worker-src 'self'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'"
    ].join('; ')
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function sendJson(res, status, payload, extra) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...securityHeaders(),
    ...corsHeaders(),
    ...(extra || {})
  });
  res.end(body);
}

function readBody(req, limit = BODY_LIMIT) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Contenu trop volumineux (5 Mo maximum).'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function clientIp(req) {
  return (req.socket && req.socket.remoteAddress) || 'inconnu';
}

/* --------------------------------- API ---------------------------------- */

async function handleGenerate(req, res) {
  const limit = ai.checkRateLimit(clientIp(req));
  if (!limit.allowed) {
    sendJson(res, 429, {
      error: 'Trop de requêtes IA. Réessaie dans ' + limit.retryAfter + ' secondes.'
    }, { 'Retry-After': String(limit.retryAfter) });
    return;
  }

  let body;
  try {
    const raw = await readBody(req);
    body = raw ? JSON.parse(raw) : {};
  } catch (error) {
    sendJson(res, error.status || 400, {
      error: error.status ? error.message : 'Corps de requête JSON invalide.'
    });
    return;
  }

  try {
    const result = await ai.generate({
      text: body.text,
      count: body.count,
      chapterTitle: body.chapterTitle,
      model: body.model,
      provider: body.provider
    });
    sendJson(res, 200, result);
  } catch (error) {
    const status = error.status && error.status >= 400 ? error.status : 500;
    if (status >= 500) console.error('[IA]', error.message);
    sendJson(res, status, {
      error: error.message || 'Erreur inattendue du service IA.',
      ...(error.detail ? { detail: error.detail } : {})
    });
  }
}

async function handleStatus(req, res) {
  try {
    const payload = await ai.status();
    sendJson(res, 200, payload);
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'État IA indisponible.' });
  }
}

/* -------------------------------- Statique ------------------------------ */

function serveStatic(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Chemin invalide.');
    return;
  }

  const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT, relative);

  if (path.relative(ROOT, filePath).startsWith('..') || path.isAbsolute(path.relative(ROOT, filePath))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Accès refusé.');
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders() });
      res.end('Fichier introuvable.');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const noCache = ['.html', '.js', '.css', '.webmanifest', '.json'].includes(ext);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': noCache ? 'no-cache' : 'public, max-age=86400',
      ...securityHeaders()
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  });
}

/* -------------------------------- Serveur ------------------------------- */

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { ...corsHeaders(), ...securityHeaders() });
    res.end();
    return;
  }

  if (url === '/api/generate') {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Méthode non autorisée : utilise POST.' }, { Allow: 'POST, OPTIONS' });
      return;
    }
    handleGenerate(req, res);
    return;
  }

  if (url === '/api/ai/status') {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Méthode non autorisée : utilise GET.' }, { Allow: 'GET, OPTIONS' });
      return;
    }
    handleStatus(req, res);
    return;
  }

  if (url.startsWith('/api/')) {
    sendJson(res, 404, { error: 'Point d’API inconnu.' });
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders() });
  res.end('Méthode non autorisée.');
});

setInterval(() => ai.pruneRateLimit(), 60 * 1000).unref();

server.listen(PORT, HOST, () => {
  console.log('Quiz Master — http://localhost:' + PORT);
  ai.status().then((info) => {
    const opencode = info.opencode;
    console.log('Moteur IA : ' + info.provider + ' (modèle ' + (info.model || 'défaut') + ')');
    console.log('opencode : ' + (opencode.installed
      ? 'v' + opencode.version + ' — ' + opencode.models.length + ' modèle(s)'
      : 'introuvable' + (opencode.error ? ' (' + opencode.error + ')' : '')));
    console.log('OpenAI   : ' + (info.openai.configured ? 'clé détectée' : 'non configuré'));
  }).catch(() => {});
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
