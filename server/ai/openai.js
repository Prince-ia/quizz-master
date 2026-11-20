/*
 * Quiz Master — fournisseur OpenAI-compatible.
 * La clé reste côté serveur (OPENAI_API_KEY), jamais dans le navigateur.
 */
'use strict';

const { buildPrompt } = require('./prompt');

const API_KEY = process.env.OPENAI_API_KEY || '';
const BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const TIMEOUT = Number(process.env.AI_TIMEOUT_MS || 180000);

function isConfigured() {
  return Boolean(API_KEY);
}

async function generate({ text, count, chapterTitle, model }) {
  if (!API_KEY) {
    const error = new Error("OPENAI_API_KEY n'est pas définie sur le serveur.");
    error.status = 503;
    throw error;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + API_KEY
      },
      body: JSON.stringify({
        model: model || MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Tu réponds toujours par un objet JSON valide, en français.' },
          { role: 'user', content: buildPrompt(text, count, chapterTitle) }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const detail = await response.text();
      const error = new Error('Erreur du fournisseur IA (' + response.status + ').');
      error.status = 502;
      error.detail = detail.slice(0, 500);
      throw error;
    }

    const payload = await response.json();
    const content = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
    return { content, model: model || MODEL };
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error("Le fournisseur IA n'a pas répondu à temps.");
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  isConfigured,
  generate,
  model: MODEL,
  baseUrl: BASE_URL
};
