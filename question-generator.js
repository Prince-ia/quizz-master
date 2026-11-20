/*
 * Quiz Master — question-generator.js
 * Génération locale de questions à partir du texte réel d'un cours.
 *
 * Aucune invention : chaque question est construite à partir d'une phrase,
 * d'une définition, d'une liste ou d'une donnée chiffrée présente dans le
 * document source. Le mode IA (optionnel) est géré par ai-connector.js.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.QuestionGenerator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_OPTION_LENGTH = 190;

  /* ------------------------------ Utilitaires ---------------------------- */

  function hashString(input) {
    let hash = 2166136261;
    const str = String(input);
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function makeQuestionId(documentId, chapterId, text) {
    return 'q_' + hashString(documentId + '|' + chapterId + '|' + text);
  }

  function cleanInline(value) {
    return String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[\s\-–•*·]+/, '')
      .replace(/[\s;:,]+$/, '')
      .trim();
  }

  function ensurePeriod(value) {
    const text = cleanInline(value);
    if (!text) return text;
    return /[.!?»]$/.test(text) ? text : text + '.';
  }

  function capitalize(value) {
    const text = String(value || '').trim();
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function normalizeKey(value) {
    return cleanInline(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function isGenericIntro(value) {
    const key = normalizeKey(value).replace(/[.:]+$/, '');
    if (!key) return true;
    if (/objectif|doit etre capable|doivent etre capable|apprenant|rappel anatomique|resume|table des matieres/i.test(key)) return true;
    const blocked = [
      'objectifs', 'objectif', 'but', 'definition', 'definitions', 'signes', 'les signes',
      'causes', 'les causes', 'consequences', 'les consequences', 'prevention', 'preventions',
      'conduite a tenir', 'cat', 'que faire', 'materiel', 'materiel a utiliser', 'indications',
      'les indications', 'comment', 'methodes', 'resultats', 'resume', 'introduction',
      'rappel anatomique', 'conclusion', 'les fractures', 'les atteintes', 'les brulures'
    ];
    if (blocked.includes(key)) return true;
    return key.length < 10;
  }

  /**
   * Une introduction de liste doit ressembler à une annonce (« … : », « … sont »)
   * et non à une phrase de cours terminée par un point.
   */
  function isValidListIntro(value) {
    const cleaned = cleanInline(value);
    if (!cleaned || cleaned.length < 12) return false;
    if (isGenericIntro(cleaned)) return false;
    if (/\d{5,}/.test(cleaned)) return false;
    if (/^(NB|CF|VOIR|PS|REMARQUE)\b/i.test(cleaned)) return false;
    if (/:$/.test(cleaned)) return true;
    if (/(?:sont|comprend|regroupe|inclut|suivent|suivants?)$/i.test(cleaned)) return true;
    // Une ligne de titre qui introduit une liste n'a pas toujours de deux-points
    // dans Word : « Victime consciente ayant des difficultés à respirer ».
    if (/[.!?]$/.test(cleaned)) return false;
    if (cleaned.split(/\s+/).length > 14) return false;
    return /^[A-ZÀ-Ý]/.test(cleaned);
  }

  /**
   * Écarte les intitulés de section et artefacts qui polluent les listes Word
   * (souvent mis en forme avec des puces).
   */
  function isUsableListItem(item) {
    const text = cleanInline(item);
    if (text.length < 3 || text.length > 95) return false;
    if (/^\d{5,}/.test(text)) return false;
    if (/^[.:;,\-–—_]+$/.test(text)) return false;
    if (text === text.toUpperCase() && text.length <= 50) return false;
    if (/^(NB|CF|VOIR|EX)\b/i.test(text)) return false;
    if (isObjectiveItem(text)) return false;
    if (/^(les|le|la)\s+(causes?|signes?|consequences?|objectifs?|definitions?|prevention|materiel)$/i.test(normalizeKey(text).replace(/ /g, ' '))) return false;
    return true;
  }

  /**
   * Intrus crédible pour une question d'exclusion : un élément court et
   * nominal. Une phrase entière (« Son action se décompose en trois gestes »)
   * rendrait la bonne réponse évidente.
   */
  function isPlausibleIntruder(value) {
    const text = cleanInline(value);
    if (text.length < 3 || text.length > 70) return false;
    if (/[.!?]$/.test(text)) return false;
    if (text.split(/\s+/).length > 8) return false;
    if (/^(?:selon|dans|après|avant|lorsque|quand|si|il|elle|on|nous|vous)\b/i.test(text)) return false;
    return true;
  }

  /** Élément formulé comme un objectif pédagogique (« De savoir pratiquer… »). */
  function isObjectiveItem(value) {
    const text = cleanInline(value)
      .replace(/^(?:de|d['’])\s+/i, '')
      .replace(/^(?:savoir|pouvoir)\s+/i, '');
    return /^(conna[îi]tre|savoir|être capable|reconna[îi]tre|pratiquer|assurer|mettre|effectuer|appliquer|ma[îi]triser|identifier|expliquer|décrire|réaliser|poser|donner|protéger|alerter|secourir)\b/i.test(text);
  }

  /** Introduction qui annonce des objectifs d'apprentissage, pas une liste de cours. */
  function isObjectiveIntro(value) {
    const text = cleanInline(value);
    return /(doit\s+être\s+capable|objectifs?\b|à\s+la\s+fin\s+(?:du|de|des)\b)/i.test(text);
  }

  /**
   * Normalise une expression développée (sigle, notion) pour l'affichage :
   * les titres saisis en capitales dans Word sont remis en casse de phrase.
   */
  function normalizeExpansion(value) {
    let text = cleanInline(value).replace(/^[\s:;,\-–—]+/, '').replace(/[\s;:,]+$/, '');
    if (!text || text.length < 6 || text.length > 130) return '';
    if (/\d{4,}/.test(text)) return '';
    text = text.replace(/^(?:le|la|les|l'|un|une|des)\s+/i, '');
    if (text === text.toUpperCase() && text.length > 6) text = text.toLowerCase();
    return capitalize(text);
  }

  /* --------------------------- Découpage en chapitres -------------------- */

  /**
   * Repère les grands titres (CHAPITRE I, PARTIE 2, MODULE, LEÇON, SECTION…)
   * et découpe le texte en conséquence.
   */
  function splitChapters(rawText) {
    const text = String(rawText || '').replace(/\r\n?/g, '\n');
    const headingRe = /(^|\n)[ \t]*(CHAPITRE|PARTIE|MODULE|LECON|LEÇON|SECTION)\s+([IVXLC]+|\d+)\s*[:.\-–—]?\s*([^\n]*)/gi;
    const matches = [];
    let match;
    while ((match = headingRe.exec(text)) !== null) {
      const headingStart = match.index + match[1].length;
      const headingEnd = match.index + match[0].length;
      matches.push({
        start: headingStart,
        end: headingEnd,
        kind: match[2].toUpperCase(),
        number: match[3],
        rest: cleanInline(match[4]),
        title: capitalize(match[2].toLowerCase()) + ' ' + match[3] + (cleanInline(match[4]) ? ' : ' + cleanInline(match[4]) : '')
      });
    }

    const chapters = [];
    if (matches.length === 0) {
      const content = cleanChapterContent(text);
      if (content.length > 60) {
        chapters.push({
          id: 'ch1',
          title: 'Contenu du cours',
          content
        });
      }
      return chapters;
    }

    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const next = matches[i + 1];
      const content = cleanChapterContent(text.slice(current.end, next ? next.start : text.length));
      // Les lignes de sommaire produisent des segments très courts : on les ignore.
      if (content.length < 250) continue;
      if (chapters.some((c) => c.title === current.title && c.content === content)) continue;
      chapters.push({
        id: 'ch' + (chapters.length + 1),
        title: current.title,
        content
      });
    }

    if (chapters.length === 0) {
      const content = cleanChapterContent(text);
      if (content.length > 60) chapters.push({ id: 'ch1', title: 'Contenu du cours', content });
    }
    return chapters;
  }

  function cleanChapterContent(content) {
    return String(content || '')
      .split('\n')
      .map((line) => line.replace(/[ \t]+$/g, ''))
      .filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        if (/^\d{1,4}$/.test(trimmed)) return false;          // numéro de page
        if (/^\d{8,}$/.test(trimmed)) return false;           // identifiant d'image
        if (/^[.\-_=·]{4,}$/.test(trimmed)) return false;      // ligne décorative
        return true;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /* ----------------------------- Découpage texte ------------------------- */

  function splitIntoSentences(paragraph) {
    const cleaned = cleanInline(paragraph);
    if (!cleaned) return [];
    // On protège les abréviations courantes avant de couper sur le point.
    const protectedText = cleaned
      .replace(/\b(M|MM|Mme|Mmes|Dr|Pr|St|Ste|art|cf|ex|etc)\.\s/g, '$1<> ')
      .replace(/(\d)\.(\d)/g, '$1<>$2');
    return protectedText
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ«"])/)
      .map((s) => s.replace(/<>/g, '.').trim())
      .filter(Boolean);
  }

  function isUsableSentence(sentence) {
    const text = sentence.trim();
    if (text.length < 35 || text.length > 330) return false;
    if (!/[a-zA-ZÀ-ÿ]/.test(text)) return false;
    const letters = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    const digits = (text.match(/\d/g) || []).length;
    if (letters < 25) return false;
    if (digits > letters * 0.6) return false;
    if (/[→⇒=]/.test(text)) return false;
    if (/\.{3,}|_{3,}/.test(text)) return false;
    if (/^(tableau|figure|photo|image|source)\b/i.test(text)) return false;
    if (/\b(www|http|@)\b/i.test(text)) return false;
    if (text === text.toUpperCase() && text.length > 25) return false;
    return true;
  }

  /* ------------------------------- Générateurs --------------------------- */

  function collectDefinitions(sentences) {
    const defs = [];
    const verbRe = /\s(?:est|sont|désigne|désignent|signifie|consistent à|consiste à|correspond à)\s/i;
    for (const sentence of sentences) {
      if (sentence.length < 55 || sentence.length > 300) continue;
      if (!verbRe.test(sentence)) continue;
      const m = sentence.match(/^(.{3,72}?)\s+(est|sont|désigne|désignent|signifie|consistent à|consiste à|correspond à)\s+(.{25,270})$/i);
      if (!m) continue;
      let term = cleanInline(m[1]);
      const predicate = cleanInline(m[3]);
      if (!term || !predicate) continue;
      if (/^(si|lorsque|quand|après|avant|pendant|en cas|chez|pour|dans|devant|selon|alors|puis|ainsi|toutefois|cependant|mais|or|donc|car|il|elle|ils|elles|on|ce|cette|ces|cela|celui|celle|qui|que|quoi|c'est|ce sont)\b/i.test(term) &&
          !/^(le|la|les|un|une|des)\s+[a-zà-ÿ]/i.test(term)) {
        continue;
      }
      if (/^(la|le|les|un|une|des)\s+(victime|personne|blesse|malade|secouriste|enfant|adulte|nourrisson|sujet|asphyxie)\b/i.test(normalizeKey(term))) continue;
      if (/(qui|que|dont|où|car|mais|donc|or|ni)$/i.test(term)) continue;
      if (term.length > 60) continue;
      if (term.split(/\s+/).length > 8) continue;
      if (/^(pas|jamais|rien|aucun)\b/i.test(predicate)) continue;
      if (/^(conservé|conservés|conservée|conservées|arrêté|arrêtés|posé|posés|fonction|constitué|constitués)\b/i.test(predicate)) continue;
      if (/^(somnolente?|conscient|inconscient|normal|normaux|modifié|modifiés|faible|rapide|lent|applicables?)\b/i.test(predicate)) continue;
      if (predicate.split(/\s+/).length < 5) continue;
      if (predicate.length > MAX_OPTION_LENGTH) continue;
      // Le sujet doit ressembler à une notion, pas à une phrase complète.
      if (/[,:;!?]/.test(term)) continue;

      // « consiste à… », « correspond à… » : on restitue le lien verbal pour
      // que la proposition se lise comme une vraie définition.
      let definition = predicate;
      if (/^(consiste|consistent|correspond)\b/i.test(m[2])) {
        definition = m[2].toLowerCase() + ' ' + predicate;
      }
      defs.push({ term: capitalize(term), definition: ensurePeriod(definition), sentence });
    }
    return defs;
  }

  function buildDefinitionQuestions(defs, chapter, allDefs, limit) {
    const questions = [];
    const used = new Set();
    let rotation = 0;
    for (const def of defs) {
      if (questions.length >= limit) break;
      const key = normalizeKey(def.term);
      if (used.has(key)) continue;
      const pool = allDefs
        .filter((other) => normalizeKey(other.term) !== key)
        .map((other) => other.definition)
        .filter((value, index, arr) => arr.indexOf(value) === index && value !== def.definition)
        .filter((value) => value.length >= def.definition.length * 0.45 && value.length <= def.definition.length * 2.1);
      const fallback = allDefs
        .filter((other) => normalizeKey(other.term) !== key)
        .map((other) => other.definition)
        .filter((value, index, arr) => arr.indexOf(value) === index && value !== def.definition);
      const distractors = (pool.length >= 3 ? pool : fallback).slice(0, 20);
      if (distractors.length < 3) continue;
      used.add(key);

      // Rotation des distracteurs : les propositions varient d'une question à
      // l'autre au lieu de répéter systématiquement les trois mêmes.
      const picked = [];
      for (let i = 0; i < distractors.length && picked.length < 3; i++) {
        picked.push(distractors[(rotation + i) % distractors.length]);
      }
      rotation += 2;

      const options = [def.definition, ...picked];
      questions.push({
        q: 'Comment le cours définit-il « ' + def.term + ' » ?',
        options,
        answer: 0,
        explanation: '« ' + def.term + ' » : ' + def.definition,
        source: chapter.title,
        kind: 'definition'
      });
    }
    return questions;
  }

  function pickEvenly(list, count) {
    if (list.length <= count) return list.slice();
    const result = [];
    const step = list.length / count;
    for (let i = 0; i < count; i++) {
      result.push(list[Math.floor(i * step)]);
    }
    return result;
  }

  /* -------------------------------- Sigles ------------------------------- */

  const ACRONYM_BLACKLIST = new Set([
    'NB', 'CF', 'VOIR', 'EX', 'PS', 'REMARQUE', 'PAGE', 'TEL', 'BP', 'ART',
    'FIG', 'TABLEAU', 'SOURCE', 'PHOTO', 'IMAGE', 'WWW', 'HTTP'
  ]);

  const EXPANSION_RE = new RegExp(
    "((?:[A-ZÀ-Ý][\\wÀ-ÿ'’\\-]*|(?:de|des|du|la|le|les|d'|l'|et|en|à|au|aux))" +
    "(?:[ \\u00a0]+(?:[A-ZÀ-Ý][\\wÀ-ÿ'’\\-]*|(?:de|des|du|la|le|les|d'|l'|et|en|à|au|aux)))*)" +
    "[ \\u00a0]*\\(([A-ZÉÈÀÎÏÔÛÇ]{2,6})\\)",
    'g'
  );

  /**
   * Repère les sigles définis dans le cours :
   *  - « Position Latérale de Sécurité (PLS) » ;
   *  - « CAT : conduite à tenir » ;
   *  - « LVA signifie liberté des voies aériennes ».
   */
  function collectAcronyms(content, sentences) {
    const found = new Map();
    const add = (acronym, expansion, sentence) => {
      const key = cleanInline(acronym).toUpperCase();
      if (!/^[A-ZÉÈÀÎÏÔÛÇ]{2,6}$/.test(key)) return;
      if (ACRONYM_BLACKLIST.has(key)) return;
      const value = normalizeExpansion(expansion);
      if (!value || value.length < 8) return;
      if (/^(?:il|elle|ils|elles|on|ce|cette|ces|nous|vous|je|tu|est|sont|doit|doivent|faut|peut|permet|consiste|correspond|agit)\b/i.test(value)) return;
      if (!found.has(key)) {
        found.set(key, {
          acronym: key,
          expansion: value,
          sentence: sentence ? cleanInline(sentence) : ''
        });
      }
    };

    for (const line of String(content || '').split('\n')) {
      const clean = cleanInline(line);
      const match = clean.match(/^([A-ZÉÈÀÎÏÔÛÇ]{2,6})\s*[:=]\s*(.+)$/);
      if (match) add(match[1], match[2], '');
    }

    for (const sentence of sentences) {
      EXPANSION_RE.lastIndex = 0;
      let match;
      while ((match = EXPANSION_RE.exec(sentence)) !== null) {
        add(match[2], match[1], sentence);
      }
      const meaning = /([A-ZÉÈÀÎÏÔÛÇ]{2,6})\s+(?:signifie|veut dire|désigne)\s+([^.;]{8,120})/g;
      while ((match = meaning.exec(sentence)) !== null) {
        add(match[1], match[2], sentence);
      }
    }

    return Array.from(found.values());
  }

  function buildAcronymQuestions(acronyms, allAcronyms, chapter, limit) {
    const questions = [];
    if (acronyms.length === 0) return questions;

    const expansionPool = unique(allAcronyms.map((item) => item.expansion)).filter(Boolean);
    const acronymPool = unique(allAcronyms.map((item) => item.acronym));
    let rotation = 0;

    for (const item of acronyms) {
      if (questions.length >= limit) break;

      // 1) Du sigle vers sa signification.
      const others = expansionPool.filter((value) => normalizeKey(value) !== normalizeKey(item.expansion));
      if (others.length >= 3) {
        const picked = [];
        for (let i = 0; i < others.length && picked.length < 3; i++) {
          picked.push(others[(rotation + i) % others.length]);
        }
        rotation += 2;
        questions.push({
          q: 'Que signifie le sigle « ' + item.acronym + ' » dans ce cours ?',
          options: [item.expansion, ...picked],
          answer: 0,
          explanation: item.expansion + ' (' + item.acronym + ').' + (item.sentence ? ' D’après le cours : « ' + item.sentence + ' »' : ''),
          source: chapter.title,
          kind: 'acronym'
        });
      }

      // 2) De la signification vers le sigle.
      if (questions.length >= limit) break;
      const otherAcronyms = acronymPool.filter((value) => value !== item.acronym);
      const pickedAcronyms = pickEvenly(otherAcronyms, 3);
      if (pickedAcronyms.length === 3) {
        questions.push({
          q: 'Quel sigle correspond à « ' + item.expansion + ' » dans ce cours ?',
          options: [item.acronym, ...pickedAcronyms],
          answer: 0,
          explanation: '« ' + item.expansion + ' » correspond au sigle ' + item.acronym + '.',
          source: chapter.title,
          kind: 'acronym'
        });
      }
    }
    return questions;
  }

  const QUANTITY_UNITS = 'minutes?|heures?|jours?|semaines?|mois|ans?|années?|séries?|insufflations?|fois|mouvements?|battements?|personnes?|victimes?|secouristes?|porteurs?|éléments?|points?|litres?|mètres?|km|%';
  const QUANTITY_RE = new RegExp('\\b(\\d{1,3}(?:[ \\u00a0]\\d{3})?)\\s*(' + QUANTITY_UNITS + ')\\b', 'gi');

  function collectNumbers(chapterSentences) {
    const ranges = [];
    const years = [];
    const quantities = [];
    const rangeRe = /(\d{1,3}(?:[.,]\d+)?)\s*(?:à|a|-|–)\s*(\d{1,3}(?:[.,]\d+)?)(?![\d])/g;
    const yearRe = /\b(1[6-9]\d{2}|20\d{2})\b/g;

    for (const sentence of chapterSentences) {
      let m;
      rangeRe.lastIndex = 0;
      while ((m = rangeRe.exec(sentence)) !== null) {
        // On écarte les dates et les nombres isolés trop grands.
        if (parseInt(m[1], 10) > 500 || parseInt(m[2], 10) > 500) continue;
        ranges.push({ sentence, raw: m[0], low: m[1], high: m[2] });
      }
      yearRe.lastIndex = 0;
      while ((m = yearRe.exec(sentence)) !== null) {
        years.push({ sentence, year: m[1] });
      }

      // Quantité isolée avec unité : « 10 minutes », « 4 séries »,
      // « 40 000 victimes ». On écarte les phrases contenant plusieurs
      // nombres (le remplacement serait ambigu).
      QUANTITY_RE.lastIndex = 0;
      const match = QUANTITY_RE.exec(sentence);
      if (!match) continue;
      QUANTITY_RE.lastIndex = 0;
      if (QUANTITY_RE.exec(sentence)) continue; // plusieurs quantités
      const tokens = sentence
        .replace(/\d{1,3}[ \u00a0]\d{3}/g, 'X')
        .match(/\d+/g) || [];
      if (tokens.length !== 1) continue;
      const value = parseInt(match[1].replace(/[^\d]/g, ''), 10);
      if (!Number.isFinite(value) || value < 1 || value > 200000) continue;
      const unit = cleanInline(match[2]).toLowerCase();
      quantities.push({ sentence, raw: match[0], value, unit });
    }
    return { ranges, years, quantities };
  }

  function buildNumberQuestions(numbers, allNumbers, chapter, limits) {
    const questions = [];
    const seen = new Set();

    // Fréquences, durées, quantités : « 15 à 20 ».
    for (const item of numbers.ranges) {
      if (questions.length >= limits.range) break;
      const key = item.sentence + '|' + item.raw;
      if (seen.has(key)) continue;
      const sentence = cleanInline(item.sentence);
      if (!sentence.includes(item.raw)) continue;
      if (sentence.length > 280) continue;
      seen.add(key);

      const answer = item.low + ' à ' + item.high;
      const pool = [];
      for (const other of allNumbers.ranges) {
        if (other.sentence === item.sentence) continue;
        const value = other.low + ' à ' + other.high;
        if (value !== answer) pool.push(value);
      }
      const distractors = unique(pool).slice(0, 10);
      if (distractors.length < 3) {
        distractors.push(...syntheticRanges(item.low, item.high, 3 - distractors.length));
      }
      const options = unique([answer, ...distractors]).slice(0, 4);
      if (options.length < 4) continue;

      questions.push({
        q: 'Complétez cette phrase du cours : « ' + sentence.replace(item.raw, '____') + ' »',
        options,
        answer: 0,
        explanation: 'Le cours indique : « ' + sentence + ' »',
        source: chapter.title,
        kind: 'number'
      });
    }

    // Dates et années.
    for (const item of numbers.years) {
      if (questions.length >= limits.range + limits.year) break;
      const key = 'year|' + item.sentence + '|' + item.year;
      if (seen.has(key)) continue;
      const sentence = cleanInline(item.sentence);
      if (!sentence.includes(item.year)) continue;
      seen.add(key);

      const otherYears = unique(
        allNumbers.years
          .filter((other) => other.sentence !== item.sentence)
          .map((other) => other.year)
          .filter((year) => year !== item.year)
      ).slice(0, 8);
      const synthetic = [item.year - 1, item.year + 1, item.year - 5, item.year + 5, item.year - 10]
        .filter((y) => y > 1700 && y < 2100 && String(y) !== item.year && !otherYears.includes(String(y)));
      const options = unique([item.year, ...otherYears, ...synthetic]).slice(0, 4);
      if (options.length < 4) continue;

      questions.push({
        q: 'Complétez : « ' + sentence.replace(item.year, '____') + ' »',
        options,
        answer: 0,
        explanation: 'D’après le cours : « ' + sentence + ' »',
        source: chapter.title,
        kind: 'date'
      });
    }

    // Quantités isolées : durées, doses, nombres de secouristes, victimes…
    const quantityLimit = limits.range + limits.year + (limits.quantity || 0);
    for (const item of numbers.quantities || []) {
      if (questions.length >= quantityLimit) break;
      const key = 'qty|' + item.sentence + '|' + item.raw;
      if (seen.has(key)) continue;
      const sentence = cleanInline(item.sentence);
      if (!sentence.includes(item.raw) || sentence.length > 280) continue;
      seen.add(key);

      const answer = formatQuantity(item.value, item.unit);
      const pool = [];
      for (const other of allNumbers.quantities || []) {
        if (other.unit !== item.unit) continue;
        if (other.sentence === item.sentence) continue;
        if (other.value === item.value) continue;
        pool.push(formatQuantity(other.value, other.unit));
      }
      const synthetics = [
        item.value + 1, item.value - 1, item.value + 2, item.value + 5,
        item.value + 10, item.value - 2, item.value * 2
      ]
        .filter((value) => value >= 1 && value <= 200000 && value !== item.value)
        .map((value) => formatQuantity(value, item.unit));
      const options = unique([answer, ...pool, ...synthetics]).slice(0, 4);
      if (options.length < 4) continue;

      questions.push({
        q: 'Complétez cette phrase du cours : « ' + sentence.replace(item.raw, '____') + ' »',
        options,
        answer: 0,
        explanation: 'Le cours indique : « ' + sentence + ' »',
        source: chapter.title,
        kind: 'quantity'
      });
    }
    return questions;
  }

  function formatQuantity(value, unit) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ' + unit;
  }

  function syntheticRanges(low, high, count) {
    const lowNum = parseInt(low, 10);
    const highNum = parseInt(high, 10);
    const candidates = [
      Math.max(1, lowNum - 5) + ' à ' + Math.max(2, highNum - 5),
      (lowNum + 5) + ' à ' + (highNum + 5),
      Math.max(1, lowNum - 10) + ' à ' + Math.max(2, highNum - 10),
      (lowNum + 10) + ' à ' + (highNum + 10),
      Math.max(1, lowNum - 2) + ' à ' + Math.max(2, highNum + 2)
    ];
    return unique(candidates).slice(0, count);
  }

  /**
   * Repère les listes à puces et leur phrase d'introduction.
   * @returns {Array<{intro:string, items:string[]}>}
   */
  function collectLists(content) {
    const lines = content.split('\n');
    const lists = [];
    let current = null;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      if (!line) continue;
      const isBullet = /^[\t\-–•*·]/.test(rawLine) || /^\d{1,2}[.)]\s+/.test(line);
      if (isBullet) {
        if (!current) {
          const intro = findIntro(lines, i);
          current = { intro, items: [] };
        }
        const item = cleanInline(line.replace(/^\d{1,2}[.)]\s+/, ''));
        if (isUsableListItem(item)) current.items.push(item);
        continue;
      }
      if (current) {
        lists.push(current);
        current = null;
      }
    }
    if (current) lists.push(current);

    return lists
      .map((list) => ({
        intro: cleanInline(list.intro),
        items: unique(list.items.map((item) => cleanInline(item))).filter(isUsableListItem)
      }))
      .filter((list) => list.items.length >= 3 && list.items.length <= 12);
  }

  function findIntro(lines, bulletIndex) {
    const explicitBullet = /^\s*(?:[-–•*·]|\d{1,2}[.)])\s*/;
    for (let i = bulletIndex - 1; i >= 0; i--) {
      const line = cleanInline(lines[i]);
      if (!line) continue;
      // On ignore les puces précédentes, mais pas les titres simplement
      // indentés (fréquent dans Word).
      if (explicitBullet.test(lines[i])) continue;
      let candidate = line;
      if (candidate.length > 110) {
        const parts = candidate.split(/(?<=[.!?])\s+/);
        candidate = parts[parts.length - 1] || '';
      }
      return candidate.length > 110 ? '' : candidate;
    }
    return '';
  }

  const COUNT_WORDS = {
    deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10
  };

  /** Nombre explicitement annoncé dans l'introduction (« il existe trois… »). */
  function statedCount(intro) {
    const key = normalizeKey(intro);
    const match = key.match(/\b(\d{1,2}|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\b/);
    if (!match) return null;
    const value = /^\d+$/.test(match[1]) ? parseInt(match[1], 10) : COUNT_WORDS[match[1]];
    return value >= 2 && value <= 12 ? value : null;
  }

  function buildListQuestions(lists, allLists, chapter, limit) {
    const questions = [];
    if (lists.length === 0) return questions;

    // On ne garde que les listes réellement exploitables : une introduction
    // qui annonce la liste, des éléments courts et propres.
    const usable = lists.filter((list) => {
      if (!list.intro || !isValidListIntro(list.intro)) return false;
      if (isObjectiveIntro(list.intro)) return false;
      if (list.items.length < 3 || list.items.length > 12) return false;
      return list.items.every(isUsableListItem);
    });
    if (usable.length === 0) return questions;

    const groups = usable.map((list, listIndex) => {
      const group = [];
      const intro = truncate(list.intro, 90);
      const ownKeys = new Set(list.items.map((item) => normalizeKey(item)));

      const intruders = [];
      for (const other of allLists) {
        if (other === list || other.intro === list.intro) continue;
        for (const item of other.items) {
          if (!ownKeys.has(normalizeKey(item))) intruders.push(item);
        }
      }
      // On privilégie des intrus courts et nominaux : une phrase entière
      // (« Son action se décompose en trois gestes ») trahirait la réponse.
      const cleanIntruders = unique(intruders).filter(isPlausibleIntruder);
      const pool = cleanIntruders.length >= 3 ? cleanIntruders : unique(intruders);

      // 1) Question d'appartenance : un intrus venu d'une autre liste du cours.
      if (pool.length > 0) {
        const offset = (listIndex * 3 + 1) % pool.length;
        const intruder = pool[offset];
        const trueItems = pickEvenly(list.items, 3);
        if (trueItems.length === 3) {
          group.push({
            q: 'Parmi ces propositions, laquelle N’APPARTIENT PAS à : « ' + intro + ' » ?',
            options: [intruder, ...trueItems],
            answer: 0,
            explanation: '« ' + intruder + ' » ne figure pas dans cette liste du cours. Les éléments cités sont : ' + list.items.join(' ; ') + '.',
            source: chapter.title,
            kind: 'list-odd'
          });
        }
      }

      // 2) Question multi-réponses : deux éléments appartiennent à la liste.
      if (pool.length >= 2 && list.items.length >= 4) {
        const trueItems = pickEvenly(list.items, 2);
        const start = (listIndex * 2) % pool.length;
        const intruders2 = [];
        for (let i = 0; i < pool.length && intruders2.length < 2; i++) {
          const candidate = pool[(start + i) % pool.length];
          if (!ownKeys.has(normalizeKey(candidate))) intruders2.push(candidate);
        }
        if (trueItems.length === 2 && intruders2.length === 2) {
          group.push({
            q: 'Lesquelles de ces propositions appartiennent à : « ' + intro + ' » ?',
            options: [...trueItems, ...intruders2],
            answers: [0, 1],
            explanation: 'Deux propositions font partie de cette liste du cours : ' +
              trueItems.join(' ; ') + '. Les deux autres n’en font pas partie.',
            source: chapter.title,
            kind: 'list-multi'
          });
        }
      }

      // 3) Question inverse : un seul élément appartient réellement à la liste.
      if (pool.length >= 3) {        const trueItem = list.items[listIndex % list.items.length];
        const picked = [];
        const start = (listIndex * 2 + 1) % pool.length;
        for (let i = 0; i < pool.length && picked.length < 3; i++) {
          const candidate = pool[(start + i) % pool.length];
          if (normalizeKey(candidate) !== normalizeKey(trueItem)) picked.push(candidate);
        }
        if (picked.length === 3) {
          group.push({
            q: 'Parmi ces propositions, laquelle APPARTIENT à : « ' + intro + ' » ?',
            options: [trueItem, ...picked],
            answer: 0,
            explanation: '« ' + trueItem + ' » fait bien partie de cette liste du cours : ' + list.items.join(' ; ') + '.',
            source: chapter.title,
            kind: 'list-odd'
          });
        }
      }

      // 4) Dénombrement : uniquement quand le cours annonce lui-même le nombre
      // (« il existe trois circonstances »), pour éviter toute ambiguïté.
      const announced = statedCount(list.intro);
      if (announced === list.items.length) {
        const countOptions = unique(
          [announced, announced - 1, announced + 1, announced + 2, announced - 2]
            .filter((n) => n >= 2 && n <= 12)
            .map((n) => n + ' éléments')
        );
        if (countOptions.length >= 4) {
          group.push({
            q: 'Selon le cours, combien d’éléments comporte la liste : « ' + intro + ' » ?',
            options: countOptions.slice(0, 4),
            answer: 0,
            explanation: 'Cette liste comporte ' + announced + ' éléments : ' + list.items.join(' ; ') + '.',
            source: chapter.title,
            kind: 'list-count'
          });
        }
      }
      return group;
    });

    // Répartition tournante : chaque liste fournit une question avant qu'une
    // autre liste ne soit exploitée une seconde fois.
    let round = 0;
    while (questions.length < limit) {
      let added = 0;
      for (const group of groups) {
        if (questions.length >= limit) break;
        if (group[round]) {
          questions.push(group[round]);
          added++;
        }
      }
      if (added === 0) break;
      round++;
    }
    return questions;
  }

  function unique(list) {
    const seen = new Set();
    const result = [];
    for (const item of list) {
      const key = String(item).trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }
    return result;
  }

  function truncate(value, max) {
    const text = cleanInline(value);
    return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…';
  }

  /* ------------------------------ Orchestration -------------------------- */

  /**
   * Génère une banque de questions à partir du texte d'un cours.
   * @param {string} text
   * @param {{documentId?:string, documentName?:string, maxPerChapter?:number}} options
   */
  function generate(text, options = {}) {
    const documentId = options.documentId || ('doc_' + hashString(text.slice(0, 4000)));
    const maxPerChapter = options.maxPerChapter || 40;
    const chapters = splitChapters(text);

    if (chapters.length === 0) {
      return {
        document: {
          id: documentId,
          name: options.documentName || 'Document importé',
          generated: true,
          importedAt: Date.now()
        },
        chapters: [],
        stats: { chapters: 0, questions: 0, sentences: 0 }
      };
    }

    // Toutes les définitions et listes du document servent de réservoir de
    // distracteurs : les options restent ainsi ancrées dans le cours.
    const perChapter = chapters.map((chapter) => {
      const paragraphs = chapter.content.split('\n').filter((line) => line.trim());
      const sentences = [];
      for (const paragraph of paragraphs) {
        if (/^[\t\-–•*·]/.test(paragraph) || /^\d{1,2}[.)]\s+/.test(paragraph.trim())) continue;
        for (const sentence of splitIntoSentences(paragraph)) {
          if (isUsableSentence(sentence)) sentences.push(sentence);
        }
      }
      const lists = collectLists(chapter.content);
      const numbers = collectNumbers(sentences);
      const acronyms = collectAcronyms(chapter.content, sentences);
      return { chapter, sentences, lists, numbers, acronyms, definitions: collectDefinitions(sentences) };
    });

    const allDefinitions = perChapter.flatMap((item) => item.definitions);
    const allLists = perChapter.flatMap((item) => item.lists);
    const allAcronyms = perChapter.flatMap((item) => item.acronyms);
    const allNumbers = {
      ranges: perChapter.flatMap((item) => item.numbers.ranges),
      years: perChapter.flatMap((item) => item.numbers.years),
      quantities: perChapter.flatMap((item) => item.numbers.quantities)
    };

    const outputChapters = [];
    let totalQuestions = 0;
    let totalSentences = 0;

    for (const item of perChapter) {
      totalSentences += item.sentences.length;
      const defs = buildDefinitionQuestions(item.definitions, item.chapter, allDefinitions, 16);
      const nums = buildNumberQuestions(item.numbers, allNumbers, item.chapter, { range: 6, year: 5, quantity: 5 });
      const sigles = buildAcronymQuestions(item.acronyms, allAcronyms, item.chapter, 6);
      const lists = buildListQuestions(item.lists, allLists, item.chapter, 8);

      let questions = [...defs, ...nums, ...sigles, ...lists];
      // Mélange déterministe pour éviter de toujours garder les mêmes types.
      questions = shuffle(questions, seedFrom(documentId + item.chapter.id));
      questions = questions.slice(0, maxPerChapter);

      // Normalisation finale + identifiants stables.
      const normalized = [];
      const seen = new Set();
      for (const question of questions) {
        const options = unique(question.options.map((opt) => cleanInline(opt)));
        if (options.length !== 4) continue;
        const correctSource = Array.isArray(question.answers) && question.answers.length
          ? question.answers
          : [question.answer];
        const correctTexts = correctSource
          .map((position) => question.options[position])
          .filter((text) => text !== undefined)
          .map((text) => cleanInline(text));
        if (!correctTexts.length) continue;
        const answerIndices = Array.from(new Set(
          correctTexts.map((text) => options.indexOf(text)).filter((index) => index >= 0)
        )).sort((a, b) => a - b);
        if (!answerIndices.length) continue;
        const key = normalizeKey(question.q);
        if (seen.has(key)) continue;
        seen.add(key);
        normalized.push({
          id: makeQuestionId(documentId, item.chapter.id, question.q),
          text: question.q,
          options,
          answer: answerIndices[0],
          answers: answerIndices.length > 1 ? answerIndices : undefined,
          explanation: question.explanation,
          source: question.source || item.chapter.title,
          kind: question.kind || 'general',
          generated: true
        });
      }

      if (normalized.length === 0) continue;
      totalQuestions += normalized.length;
      outputChapters.push({
        id: item.chapter.id,
        title: item.chapter.title,
        questions: normalized
      });
    }

    return {
      document: {
        id: documentId,
        name: options.documentName || 'Document importé',
        generated: true,
        importedAt: Date.now()
      },
      chapters: outputChapters,
      stats: { chapters: outputChapters.length, questions: totalQuestions, sentences: totalSentences }
    };
  }

  function seedFrom(str) {
    return hashString(str)
      .split('')
      .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 2147483647, 7);
  }

  function shuffle(list, seed) {
    const array = list.slice();
    let state = seed || 1;
    const random = () => {
      state = (state * 48271) % 2147483647;
      return state / 2147483647;
    };
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Convertit une banque « preset » (questions avec options/answer/explanation)
   * au format interne uniforme.
   */
  function normalizePreset(preset, documentId) {
    const doc = preset.document || {};
    const id = documentId || doc.id || 'preset';
    const chapters = (preset.chapters || []).map((chapter, index) => {
      const chapterId = chapter.id || 'ch' + (index + 1);
      const questions = (chapter.questions || []).map((question) => {
        const options = (question.o || question.options || []).map((opt) => cleanInline(opt));
        const answers = Array.isArray(question.answers) ? question.answers.filter((value) => Number.isInteger(value) && value >= 0 && value < options.length) : [];
        const answer = answers.length ? answers[0] : (typeof question.a === 'number' ? question.a : question.answer);
        const text = cleanInline(question.q || question.text);
        return {
          id: makeQuestionId(id, chapterId, text),
          text,
          options,
          answer,
          answers: answers.length > 1 ? answers : undefined,
          explanation: question.e || question.explanation || '',
          source: question.s || question.source || chapter.title,
          kind: question.kind || 'curated',
          generated: false
        };
      }).filter((question) => question.options.length === 4 && question.answer >= 0 && question.answer < 4 && question.text);
      return { id: chapterId, title: chapter.title, questions };
    }).filter((chapter) => chapter.questions.length > 0);

    return {
      document: {
        id,
        name: doc.name || 'Cours préchargé',
        source: doc.source || '',
        edition: doc.edition || '',
        organization: doc.organization || '',
        preloaded: !!doc.preloaded,
        generated: false,
        importedAt: doc.importedAt || Date.now()
      },
      chapters,
      stats: {
        chapters: chapters.length,
        questions: chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0)
      }
    };
  }

  return {
    generate,
    splitChapters,
    normalizePreset,
    makeQuestionId,
    _internals: {
      splitIntoSentences,
      collectDefinitions,
      collectLists,
      collectNumbers,
      collectAcronyms,
      normalizeExpansion,
      cleanInline,
      normalizeKey,
      isGenericIntro,
      unique,
      shuffle
    }
  };
});
