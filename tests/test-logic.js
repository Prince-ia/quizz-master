/*
 * Tests de logique (Node.js) — aucune dépendance externe.
 * Lancement : node tests/test-logic.js
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const DocxReader = require('../docx-reader.js');
const QuestionGenerator = require('../question-generator.js');
const QuizEngine = require('../quiz-engine.js');
const { ProgressManager, createMemoryStorage } = require('../progress-manager.js');
const preset = require('../data/preset-course.js');

const results = { passed: 0, failed: 0, failures: [] };

async function test(name, fn) {
  try {
    await fn();
    results.passed++;
    console.log('  ✓ ' + name);
  } catch (error) {
    results.failed++;
    results.failures.push({ name, error });
    console.log('  ✗ ' + name + '\n     → ' + error.message);
  }
}

function assertValidBank(bank, label) {
  assert(bank.chapters.length > 0, label + ' : aucun chapitre');
  let total = 0;
  const ids = new Set();
  for (const chapter of bank.chapters) {
    assert(chapter.title && chapter.title.length > 2, label + ' : titre de chapitre invalide');
    for (const question of chapter.questions) {
      total++;
      assert(question.id, label + ' : identifiant manquant');
      assert(!ids.has(question.id), label + ' : identifiant dupliqué ' + question.id);
      ids.add(question.id);
      assert(question.text && question.text.length > 8, label + ' : question trop courte');
      assert(Array.isArray(question.options) && question.options.length === 4, label + ' : il faut 4 options');
      const unique = new Set(question.options.map((opt) => opt.toLowerCase().trim()));
      assert(unique.size === 4, label + ' : options dupliquées dans « ' + question.text + ' »');
      assert(question.answer >= 0 && question.answer < 4, label + ' : index de réponse invalide');
      if (question.answers) {
        assert(Array.isArray(question.answers) && question.answers.length >= 2, label + ' : answers doit contenir au moins 2 indices');
        assert(question.answers.includes(question.answer), label + ' : answers doit inclure answer');
        assert.strictEqual(new Set(question.answers).size, question.answers.length, label + ' : answers contient des doublons');
        for (const index of question.answers) {
          assert(index >= 0 && index < 4, label + ' : index de answers invalide');
        }
      }
      assert(question.explanation && question.explanation.length > 5, label + ' : explication manquante');
      assert(question.source, label + ' : source manquante');
      for (const option of question.options) {
        assert(option.trim().length > 0, label + ' : option vide');
      }
    }
  }
  return total;
}

async function loadCourseText() {
  const file = path.join(__dirname, '..', 'CRT 2024.docx');
  const buffer = fs.readFileSync(file);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return DocxReader.extractDocxText(arrayBuffer);
}

async function main() {
  console.log('\n=== Quiz Master — tests de logique ===\n');
  console.log('• Extraction DOCX');
  let courseText = '';
  await test('extrait le texte de CRT 2024.docx', async () => {
    courseText = await loadCourseText();
    assert(courseText.length > 25000, 'texte extrait trop court : ' + courseText.length);
    assert(/CHAPITRE I/i.test(courseText), 'les titres de chapitres sont absents');
    assert(/Solferino/i.test(courseText), 'le contenu du cours est incomplet');
  });

  console.log('\n• Banque préchargée');
  const presetBank = QuestionGenerator.normalizePreset(preset, preset.document.id);
  const presetTotal = assertValidBank(presetBank, 'preset');
  await test('la banque préchargée est valide (' + presetTotal + ' questions)', () => {
    assert(presetBank.chapters.length === 9, '9 chapitres attendus, reçu ' + presetBank.chapters.length);
    assert(presetTotal >= 100, 'au moins 100 questions attendues, reçu ' + presetTotal);
  });
  await test('chaque chapitre préchargé contient au moins 10 questions', () => {
    for (const chapter of presetBank.chapters) {
      assert(chapter.questions.length >= 10, chapter.title + ' : ' + chapter.questions.length + ' questions');
    }
  });

  console.log('\n• Génération locale depuis le cours');
  const generated = QuestionGenerator.generate(courseText, {
    documentId: 'test-doc',
    documentName: 'CRT 2024 (test)'
  });
  const generatedTotal = assertValidBank(generated, 'généré');
  await test('détecte les chapitres du document', () => {
    assert(generated.chapters.length >= 8, 'chapitres détectés : ' + generated.chapters.length);
  });
  await test('génère une banque riche (' + generatedTotal + ' questions)', () => {
    assert(generatedTotal >= 60, 'au moins 60 questions attendues, reçu ' + generatedTotal);
  });
  await test('génère des questions de plusieurs types', () => {
    const kinds = new Set();
    for (const chapter of generated.chapters) {
      for (const question of chapter.questions) kinds.add(question.kind);
    }
    assert(kinds.size >= 2, 'types générés : ' + Array.from(kinds).join(', '));
    assert(kinds.has('definition') || kinds.has('number'), 'aucune question de définition ou chiffrée');
  });
  await test('la génération est déterministe (identifiants stables)', () => {
    const again = QuestionGenerator.generate(courseText, { documentId: 'test-doc' });
    const idsA = generated.chapters.flatMap((c) => c.questions.map((q) => q.id)).sort();
    const idsB = again.chapters.flatMap((c) => c.questions.map((q) => q.id)).sort();
    assert.deepStrictEqual(idsA, idsB);
    assert.strictEqual(again.stats.questions, generated.stats.questions);
  });

  console.log('\n• Moteur de quiz');
  const questions = QuizEngine.flatten(presetBank.chapters, 'crt-2024');

  await test('prépare exactement 10 questions sans doublon', () => {
    const session = QuizEngine.buildSession({ questions, chapterId: 'all', count: 10, rng: QuizEngine.createRng(42) });
    assert.strictEqual(session.delivered, 10);
    const ids = new Set(session.items.map((item) => item.question.id));
    assert.strictEqual(ids.size, 10, 'questions dupliquées dans la session');
    for (const item of session.items) {
      assert.strictEqual(item.options.length, 4);
      const correctCount = item.options.filter((opt) => opt.correct).length;
      assert(correctCount >= 1, 'au moins une bonne réponse attendue');
      assert.strictEqual(correctCount, item.answerIndices.length, 'answerIndices incohérent');
      for (const option of item.options) assert(option.text.length > 0);
    }
  });

  await test('mélange l’ordre des propositions sans perdre la bonne réponse', () => {
    let changed = 0;
    for (let seed = 1; seed <= 15; seed++) {
      const session = QuizEngine.buildSession({ questions, chapterId: 'all', count: 10, rng: QuizEngine.createRng(seed) });
      for (const item of session.items) {
        const correctTexts = item.options.filter((option) => option.correct).map((option) => option.text.trim());
        const expectedTexts = (item.question.answers || [item.question.answer])
          .map((index) => item.question.options[index].trim());
        assert.deepStrictEqual(correctTexts.slice().sort(), expectedTexts.slice().sort(), 'la bonne réponse a été perdue');
        if (item.answerIndex !== item.question.answer) changed++;
      }
    }
    assert(changed > 20, 'les propositions ne sont pas réellement mélangées (' + changed + ')');
  });

  await test('gère les questions à réponses multiples', () => {
    const multi = {
      id: 'multi-1',
      text: 'Lesquelles sont correctes ?',
      options: ['Un', 'Deux', 'Trois', 'Quatre'],
      answers: [0, 2],
      answer: 0,
      explanation: 'Un et Trois sont corrects.',
      source: 'Test',
      chapterId: 'ch1'
    };
    assert.deepStrictEqual(QuizEngine.correctIndices(multi), [0, 2]);
    assert.deepStrictEqual(QuizEngine.correctIndices(questions[0]), [questions[0].answer]);
    assert.deepStrictEqual(QuizEngine.normalizeSelection([2, 0, 2]), [0, 2]);
    assert.strictEqual(QuizEngine.sameSelection([0, 2], [2, 0]), false);
    assert.strictEqual(QuizEngine.sameSelection([0, 2], [0, 2]), true);

    const session = QuizEngine.buildSession({ questions: [multi], count: 1, rng: QuizEngine.createRng(4) });
    const item = session.items[0];
    assert.strictEqual(item.answerIndices.length, 2);

    const exact = QuizEngine.evaluate(session, [item.answerIndices]);
    assert.strictEqual(exact.correct, 1);
    assert.strictEqual(exact.details[0].chosenTexts.length, 2);

    const partial = QuizEngine.evaluate(session, [[item.answerIndices[0]]]);
    assert.strictEqual(partial.correct, 0, 'une sélection partielle doit être fausse');

    const extra = QuizEngine.evaluate(session, [[...item.answerIndices, 3]]);
    assert.strictEqual(extra.correct, 0, 'une sélection trop large doit être fausse');

    const none = QuizEngine.evaluate(session, [[]]);
    assert.strictEqual(none.correct, 0);
    assert.strictEqual(none.answered, 0);
    assert.strictEqual(none.details[0].chosen, null);
  });

  await test('normalizePreset conserve les réponses multiples', () => {
    const bank = QuestionGenerator.normalizePreset({
      document: { id: 'multi-doc', name: 'Multi' },
      chapters: [{
        id: 'ch1',
        title: 'Chapitre multi',
        questions: [{
          q: 'Lesquelles sont correctes ?',
          options: ['Un', 'Deux', 'Trois', 'Quatre'],
          answers: [1, 3],
          explanation: 'Deux et Quatre.',
          source: 'Test'
        }]
      }]
    }, 'multi-doc');
    const question = bank.chapters[0].questions[0];
    assert.deepStrictEqual(question.answers, [1, 3]);
    assert.strictEqual(question.answer, 1);
  });

  await test('respecte le chapitre demandé', () => {
    const session = QuizEngine.buildSession({ questions, chapterId: 'ch5', count: 10, rng: QuizEngine.createRng(7) });
    assert(session.items.every((item) => item.question.chapterId === 'ch5'));
  });

  await test('privilégie les questions jamais vues', () => {
    const fake = Array.from({ length: 40 }, (_, i) => ({
      id: 'q' + i,
      text: 'Question ' + i + ' ?',
      options: ['A', 'B', 'C', 'D'],
      answer: 0,
      explanation: 'Explication ' + i,
      source: 'Test',
      chapterId: 'ch1'
    }));
    const now = Date.now();
    const stats = {};
    for (let i = 0; i < 20; i++) {
      stats['q' + i] = { seen: 3, correct: 3, wrong: 0, box: 5, due: now + 30 * QuizEngine.DAY, streak: 3 };
    }
    const recent = fake.slice(0, 20).map((q) => q.id);
    const session = QuizEngine.buildSession({ questions: fake, chapterId: 'all', count: 10, stats, recent, now, rng: QuizEngine.createRng(123) });
    const unseen = session.items.filter((item) => parseInt(item.question.id.slice(1), 10) >= 20).length;
    assert(unseen >= 9, 'questions inédites sélectionnées : ' + unseen + '/10');
  });

  await test('varie les questions d’une session à l’autre', () => {
    const stats = {};
    const now = Date.now();
    let recent = [];
    const first = QuizEngine.buildSession({ questions, count: 10, stats, recent, now, rng: QuizEngine.createRng(11) });
    const firstIds = first.items.map((i) => i.question.id);
    for (const id of firstIds) {
      stats[id] = { seen: 1, correct: 1, wrong: 0, box: 1, due: now + QuizEngine.DAY, streak: 1 };
      recent.unshift(id);
    }
    const second = QuizEngine.buildSession({ questions, count: 10, stats, recent, now, rng: QuizEngine.createRng(12) });
    const secondIds = second.items.map((i) => i.question.id);
    const overlap = firstIds.filter((id) => secondIds.includes(id)).length;
    assert(overlap <= 2, 'trop de questions répétées : ' + overlap + '/10');
  });

  await test('fait revenir les questions échouées', () => {
    const stats = {};
    const now = Date.now();
    const failed = questions[3];
    const failed2 = questions[17];
    stats[failed.id] = { seen: 2, correct: 0, wrong: 2, box: 0, due: now - QuizEngine.DAY, streak: 0 };
    stats[failed2.id] = { seen: 1, correct: 0, wrong: 1, box: 0, due: now - 3600000, streak: 0 };
    const session = QuizEngine.buildSession({ questions, count: 10, stats, now, rng: QuizEngine.createRng(5) });
    const ids = session.items.map((item) => item.question.id);
    assert(ids.includes(failed.id), 'la question la plus échouée devrait revenir');
    assert(ids.includes(failed2.id), 'la seconde question échouée devrait revenir');
  });

  await test('complète une session Réviser mes erreurs à 10 questions', () => {
    const stats = {};
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      stats[questions[i].id] = { seen: 1, correct: 0, wrong: 1, box: 0, due: now - 1000, streak: 0 };
    }
    const session = QuizEngine.buildReviewSession(questions, stats, { count: 10, now, rng: QuizEngine.createRng(3) });
    assert(session, 'session de révision attendue');
    assert.strictEqual(session.delivered, 10);
    const firstThree = session.items.slice(0, 3).map((item) => item.question.id);
    assert(firstThree.every((id) => stats[id]), 'les erreurs devraient être placées en premier');
  });

  console.log('\n• Correction et résultats');
  await test('corrige correctement les réponses', () => {
    const session = QuizEngine.buildSession({ questions, count: 10, rng: QuizEngine.createRng(9) });
    const answers = session.items.map((item, index) => {
      if (index % 3 !== 0) return item.answerIndices;
      const wrong = [0, 1, 2, 3].find((position) => !item.answerIndices.includes(position));
      return [wrong];
    });
    const result = QuizEngine.evaluate(session, answers);
    assert.strictEqual(result.total, 10);
    assert.strictEqual(result.correct, 6);
    assert.strictEqual(result.wrong, 4);
    assert.strictEqual(result.percent, 60);
    assert.strictEqual(result.missed.length, 4);
    assert.strictEqual(result.message.tone, 'average');
  });

  await test('applique les messages de résultat attendus', () => {
    assert.strictEqual(QuizEngine.getMessage(10, 10).tone, 'excellent');
    assert.strictEqual(QuizEngine.getMessage(8, 10).tone, 'good');
    assert.strictEqual(QuizEngine.getMessage(6, 10).tone, 'average');
    assert.strictEqual(QuizEngine.getMessage(4, 10).tone, 'weak');
  });

  console.log('\n• Progression et répétition espacée');
  const storage = createMemoryStorage();
  const progress = new ProgressManager({ storage, key: 'quizmaster.test' });
  const q1 = questions[0];
  const q2 = questions[1];

  await test('enregistre les réponses et met à jour le compteur global', () => {
    progress.recordAnswer(q1, true);
    progress.recordAnswer(q1, true);
    progress.recordAnswer(q2, false);
    const stats = progress.getGlobalStats();
    assert.strictEqual(stats.answered, 3);
    assert.strictEqual(stats.correct, 2);
    assert.strictEqual(stats.wrong, 1);
    assert.strictEqual(stats.accuracy, 67);
    assert.strictEqual(stats.currentStreak, 0);
    assert.strictEqual(stats.bestStreak, 2);
  });

  await test('applique la répétition espacée (boîte et échéance)', () => {
    const stat1 = progress.getQuestionStat(q1.id);
    assert.strictEqual(stat1.seen, 2);
    assert.strictEqual(stat1.correct, 2);
    assert.strictEqual(stat1.box, 2);
    assert(stat1.due > Date.now() + 2 * QuizEngine.DAY, 'la question maîtrisée doit être espacée');
    const stat2 = progress.getQuestionStat(q2.id);
    assert.strictEqual(stat2.box, 0);
    assert(stat2.due <= Date.now() + 11 * 60 * 1000, 'une erreur doit revenir rapidement');
  });

  await test('enregistre l’historique des quiz et les statistiques', () => {
    progress.recordQuiz({
      documentId: 'crt-2024',
      documentName: 'Secourisme',
      chapterId: 'ch1',
      chapterTitle: 'Chapitre I',
      score: 8,
      total: 10,
      percent: 80,
      questionIds: [q1.id, q2.id],
      wrongIds: [q2.id]
    });
    const global = progress.getGlobalStats();
    assert.strictEqual(global.quizzes, 1);
    assert.strictEqual(global.bestPercent, 80);
    assert.strictEqual(progress.getRecentQuiz().length, 1);
    assert.strictEqual(progress.getDifficultQuestions(questions, 5)[0].question.id, q2.id);
  });

  await test('calcule la progression par chapitre', () => {
    const progressList = progress.getChapterProgress(presetBank.chapters);
    const ch1 = progressList.find((item) => item.id === 'ch1');
    assert(ch1.total > 0);
    assert(ch1.seen >= 1);
    assert(ch1.mastery >= 0 && ch1.mastery <= 100);
  });

  await test('exporte et restaure la progression', () => {
    const exported = JSON.parse(JSON.stringify(progress.exportAll()));
    const storage2 = createMemoryStorage();
    const restored = new ProgressManager({ storage: storage2, key: 'quizmaster.test' });
    restored.importAll(exported);
    assert.strictEqual(restored.getGlobalStats().answered, progress.getGlobalStats().answered);
    assert.strictEqual(restored.getGlobalStats().quizzes, 1);
    assert(restored.getQuestionStat(q1.id));
  });

  await test('réinitialise les statistiques sans toucher aux cours', () => {
    progress.saveDocument({ id: 'doc-test', name: 'Doc test' }, [{ id: 'ch1', title: 'Chapitre', questions: [q1] }]);
    progress.resetProgress();
    assert.strictEqual(progress.getGlobalStats().answered, 0);
    assert.strictEqual(progress.getGlobalStats().quizzes, 0);
    assert(progress.hasDocument('doc-test'));
  });

  console.log('\n• Simulation de sessions successives');
  await test('10 sessions consécutives restent variées et cohérentes', () => {
    const simStorage = createMemoryStorage();
    const sim = new ProgressManager({ storage: simStorage, key: 'quizmaster.sim' });
    const pool = QuizEngine.flatten(presetBank.chapters, 'crt-2024');
    const seenSessions = [];
    for (let sessionIndex = 0; sessionIndex < 10; sessionIndex++) {
      const session = QuizEngine.buildSession({
        questions: pool,
        count: 10,
        stats: sim.state.questionStats,
        recent: sim.state.recent,
        rng: QuizEngine.createRng(100 + sessionIndex)
      });
      const ids = session.items.map((item) => item.question.id);
      assert.strictEqual(new Set(ids).size, 10);
      const previousOverlap = seenSessions.length
        ? Math.max(...seenSessions.map((previous) => ids.filter((id) => previous.includes(id)).length))
        : 0;
      assert(previousOverlap <= 4, 'session ' + sessionIndex + ' trop similaire (overlap ' + previousOverlap + ')');
      seenSessions.push(ids);
      session.items.forEach((item, index) => {
        sim.recordAnswer(item.question, index % 4 !== 0);
      });
      const result = QuizEngine.evaluate(session, session.items.map((item, index) => {
        if (index % 4 !== 0) return item.answerIndices;
        const wrong = [0, 1, 2, 3].find((position) => !item.answerIndices.includes(position));
        return [wrong];
      }));
      sim.recordQuiz({
        documentId: 'crt-2024',
        documentName: 'Secourisme',
        chapterId: 'all',
        chapterTitle: 'Toutes les parties',
        score: result.correct,
        total: result.total,
        percent: result.percent
      });
    }
    const stats = sim.getGlobalStats();
    assert.strictEqual(stats.quizzes, 10);
    assert.strictEqual(stats.answered, 100);
    assert(stats.accuracy > 50 && stats.accuracy < 90);
    assert(sim.getRecentQuiz(20).length === 10);
  });

  console.log('\n----------------------------------------');
  console.log('Résultat : ' + results.passed + ' réussis, ' + results.failed + ' échoués.');
  if (results.failed > 0) {
    for (const failure of results.failures) {
      console.error('\n✗ ' + failure.name);
      console.error(failure.error.stack);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
