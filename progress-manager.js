/*
 * Quiz Master — progress-manager.js
 * Persistance locale (localStorage) : statistiques, historique, répétition
 * espacée et réglages. Aucune donnée n'est envoyée sur le réseau.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') {
    // Le navigateur utilise directement la classe ; les utilitaires restent
    // accessibles via ProgressManagerTools.
    window.ProgressManager = api.ProgressManager;
    window.ProgressManagerTools = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DAY = 86400000;
  const VERSION = 1;
  const BOX_INTERVALS = [0, 1, 3, 7, 14, 30]; // en jours
  const MAX_QUIZZES = 60;
  const MAX_RECENT = 40;

  function createMemoryStorage() {
    const map = new Map();
    return {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => map.set(key, String(value)),
      removeItem: (key) => map.delete(key),
      key: (index) => Array.from(map.keys())[index] || null,
      get length() {
        return map.size;
      }
    };
  }

  function defaultState() {
    return {
      version: VERSION,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      documents: [],
      questionStats: {},
      quizzes: [],
      recent: [],
      counters: { answered: 0, correct: 0, wrong: 0, currentStreak: 0, bestStreak: 0 },
      settings: { aiEndpoint: '', aiEnabled: false }
    };
  }

  function safeParse(raw) {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  class ProgressManager {
    /**
     * @param {Object} [options]
     * @param {Storage} [options.storage]  localStorage compatible
     * @param {string}  [options.key]
     */
    constructor(options = {}) {
      let storage = options.storage;
      if (!storage) {
        try {
          storage = typeof window !== 'undefined' ? window.localStorage : null;
          if (storage) {
            const probe = '__quizmaster_probe__';
            storage.setItem(probe, '1');
            storage.removeItem(probe);
          }
        } catch (error) {
          storage = null;
        }
      }
      this.persistent = !!storage;
      this.storage = storage || createMemoryStorage();
      this.key = options.key || 'quizmaster.v1';
      this.bankPrefix = this.key + '.bank.';
      this.state = this.load();
    }

    /* ------------------------------ Persistance ------------------------- */

    load() {
      const base = defaultState();
      const stored = safeParse(this.storage.getItem(this.key));
      if (!stored) return base;
      const state = {
        ...base,
        ...stored,
        counters: { ...base.counters, ...(stored.counters || {}) },
        settings: { ...base.settings, ...(stored.settings || {}) },
        documents: Array.isArray(stored.documents) ? stored.documents : [],
        quizzes: Array.isArray(stored.quizzes) ? stored.quizzes : [],
        recent: Array.isArray(stored.recent) ? stored.recent : [],
        questionStats: stored.questionStats && typeof stored.questionStats === 'object' ? stored.questionStats : {}
      };
      state.version = VERSION;
      return state;
    }

    persist() {
      this.state.updatedAt = Date.now();
      try {
        this.storage.setItem(this.key, JSON.stringify(this.state));
        return true;
      } catch (error) {
        console.warn('Quiz Master : impossible d’enregistrer la progression.', error);
        return false;
      }
    }

    /* ------------------------------- Documents -------------------------- */

    listDocuments() {
      return this.state.documents.slice().sort((a, b) => (b.importedAt || 0) - (a.importedAt || 0));
    }

    getDocument(documentId) {
      return this.state.documents.find((doc) => doc.id === documentId) || null;
    }

    saveDocument(document, chapters) {
      const meta = {
        id: document.id,
        name: document.name,
        source: document.source || '',
        edition: document.edition || '',
        organization: document.organization || '',
        preloaded: !!document.preloaded,
        importedAt: document.importedAt || Date.now(),
        chapters: (chapters || []).map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          questionCount: (chapter.questions || []).length
        })),
        questionCount: (chapters || []).reduce((sum, chapter) => sum + (chapter.questions || []).length, 0)
      };
      const index = this.state.documents.findIndex((doc) => doc.id === meta.id);
      if (index >= 0) this.state.documents[index] = meta;
      else this.state.documents.unshift(meta);
      this.persist();
      return meta;
    }

    hasDocument(documentId) {
      return !!this.getDocument(documentId);
    }

    removeDocument(documentId) {
      const document = this.getDocument(documentId);
      if (document && document.preloaded) return false;
      this.state.documents = this.state.documents.filter((doc) => doc.id !== documentId);
      // On retire aussi les statistiques liées à ce document.
      // (les identifiants de questions sont uniques par document)
      this.storage.removeItem(this.bankPrefix + documentId);
      this.persist();
      return true;
    }

    saveBank(documentId, bank) {
      try {
        this.storage.setItem(this.bankPrefix + documentId, JSON.stringify(bank));
        return true;
      } catch (error) {
        console.warn('Quiz Master : banque de questions trop volumineuse pour localStorage.', error);
        return false;
      }
    }

    getBank(documentId) {
      const raw = this.storage.getItem(this.bankPrefix + documentId);
      const bank = safeParse(raw);
      return bank && Array.isArray(bank.chapters) ? bank : null;
    }

    /* --------------------------- Réponses et quiz ----------------------- */

    getQuestionStat(questionId) {
      return this.state.questionStats[questionId] || null;
    }

    /**
     * Enregistre une réponse et met à jour la répétition espacée.
     * @param {{id:string, chapterId?:string, documentId?:string}} question
     * @param {boolean} correct
     * @param {number} [now]
     */
    recordAnswer(question, correct, now = Date.now()) {
      const id = question.id;
      if (!id) return null;
      const existing = this.state.questionStats[id] || {
        seen: 0,
        correct: 0,
        wrong: 0,
        streak: 0,
        bestStreak: 0,
        box: 0,
        due: 0,
        lastSeen: 0,
        lastCorrect: null,
        documentId: question.documentId || null,
        chapterId: question.chapterId || null
      };

      const stat = { ...existing };
      stat.seen += 1;
      stat.lastSeen = now;
      stat.lastCorrect = !!correct;
      stat.documentId = question.documentId || stat.documentId || null;
      stat.chapterId = question.chapterId || stat.chapterId || null;

      if (correct) {
        stat.correct += 1;
        stat.streak += 1;
        stat.bestStreak = Math.max(stat.bestStreak || 0, stat.streak);
        stat.box = clamp((stat.box || 0) + 1, 0, BOX_INTERVALS.length - 1);
        stat.due = now + BOX_INTERVALS[stat.box] * DAY;
        this.state.counters.currentStreak += 1;
        this.state.counters.bestStreak = Math.max(
          this.state.counters.bestStreak || 0,
          this.state.counters.currentStreak
        );
      } else {
        stat.wrong += 1;
        stat.streak = 0;
        stat.box = 0;
        // Une question ratée revient très vite (10 minutes), donc dès la
        // prochaine session, sans être immédiatement répétée dans celle-ci.
        stat.due = now + 10 * 60 * 1000;
        this.state.counters.currentStreak = 0;
      }

      this.state.questionStats[id] = stat;
      this.state.counters.answered += 1;
      if (correct) this.state.counters.correct += 1;
      else this.state.counters.wrong += 1;

      this.state.recent = [id, ...this.state.recent.filter((item) => item !== id)].slice(0, MAX_RECENT);
      this.persist();
      return stat;
    }

    /**
     * Enregistre la synthèse d'un quiz terminé.
     */
    recordQuiz(quiz) {
      const entry = {
        id: quiz.id || 'quiz_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        date: quiz.date || Date.now(),
        documentId: quiz.documentId || null,
        documentName: quiz.documentName || '',
        chapterId: quiz.chapterId || 'all',
        chapterTitle: quiz.chapterTitle || 'Toutes les parties',
        mode: quiz.mode || 'normal',
        score: quiz.score || 0,
        total: quiz.total || 0,
        percent: quiz.percent || 0,
        durationMs: quiz.durationMs || 0,
        questionIds: quiz.questionIds || [],
        wrongIds: quiz.wrongIds || []
      };
      this.state.quizzes = [entry, ...this.state.quizzes].slice(0, MAX_QUIZZES);
      this.persist();
      return entry;
    }

    /* ------------------------------ Statistiques ------------------------ */

    getGlobalStats() {
      const counters = this.state.counters;
      const accuracy = counters.answered > 0
        ? Math.round((counters.correct / counters.answered) * 100)
        : 0;
      const quizzes = this.state.quizzes;
      const bestPercent = quizzes.reduce((best, quiz) => Math.max(best, quiz.percent || 0), 0);
      return {
        quizzes: quizzes.length,
        answered: counters.answered,
        correct: counters.correct,
        wrong: counters.wrong,
        accuracy,
        bestPercent,
        currentStreak: counters.currentStreak,
        bestStreak: counters.bestStreak,
        documents: this.state.documents.length,
        seenQuestions: Object.keys(this.state.questionStats).length
      };
    }

    /**
     * Progression par chapitre : couverture (questions vues) et maîtrise
     * (taux de réussite moyen sur les questions déjà rencontrées).
     */
    getChapterProgress(chapters) {
      return (chapters || []).map((chapter) => {
        const questions = chapter.questions || [];
        let seen = 0;
        let masterySum = 0;
        let errors = 0;
        for (const question of questions) {
          const stat = this.state.questionStats[question.id];
          if (!stat) continue;
          seen++;
          const attempts = (stat.correct || 0) + (stat.wrong || 0);
          masterySum += attempts > 0 ? (stat.correct || 0) / attempts : 0;
          errors += stat.wrong || 0;
        }
        return {
          id: chapter.id,
          title: chapter.title,
          total: questions.length,
          seen,
          coverage: questions.length ? Math.round((seen / questions.length) * 100) : 0,
          mastery: seen ? Math.round((masterySum / seen) * 100) : 0,
          errors
        };
      });
    }

    getDifficultQuestions(questions, limit = 8) {
      return (questions || [])
        .map((question) => {
          const stat = this.state.questionStats[question.id];
          if (!stat || stat.wrong === 0) return null;
          const attempts = stat.correct + stat.wrong;
          return {
            question,
            stat,
            errorRate: attempts ? stat.wrong / attempts : 1,
            attempts
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (b.errorRate !== a.errorRate) return b.errorRate - a.errorRate;
          return b.stat.wrong - a.stat.wrong;
        })
        .slice(0, limit);
    }

    getDueQuestions(questions, now = Date.now()) {
      return (questions || []).filter((question) => {
        const stat = this.state.questionStats[question.id];
        return stat && stat.seen > 0 && (stat.due || 0) <= now;
      });
    }

    getRecentQuiz(limit = 8) {
      return this.state.quizzes.slice(0, limit);
    }

    /* -------------------------------- Réglages -------------------------- */

    updateSettings(patch) {
      this.state.settings = { ...this.state.settings, ...(patch || {}) };
      this.persist();
      return this.state.settings;
    }

    /* ---------------------------- Import/Export ------------------------- */

    exportAll() {
      const banks = {};
      for (const document of this.state.documents) {
        const bank = this.getBank(document.id);
        if (bank) banks[document.id] = bank;
      }
      return {
        app: 'quiz-master',
        version: VERSION,
        exportedAt: Date.now(),
        state: this.state,
        banks
      };
    }

    importAll(payload) {
      if (!payload || payload.app !== 'quiz-master' || !payload.state) {
        throw new Error('Fichier de sauvegarde invalide.');
      }
      const incoming = payload.state;
      this.state = {
        ...defaultState(),
        ...incoming,
        counters: { ...defaultState().counters, ...(incoming.counters || {}) },
        settings: { ...defaultState().settings, ...(incoming.settings || {}) },
        documents: Array.isArray(incoming.documents) ? incoming.documents : [],
        quizzes: Array.isArray(incoming.quizzes) ? incoming.quizzes : [],
        recent: Array.isArray(incoming.recent) ? incoming.recent : [],
        questionStats: incoming.questionStats || {}
      };
      if (payload.banks && typeof payload.banks === 'object') {
        for (const [documentId, bank] of Object.entries(payload.banks)) {
          this.saveBank(documentId, bank);
        }
      }
      this.persist();
      return true;
    }

    resetProgress() {
      this.state.questionStats = {};
      this.state.quizzes = [];
      this.state.recent = [];
      this.state.counters = { answered: 0, correct: 0, wrong: 0, currentStreak: 0, bestStreak: 0 };
      this.persist();
    }

    resetAll() {
      for (const document of this.state.documents) {
        this.storage.removeItem(this.bankPrefix + document.id);
      }
      this.state = defaultState();
      this.persist();
    }
  }

  return { ProgressManager, createMemoryStorage, BOX_INTERVALS, VERSION };
});
