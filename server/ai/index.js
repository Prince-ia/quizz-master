/*
 * Quiz Master — orchestration des fournisseurs IA.
 *
 * AI_PROVIDER=auto|opencode|openai  (auto par défaut)
 *   - auto      : opencode s'il est installé, sinon OpenAI si une clé existe ;
 *   - opencode  : `opencode run` en local, sans clé API ;
 *   - openai    : API compatible OpenAI (clé côté serveur).
 *
 * Le module valide systématiquement la réponse du modèle : les questions dont
 * la citation « source » n'existe pas dans le cours sont écartées.
 */
'use strict';

const { validateQuestions, MAX_TEXT } = require('./prompt');
const openai = require('./openai');
const opencode = require('./opencode');

const PROVIDER = String(process.env.AI_PROVIDER || 'auto').toLowerCase();
const RATE_LIMIT = Number(process.env.AI_RATE_LIMIT || 30);
const RATE_WINDOW = Number(process.env.AI_RATE_WINDOW_MS || 10 * 60 * 1000);
const MIN_TEXT = 100;

const hits = new Map();

/** Limitation de débit simple, par adresse IP (fenêtre glissante fixe). */
function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || 'inconnu';
  const entry = hits.get(key);
  if (!entry || now - entry.start > RATE_WINDOW) {
    hits.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.start + RATE_WINDOW - now) / 1000)
    };
  }
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

/** Nettoie les compteurs expirés (mémoire bornée). */
function pruneRateLimit(now = Date.now()) {
  for (const [key, entry] of hits) {
    if (now - entry.start > RATE_WINDOW) hits.delete(key);
  }
}

/** Extrait le premier objet JSON d'un texte (tolère les blocs Markdown). */
function extractJson(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Réponse IA non exploitable.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Détermine le fournisseur réellement utilisé. */
async function resolveProvider(requested) {
  const wanted = String(requested || PROVIDER).toLowerCase();
  if (wanted === 'opencode') return 'opencode';
  if (wanted === 'openai') return 'openai';
  if (wanted === 'auto') {
    const info = await opencode.detect();
    if (info.installed) return 'opencode';
    if (openai.isConfigured()) return 'openai';
    return 'opencode';
  }
  throw Object.assign(new Error('Fournisseur IA inconnu : ' + wanted), { status: 400 });
}

function createError(message, status) {
  return Object.assign(new Error(message), { status });
}

/**
 * Génère des questions validées.
 * @param {{text:string,count?:number,chapterTitle?:string,model?:string}} options
 */
async function generate(options) {
  const text = String(options.text || '').trim();
  if (text.length < MIN_TEXT) {
    throw createError('Texte de cours trop court (minimum ' + MIN_TEXT + ' caractères).', 400);
  }

  const count = Math.max(5, Math.min(40, Number(options.count) || 20));
  const chapterTitle = String(options.chapterTitle || '').trim();
  const model = String(options.model || '').trim();
  const provider = await resolveProvider(options.provider);
  const source = text.slice(0, MAX_TEXT);

  let payload;
  let usedModel = model;

  if (provider === 'opencode') {
    const result = await opencode.generate({ text: source, count, chapterTitle, model });
    payload = result.payload;
    usedModel = result.model;
  } else {
    if (!openai.isConfigured()) {
      throw createError("Aucun fournisseur IA disponible : installe opencode ou définis OPENAI_API_KEY.", 503);
    }
    const result = await openai.generate({ text: source, count, chapterTitle, model });
    payload = extractJson(result.content);
    usedModel = result.model;
  }

  const validated = validateQuestions(payload, source, chapterTitle);
  if (validated.questions.length === 0) {
    throw createError("Le modèle n'a renvoyé aucune question vérifiable dans le cours. Réessaie ou réduis le nombre de questions.", 422);
  }

  return {
    questions: validated.questions,
    provider,
    model: usedModel,
    requested: count,
    kept: validated.questions.length,
    dropped: validated.dropped,
    unverified: validated.unverified
  };
}

/** État du service pour l'interface (aucune génération, aucun coût). */
async function status() {
  const info = await opencode.detect();
  const models = info.installed ? await opencode.listModels() : [];
  let provider = PROVIDER;
  if (provider === 'auto') {
    provider = info.installed ? 'opencode' : (openai.isConfigured() ? 'openai' : 'local');
  }
  return {
    provider,
    model: provider === 'opencode' ? opencode.model : openai.model,
    openai: {
      configured: openai.isConfigured(),
      model: openai.model,
      baseUrl: openai.baseUrl
    },
    opencode: {
      installed: info.installed,
      version: info.version,
      error: info.error,
      binary: opencode.binary,
      models
    },
    limits: {
      requests: RATE_LIMIT,
      windowMs: RATE_WINDOW,
      maxText: MAX_TEXT,
      minText: MIN_TEXT
    }
  };
}

module.exports = {
  generate,
  status,
  resolveProvider,
  checkRateLimit,
  pruneRateLimit,
  extractJson,
  MIN_TEXT
};
