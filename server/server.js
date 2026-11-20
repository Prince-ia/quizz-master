/*
 * Quiz Master — proxy IA optionnel (Node.js 18+, aucune dépendance)
 *
 * Rôle :
 *   1. Servir l'application en local :  http://localhost:8787
 *   2. Exposer /api/generate qui appelle un fournisseur compatible OpenAI
 *      en gardant la clé API côté serveur (jamais dans le navigateur).
 *
 * Lancement (PowerShell) :
 *   $env:OPENAI_API_KEY="sk-..."
 *   $env:OPENAI_MODEL="gpt-4o-mini"          # facultatif
 *   $env:OPENAI_BASE_URL="https://api.openai.com/v1"  # facultatif
 *   node server/server.js
 *
 * Puis, dans Quiz Master → Réglages → IA :
 *   Point d'API : http://localhost:8787/api/generate
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.OPENAI_API_KEY || '';
const BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req, limit = 3 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Contenu trop volumineux.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function extractJson(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Réponse IA non exploitable.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function buildPrompt(text, count, chapterTitle) {
  return [
    "Tu es un concepteur de questionnaires pédagogiques en français.",
    "À partir UNIQUEMENT du texte de cours ci-dessous, rédige " + count + " questions à choix multiples.",
    "Règles strictes :",
    "- 4 propositions par question, une seule correcte.",
    "- Les questions portent sur les définitions, mécanismes, dates, chiffres, listes et conduites à tenir du texte.",
    "- N'invente AUCUNE information absente du texte.",
    "- Chaque explication cite le contenu du cours.",
    "- Évite les questions triviales et les doublons.",
    "- Réponds exclusivement en JSON valide, sans texte autour, au format :",
    '{"questions":[{"q":"...","options":["A","B","C","D"],"answer":0,"explanation":"...","source":"..."}]}',
    chapterTitle ? "Titre de la section : " + chapterTitle : '',
    "TEXTE DU COURS :",
    text.slice(0, 12000)
  ].filter(Boolean).join('\n');
}

async function handleGenerate(req, res) {
  if (!API_KEY) {
    sendJson(res, 503, {
      error: "Le proxy fonctionne, mais OPENAI_API_KEY n'est pas définie sur le serveur."
    });
    return;
  }
  try {
    const raw = await readBody(req);
    const body = JSON.parse(raw);
    const text = String(body.text || '').trim();
    const count = Math.max(5, Math.min(60, Number(body.count) || 40));
    if (text.length < 100) {
      sendJson(res, 400, { error: 'Texte de cours trop court.' });
      return;
    }

    const response = await fetch(BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + API_KEY
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Tu réponds toujours par un objet JSON valide, en français.' },
          { role: 'user', content: buildPrompt(text, count, body.chapterTitle) }
        ]
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      sendJson(res, 502, { error: 'Erreur du fournisseur IA (' + response.status + ').', detail: detail.slice(0, 500) });
      return;
    }

    const payload = await response.json();
    const content = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
    const parsed = extractJson(content);
    sendJson(res, 200, { questions: Array.isArray(parsed.questions) ? parsed.questions : [] });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT, relative);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Accès refusé.');
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Fichier introuvable.');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/generate') {
    handleGenerate(req, res);
    return;
  }
  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }
  res.writeHead(405);
  res.end('Méthode non autorisée.');
});

server.listen(PORT, () => {
  console.log('Quiz Master — serveur local : http://localhost:' + PORT);
  console.log('Proxy IA : ' + (API_KEY ? 'clé détectée (modèle ' + MODEL + ')' : 'aucune clé (mode local uniquement)'));
});
