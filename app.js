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
    selected: null,
    answered: false,
    quizStart: 0,
    quizCorrect: 0,
    lastResult: null,
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
    let session = null;

    try {
      if (mode === 'review') {
        session = QuizEngine.buildReviewSession(questions, stats, {
          count: QUESTIONS_PER_QUIZ,
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
          count: QUESTIONS_PER_QUIZ,
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
    App.answers = new Array(session.items.length).fill(null);
    App.selected = null;
    App.answered = false;
    App.quizStart = Date.now();
    App.quizCorrect = 0;
    App.lastConfig = { docId, chapterId, mode };

    if (session.delivered < QUESTIONS_PER_QUIZ) {
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

    $('#quiz-chapter').textContent = currentDocumentName(App.session.documentId) + ' · ' + sessionChapterTitle();
    $('#quiz-counter').textContent = position + ' / ' + total;
    $('#quiz-score').textContent = App.quizCorrect + (App.quizCorrect === 1 ? ' bonne réponse' : ' bonnes réponses');

    const progress = $('#quiz-progress');
    progress.setAttribute('aria-valuemax', String(total));
    progress.setAttribute('aria-valuenow', String(App.index));
    $('#quiz-progress-bar').style.width = ((App.index / total) * 100) + '%';

    $('#question-type').textContent = TYPE_LABELS[item.question.kind] || 'Question';
    $('#question-source').textContent = item.question.source || '';
    $('#question-text').textContent = item.question.text;

    const optionsBox = $('#options');
    clear(optionsBox);

    item.options.forEach((option, index) => {
      const button = el('button', 'option');
      button.type = 'button';
      button.dataset.index = String(index);
      button.setAttribute('aria-pressed', 'false');
      const letter = el('span', 'option-letter', String.fromCharCode(65 + index));
      const text = el('span', 'option-text', option.text);
      button.append(letter, text);
      button.addEventListener('click', () => selectOption(index));
      optionsBox.append(button);
    });

    const feedback = $('#feedback');
    feedback.hidden = true;
    feedback.className = 'feedback';
    clear(feedback);

    const validateBtn = $('#validate-btn');
    validateBtn.hidden = false;
    validateBtn.disabled = true;
    const nextBtn = $('#next-btn');
    nextBtn.hidden = true;
    nextBtn.textContent = position === total ? 'Voir mes résultats' : 'Question suivante';

    App.selected = null;
    App.answered = false;

    const card = $('#question-card');
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
  }

  function selectOption(index) {
    if (App.answered || !App.session) return;
    const items = App.session.items[App.index];
    if (!items || index < 0 || index >= items.options.length) return;
    App.selected = index;
    $$('#options .option').forEach((button, optionIndex) => {
      const isSelected = optionIndex === index;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
    $('#validate-btn').disabled = false;
  }

  function validateAnswer() {
    if (App.answered || !App.session || App.selected === null) return;
    const item = App.session.items[App.index];
    const chosen = App.selected;
    const isCorrect = chosen === item.answerIndex;

    App.answered = true;
    App.answers[App.index] = chosen;
    if (isCorrect) App.quizCorrect++;

    $$('#options .option').forEach((button, index) => {
      button.disabled = true;
      button.classList.remove('is-selected');
      if (index === item.answerIndex) button.classList.add('is-correct');
      else if (index === chosen) button.classList.add('is-wrong');
      else button.classList.add('is-dimmed');
      button.setAttribute('aria-pressed', index === chosen ? 'true' : 'false');
    });

    const feedback = $('#feedback');
    feedback.className = 'feedback ' + (isCorrect ? 'is-correct' : 'is-wrong');
    clear(feedback);

    const head = el('div', 'feedback-head');
    head.append(el('span', '', isCorrect ? '✓' : '✕'), el('span', '', isCorrect ? 'Bonne réponse !' : 'Réponse incorrecte'));
    const explanation = el('p', '', item.question.explanation || 'Aucune explication disponible pour cette question.');
    if (!isCorrect) {
      explanation.prepend(el('span', 'correct-answer', 'Bonne réponse : ' + item.options[item.answerIndex].text + '. '));
    }
    feedback.append(head, explanation);
    if (item.question.source) feedback.append(el('span', 'feedback-source', 'Référence : ' + item.question.source));
    feedback.hidden = false;

    App.progress.recordAnswer(item.question, isCorrect);

    $('#quiz-score').textContent = App.quizCorrect + (App.quizCorrect === 1 ? ' bonne réponse' : ' bonnes réponses');
    $('#quiz-progress').setAttribute('aria-valuenow', String(App.index + 1));
    $('#quiz-progress-bar').style.width = (((App.index + 1) / App.session.delivered) * 100) + '%';
    $('#validate-btn').hidden = true;
    const nextBtn = $('#next-btn');
    nextBtn.hidden = false;
    nextBtn.textContent = App.index + 1 === App.session.delivered ? 'Voir mes résultats' : 'Question suivante';
    nextBtn.focus({ preventScroll: true });
  }

  function nextQuestion() {
    if (!App.session) return;
    if (!App.answered) return;
    if (App.index + 1 < App.session.delivered) {
      App.index++;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    navigate('results');
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

    $('#missed-count').textContent = plural(result.missed.length, 'question');
    const list = $('#missed-list');
    clear(list);
    $('#missed-empty').hidden = result.missed.length !== 0;

    for (const detail of result.missed) {
      const item = el('article', 'missed-item');
      item.append(el('p', 'missed-q', detail.question.text));

      const chosen = detail.chosen === null ? 'Aucune réponse' : detail.options[detail.chosen].text;
      const badLine = el('p', 'answer-line is-bad');
      badLine.append(el('strong', '', 'Ta réponse : '), document.createTextNode(chosen));
      const goodLine = el('p', 'answer-line is-good');
      goodLine.append(el('strong', '', 'Bonne réponse : '), document.createTextNode(detail.options[detail.answerIndex].text));

      const explanation = el('p', 'missed-explanation', detail.question.explanation || '');
      if (detail.question.source) explanation.append(el('span', 'src', 'Référence : ' + detail.question.source));
      item.append(badLine, goodLine, explanation);
      list.append(item);
    }

    const reviewBtn = $('#review-errors-btn');
    reviewBtn.disabled = result.missed.length === 0;
    reviewBtn.title = result.missed.length === 0 ? 'Aucune erreur à réviser.' : 'Relancer un quiz sur tes erreurs';
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

    const bank = getCurrentBank();
    const docMeta = getDocumentMeta(App.currentDocId);
    $('#dash-doc-name').textContent = docMeta ? docMeta.name : 'Aucun cours';

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

  function renderSettings() {
    const settings = App.progress.state.settings;
    $('#ai-endpoint').value = settings.aiEndpoint || '';
    $('#ai-enabled').checked = !!settings.aiEnabled;
    updateStorageMeter();
    $('#ai-status').textContent = settings.aiEnabled
      ? 'Mode IA activé : les nouveaux imports tenteront d’enrichir la banque via le proxy.'
      : 'Mode local actif : toutes les questions sont générées dans le navigateur.';
    $('#ai-status').className = 'hint';
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
    if (settings.aiEnabled && settings.aiEndpoint) {
      setDropzoneStatus(prefix + 'Enrichissement IA en cours…');
      await enrichWithAi(bank, extracted.text, settings.aiEndpoint);
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

  async function enrichWithAi(bank, text, endpoint) {
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
            chapterTitle: target.title
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
      if (!window.confirm('Quitter le quiz en cours ? Les réponses déjà validées sont enregistrées, le quiz ne sera pas comptabilisé.')) return;
      App.session = null;
      navigate('library');
    });

    $('#options').addEventListener('click', (event) => {
      const button = event.target.closest('.option');
      if (!button) return;
      selectOption(Number(button.dataset.index));
    });

    $('#validate-btn').addEventListener('click', validateAnswer);
    $('#next-btn').addEventListener('click', nextQuestion);

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
      const endpoint = $('#ai-endpoint').value.trim();
      const enabled = $('#ai-enabled').checked;
      if (enabled && !endpoint) {
        setStatus('#ai-status', 'Renseigne un point d’API avant d’activer l’IA.', 'error');
        return;
      }
      if (enabled && !/^https?:\/\//i.test(endpoint)) {
        setStatus('#ai-status', 'Le point d’API doit commencer par http:// ou https://.', 'error');
        return;
      }
      App.progress.updateSettings({ aiEndpoint: endpoint, aiEnabled: enabled });
      setStatus('#ai-status', 'Réglages enregistrés.', 'ok');
      showToast('Réglages enregistrés.', 'success');
    });

    $('#test-ai-btn').addEventListener('click', testAiConnection);

    $('#export-btn').addEventListener('click', exportProgress);
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

    if (!App.answered && /^[1-4]$/.test(event.key)) {
      event.preventDefault();
      selectOption(Number(event.key) - 1);
      return;
    }
    if (!App.answered && /^[a-dA-D]$/.test(event.key)) {
      event.preventDefault();
      selectOption(event.key.toLowerCase().charCodeAt(0) - 97);
      return;
    }
    if (event.key === 'Enter') {
      if (App.answered) {
        event.preventDefault();
        nextQuestion();
      } else if (App.selected !== null) {
        event.preventDefault();
        validateAnswer();
      }
    }
  }

  async function testAiConnection() {
    const endpoint = $('#ai-endpoint').value.trim();
    const status = $('#ai-status');
    if (!endpoint) {
      setStatus('#ai-status', 'Renseigne d’abord le point d’API.', 'error');
      return;
    }
    status.className = 'hint';
    status.textContent = 'Test de connexion…';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '', count: 5 })
      });
      // Un proxy joignable répond 400/422 à un texte vide : c'est suffisant.
      if (response.status < 500) {
        status.className = 'hint is-ok';
        status.textContent = 'Proxy joignable (HTTP ' + response.status + '). Le mode IA peut être activé.';
      } else {
        status.className = 'hint is-error';
        status.textContent = 'Le proxy répond avec une erreur ' + response.status + '. Vérifie la clé API côté serveur.';
      }
    } catch (error) {
      status.className = 'hint is-error';
      status.textContent = 'Connexion impossible : ' + (error.message || 'réseau indisponible') + '.';
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
