/*
 * Quiz Master — app.js
 * Interface, navigation, import DOCX et orchestration du quiz.
 */
(function () {
  'use strict';

  const PRESET_ID = 'crt-2024';
  const QUESTIONS_PER_QUIZ = 10;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function tick() {
    return new Promise((resolve) => setTimeout(resolve, 30));
  }

  function simpleHash(input) {
    let hash = 2166136261;
    const str = String(input);
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function formatDate(timestamp) {
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
    } catch (error) {
      return new Date(timestamp).toLocaleString('fr-FR');
    }
  }

  function plural(count, singular, pluralWord) {
    return count + ' ' + (count > 1 ? pluralWord || singular + 's' : singular);
  }

  const TYPE_LABELS = {
    definition: 'Définition',
    number: 'Chiffres clés',
    date: 'Date clé',
    'list-count': 'Liste du cours',
    'list-odd': 'Liste du cours',
    'list-multi': 'Plusieurs réponses',
    acronym: 'Sigle',
    'acronym-expansion': 'Sigle',
    curated: 'Question de cours',
    ai: 'Question IA',
    general: 'Notion clé'
  };

  const App = {
    progress: null,
    banks: new Map(),
    documents: [],
    currentDocId: null,
    view: 'home',
    session: null,
    index: 0,
    answers: [],
    quizStart: 0,
    lastResult: null,
    lastResultDuration: 0,
    reviewFilter: 'all',
    lastConfig: null,
    toastTimer: null,
    importing: false
  };

  /* ====================================================================== */
  /*                               DÉMARRAGE                                */
  /* ====================================================================== */

  function init() {
    App.progress = new ProgressManager();
    ensurePreset();
    App.documents = progressDocuments();
    App.currentDocId = App.progress.state.settings.lastDocId || (App.documents[0] && App.documents[0].id) || null;
    if (App.currentDocId && !App.documents.some((doc) => doc.id === App.currentDocId)) {
      App.currentDocId = App.documents[0] ? App.documents[0].id : null;
    }

    bindEvents();
    applyTheme(App.progress.state.settings.theme || 'dark');
    if (typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-color-scheme: light)');
      const listener = () => {
        if ((App.progress.state.settings.theme || 'dark') === 'auto') applyTheme('auto');
      };
      if (media.addEventListener) media.addEventListener('change', listener);
      else if (media.addListener) media.addListener(listener);
    }
    registerServiceWorker();
    updateStoragePill();
    renderHome();
    navigate('home');

    if (!App.progress.persistent) {
      showToast('Stockage local indisponible : la progression ne sera pas conservée après fermeture.', 'error', 6000);
    }
  }

  function ensurePreset() {
    const preset = window.QUIZMASTER_PRESET;
    if (!preset) return;
    const bank = QuestionGenerator.normalizePreset(preset, PRESET_ID);
    if (!bank.chapters.length) return;
    bank.document.preloaded = true;
    App.banks.set(PRESET_ID, bank);
    if (!App.progress.hasDocument(PRESET_ID)) {
      App.progress.saveDocument(bank.document, bank.chapters);
    }
    App.documents = progressDocuments();
  }

  function progressDocuments() {
    const docs = App.progress.listDocuments();
    return docs.slice().sort((a, b) => {
      if (a.preloaded !== b.preloaded) return a.preloaded ? -1 : 1;
      return (b.importedAt || 0) - (a.importedAt || 0);
    });
  }

  function getBank(documentId) {
    if (!documentId) return null;
    if (App.banks.has(documentId)) return App.banks.get(documentId);
    if (documentId === PRESET_ID && window.QUIZMASTER_PRESET) {
      const bank = QuestionGenerator.normalizePreset(window.QUIZMASTER_PRESET, PRESET_ID);
      if (bank.chapters.length) {
        bank.document.preloaded = true;
        App.banks.set(documentId, bank);
        return bank;
      }
    }
    const stored = App.progress.getBank(documentId);
    if (stored) App.banks.set(documentId, stored);
    return stored;
  }

  function getDocumentMeta(documentId) {
    return App.documents.find((doc) => doc.id === documentId) || null;
  }

  function getCurrentBank() {
    return App.currentDocId ? getBank(App.currentDocId) : null;
  }

  function currentDocumentName(documentId) {
    const meta = getDocumentMeta(documentId || App.currentDocId);
    return meta ? meta.name : 'Cours';
  }

  /* ====================================================================== */
  /*                                NAVIGATION                              */
  /* ====================================================================== */

  function navigate(view) {
    if (view === 'quiz' && !App.session) view = 'home';
    if (view === 'results' && !App.lastResult) view = 'home';
    if (view === 'library') renderLibrary();
    if (view === 'home') renderHome();
    if (view === 'dashboard') renderDashboard();
    if (view === 'settings') renderSettings();
    if (view === 'quiz') renderQuestion();
    if (view === 'results') renderResults();

    App.view = view;
    $$('.view').forEach((section) => {
      section.hidden = section.id !== 'view-' + view;
    });
    const navTarget = view === 'quiz' || view === 'results' ? 'library' : view;
    $$('.nav-link').forEach((link) => {
      const active = link.dataset.nav === navTarget;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ====================================================================== */
  /*                                  ACCUEIL                               */
  /* ====================================================================== */

  function allQuestions() {
    const questions = [];
    for (const doc of App.documents) {
      const bank = getBank(doc.id);
      if (!bank) continue;
      questions.push(...QuizEngine.flatten(bank.chapters, doc.id));
    }
    return questions;
  }

  function countDueQuestions() {
    const now = Date.now();
    return allQuestions().filter((question) => {
      const stat = App.progress.state.questionStats[question.id];
      return stat && stat.seen > 0 && (stat.due || 0) <= now;
    }).length;
  }

  function countFailedQuestions() {
    return allQuestions().filter((question) => {
      const stat = App.progress.state.questionStats[question.id];
      return stat && (stat.wrong || 0) > 0;
    }).length;
  }

  function levelFor(stats) {
    if (stats.quizzes === 0) return 'Nouveau';
    if (stats.quizzes < 3) return 'Débutant';
    if (stats.quizzes < 8 || stats.accuracy < 60) return 'Apprenti';
    if (stats.quizzes < 15 || stats.accuracy < 82) return 'Confirmé';
    return 'Expert';
  }

  /* --------------------------- Thème et objectif ------------------------- */

  const THEMES = ['dark', 'light', 'auto'];

  function resolveTheme(theme) {
    if (theme === 'auto') {
      return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
    }
    return theme === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    const resolved = resolveTheme(theme);
    document.documentElement.dataset.theme = resolved;
    const button = $('#theme-toggle');
    if (!button) return;
    button.textContent = resolved === 'light' ? '☀' : '☾';
    button.title = 'Thème : ' + (theme === 'auto' ? 'auto (' + resolved + ')' : resolved);
    button.setAttribute('aria-label', 'Thème ' + resolved + ' — cliquer pour changer');
  }

  function cycleTheme() {
    const current = App.progress.state.settings.theme || 'dark';
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    App.progress.updateSettings({ theme: next });
    applyTheme(next);
    showToast('Thème : ' + (next === 'auto' ? 'automatique' : next === 'light' ? 'clair' : 'sombre'), 'info', 1800);
  }

  function renderGoal() {
    const card = $('#goal-card');
    if (!card) return;
    const goal = Math.max(0, Number(App.progress.state.settings.dailyGoal) || 0);
    if (!goal) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    const today = App.progress.getDailyProgress();
    const percent = Math.min(100, Math.round((today.answered / goal) * 100));
    $('#goal-bar').style.width = percent + '%';
    $('#goal-progress').setAttribute('aria-valuenow', String(percent));
    $('#goal-value').textContent = today.answered + ' / ' + goal;
    if (today.answered >= goal) {
      $('#goal-text').textContent = '🎉 Objectif atteint : ' + today.answered + ' réponses aujourd’hui (' + today.accuracy + '% de réussite).';
    } else if (today.answered > 0) {
      $('#goal-text').textContent = today.answered + ' réponse' + (today.answered > 1 ? 's' : '') +
        ' aujourd’hui · ' + today.accuracy + '% de réussite · encore ' + (goal - today.answered) + '.';
    } else {
      $('#goal-text').textContent = 'Aucune réponse aujourd’hui : lance un quiz pour démarrer.';
    }
  }

  function renderWeekChart() {
    const box = $('#week-chart');
    if (!box) return;
    clear(box);
    const days = App.progress.getWeekActivity();
    const max = Math.max(1, ...days.map((day) => day.answered));
    const total = days.reduce((sum, day) => sum + day.answered, 0);
    const totalNode = $('#week-total');
    if (totalNode) totalNode.textContent = plural(total, 'réponse');

    const labels = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
    for (const day of days) {
      const date = new Date(day.date);
      const wrap = el('div', 'week-day');
      const barWrap = el('div', 'week-bar-wrap');
      const bar = el('div', 'week-bar' + (day.answered ? '' : ' is-empty'));
      bar.style.height = Math.round((day.answered / max) * 100) + '%';
      bar.title = day.answered + ' réponse' + (day.answered > 1 ? 's' : '');
      barWrap.append(bar);
      wrap.append(
        el('span', 'week-value', String(day.answered)),
        barWrap,
        el('span', 'week-label', labels[date.getDay()])
      );
      box.append(wrap);
    }
  }

  function renderHome() {
    const stats = App.progress.getGlobalStats();
    $('#hero-accuracy').textContent = stats.accuracy + '%';
    $('#hero-quizzes').textContent = stats.quizzes;
    $('#hero-answered').textContent = stats.answered;
    $('#hero-streak').textContent = stats.bestStreak;
    $('#hero-level').textContent = levelFor(stats);
    const ring = $('#hero-ring');
    ring.style.setProperty('--value', String(stats.accuracy));

    const preset = window.QUIZMASTER_PRESET;
    const hint = $('#hero-hint');
    if (preset) {
      const bank = getBank(PRESET_ID);
      const count = bank ? bank.stats.questions : 0;
      hint.textContent = 'Cours de secourisme CRT 2024 inclus · ' + plural(count, 'question') + ' disponible' + (count > 1 ? 's' : '') + '.';
    }

    $('#stat-quizzes').textContent = stats.quizzes;
    $('#stat-accuracy').textContent = stats.accuracy + '%';
    $('#stat-seen').textContent = stats.seenQuestions;
    $('#stat-due').textContent = countDueQuestions();

    renderContinueCards();
    renderGoal();

    if (App.documents.length === 0) {
      const hintEl = $('#hero-hint');
      hintEl.textContent = 'Importe ton premier cours pour commencer.';
    }
  }

  function renderContinueCards() {
    const container = $('#home-continue');
    clear(container);

    const lastQuiz = App.progress.getRecentQuiz(1)[0];
    if (lastQuiz) {
      const card = el('article', 'continue-card');
      const eyebrow = el('p', 'continue-meta', 'Dernier quiz · ' + formatDate(lastQuiz.date));
      const title = el('h3', '', lastQuiz.chapterTitle);
      const doc = el('p', '', lastQuiz.documentName + ' — ' + lastQuiz.score + '/' + lastQuiz.total + ' (' + lastQuiz.percent + '%)');
      const foot = el('div', 'continue-foot');
      const btn = el('button', 'btn btn-primary btn-sm', 'Refaire un quiz');
      btn.type = 'button';
      btn.addEventListener('click', () => startQuiz({ docId: lastQuiz.documentId, chapterId: lastQuiz.chapterId, mode: 'normal' }));
      foot.append(btn);
      card.append(eyebrow, title, doc, foot);
      container.append(card);
    }

    const bank = getCurrentBank();
    if (bank && bank.chapters.length) {
      const progress = App.progress.getChapterProgress(bank.chapters);
      const target = progress.slice().sort((a, b) => {
        if (a.seen === 0 && b.seen > 0) return -1;
        if (b.seen === 0 && a.seen > 0) return 1;
        if (a.mastery !== b.mastery) return a.mastery - b.mastery;
        return a.seen - b.seen;
      })[0];
      const card = el('article', 'continue-card');
      const eyebrow = el('p', 'continue-meta', 'Recommander pour toi');
      const title = el('h3', '', target.title);
      const detail = el('p', '', target.seen === 0
        ? 'Nouveau chapitre à découvrir.'
        : 'Maîtrise actuelle : ' + target.mastery + '% · ' + target.errors + ' erreur(s) enregistrée(s).');
      const foot = el('div', 'continue-foot');
      const btn = el('button', 'btn btn-soft btn-sm', 'Quiz de 10 questions');
      btn.type = 'button';
      btn.addEventListener('click', () => startQuiz({ docId: bank.document.id, chapterId: target.id, mode: 'normal' }));
      const link = el('button', 'link-btn', 'Voir les chapitres →');
      link.type = 'button';
      link.addEventListener('click', () => navigate('library'));
      foot.append(btn, link);
      card.append(eyebrow, title, detail, foot);
      container.append(card);
    }

    const failed = countFailedQuestions();
    if (failed > 0) {
      const card = el('article', 'continue-card');
      const eyebrow = el('p', 'continue-meta', 'Répétition espacée');
      const title = el('h3', '', 'Réviser mes erreurs');
      const detail = el('p', '', plural(failed, 'question') + ' à retravailler en priorité.');
      const foot = el('div', 'continue-foot');
      const btn = el('button', 'btn btn-soft btn-sm', 'Lancer la révision');
      btn.type = 'button';
      btn.addEventListener('click', () => startQuiz({ docId: App.currentDocId, chapterId: 'all', mode: 'review' }));
      foot.append(btn);
      card.append(eyebrow, title, detail, foot);
      container.append(card);
    }

    if (!container.childElementCount) {
      const card = el('article', 'continue-card');
      card.append(
        el('p', 'continue-meta', 'Bienvenue'),
        el('h3', '', 'Commence par le cours de secourisme'),
        el('p', '', '10 questions par partie, correction expliquée, progression sauvegardée.')
      );
      const foot = el('div', 'continue-foot');
      const btn = el('button', 'btn btn-primary btn-sm', 'Ouvrir mes cours');
      btn.type = 'button';
      btn.addEventListener('click', () => navigate('library'));
      foot.append(btn);
      card.append(foot);
      container.append(card);
    }
  }

  /* ====================================================================== */
  /*                              BIBLIOTHÈQUE                              */
  /* ====================================================================== */

  function renderLibrary() {
    App.documents = progressDocuments();
    const select = $('#doc-select');
    clear(select);
    if (!App.documents.length) {
      const option = el('option', '', 'Aucun cours');
      option.value = '';
      select.append(option);
      select.disabled = true;
      $('#chapter-grid').replaceChildren();
      $('#doc-meta').textContent = '';
      $('#delete-doc-btn').disabled = true;
      return;
    }
    select.disabled = false;

    if (!App.currentDocId || !App.documents.some((doc) => doc.id === App.currentDocId)) {
      App.currentDocId = App.documents[0].id;
    }

    for (const doc of App.documents) {
      const option = el('option', '', doc.name + (doc.preloaded ? ' (inclus)' : ''));
      option.value = doc.id;
      select.append(option);
    }
    select.value = App.currentDocId;

    const meta = getDocumentMeta(App.currentDocId);
    const bank = getBank(App.currentDocId);
    const metaBox = $('#doc-meta');
    clear(metaBox);
    if (meta) {
      metaBox.append(
        el('span', '', plural(meta.questionCount || 0, 'question') + ' au total'),
        el('span', '', plural((meta.chapters || []).length, 'partie') + ' de cours')
      );
      if (meta.edition) metaBox.append(el('span', '', meta.edition));
      if (meta.source) metaBox.append(el('span', '', 'Source : ' + meta.source));
    }

    const deleteBtn = $('#delete-doc-btn');
    deleteBtn.disabled = !meta || !!meta.preloaded;
    deleteBtn.title = meta && meta.preloaded ? 'Le cours inclus ne peut pas être supprimé.' : 'Supprimer ce cours importé';

    const grid = $('#chapter-grid');
    clear(grid);

    if (!bank || !bank.chapters.length) {
      grid.append(el('p', 'empty-note', 'La banque de questions de ce cours est introuvable. Réimporte le document.'));
      return;
    }

    const progressList = App.progress.getChapterProgress(bank.chapters);
    const progressById = new Map(progressList.map((item) => [item.id, item]));

    progressList.forEach((info, index) => {
      const chapter = bank.chapters.find((item) => item.id === info.id);
      if (!chapter) return;
      const card = el('article', 'chapter-card');
      card.style.animationDelay = Math.min(index * 35, 280) + 'ms';

      const top = el('div', 'chapter-top');
      top.append(
        el('h3', 'chapter-title', chapter.title),
        el('span', 'chapter-count', plural(chapter.questions.length, 'question'))
      );

      const mini = el('div', 'mini-progress');
      const fill = el('span');
      fill.style.width = info.coverage + '%';
      mini.append(fill);

      const statsRow = el('div', 'chapter-stats');
      statsRow.append(el('span', '', 'Vues : ' + info.seen + '/' + info.total));
      const mastery = el('span', 'mastery-pill', 'maîtrise ' + info.mastery + '%');
      if (info.mastery === 0) mastery.classList.add('is-zero');
      else if (info.mastery < 50) mastery.classList.add('is-low');
      statsRow.append(mastery);

      const actions = el('div', 'chapter-actions');
      const quizBtn = el('button', 'btn btn-primary btn-sm', 'Quiz · 10');
      quizBtn.type = 'button';
      quizBtn.dataset.action = 'quiz';
      quizBtn.dataset.chapter = chapter.id;
      quizBtn.dataset.doc = bank.document.id;
      const reviewBtn = el('button', 'btn btn-soft btn-sm', info.errors > 0 ? 'Réviser (' + info.errors + ')' : 'Réviser');
      reviewBtn.type = 'button';
      reviewBtn.dataset.action = 'review';
      reviewBtn.dataset.chapter = chapter.id;
      reviewBtn.dataset.doc = bank.document.id;
      reviewBtn.disabled = info.errors === 0;
      if (info.errors === 0) reviewBtn.title = 'Aucune erreur enregistrée dans ce chapitre pour le moment.';
      actions.append(quizBtn, reviewBtn);

      card.append(top, mini, statsRow, actions);
      grid.append(card);
    });

    const allQuizBtn = $('#quiz-all-btn');
    allQuizBtn.disabled = !bank || !bank.chapters.length;
    allQuizBtn.dataset.doc = App.currentDocId;
  }

  /* ====================================================================== */
  /*                                  QUIZ                                  */
  /* ====================================================================== */

  function startQuiz(options = {}) {
    const docId = options.docId || App.currentDocId;
    const chapterId = options.chapterId || 'all';
    const mode = options.mode || 'normal';
    const bank = getBank(docId);

    if (!bank || !bank.chapters.length) {
      showToast('Aucune question disponible pour ce cours.', 'error');
      return;
    }

    const questions = QuizEngine.flatten(bank.chapters, docId);
    if (questions.length === 0) {
      showToast('Aucune question dans ce cours : réimporte ou régénère la banque.', 'error');
      return;
    }

    const stats = App.progress.state.questionStats;
    const recent = App.progress.state.recent;
    const settings = App.progress.state.settings || {};
    const count = Math.max(1, Math.min(50, Number(settings.quizCount) || QUESTIONS_PER_QUIZ));
    let session = null;

    try {
      if (mode === 'review') {
        session = QuizEngine.buildReviewSession(questions, stats, {
          count,
          chapterId,
          documentId: docId,
          recent
        });
        if (!session || session.delivered === 0) {
          showToast('Aucune erreur à réviser pour le moment. Lance un quiz normal !', 'info');
          return;
        }
      } else {
        session = QuizEngine.buildSession({
          questions,
          chapterId,
          count,
          stats,
          recent,
          fallbackQuestions: questions,
          documentId: docId,
          mode: 'normal'
        });
      }
    } catch (error) {
      showToast(error.message || 'Impossible de lancer le quiz.', 'error');
      return;
    }

    App.session = session;
    App.index = 0;
    App.answers = session.items.map(() => []);
    App.quizStart = Date.now();
    App.lastConfig = { docId, chapterId, mode };

    if (session.delivered < count) {
      showToast('Seulement ' + session.delivered + ' question(s) disponible(s) dans ce cours.', 'info', 5000);
    }

    navigate('quiz');
  }

  function sessionChapterTitle() {
    if (!App.session) return '';
    if (App.lastConfig && App.lastConfig.mode === 'review') return 'Révision ciblée';
    if (App.session.chapterId === 'all') return 'Toutes les parties';
    if (App.session.filledFromOtherChapters > 0) return 'Révision mixte (complétée avec d’autres parties)';
    const bank = getBank(App.session.documentId);
    const chapter = bank && bank.chapters.find((item) => item.id === App.session.chapterId);
    return chapter ? chapter.title : 'Quiz';
  }

  function renderQuestion() {
    if (!App.session) return;
    const item = App.session.items[App.index];
    if (!item) return;

    const total = App.session.delivered;
    const position = App.index + 1;
    const correctCount = (item.answerIndices || [item.answerIndex]).length;

    $('#quiz-chapter').textContent = currentDocumentName(App.session.documentId) + ' · ' + sessionChapterTitle();
    $('#quiz-counter').textContent = position + ' / ' + total;
    $('#quiz-score').textContent = correctCount > 1 ? 'Plusieurs réponses' : 'Une seule réponse';

    const progress = $('#quiz-progress');
    progress.setAttribute('aria-valuemax', String(total));
    progress.setAttribute('aria-valuenow', String(App.index));
    $('#quiz-progress-bar').style.width = ((App.index / total) * 100) + '%';

    $('#question-type').textContent = TYPE_LABELS[item.question.kind] || 'Question';
    $('#question-source').textContent = item.question.source || '';
    $('#question-text').textContent = item.question.text;
    $('#question-text').tabIndex = -1;

    const optionsBox = $('#options');
    clear(optionsBox);
    const selected = App.answers[App.index] || [];

    item.options.forEach((option, index) => {
      const button = el('button', 'option');
      button.type = 'button';
      button.dataset.index = String(index);
      const isSelected = selected.includes(index);
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      const letter = el('span', 'option-letter', String.fromCharCode(65 + index));
      const text = el('span', 'option-text', option.text);
      const check = el('span', 'option-check', '✓');
      button.append(letter, text, check);
      button.addEventListener('click', () => selectOption(index));
      optionsBox.append(button);
    });

    const hint = $('#keyboard-hint');
    hint.textContent = correctCount > 1
      ? 'Sélectionne une ou plusieurs réponses (touches 1-4), puis clique sur Suivant'
      : 'Sélectionne une réponse (touches 1-4 ou A-D), puis clique sur Suivant';

    const nextBtn = $('#next-btn');
    nextBtn.hidden = false;
    nextBtn.textContent = position === total ? 'Voir mes résultats' : 'Suivant';
    updateNextState();

    const card = $('#question-card');
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
  }

  function updateNextState() {
    const nextBtn = $('#next-btn');
    if (!nextBtn) return;
    const selected = App.answers[App.index] || [];
    nextBtn.classList.toggle('is-empty', selected.length === 0);
    nextBtn.title = selected.length === 0
      ? 'Aucune réponse sélectionnée : cette question comptera comme fausse.'
      : '';
  }

  function selectOption(index) {
    if (!App.session) return;
    const item = App.session.items[App.index];
    if (!item || index < 0 || index >= item.options.length) return;

    const current = App.answers[App.index] || [];
    const next = current.includes(index)
      ? current.filter((value) => value !== index)
      : [...current, index].sort((a, b) => a - b);
    App.answers[App.index] = next;

    $$('#options .option').forEach((button, optionIndex) => {
      const isSelected = next.includes(optionIndex);
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
    updateNextState();
  }

  function nextQuestion() {
    if (!App.session) return;
    if (App.index + 1 < App.session.delivered) {
      App.index++;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const title = $('#question-text');
      if (title) title.focus({ preventScroll: true });
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    if (!App.session) return;
    const evaluation = QuizEngine.evaluate(App.session, App.answers);
    const durationMs = Date.now() - App.quizStart;
    const bank = getBank(App.session.documentId);
    let chapterTitle = sessionChapterTitle();
    if (App.lastConfig && App.lastConfig.mode === 'review') chapterTitle = 'Révision ciblée';
    if (bank && App.session.chapterId === 'all') chapterTitle = 'Toutes les parties';

    // Les réponses sont enregistrées en une seule fois, à la fin du quiz.
    for (const detail of evaluation.details) {
      App.progress.recordAnswer(detail.question, detail.isCorrect);
    }

    App.progress.recordQuiz({
      id: App.session.id,
      date: Date.now(),
      documentId: App.session.documentId,
      documentName: currentDocumentName(App.session.documentId),
      chapterId: App.session.chapterId,
      chapterTitle,
      mode: App.lastConfig ? App.lastConfig.mode : 'normal',
      score: evaluation.correct,
      total: evaluation.total,
      percent: evaluation.percent,
      durationMs,
      questionIds: App.session.items.map((item) => item.question.id),
      wrongIds: evaluation.missed.map((result) => result.question.id)
    });

    App.lastResult = evaluation;
    App.lastResultDuration = durationMs;
    App.reviewFilter = 'all';
    navigate('results');
    const title = $('#results-title');
    if (title) title.focus({ preventScroll: true });
  }

  /* ====================================================================== */
  /*                               RÉSULTATS                                */
  /* ====================================================================== */

  function renderResults() {
    const result = App.lastResult;
    if (!result) return;

    $('#results-score').textContent = result.correct + '/' + result.total;
    $('#results-percent').textContent = result.percent + '%';
    $('#results-title').textContent = result.message.title;
    $('#results-message').textContent = result.message.detail;
    $('#results-eyebrow').textContent = result.message.emoji + ' Résultats du quiz';

    const ring = $('#score-ring');
    ring.style.setProperty('--value', String(result.percent));
    const color = result.percent >= 70 ? 'var(--green)' : result.percent >= 50 ? 'var(--gold)' : 'var(--red)';
    ring.style.background = 'conic-gradient(' + color + ' ' + result.percent + '%, rgba(255,255,255,.08) 0)';

    const kpis = $('#results-kpis');
    clear(kpis);
    const kpiData = [
      { icon: '✓', cls: 'icon-teal', value: result.correct, label: 'Bonnes réponses' },
      { icon: '✕', cls: 'icon-red', value: result.wrong, label: 'Mauvaises réponses' },
      { icon: '◎', cls: 'icon-gold', value: result.percent + '%', label: 'Taux de réussite' },
      { icon: '⏱', cls: 'icon-violet', value: formatDuration(App.lastResultDuration || 0), label: 'Durée du quiz' }
    ];
    for (const kpi of kpiData) {
      const card = el('article', 'stat-card');
      card.append(el('span', 'stat-icon ' + kpi.cls, kpi.icon));
      const body = el('div');
      body.append(el('strong', '', String(kpi.value)), el('span', '', kpi.label));
      card.append(body);
      kpis.append(card);
    }

    const details = result.details || [];
    const wrong = details.filter((detail) => !detail.isCorrect);
    $('#results-count').textContent = details.length + ' question' + (details.length > 1 ? 's' : '');
    $('#results-wrong-count').textContent = String(wrong.length);

    $$('#results-filter [data-filter]').forEach((button) => {
      const active = button.dataset.filter === App.reviewFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    renderResultsList(App.reviewFilter);

    const reviewBtn = $('#review-errors-btn');
    reviewBtn.disabled = wrong.length === 0;
    reviewBtn.title = wrong.length === 0 ? 'Aucune erreur à réviser.' : 'Relancer un quiz sur tes erreurs';
  }

  function renderResultsList(filter) {
    const result = App.lastResult;
    if (!result) return;
    const list = $('#results-list');
    if (!list) return;
    clear(list);

    const details = result.details || [];
    const visible = filter === 'wrong' ? details.filter((detail) => !detail.isCorrect) : details;

    $('#results-empty').hidden = visible.length !== 0;
    if (visible.length === 0) {
      $('#results-empty').textContent = '🎉 Aucune erreur : toutes les réponses étaient justes.';
      return;
    }

    visible.forEach((detail) => {
      const index = details.indexOf(detail);
      const item = el('article', 'review-item ' + (detail.isCorrect ? 'is-correct' : 'is-wrong'));

      const head = el('div', 'review-head');
      head.append(el('span', 'review-index', 'Question ' + (index + 1)));
      head.append(el('span', 'review-status', detail.isCorrect ? '✓ Correct' : '✕ Incorrect'));
      if (detail.question.source) head.append(el('span', 'review-source', detail.question.source));
      item.append(head);

      item.append(el('p', 'review-q', detail.question.text));

      const options = el('ul', 'review-options');
      detail.options.forEach((option, optionIndex) => {
        const isCorrect = (detail.answerIndices || []).includes(optionIndex);
        const isChosen = (detail.chosenIndices || []).includes(optionIndex);
        const line = el('li', 'review-option');
        if (isCorrect) line.classList.add('is-correct');
        if (isChosen) line.classList.add('is-chosen');
        if (isChosen && !isCorrect) line.classList.add('is-missed');
        line.append(el('span', 'option-letter', String.fromCharCode(65 + optionIndex)));
        line.append(el('span', 'option-text', option.text));
        if (isCorrect) line.append(el('span', 'review-tag is-good', 'Bonne réponse'));
        else if (isChosen) line.append(el('span', 'review-tag is-bad', 'Ton choix'));
        options.append(line);
      });
      item.append(options);

      const answers = el('div', 'review-answers');
      const chosenText = detail.chosenTexts && detail.chosenTexts.length
        ? detail.chosenTexts.join(' · ')
        : 'Aucune réponse';
      const correctText = detail.correctTexts && detail.correctTexts.length
        ? detail.correctTexts.join(' · ')
        : '—';
      const chosenLine = el('p', 'answer-line ' + (detail.isCorrect ? 'is-good' : 'is-bad'));
      chosenLine.append(el('strong', '', 'Ta réponse : '), document.createTextNode(chosenText));
      const correctLine = el('p', 'answer-line is-good');
      correctLine.append(el('strong', '', detail.correctTexts.length > 1 ? 'Bonnes réponses : ' : 'Bonne réponse : '), document.createTextNode(correctText));
      answers.append(chosenLine, correctLine);
      item.append(answers);

      if (detail.question.explanation) {
        item.append(el('p', 'review-explanation', detail.question.explanation));
      }

      list.append(item);
    });
  }

  function formatDuration(ms) {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return seconds + ' s';
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return minutes + ' min ' + rest + ' s';
  }

  /* ====================================================================== */
  /*                                PROGRESSION                             */
  /* ====================================================================== */

  function renderDashboard() {
    App.documents = progressDocuments();
    const stats = App.progress.getGlobalStats();
    const due = countDueQuestions();
    const failed = countFailedQuestions();

    const statsBox = $('#dashboard-stats');
    clear(statsBox);
    const kpis = [
      { icon: '✓', cls: 'icon-teal', value: stats.accuracy + '%', label: 'Taux de réussite global' },
      { icon: '◎', cls: 'icon-red', value: stats.quizzes, label: 'Quiz terminés' },
      { icon: '✦', cls: 'icon-gold', value: stats.answered, label: 'Réponses données' },
      { icon: '↻', cls: 'icon-violet', value: due, label: 'À réviser aujourd’hui' }
    ];
    for (const kpi of kpis) {
      const card = el('article', 'stat-card');
      card.append(el('span', 'stat-icon ' + kpi.cls, kpi.icon));
      const body = el('div');
      body.append(el('strong', '', String(kpi.value)), el('span', '', kpi.label));
      card.append(body);
      statsBox.append(card);
    }

    renderWeekChart();

    const bank = getCurrentBank();
    const docMeta = getDocumentMeta(App.currentDocId);    $('#dash-doc-name').textContent = docMeta ? docMeta.name : 'Aucun cours';

    const masteryList = $('#mastery-list');
    clear(masteryList);
    if (bank && bank.chapters.length) {
      const progressList = App.progress.getChapterProgress(bank.chapters);
      for (const info of progressList) {
        const item = el('div', 'mastery-item');
        const top = el('div', 'mastery-top');
        top.append(el('span', '', info.title), el('em', '', info.mastery + '% · ' + info.seen + '/' + info.total + ' vues'));
        const mini = el('div', 'mini-progress');
        const fill = el('span');
        fill.style.width = info.mastery + '%';
        fill.style.background = info.mastery >= 70
          ? 'linear-gradient(90deg, var(--teal), var(--green))'
          : info.mastery >= 40
            ? 'linear-gradient(90deg, var(--gold), #ff9a62)'
            : 'linear-gradient(90deg, var(--accent), var(--gold))';
        mini.append(fill);
        item.append(top, mini);
        masteryList.append(item);
      }
    } else {
      masteryList.append(el('p', 'empty-note', 'Aucun chapitre disponible.'));
    }

    const difficultList = $('#difficult-list');
    clear(difficultList);
    const questions = bank ? QuizEngine.flatten(bank.chapters, bank.document.id) : [];
    const difficult = App.progress.getDifficultQuestions(questions, 6);
    $('#difficult-count').textContent = String(difficult.length);
    if (difficult.length === 0) {
      difficultList.append(el('p', 'empty-note', failed === 0
        ? 'Aucune notion difficile pour l’instant : termine un quiz pour obtenir un diagnostic.'
        : 'Aucune notion difficile dans ce cours.'));
    } else {
      for (const entry of difficult) {
        const item = el('div', 'difficult-item');
        item.append(el('p', '', entry.question.text));
        const meta = el('div', 'difficult-meta');
        meta.append(
          el('span', '', entry.question.source || entry.question.chapterTitle || ''),
          el('span', 'rate', Math.round(entry.errorRate * 100) + '% d’erreurs')
        );
        item.append(meta);
        difficultList.append(item);
      }
    }

    const history = App.progress.getRecentQuiz(12);
    const body = $('#history-body');
    clear(body);
    $('#history-count').textContent = String(history.length);
    $('#history-empty').hidden = history.length > 0;
    for (const quiz of history) {
      const row = el('tr');
      row.append(el('td', '', formatDate(quiz.date)));
      row.append(el('td', '', (quiz.documentName || 'Cours') + ' — ' + (quiz.chapterTitle || 'Toutes les parties')));
      row.append(el('td', 'score-cell', quiz.score + '/' + quiz.total));
      const percentCell = el('td', quiz.percent >= 70 ? 'pct-good' : quiz.percent >= 50 ? 'pct-mid' : 'pct-low', quiz.percent + '%');
      row.append(percentCell);
      body.append(row);
    }

    const reviewBtn = $('#dash-review-errors');
    reviewBtn.disabled = failed === 0;
    reviewBtn.title = failed === 0 ? 'Aucune erreur enregistrée.' : 'Réviser les questions échouées';
  }

  /* ====================================================================== */
  /*                                 RÉGLAGES                               */
  /* ====================================================================== */

  function currentAiEndpoint() {
    const settings = App.progress.state.settings;
    if (settings.aiMode === 'opencode') {
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        return location.origin + '/api/generate';
      }
      return 'http://localhost:8787/api/generate';
    }
    return settings.aiEndpoint || '';
  }

  function setAiStatus(message, type) {
    const box = $('#ai-status');
    if (!box) return;
    box.className = 'ai-status-box' + (type ? ' is-' + type : '');
    box.textContent = message;
  }

  function syncAiFields() {
    const mode = $('#ai-mode') ? $('#ai-mode').value : 'local';
    const proxy = $('#ai-proxy-fields');
    const opencode = $('#ai-opencode-fields');
    if (proxy) proxy.hidden = mode !== 'proxy';
    if (opencode) opencode.hidden = mode !== 'opencode';
  }

  function renderSettings() {
    const settings = App.progress.state.settings;
    $('#ai-mode').value = settings.aiMode || 'local';
    $('#ai-endpoint').value = settings.aiEndpoint || '';
    $('#ai-enabled').checked = !!settings.aiEnabled;
    $('#quiz-count').value = String(settings.quizCount || 10);
    $('#daily-goal').value = String(settings.dailyGoal === undefined ? 20 : settings.dailyGoal);
    syncAiFields();
    updateStorageMeter();

    if (settings.aiMode === 'opencode') {
      loadAiStatus();
    } else if (settings.aiMode === 'proxy') {
      setAiStatus(settings.aiEnabled
        ? 'Mode proxy activé : les imports tenteront d’enrichir la banque via ton proxy.'
        : 'Mode proxy configuré mais désactivé.', '');
    } else {
      setAiStatus('Mode local actif : toutes les questions sont générées dans le navigateur, sans réseau.', '');
    }
  }

  async function loadAiStatus() {
    setAiStatus('Recherche du serveur local…', '');
    try {
      const response = await fetch('/api/ai/status', { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const opencode = data.opencode || {};
      const models = Array.isArray(opencode.models) ? opencode.models : [];
      const select = $('#ai-model');
      if (select) {
        const saved = App.progress.state.settings.aiModel || data.model || '';
        clear(select);
        if (models.length) {
          for (const model of models) {
            const option = el('option', '', model);
            option.value = model;
            select.append(option);
          }
          select.value = models.includes(saved) ? saved : models[0];
        } else {
          const option = el('option', '', saved || 'Modèle par défaut d’opencode');
          option.value = saved;
          select.append(option);
        }
      }

      if (opencode.installed) {
        setAiStatus(
          'opencode détecté (v' + (opencode.version || '?') + ') · modèle du serveur : ' +
          (data.model || 'défaut') + ' · aucune clé API requise.',
          'ok'
        );
      } else {
        setAiStatus(
          'Serveur local joignable, mais opencode est introuvable' +
          (opencode.error ? ' : ' + opencode.error : '.') +
          ' Installe-le ou choisis un autre moteur.',
          'error'
        );
      }
    } catch (error) {
      setAiStatus(
        'Serveur local injoignable. Lance « node server/server.js » puis recharge la page. ' +
        (error.message || ''),
        'error'
      );
    }
  }

  function updateStorageMeter() {
    let bytes = 0;
    try {
      if (App.progress.persistent) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key || !key.startsWith(App.progress.key)) continue;
          const value = localStorage.getItem(key) || '';
          bytes += (key.length + value.length) * 2;
        }
      }
    } catch (error) {
      bytes = 0;
    }
    const kb = bytes / 1024;
    const limitKb = 5 * 1024;
    const percent = Math.min(100, Math.round((kb / limitKb) * 100));
    $('#storage-usage').textContent = App.progress.persistent
      ? (kb < 1024 ? Math.round(kb) + ' Ko / ~5 Mo' : (kb / 1024).toFixed(1) + ' Mo / ~5 Mo')
      : 'Non disponible';
    const bar = $('#storage-bar');
    bar.style.width = percent + '%';
    bar.style.background = percent > 85
      ? 'linear-gradient(90deg, var(--red), var(--gold))'
      : 'linear-gradient(90deg, var(--accent), var(--gold))';
  }

  function updateStoragePill() {
    const pill = $('#storage-pill');
    if (!App.progress.persistent) {
      pill.textContent = 'Mémoire';
      pill.classList.add('is-memory');
      pill.title = 'localStorage indisponible : la progression sera perdue à la fermeture.';
    } else {
      pill.textContent = 'Local';
      pill.classList.remove('is-memory');
      pill.title = 'Progression sauvegardée dans ce navigateur.';
    }
  }

  /* ====================================================================== */
  /*                                 IMPORT                                 */
  /* ====================================================================== */

  async function handleFiles(fileList) {
    if (App.importing) return;
    const files = Array.from(fileList || []);
    if (!files.length) return;

    App.importing = true;
    const dropzone = $('#dropzone');
    dropzone.classList.add('is-busy');

    let imported = 0;
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const prefix = files.length > 1 ? '(' + (i + 1) + '/' + files.length + ') ' : '';
      setDropzoneStatus(prefix + 'Lecture de ' + file.name + '…');
      try {
        const done = await importOne(file, prefix);
        if (done) imported++;
      } catch (error) {
        console.error(error);
        errors.push(file.name + ' : ' + (error.message || 'erreur inconnue'));
      }
    }

    App.importing = false;
    dropzone.classList.remove('is-busy');
    $('#file-input').value = '';

    if (imported > 0) {
      setDropzoneStatus(imported + (imported > 1 ? ' cours importés.' : ' cours importé.'));
      App.documents = progressDocuments();
      App.currentDocId = App.progress.state.settings.lastDocId || App.currentDocId;
      navigate('library');
      showToast(imported > 1 ? imported + ' cours importés avec succès.' : 'Cours importé : banque de questions prête.', 'success');
    }
    if (errors.length) {
      setDropzoneStatus('Erreur : ' + errors.join(' · '));
      showToast(errors[0], 'error', 7000);
    }
  }

  function setDropzoneStatus(message) {
    const status = $('#dropzone-status');
    if (status) status.textContent = message;
  }

  async function importOne(file, prefix) {
    const documentId = 'doc_' + simpleHash(file.name + '|' + (file.size || 0) + '|' + (file.lastModified || 0));
    const documentName = file.name.replace(/\.(docx|txt|md)$/i, '');

    if (App.progress.hasDocument(documentId)) {
      const replace = window.confirm('« ' + documentName + ' » est déjà importé. Remplacer sa banque de questions ?');
      if (!replace) return false;
    }

    const extracted = await DocxReader.readFile(file, { mammoth: window.mammoth });
    setDropzoneStatus(prefix + 'Génération des questions…');
    await tick();

    const bank = QuestionGenerator.generate(extracted.text, {
      documentId,
      documentName,
      maxPerChapter: 30
    });

    if (!bank.chapters.length || bank.stats.questions === 0) {
      throw new Error('Impossible de générer des questions : le cours est trop court ou mal structuré.');
    }

    // Enrichissement IA optionnel (proxy sécurisé, jamais de clé côté client).
    const settings = App.progress.state.settings;
    if (settings.aiEnabled && settings.aiMode !== 'local') {
      const endpoint = currentAiEndpoint();
      if (endpoint) {
        setDropzoneStatus(prefix + 'Enrichissement IA en cours… (peut prendre 1 à 2 min)');
        await enrichWithAi(bank, extracted.text, endpoint, settings.aiModel);
      }
    }

    setDropzoneStatus(prefix + 'Enregistrement…');
    await tick();

    const stored = App.progress.saveBank(documentId, bank);
    if (!stored) {
      showToast('Banque trop volumineuse pour le stockage local : elle reste utilisable jusqu’à la fermeture.', 'error', 7000);
    }
    App.banks.set(documentId, bank);
    App.progress.saveDocument(bank.document, bank.chapters);
    App.progress.updateSettings({ lastDocId: documentId });
    App.currentDocId = documentId;

    if (bank.stats.questions < 10) {
      showToast('Seulement ' + bank.stats.questions + ' questions générées : ajoute du contenu ou active l’IA.', 'info', 6000);
    }
    return true;
  }

  async function enrichWithAi(bank, text, endpoint, model) {
    try {
      const chaptersWithContent = QuestionGenerator.splitChapters(text);
      if (!chaptersWithContent.length) return;
      let added = 0;
      const limit = Math.min(4, bank.chapters.length, chaptersWithContent.length);

      for (let i = 0; i < limit; i++) {
        const target = bank.chapters[i];
        const source = chaptersWithContent[i];
        if (!target || !source) continue;
        try {
          const generated = await AIProvider.generate({
            endpoint,
            text: source.content.slice(0, 11000),
            count: 10,
            chapterTitle: target.title,
            model: model || '',
            timeout: 180000
          });
          const existing = new Set(target.questions.map((q) => q.text.toLowerCase()));
          for (const question of generated) {
            if (existing.has(question.text.toLowerCase())) continue;
            const id = QuestionGenerator.makeQuestionId(bank.document.id, target.id, question.text);
            target.questions.push({
              id,
              text: question.text,
              options: question.options,
              answer: question.answer,
              answers: question.answers,
              explanation: question.explanation,
              source: question.source || target.title,
              kind: 'ai',
              generated: true
            });
            existing.add(question.text.toLowerCase());
            added++;
          }
        } catch (error) {
          console.warn('IA indisponible pour « ' + target.title + ' » :', error.message);
        }
      }

      if (added > 0) {
        bank.stats.questions = bank.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
        showToast(plural(added, 'question') + ' ajoutée(s) par l’IA.', 'success');
      }
    } catch (error) {
      console.warn('Enrichissement IA ignoré :', error);
      showToast('IA indisponible : le quiz local reste complet. ' + error.message, 'info', 6000);
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((error) => {
        console.warn('Service worker non enregistré :', error.message);
      });
    });
  }

  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function csvCell(value) {
    return '"' + String(value === undefined || value === null ? '' : value).replace(/"/g, '""') + '"';
  }

  function exportQuestions(format) {
    const bank = getCurrentBank();
    if (!bank || !bank.chapters.length) {
      setStatus('#data-status', 'Aucun cours actif à exporter.', 'error');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    const base = (bank.document.name || 'quiz-master').replace(/[^\w\-]+/g, '-').slice(0, 50);
    const rows = [];

    if (format === 'anki') {
      for (const chapter of bank.chapters) {
        for (const question of chapter.questions) {
          const correct = QuizEngine.correctIndices(question)
            .map((index) => String.fromCharCode(65 + index))
            .join(', ');
          const front = question.text + '<br>' +
            question.options.map((option, index) => String.fromCharCode(65 + index) + '. ' + option).join('<br>');
          const back = 'Réponse : ' + correct + (question.explanation ? '<br><br>' + question.explanation : '');
          rows.push(front + '\t' + back);
        }
      }
      downloadFile('quizmaster-anki-' + date + '.txt', rows.join('\n'), 'text/tab-separated-values;charset=utf-8');
      setStatus('#data-status', rows.length + ' question(s) exportée(s) pour Anki.', 'ok');
      return;
    }

    rows.push(['Chapitre', 'Question', 'A', 'B', 'C', 'D', 'Réponses', 'Explication', 'Référence'].map(csvCell).join(','));
    for (const chapter of bank.chapters) {
      for (const question of chapter.questions) {
        const correct = QuizEngine.correctIndices(question)
          .map((index) => String.fromCharCode(65 + index))
          .join(' ');
        rows.push([
          chapter.title,
          question.text,
          question.options[0],
          question.options[1],
          question.options[2],
          question.options[3],
          correct,
          question.explanation || '',
          question.source || ''
        ].map(csvCell).join(','));
      }
    }
    // BOM UTF-8 pour qu'Excel affiche correctement les accents.
    downloadFile('quizmaster-questions-' + date + '.csv', '\ufeff' + rows.join('\r\n'), 'text/csv;charset=utf-8');
    setStatus('#data-status', (rows.length - 1) + ' question(s) exportée(s) en CSV.', 'ok');
  }

  /* ====================================================================== */
  /*                          EXPORT / IMPORT SAUVEGARDE                    */
  /* ====================================================================== */

  function exportProgress() {
    try {
      const payload = App.progress.exportAll();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = 'quizmaster-sauvegarde-' + date + '.json';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setStatus('#data-status', 'Sauvegarde exportée.', 'ok');
    } catch (error) {
      setStatus('#data-status', 'Export impossible : ' + error.message, 'error');
    }
  }

  async function importBackup(file) {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      App.progress.importAll(payload);
      App.banks.clear();
      ensurePreset();
      App.documents = progressDocuments();
      App.currentDocId = App.progress.state.settings.lastDocId || (App.documents[0] && App.documents[0].id) || null;
      renderSettings();
      renderHome();
      setStatus('#data-status', 'Sauvegarde restaurée avec succès.', 'ok');
      showToast('Progression restaurée.', 'success');
    } catch (error) {
      setStatus('#data-status', 'Restauration impossible : ' + error.message, 'error');
    }
  }

  function setStatus(selector, message, type) {
    const node = $(selector);
    if (!node) return;
    node.textContent = message;
    node.className = 'hint' + (type ? ' is-' + type : '');
  }

  /* ====================================================================== */
  /*                                  TOAST                                 */
  /* ====================================================================== */

  function showToast(message, type, duration) {
    const toast = $('#toast');
    if (!toast) return;
    clearTimeout(App.toastTimer);
    toast.textContent = message;
    toast.className = 'toast is-visible' + (type ? ' is-' + type : '');
    toast.hidden = false;
    App.toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => { toast.hidden = true; }, 300);
    }, duration || 3800);
  }

  /* ====================================================================== */
  /*                                 ÉVÉNEMENTS                             */
  /* ====================================================================== */

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const nav = event.target.closest('[data-nav]');
      if (nav) {
        event.preventDefault();
        navigate(nav.dataset.nav);
      }
    });

    $('#top-import-btn').addEventListener('click', openFilePicker);
    $('#hero-import').addEventListener('click', openFilePicker);
    $('#library-import-btn').addEventListener('click', openFilePicker);
    $('#hero-start').addEventListener('click', () => navigate('library'));

    const dropzone = $('#dropzone');
    const fileInput = $('#file-input');
    dropzone.addEventListener('click', openFilePicker);
    dropzone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openFilePicker();
      }
    });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    ['dragenter', 'dragover'].forEach((type) => {
      dropzone.addEventListener(type, (event) => {
        event.preventDefault();
        dropzone.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach((type) => {
      dropzone.addEventListener(type, (event) => {
        event.preventDefault();
        dropzone.classList.remove('is-dragover');
      });
    });
    dropzone.addEventListener('drop', (event) => {
      if (event.dataTransfer && event.dataTransfer.files) handleFiles(event.dataTransfer.files);
    });

    $('#doc-select').addEventListener('change', (event) => {
      App.currentDocId = event.target.value;
      App.progress.updateSettings({ lastDocId: App.currentDocId });
      renderLibrary();
    });

    $('#chapter-grid').addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const docId = button.dataset.doc || App.currentDocId;
      const chapterId = button.dataset.chapter || 'all';
      startQuiz({ docId, chapterId, mode: button.dataset.action === 'review' ? 'review' : 'normal' });
    });

    $('#quiz-all-btn').addEventListener('click', () => {
      startQuiz({ docId: $('#quiz-all-btn').dataset.doc || App.currentDocId, chapterId: 'all', mode: 'normal' });
    });

    $('#delete-doc-btn').addEventListener('click', () => {
      const meta = getDocumentMeta(App.currentDocId);
      if (!meta || meta.preloaded) return;
      if (!window.confirm('Supprimer « ' + meta.name + ' » et sa banque de questions ? Les statistiques associées resteront dans l’historique.')) return;
      App.progress.removeDocument(meta.id);
      App.banks.delete(meta.id);
      App.documents = progressDocuments();
      App.currentDocId = App.documents[0] ? App.documents[0].id : null;
      App.progress.updateSettings({ lastDocId: App.currentDocId });
      renderLibrary();
      showToast('Cours supprimé.', 'success');
    });

    $('#quit-quiz').addEventListener('click', () => {
      if (!window.confirm('Quitter le quiz en cours ? Les réponses de cette session ne seront pas enregistrées.')) return;
      App.session = null;
      navigate('library');
    });

    $('#options').addEventListener('click', (event) => {
      const button = event.target.closest('.option');
      if (!button) return;
      selectOption(Number(button.dataset.index));
    });

    $('#next-btn').addEventListener('click', nextQuestion);

    const filterBox = $('#results-filter');
    if (filterBox) {
      filterBox.addEventListener('click', (event) => {
        const button = event.target.closest('[data-filter]');
        if (!button) return;
        App.reviewFilter = button.dataset.filter;
        $$('#results-filter [data-filter]').forEach((item) => {
          const active = item.dataset.filter === App.reviewFilter;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        renderResultsList(App.reviewFilter);
      });
    }

    $('#restart-btn').addEventListener('click', () => {
      if (!App.lastConfig) return;
      startQuiz({ docId: App.lastConfig.docId, chapterId: App.lastConfig.chapterId, mode: 'normal' });
    });

    $('#review-errors-btn').addEventListener('click', () => {
      if (!App.lastConfig) return;
      startQuiz({ docId: App.lastConfig.docId, chapterId: 'all', mode: 'review' });
    });

    $('#dash-review-errors').addEventListener('click', () => {
      startQuiz({ docId: App.currentDocId, chapterId: 'all', mode: 'review' });
    });

    $('#save-settings-btn').addEventListener('click', () => {
      const mode = $('#ai-mode').value;
      const endpoint = $('#ai-endpoint').value.trim();
      const enabled = $('#ai-enabled').checked;
      const model = $('#ai-model') ? $('#ai-model').value : '';
      const quizCount = Math.max(1, Math.min(50, Number($('#quiz-count').value) || 10));
      const dailyGoal = Math.max(0, Math.min(200, Number($('#daily-goal').value) || 0));

      if (enabled && mode === 'proxy' && !endpoint) {
        setAiStatus('Renseigne un point d’API avant d’activer le proxy.', 'error');
        return;
      }
      if (enabled && mode === 'proxy' && !/^https?:\/\//i.test(endpoint)) {
        setAiStatus('Le point d’API doit commencer par http:// ou https://.', 'error');
        return;
      }
      if (enabled && mode === 'opencode' && location.protocol === 'file:') {
        setAiStatus('Le mode opencode nécessite le serveur local : ouvre l’application via http://localhost:8787.', 'error');
        return;
      }

      App.progress.updateSettings({
        aiMode: mode,
        aiEndpoint: endpoint,
        aiModel: model,
        aiEnabled: enabled,
        quizCount,
        dailyGoal
      });
      syncAiFields();
      renderGoal();
      if (mode === 'opencode') {
        loadAiStatus();
      } else {
        setAiStatus('Réglages enregistrés.', 'ok');
      }
      showToast('Réglages enregistrés.', 'success');
    });

    $('#ai-mode').addEventListener('change', () => {
      syncAiFields();
      if ($('#ai-mode').value === 'opencode') loadAiStatus();
    });

    $('#theme-toggle').addEventListener('click', cycleTheme);

    $('#test-ai-btn').addEventListener('click', testAiConnection);

    $('#export-btn').addEventListener('click', exportProgress);
    $('#export-csv-btn').addEventListener('click', () => exportQuestions('csv'));
    $('#export-anki-btn').addEventListener('click', () => exportQuestions('anki'));
    $('#import-backup-btn').addEventListener('click', () => $('#backup-input').click());
    $('#backup-input').addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) importBackup(file);
      event.target.value = '';
    });

    $('#reset-stats-btn').addEventListener('click', () => {
      if (!window.confirm('Réinitialiser toutes les statistiques et l’historique ? Les cours importés seront conservés.')) return;
      App.progress.resetProgress();
      renderHome();
      renderSettings();
      setStatus('#data-status', 'Statistiques réinitialisées.', 'ok');
      showToast('Statistiques réinitialisées.', 'success');
    });

    $('#reset-all-btn').addEventListener('click', () => {
      if (!window.confirm('Tout effacer (cours importés, banques, statistiques) ? Cette action est irréversible.')) return;
      App.progress.resetAll();
      App.banks.clear();
      ensurePreset();
      App.documents = progressDocuments();
      App.currentDocId = App.documents[0] ? App.documents[0].id : null;
      renderSettings();
      renderHome();
      setStatus('#data-status', 'Toutes les données ont été effacées.', 'ok');
      showToast('Données effacées. Le cours inclus reste disponible.', 'success');
    });

    document.addEventListener('keydown', handleKeyboard);
  }

  function openFilePicker() {
    const input = $('#file-input');
    if (input) input.click();
  }

  function handleKeyboard(event) {
    if (App.view !== 'quiz' || !App.session) return;
    const target = event.target;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

    if (/^[1-4]$/.test(event.key)) {
      event.preventDefault();
      selectOption(Number(event.key) - 1);
      return;
    }
    if (/^[a-dA-D]$/.test(event.key)) {
      event.preventDefault();
      selectOption(event.key.toLowerCase().charCodeAt(0) - 97);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      nextQuestion();
    }
  }

  async function testAiConnection() {
    const mode = $('#ai-mode') ? $('#ai-mode').value : 'local';
    if (mode === 'opencode') {
      await loadAiStatus();
      return;
    }
    if (mode === 'local') {
      setAiStatus('Mode local : aucune connexion nécessaire, tout fonctionne hors ligne.', 'ok');
      return;
    }

    const endpoint = $('#ai-endpoint').value.trim();
    if (!endpoint) {
      setAiStatus('Renseigne d’abord le point d’API.', 'error');
      return;
    }
    setAiStatus('Test de connexion…', '');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '', count: 5 })
      });
      // Un proxy joignable répond 400/422 à un texte vide : c'est suffisant.
      if (response.status < 500) {
        setAiStatus('Proxy joignable (HTTP ' + response.status + '). Le mode IA peut être activé.', 'ok');
      } else {
        setAiStatus('Le proxy répond avec une erreur ' + response.status + '. Vérifie la clé API côté serveur.', 'error');
      }
    } catch (error) {
      setAiStatus('Connexion impossible : ' + (error.message || 'réseau indisponible') + '.', 'error');
    }
  }

  /* ====================================================================== */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API minimale exposée pour les tests d'intégration headless.
  window.QuizMasterApp = {
    state: App,
    navigate,
    startQuiz,
    getBank
  };
})();
