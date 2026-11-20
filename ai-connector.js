/*
 * Quiz Master — ai-connector.js
 * Connexion OPTIONNELLE à un service de génération de questions par IA.
 *
 * Sécurité : aucune clé API n'est stockée ni utilisée dans le navigateur.
 * L'application appelle uniquement un point d'API proxy (voir server/server.js)
 * qui détient la clé côté serveur. Sans proxy configuré, le mode local
 * (question-generator.js) reste actif.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.AIProvider = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function normalizeAnswer(value, optionsLength) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value >= 0 && value < optionsLength ? Math.trunc(value) : -1;
    }
    if (typeof value === 'string') {
      const letter = value.trim().toUpperCase();
      if (/^[A-D]$/.test(letter)) return letter.charCodeAt(0) - 65;
      const number = parseInt(letter, 10);
      if (!Number.isNaN(number)) return number >= 0 && number < optionsLength ? number : -1;
    }
    return -1;
  }

  /**
   * Valide et normalise les questions renvoyées par le proxy.
   * Toute question incomplète est écartée (jamais de contenu inventé côté client).
   */
  function normalizeQuestions(payload, sourceLabel) {
    const list = Array.isArray(payload) ? payload : (payload && payload.questions) || [];
    const questions = [];
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue;
      const text = String(raw.q || raw.question || '').trim();
      const options = (raw.options || raw.o || []).map((opt) => String(opt).trim());
      const answer = normalizeAnswer(raw.answer !== undefined ? raw.answer : raw.a, options.length);
      const explanation = String(raw.explanation || raw.e || '').trim();
      if (!text || options.length !== 4 || answer < 0 || !explanation) continue;
      if (new Set(options.map((opt) => opt.toLowerCase())).size !== 4) continue;
      questions.push({
        text,
        options,
        answer,
        explanation,
        source: String(raw.source || sourceLabel || 'Généré par IA'),
        kind: 'ai',
        generated: true
      });
    }
    return questions;
  }

  async function generate(options) {
    const endpoint = String(options.endpoint || '').trim();
    if (!endpoint) throw new Error("Aucun point d'API IA n'est configuré.");
    if (typeof fetch !== 'function') throw new Error('fetch indisponible dans ce navigateur.');

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = setTimeout(() => controller && controller.abort(), options.timeout || 60000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: options.text,
          count: options.count || 40,
          chapterTitle: options.chapterTitle || '',
          language: 'fr'
        }),
        signal: controller ? controller.signal : undefined
      });

      if (!response.ok) {
        let detail = '';
        try {
          const body = await response.json();
          detail = body.error || body.message || '';
        } catch (error) {
          detail = '';
        }
        throw new Error('Le service IA a répondu ' + response.status + (detail ? ' : ' + detail : '.'));
      }

      const payload = await response.json();
      const questions = normalizeQuestions(payload, options.chapterTitle);
      if (questions.length === 0) {
        throw new Error("Le service IA n'a renvoyé aucune question valide.");
      }
      return questions;
    } finally {
      clearTimeout(timeout);
    }
  }

  return { generate, normalizeQuestions, normalizeAnswer };
});
