/*
 * Faux binaire opencode pour les tests.
 * Reproduit le contrat de `opencode run --standalone --format json` :
 * NDJSON avec des événements { type: "text", part: { text } }.
 */
'use strict';

const fs = require('fs');

const args = process.argv.slice(2);

function emit(text) {
  process.stdout.write(JSON.stringify({ type: 'text', part: { type: 'text', text } }) + '\n');
}

if (args.includes('--version')) {
  process.stdout.write('9.9.9-test\n');
  process.exit(0);
}

if (args[0] === 'models') {
  process.stdout.write('opencode/deepseek-v4.1-flash-free\nopencode/test-model\n');
  process.exit(0);
}

if (args[0] === 'run') {
  const fileIndex = args.indexOf('--file');
  const file = fileIndex >= 0 ? args[fileIndex + 1] : '';
  let course = '';
  try {
    course = fs.readFileSync(file, 'utf8');
  } catch (error) {
    course = '';
  }

  // Citation exacte extraite du cours fourni, pour passer la validation serveur.
  const quote = (course.match(/[^.!?]*Solferino[^.!?]*[.!?]/i) || [''])[0].trim() ||
    course.slice(0, 120).trim();

  const payload = {
    questions: [
      {
        q: 'Que désigne le plan Solferino ?',
        options: ['Un dispositif de secours', 'Un modèle de voiture', 'Une marque de défibrillateur', 'Un logiciel'],
        answer: 0,
        explanation: 'Le plan Solferino organise les secours.',
        source: quote
      },
      {
        q: 'Question à plusieurs réponses ?',
        options: ['Un', 'Deux', 'Trois', 'Quatre'],
        answers: [0, 2],
        explanation: 'Deux propositions sont correctes.',
        source: quote
      },
      {
        q: 'Question inventée ?',
        options: ['A', 'B', 'C', 'D'],
        answer: 0,
        explanation: 'Explication.',
        source: 'Cette citation totalement inventée ne figure nulle part dans le cours fourni.'
      }
    ]
  };

  emit('```json\n' + JSON.stringify(payload) + '\n```');
  process.exit(0);
}

process.stderr.write('argument inconnu : ' + args.join(' ') + '\n');
process.exit(1);
