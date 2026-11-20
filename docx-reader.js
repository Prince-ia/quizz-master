/*
 * Quiz Master — docx-reader.js
 * Extraction locale du texte d'un fichier .docx (aucune dépendance obligatoire).
 *
 * Principe : un .docx est une archive ZIP contenant word/document.xml.
 * On lit le répertoire central du ZIP, on décompresse l'entrée avec
 * DecompressionStream('deflate-raw') (API native du navigateur), puis on
 * convertit le XML Word en texte brut structuré.
 *
 * Si l'API native n'est pas disponible (navigateur ancien), on bascule
 * automatiquement sur Mammoth.js s'il est chargé (voir index.html).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DocxReader = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  /* ----------------------------- Utilitaires ----------------------------- */

  function readU16(view, offset) {
    return view.getUint16(offset, true);
  }

  function readU32(view, offset) {
    return view.getUint32(offset, true);
  }

  function findSignature(view, signature, from, to) {
    for (let i = to - 4; i >= from; i--) {
      if (view.getUint32(i, true) === signature) return i;
    }
    return -1;
  }

  /* --------------------------- Décompression ZIP ------------------------- */

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('NATIVE_INFLATE_UNAVAILABLE');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Extrait les entrées d'une archive ZIP.
   * @returns {Promise<Array<{name:string, method:number, compressedSize:number, localOffset:number}>>}
   */
  async function listZipEntries(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const reader = new Uint8Array(arrayBuffer);
    const EOCD = 0x06054b50;
    const searchStart = Math.max(0, view.byteLength - 66000);
    const eocd = findSignature(view, EOCD, searchStart, view.byteLength);
    if (eocd < 0) throw new Error('Fichier ZIP invalide (fin de répertoire introuvable).');

    const count = readU16(view, eocd + 10);
    const cdOffset = readU32(view, eocd + 16);
    const entries = [];
    let offset = cdOffset;
    const CENTRAL = 0x02014b50;

    for (let i = 0; i < count; i++) {
      if (offset + 46 > view.byteLength) break;
      if (readU32(view, offset) !== CENTRAL) break;
      const method = readU16(view, offset + 10);
      const compressedSize = readU32(view, offset + 20);
      const nameLength = readU16(view, offset + 28);
      const extraLength = readU16(view, offset + 30);
      const commentLength = readU16(view, offset + 32);
      const localOffset = readU32(view, offset + 42);
      const nameBytes = reader.subarray(offset + 46, offset + 46 + nameLength);
      const name = new TextDecoder('utf-8').decode(nameBytes);
      entries.push({ name, method, compressedSize, localOffset });
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }

  async function readZipEntry(arrayBuffer, entry) {
    const view = new DataView(arrayBuffer);
    const reader = new Uint8Array(arrayBuffer);
    if (readU32(view, entry.localOffset, true) !== 0x04034b50) {
      throw new Error('Entrée ZIP endommagée.');
    }
    const nameLength = readU16(view, entry.localOffset + 26);
    const extraLength = readU16(view, entry.localOffset + 28);
    const dataStart = entry.localOffset + 30 + nameLength + extraLength;
    const data = reader.subarray(dataStart, dataStart + entry.compressedSize);
    if (entry.method === 0) return data;
    if (entry.method === 8) return inflateRaw(data);
    throw new Error('Méthode de compression ZIP non prise en charge : ' + entry.method);
  }

  /* ----------------------- Conversion XML Word → texte ------------------- */

  function decodeEntities(str) {
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&amp;/g, '&');
  }

  /**
   * Convertit word/document.xml en texte lisible (paragraphes, tabulations,
   * sauts de ligne et cellules de tableaux).
   */
  function docxXmlToText(xmlString) {
    if (typeof DOMParser === 'undefined') {
      return fallbackXmlToText(xmlString);
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) return fallbackXmlToText(xmlString);

    const paragraphs = doc.getElementsByTagNameNS(WORD_NS, 'p');
    const lines = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      let line = '';
      const nodes = p.getElementsByTagName('*');
      for (let j = 0; j < nodes.length; j++) {
        const node = nodes[j];
        const local = node.localName;
        if (node.namespaceURI !== WORD_NS) continue;
        if (local === 't') line += node.textContent;
        else if (local === 'tab') line += '\t';
        else if (local === 'br' || local === 'cr') line += '\n';
        else if (local === 'noBreakHyphen') line += '-';
      }
      lines.push(line);
    }
    return cleanupText(lines.join('\n'));
  }

  /** Parseur de secours (regex) si DOMParser n'est pas disponible. */
  function fallbackXmlToText(xmlString) {
    const withBreaks = xmlString
      .replace(/<w:tab\b[^>]*\/>/g, '\t')
      .replace(/<w:(?:br|cr)\b[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n');
    const withoutTags = withBreaks.replace(/<[^>]+>/g, '');
    return cleanupText(decodeEntities(withoutTags));
  }

  /** Nettoie les artefacts : lignes de numéros de page, espaces multiples… */
  function cleanupText(text) {
    const lines = String(text)
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]+$/g, ''))
      .filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) return true; // on garde les séparateurs de paragraphe
        // Numéros de page / identifiants d'images insérés par Word
        if (/^\d{1,4}$/.test(trimmed)) return false;
        if (/^\d{8,}$/.test(trimmed)) return false;
        if (/^\d{5,}\d{5,}$/.test(trimmed)) return false;
        return true;
      });

    // Réduction des lignes vides consécutives
    const output = [];
    let blankRun = 0;
    for (const line of lines) {
      if (!line.trim()) {
        blankRun++;
        if (blankRun <= 2) output.push('');
      } else {
        blankRun = 0;
        output.push(line);
      }
    }
    return output.join('\n').trim();
  }

  /* ------------------------------- API publique -------------------------- */

  /**
   * Lit un fichier importé (File/Blob) et renvoie son texte.
   * @param {File|Blob} file
   * @param {Object} [options]
   * @returns {Promise<{text:string, meta:{name:string, size:number, source:string}}>}
   */
  async function readFile(file, options = {}) {
    const name = file.name || 'document';
    const lower = name.toLowerCase();

    if (lower.endsWith('.txt') || lower.endsWith('.md')) {
      const text = await file.text();
      return {
        text: cleanupText(text),
        meta: { name, size: file.size || 0, source: 'txt' }
      };
    }

    if (lower.endsWith('.doc') && !lower.endsWith('.docx')) {
      throw new Error("Les fichiers .doc (ancien format Word) ne sont pas pris en charge. Enregistrez le document au format .docx.");
    }

    const arrayBuffer = await file.arrayBuffer();
    let text;
    try {
      text = await extractDocxText(arrayBuffer);
    } catch (error) {
      if (error.message === 'NATIVE_INFLATE_UNAVAILABLE' && options.mammoth) {
        const result = await options.mammoth.extractRawText({ arrayBuffer });
        text = cleanupText(result.value || '');
      } else {
        throw error;
      }
    }

    if (!text || text.length < 40) {
      throw new Error("Le document ne contient pas assez de texte exploitable (moins de 40 caractères extraits).");
    }
    return {
      text,
      meta: { name, size: file.size || arrayBuffer.byteLength, source: 'docx' }
    };
  }

  /** Extrait le texte d'un .docx à partir de son ArrayBuffer. */
  async function extractDocxText(arrayBuffer) {
    const entries = await listZipEntries(arrayBuffer);
    const entry =
      entries.find((e) => e.name === 'word/document.xml') ||
      entries.find((e) => /^word\/document\d*\.xml$/.test(e.name));
    if (!entry) throw new Error("Fichier .docx invalide : word/document.xml est absent.");

    const xmlBytes = await readZipEntry(arrayBuffer, entry);
    const xml = new TextDecoder('utf-8').decode(xmlBytes);
    const text = docxXmlToText(xml);
    if (!text || text.length < 40) {
      throw new Error("Le document Word ne contient pas de texte exploitable (images ou contenu vide).");
    }
    return text;
  }

  return { readFile, extractDocxText, docxXmlToText, cleanupText, listZipEntries, readZipEntry };
});
