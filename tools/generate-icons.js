/*
 * Génère les icônes PWA (PNG) sans dépendance externe.
 * Lancement : node tools/generate-icons.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'icons');

/* ------------------------------ PNG encoder ----------------------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtre None
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* -------------------------------- Dessin -------------------------------- */

const ACCENT = [255, 77, 94];
const WHITE = [255, 255, 255];

function draw(size, { rounded = true, padding = 0 } = {}) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = rounded ? size * 0.22 : 0;
  const inset = padding * size;

  function insideRounded(x, y) {
    const min = inset;
    const max = size - inset - 1;
    if (x < min || y < min || x > max || y > max) return false;
    if (!radius) return true;
    const r = Math.min(radius, (max - min) / 2);
    const cx = x < min + r ? min + r : (x > max - r ? max - r : x);
    const cy = y < min + r ? min + r : (y > max - r ? max - r : y);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  }

  // Croix centrée (40 % de la largeur).
  const thickness = Math.round(size * 0.19);
  const armLength = Math.round(size * 0.42);
  const center = size / 2;
  const half = thickness / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      if (!insideRounded(x, y)) {
        pixels[offset + 3] = 0;
        continue;
      }
      const horizontal = Math.abs(y + 0.5 - center) <= half && Math.abs(x + 0.5 - center) <= armLength / 2;
      const vertical = Math.abs(x + 0.5 - center) <= half && Math.abs(y + 0.5 - center) <= armLength / 2;
      const color = horizontal || vertical ? WHITE : ACCENT;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }

  return encodePng(size, size, pixels);
}

fs.mkdirSync(OUT, { recursive: true });
const outputs = [
  ['icon-192.png', 192, { rounded: true }],
  ['icon-512.png', 512, { rounded: true }],
  ['icon-maskable-512.png', 512, { rounded: false, padding: 0.1 }]
];

for (const [name, size, options] of outputs) {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, draw(size, options));
  console.log(name + ' — ' + fs.statSync(file).size + ' octets');
}
