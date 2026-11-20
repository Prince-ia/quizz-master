const fs = require('fs');
const D = require('../docx-reader.js');
const Q = require('../question-generator.js');

(async () => {
  const b = fs.readFileSync(require('path').join(__dirname, '..', 'CRT 2024.docx'));
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  const t = await D.extractDocxText(ab);
  const bank = Q.generate(t, { documentId: 'demo', documentName: 'demo' });
  let n = 0;
  for (const ch of bank.chapters) {
    console.log('\n### ' + ch.title + ' (' + ch.questions.length + ')');
    for (const q of ch.questions.slice(0, 4)) {
      console.log('- ' + q.text);
      q.options.forEach((o, i) => {
        console.log('   ' + String.fromCharCode(65 + i) + '. ' + o + (i === q.answer ? '   <==' : ''));
      });
      console.log('   expl: ' + q.explanation.slice(0, 160));
      n++;
    }
  }
  console.log('\nTOTAL', n);
})();
