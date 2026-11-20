/*
 * Tests du fournisseur opencode et de la validation des questions IA.
 * Utilise un faux binaire (tests/fixtures/fake-opencode.js) : aucun réseau,
 * aucun appel réel au modèle.
 *
 * Lancement : node tests/test-opencode.js
 */
'use strict';

const assert = require('assert');
const path = require('path');

process.env.OPENCODE_BIN = path.join(__dirname, 'fixtures', 'fake-opencode.js');
process.env.AI_PROVIDER = 'opencode';
process.env.AI_RATE_LIMIT = '3';

const opencode = require('../server/ai/opencode');
const prompt = require('../server/ai/prompt');
const ai = require('../server/ai');

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

const COURSE = [
  'Le plan Solferino est un dispositif national de réponse aux situations sanitaires exceptionnelles.',
  'Il organise la mobilisation des établissements de santé et des professionnels de santé.',
  'La formation du grand public comprend les gestes de premiers secours et l’alerte des secours.'
].join(' ');

async function main() {
  console.log('\n=== Quiz Master — tests IA (opencode) ===\n');

  console.log('• Détection et modèles');
  await test('détecte le binaire opencode et sa version', async () => {
    const info = await opencode.detect();
    assert.strictEqual(info.installed, true);
    assert.strictEqual(info.version, '9.9.9-test');
  });

  await test('liste les modèles disponibles', async () => {
    const models = await opencode.listModels();
    assert(models.includes('opencode/test-model'), 'modèle de test absent : ' + models.join(', '));
  });

  console.log('\n• Analyse de la sortie NDJSON');
  await test('parseEvents ne garde que les événements texte', () => {
    const stdout = [
      JSON.stringify({ type: 'step_start', part: {} }),
      JSON.stringify({ type: 'text', part: { type: 'text', text: '{"questions":' } }),
      JSON.stringify({ type: 'text', part: { type: 'text', text: '[]}' } }),
      JSON.stringify({ type: 'error', error: { message: 'avertissement' } })
    ].join('\n');
    const parsed = opencode.parseEvents(stdout);
    assert.strictEqual(parsed.text, '{"questions":[]}');
    assert.strictEqual(parsed.errors.length, 1);
  });

  await test('extractJson tolère un bloc Markdown', () => {
    const payload = opencode.extractJson('```json\n{"questions":[]}\n```');
    assert.deepStrictEqual(payload, { questions: [] });
  });

  console.log('\n• Validation des questions');
  await test('normaliseForMatch ignore accents et ponctuation', () => {
    assert.strictEqual(prompt.normalizeForMatch('Élève : l’alerte !'), 'eleve l alerte');
  });

  await test('validateQuestions écarte les citations inventées', () => {
    const payload = {
      questions: [
        {
          q: 'Que désigne le plan Solferino ?',
          options: ['Un dispositif de secours', 'Une voiture', 'Un défibrillateur', 'Un logiciel'],
          answer: 0,
          explanation: 'Le plan Solferino organise la réponse sanitaire.',
          source: 'Le plan Solferino est un dispositif national de réponse aux situations sanitaires exceptionnelles.'
        },
        {
          q: 'Question inventée ?',
          options: ['A', 'B', 'C', 'D'],
          answer: 0,
          explanation: 'Explication.',
          source: 'Citation totalement absente du cours fourni pour ce test de validation.'
        }
      ]
    };
    const validated = prompt.validateQuestions(payload, COURSE, 'Chapitre test');
    assert.strictEqual(validated.questions.length, 1);
    assert.strictEqual(validated.dropped, 1);
  });

  await test('validateQuestions accepte deux réponses correctes', () => {
    const payload = {
      questions: [{
        q: 'Lesquelles sont correctes ?',
        options: ['Un', 'Deux', 'Trois', 'Quatre'],
        answers: [0, 2],
        explanation: 'Deux propositions.',
        source: 'Le plan Solferino est un dispositif national de réponse aux situations sanitaires exceptionnelles.'
      }]
    };
    const validated = prompt.validateQuestions(payload, COURSE, 'Chapitre test');
    assert.strictEqual(validated.questions.length, 1);
    assert.deepStrictEqual(validated.questions[0].answers, [0, 2]);
    assert.strictEqual(validated.questions[0].answer, 0);
  });

  console.log('\n• Génération via opencode');
  await test('génère et valide des questions depuis le cours', async () => {
    const result = await ai.generate({ text: COURSE, count: 5, chapterTitle: 'Chapitre test' });
    assert.strictEqual(result.provider, 'opencode');
    assert.strictEqual(result.requested, 5);
    assert.strictEqual(result.kept, 2, 'deux questions vérifiables attendues, reçu ' + result.kept);
    assert.strictEqual(result.dropped, 1);
    const multi = result.questions.find((question) => Array.isArray(question.answers));
    assert(multi, 'la question à réponses multiples doit être conservée');
    assert.deepStrictEqual(multi.answers, [0, 2]);
  });

  await test('refuse un cours trop court', async () => {
    await assert.rejects(
      () => ai.generate({ text: 'Trop court.', count: 5 }),
      (error) => error.status === 400
    );
  });

  console.log('\n• Limitation de débit');
  await test('bloque au-delà du quota par adresse', () => {
    const ip = '10.0.0.42';
    assert.strictEqual(ai.checkRateLimit(ip).allowed, true);
    assert.strictEqual(ai.checkRateLimit(ip).allowed, true);
    assert.strictEqual(ai.checkRateLimit(ip).allowed, true);
    const blocked = ai.checkRateLimit(ip);
    assert.strictEqual(blocked.allowed, false);
    assert(blocked.retryAfter > 0);
    assert.strictEqual(ai.checkRateLimit('10.0.0.43').allowed, true);
  });

  console.log('\n• État du service');
  await test('status expose opencode et ses modèles', async () => {
    const status = await ai.status();
    assert.strictEqual(status.opencode.installed, true);
    assert(status.opencode.models.includes('opencode/test-model'));
    assert.strictEqual(status.provider, 'opencode');
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
