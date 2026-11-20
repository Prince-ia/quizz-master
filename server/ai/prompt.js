/*
 * Quiz Master — construction du prompt et validation des questions IA.
 * Module pur : testable sans réseau ni processus.
 */
'use strict';

const MAX_TEXT = 60000;

function buildPrompt(text, count, chapterTitle) {
  return [
    'Tu es un concepteur de questionnaires pédagogiques en français.',
    'À partir UNIQUEMENT du texte de cours ci-dessous, rédige ' + count + ' questions à choix multiples.',
    'Règles strictes :',
    '- 4 propositions par question, une seule correcte par défaut.',
    '- Tu peux proposer au plus 2 questions à réponses multiples : utilise alors "answers" avec 2 indices et indique « (plusieurs réponses) » dans la question.',
    '- Les questions portent sur les définitions, mécanismes, dates, chiffres, listes et conduites à tenir du texte.',
    "- N'invente AUCUNE information absente du texte.",
    '- Chaque explication cite le contenu du cours.',
    '- Le champ "source" doit être une CITATION EXACTE de 10 à 25 mots copiée du texte du cours (pas le titre, pas le nom du fichier).',
    '- Évite les questions triviales et les doublons.',
    '- Réponds exclusivement en JSON valide, sans texte autour, au format :',
    '{"questions":[{"q":"...","options":["A","B","C","D"],"answer":0,"explanation":"...","source":"citation exacte du cours"}]}',
    chapterTitle ? 'Titre de la section : ' + chapterTitle : '',
    'TEXTE DU COURS :',
    String(text || '').slice(0, MAX_TEXT)
  ].filter(Boolean).join('\n');
}

/** Variante du prompt quand le cours est joint en fichier (opencode). */
function buildFilePrompt(count, chapterTitle) {
  return [
    'Tu es un concepteur de questionnaires pédagogiques en français.',
    'Le fichier joint contient le texte du cours.',
    'Rédige ' + count + ' questions à choix multiples à partir UNIQUEMENT de ce texte.',
    'Règles strictes :',
    '- 4 propositions par question, une seule correcte par défaut.',
    '- Tu peux proposer au plus 2 questions à réponses multiples : utilise alors "answers" avec 2 indices et indique « (plusieurs réponses) » dans la question.',
    "- N'invente AUCUNE information absente du texte.",
    '- Chaque explication cite le contenu du cours.',
    '- Le champ "source" doit être une CITATION EXACTE de 10 à 25 mots copiée du texte (pas le titre, pas le nom du fichier).',
    '- Évite les questions triviales et les doublons.',
    '- Réponds exclusivement en JSON valide, sans texte autour, au format :',
    '{"questions":[{"q":"...","options":["A","B","C","D"],"answer":0,"explanation":"...","source":"citation exacte du cours"}]}',
    chapterTitle ? 'Titre de la section : ' + chapterTitle : ''
  ].filter(Boolean).join('\n');
}

/** Normalise un texte pour comparer citations et cours (accents, ponctuation, casse). */
function normalizeForMatch(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

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
 * Valide et normalise la réponse du modèle.
 * - écarte les questions incomplètes ou dupliquées ;
 * - vérifie que la citation "source" existe réellement dans le cours ;
 * - remplace une source trop courte (nom de fichier) par le titre de section.
 */
function validateQuestions(payload, text, chapterTitle) {
  const list = Array.isArray(payload) ? payload : (payload && payload.questions) || [];
  const haystack = normalizeForMatch(text);
  const questions = [];
  const seen = new Set();
  let dropped = 0;
  let unverified = 0;

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') {
      dropped++;
      continue;
    }
    const question = String(raw.q || raw.question || '').trim();
    const options = (raw.options || raw.o || []).map((option) => String(option).trim());
    const explanation = String(raw.explanation || raw.e || '').trim();
    if (!question || options.length !== 4 || !explanation) {
      dropped++;
      continue;
    }
    if (new Set(options.map((option) => option.toLowerCase())).size !== 4) {
      dropped++;
      continue;
    }

    const rawAnswers = Array.isArray(raw.answers) ? raw.answers : [];
    let answers = Array.from(new Set(
      rawAnswers.map((value) => normalizeAnswer(value, options.length)).filter((value) => value >= 0)
    )).sort((a, b) => a - b);
    if (answers.length < 2) {
      const single = normalizeAnswer(raw.answer !== undefined ? raw.answer : raw.a, options.length);
      if (single < 0) {
        dropped++;
        continue;
      }
      answers = [single];
    }

    const key = normalizeForMatch(question);
    if (seen.has(key)) {
      dropped++;
      continue;
    }
    seen.add(key);

    let source = String(raw.source || raw.s || '').trim();
    const normalizedSource = normalizeForMatch(source);
    if (normalizedSource.length >= 20) {
      if (!haystack.includes(normalizedSource)) {
        // Citation annoncée mais introuvable : la question n'est pas fiable.
        dropped++;
        continue;
      }
    } else {
      source = chapterTitle || 'Généré par IA';
      unverified++;
    }

    questions.push({
      q: question,
      options,
      answer: answers[0],
      answers: answers.length > 1 ? answers : undefined,
      explanation,
      source
    });
  }

  return { questions, dropped, unverified };
}

module.exports = {
  MAX_TEXT,
  buildPrompt,
  buildFilePrompt,
  normalizeForMatch,
  normalizeAnswer,
  validateQuestions
};
