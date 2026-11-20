/*
 * Quiz Master — quiz-engine.js
 * Moteur pur (sans DOM) : sélection intelligente des questions, randomisation,
 * correction et calcul des résultats. Testable dans Node.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.QuizEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DAY = 86400000;

  /* ------------------------------- Aléatoire ----------------------------- */

  /** Générateur pseudo-aléatoire déterministe (mulberry32) — utile pour les tests. */
  function createRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, rng = Math.random) {
    const array = list.slice();
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /* ----------------------------- Mise à plat ----------------------------- */

  /**
   * Transforme les chapitres d'une banque en tableau plat de questions
   * enrichies (documentId, chapterId, chapterTitle).
   */
  function flatten(chapters, documentId) {
    const questions = [];
    for (const chapter of chapters || []) {
      for (const question of chapter.questions || []) {
        questions.push({
          ...question,
          documentId,
          chapterId: chapter.id,
          chapterTitle: chapter.title
        });
      }
    }
    return questions;
  }

  function groupByChapter(questions) {
    const map = new Map();
    for (const question of questions) {
      const key = question.chapterId || 'default';
      if (!map.has(key)) map.set(key, { id: key, title: question.chapterTitle || 'Cours', questions: [] });
      map.get(key).questions.push(question);
    }
    return Array.from(map.values());
  }

  /* --------------------------- Sélection pondérée ------------------------ */

  /**
   * Poids d'une question. Plus le poids est élevé, plus la question a de
   * chances d'être tirée :
   *  - jamais vue : forte priorité ;
   *  - échouée souvent : priorité renforcée ;
   *  - révision espacée arrivée à échéance : priorité renforcée ;
   *  - vue récemment / pas encore due : priorité réduite.
   */
  function getWeight(questionId, stats = {}, recent = [], now = Date.now()) {
    const stat = stats[questionId];
    if (!stat || !stat.seen) return 100;

    const attempts = (stat.correct || 0) + (stat.wrong || 0);
    const errorRate = attempts > 0 ? (stat.wrong || 0) / attempts : 0.5;
    let weight = 16 + 95 * errorRate;

    if (stat.box === 0 || stat.wrong > stat.correct) weight += 20;

    const due = typeof stat.due === 'number' ? stat.due : 0;
    if (due <= now) {
      const overdueDays = Math.min(60, (now - due) / DAY);
      weight += 22 + overdueDays;
    } else {
      weight *= 0.3;
    }

    weight -= Math.min(15, (stat.box || 0) * 3);

    if (recent.includes(questionId)) weight *= 0.12;

    return Math.max(1, weight);
  }

  function weightedSample(items, weightFn, count, rng) {
    const pool = items.slice();
    const chosen = [];
    while (pool.length > 0 && chosen.length < count) {
      const weights = pool.map(weightFn);
      const total = weights.reduce((sum, value) => sum + value, 0);
      let index = pool.length - 1;
      if (total > 0) {
        let target = rng() * total;
        for (let i = 0; i < pool.length; i++) {
          target -= weights[i];
          if (target <= 0) {
            index = i;
            break;
          }
        }
      } else {
        index = Math.floor(rng() * pool.length);
      }
      chosen.push(pool.splice(index, 1)[0]);
    }
    return chosen;
  }

  /**
   * Prépare une session de quiz.
   * @param {Object} options
   * @param {Array} options.questions       Banque plate (toutes questions)
   * @param {string} [options.chapterId]    Chapitre ciblé ('all' pour tout)
   * @param {number} [options.count=10]
   * @param {Object} [options.stats]        Statistiques par question
   * @param {Array}  [options.recent]       Identifiants récemment posés
   * @param {number} [options.now]
   * @param {Function} [options.rng]
   * @param {Array}  [options.fallbackQuestions]  Questions de secours (autres chapitres)
   */
  function buildSession(options) {
    const {
      questions = [],
      chapterId = 'all',
      count = 10,
      stats = {},
      recent = [],
      now = Date.now(),
      rng = Math.random,
      mode = 'normal',
      fallbackQuestions = []
    } = options;

    const pool = chapterId && chapterId !== 'all'
      ? questions.filter((q) => q.chapterId === chapterId)
      : questions.slice();

    if (pool.length === 0) throw new Error('Aucune question disponible pour ce chapitre.');

    const requested = Math.max(1, Math.min(50, count));

    // Créneaux réservés à la répétition espacée : les questions échouées et
    // arrivées à échéance reviennent automatiquement, même face à un grand
    // stock de questions inédites. C'est ce qui rend la révision réellement
    // adaptative (et non un simple tirage aléatoire).
    const reserveSlots = Math.max(1, Math.min(Math.ceil(requested * 0.4), requested - 1));
    const hot = pool
      .filter((question) => {
        const stat = stats[question.id];
        return stat && stat.seen > 0 && (stat.wrong || 0) > 0 && (stat.due || 0) <= now;
      })
      .sort((a, b) => getWeight(b.id, stats, recent, now) - getWeight(a.id, stats, recent, now))
      .slice(0, reserveSlots);

    const hotIds = new Set(hot.map((question) => question.id));
    const selected = hot.slice();

    const remainingPool = pool.filter((question) => !hotIds.has(question.id));
    const drawn = weightedSample(
      remainingPool,
      (q) => getWeight(q.id, stats, recent, now),
      requested - selected.length,
      rng
    );
    selected.push(...drawn);

    // Si le chapitre ne contient pas assez de questions, on complète avec les
    // autres chapitres du même document (jamais avec un autre document).
    let filledFromOtherChapters = 0;
    if (selected.length < requested) {
      const used = new Set(selected.map((q) => q.id));
      const extras = fallbackQuestions.filter(
        (q) => !used.has(q.id) && q.chapterId !== chapterId
      );
      // On retire d'abord les questions récentes, pour garantir la variété.
      const fresh = extras.filter((q) => !recent.includes(q.id));
      const candidates = fresh.length >= requested - selected.length ? fresh : extras;
      const extraSelection = weightedSample(
        candidates,
        (q) => getWeight(q.id, stats, recent, now),
        requested - selected.length,
        rng
      );
      filledFromOtherChapters = extraSelection.length;
      selected.push(...extraSelection);
    }

    const items = selected.map((question) => {
      const options = shuffle(
        question.options.map((text, index) => ({ text, correct: index === question.answer })),
        rng
      );
      return {
        question,
        options,
        answerIndex: options.findIndex((option) => option.correct)
      };
    });

    return {
      id: 'session_' + Math.floor(rng() * 1e9).toString(36) + '_' + now.toString(36),
      mode,
      documentId: options.documentId || (questions[0] && questions[0].documentId) || null,
      chapterId,
      createdAt: now,
      requested,
      delivered: items.length,
      filledFromOtherChapters,
      items
    };
  }

  /**
   * Construit une session « Réviser mes erreurs » à partir des statistiques.
   * Priorité aux questions les plus échouées et non maîtrisées.
   */
  function buildReviewSession(questions, stats, options = {}) {
    const {
      count = 10,
      now = Date.now(),
      rng = Math.random,
      chapterId = 'all',
      recent = []
    } = options;
    const scoped = chapterId && chapterId !== 'all'
      ? questions.filter((q) => q.chapterId === chapterId)
      : questions;

    const failed = scoped.filter((q) => {
      const stat = stats[q.id];
      return stat && (stat.wrong || 0) > 0;
    });
    if (failed.length === 0) return null;

    failed.sort((a, b) => {
      const sa = stats[a.id] || {};
      const sb = stats[b.id] || {};
      const rateA = (sa.wrong || 0) / Math.max(1, (sa.correct || 0) + (sa.wrong || 0));
      const rateB = (sb.wrong || 0) / Math.max(1, (sb.correct || 0) + (sb.wrong || 0));
      if (rateB !== rateA) return rateB - rateA;
      if ((sb.wrong || 0) !== (sa.wrong || 0)) return (sb.wrong || 0) - (sa.wrong || 0);
      return (sa.box || 0) - (sb.box || 0);
    });

    const selected = failed
      .slice(0, Math.max(1, Math.min(50, count)))
      .map((question) => {
        const optionsList = shuffle(
          question.options.map((text, index) => ({ text, correct: index === question.answer })),
          rng
        );
        return {
          question,
          options: optionsList,
          answerIndex: optionsList.findIndex((option) => option.correct)
        };
      });

    // Une session d'entraînement doit rester une partie complète : on complète
    // avec les questions les plus « chaudes » (échues / jamais vues) si les
    // erreurs sont moins nombreuses que demandé.
    if (selected.length < count) {
      const used = new Set(selected.map((item) => item.question.id));
      const extras = scoped.filter((question) => !used.has(question.id));
      const extraQuestions = weightedSample(
        extras,
        (question) => getWeight(question.id, stats, recent, now),
        count - selected.length,
        rng
      );
      for (const question of extraQuestions) {
        const optionsList = shuffle(
          question.options.map((text, index) => ({ text, correct: index === question.answer })),
          rng
        );
        selected.push({
          question,
          options: optionsList,
          answerIndex: optionsList.findIndex((option) => option.correct)
        });
      }
    }

    return {
      id: 'review_' + Math.floor(rng() * 1e9).toString(36) + '_' + now.toString(36),
      mode: 'review',
      documentId: options.documentId || (questions[0] && questions[0].documentId) || null,
      chapterId,
      createdAt: now,
      requested: count,
      delivered: selected.length,
      filledFromOtherChapters: 0,
      items: selected
    };
  }

  /* ------------------------------- Résultats ----------------------------- */

  function getMessage(score, total) {
    const onTen = total > 0 ? Math.round((score / total) * 10) : 0;
    if (onTen >= 9) {
      return {
        title: 'Excellent !',
        detail: 'Tu maîtrises presque parfaitement ce chapitre.',
        tone: 'excellent',
        emoji: '🏆'
      };
    }
    if (onTen >= 7) {
      return {
        title: 'Très bien !',
        detail: 'Encore quelques efforts pour viser le sans-faute.',
        tone: 'good',
        emoji: '🎯'
      };
    }
    if (onTen >= 5) {
      return {
        title: 'Bon début',
        detail: 'Certaines notions sont encore à revoir.',
        tone: 'average',
        emoji: '📘'
      };
    }
    return {
      title: 'Il faut reprendre les notions essentielles',
      detail: 'Relis le chapitre, puis réessaie : c’est en pratiquant qu’on progresse.',
      tone: 'weak',
      emoji: '💪'
    };
  }

  /**
   * Corrige une session.
   * @param {Object} session
   * @param {Array<number|null>} answers index choisi pour chaque question
   */
  function evaluate(session, answers) {
    const items = (session && session.items) || [];
    const results = [];
    let correct = 0;
    let answered = 0;

    items.forEach((item, index) => {
      const chosen = typeof answers[index] === 'number' ? answers[index] : null;
      const isCorrect = chosen !== null && chosen === item.answerIndex;
      if (chosen !== null) answered++;
      if (isCorrect) correct++;
      results.push({
        question: item.question,
        options: item.options,
        answerIndex: item.answerIndex,
        chosen,
        isCorrect
      });
    });

    const total = items.length;
    const wrong = total - correct;
    return {
      total,
      answered,
      correct,
      wrong,
      score: correct,
      percent: total > 0 ? Math.round((correct / total) * 100) : 0,
      message: getMessage(correct, total),
      details: results,
      missed: results.filter((result) => !result.isCorrect)
    };
  }

  return {
    DAY,
    createRng,
    shuffle,
    flatten,
    groupByChapter,
    getWeight,
    weightedSample,
    buildSession,
    buildReviewSession,
    evaluate,
    getMessage
  };
});
