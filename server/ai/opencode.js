/*
 * Quiz Master — fournisseur opencode local.
 *
 * Appelle `opencode run` en mode non interactif :
 *   opencode run --standalone --format json --model <modele> --file <cours> <prompt>
 *
 * Le cours est transmis par fichier (pas par la ligne de commande) pour éviter
 * la limite de longueur des arguments sous Windows. Chaque génération tourne
 * dans un répertoire temporaire isolé, avec toutes les permissions refusées :
 * l'agent ne peut ni lire, ni écrire, ni exécuter de commande.
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildFilePrompt, MAX_TEXT } = require('./prompt');

const BIN = process.env.OPENCODE_BIN || 'opencode';
const MODEL = process.env.OPENCODE_MODEL || 'opencode/deepseek-v4.1-flash-free';
const TIMEOUT = Number(process.env.OPENCODE_TIMEOUT_MS || 180000);
const MAX_OUTPUT = 8 * 1024 * 1024;

let resolvedBin = null;
let detection = null;
let modelsCache = null;
let queue = Promise.resolve();

function resolveBinary() {
  if (resolvedBin) return resolvedBin;
  if (process.env.OPENCODE_BIN) {
    resolvedBin = process.env.OPENCODE_BIN;
    return resolvedBin;
  }
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || '';
    if (appData) {
      const exe = path.join(appData, 'npm', 'node_modules', '@opencode', 'cli', 'bin', 'opencode.exe');
      try {
        if (fs.existsSync(exe)) {
          resolvedBin = exe;
          return resolvedBin;
        }
      } catch (error) {
        // Ignore et retomber sur la commande du PATH.
      }
    }
  }
  resolvedBin = BIN;
  return resolvedBin;
}

function killTree(child) {
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
    } else {
      child.kill('SIGKILL');
    }
  } catch (error) {
    // Le processus est peut-être déjà terminé.
  }
}

function run(args, options = {}) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      const commandBin = resolveBinary();
      const isScript = /\.(c|m)?js$/i.test(commandBin);
      const command = isScript ? process.execPath : commandBin;
      const argv = isScript ? [commandBin, ...args] : args;
      child = spawn(command, argv, {
        cwd: options.cwd,
        windowsHide: true,
        env: { ...process.env, NO_COLOR: '1' }
      });
    } catch (error) {
      reject(error);
      return;
    }

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      killTree(child);
      const error = new Error("opencode n'a pas répondu dans le délai imparti.");
      error.status = 504;
      reject(error);
    }, options.timeout || TIMEOUT);

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.length > MAX_OUTPUT) {
        killTree(child);
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk).slice(-4000);
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      if (error.code === 'ENOENT') {
        const missing = new Error("La commande « " + resolveBinary() + " » est introuvable. Installe opencode ou définis OPENCODE_BIN.");
        missing.status = 503;
        reject(missing);
      } else {
        reject(error);
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      resolve({ code, stdout, stderr });
    });
  });
}

/** Détecte opencode (version) et met le résultat en cache. */
async function detect() {
  if (detection) return detection;
  try {
    const result = await run(['--version'], { timeout: 15000 });
    const version = (result.stdout || '').trim().split('\n')[0];
    detection = result.code === 0
      ? { installed: true, version: version || 'inconnue', error: null }
      : { installed: false, version: null, error: (result.stderr || '').trim().slice(0, 300) || 'code ' + result.code };
  } catch (error) {
    detection = { installed: false, version: null, error: error.message };
  }
  return detection;
}

/** Liste les modèles disponibles (sans consommer de tokens). */
async function listModels() {
  if (modelsCache) return modelsCache;
  try {
    const result = await run(['models'], { timeout: 20000 });
    if (result.code !== 0) return [];
    modelsCache = (result.stdout || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^[\w.-]+\/[\w.#-]+$/.test(line))
      .slice(0, 80);
  } catch (error) {
    modelsCache = [];
  }
  return modelsCache;
}

/** Extrait le premier objet JSON d'un texte (tolère les blocs Markdown). */
function extractJson(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Réponse IA non exploitable.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Transforme la sortie NDJSON d'`opencode run --format json` en texte. */
function parseEvents(stdout) {
  const chunks = [];
  const errors = [];
  for (const line of String(stdout || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed[0] !== '{') continue;
    let event;
    try {
      event = JSON.parse(trimmed);
    } catch (error) {
      continue;
    }
    if (event.type === 'error') {
      errors.push(event.error && event.error.message ? event.error.message : JSON.stringify(event).slice(0, 300));
      continue;
    }
    if (event.type === 'text' && event.part && typeof event.part.text === 'string') {
      chunks.push(event.part.text);
    }
  }
  return { text: chunks.join(''), errors };
}

function enqueue(task) {
  const next = queue.then(task, task);
  queue = next.catch(() => {});
  return next;
}

async function doGenerate({ text, count, chapterTitle, model }) {
  const info = await detect();
  if (!info.installed) {
    const error = new Error("opencode est introuvable sur cette machine. " + (info.error || ''));
    error.status = 503;
    throw error;
  }

  const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizmaster-opencode-'));
  const coursePath = path.join(workdir, 'cours.txt');
  const configPath = path.join(workdir, 'opencode.json');

  try {
    fs.writeFileSync(coursePath, String(text || '').slice(0, MAX_TEXT), 'utf8');
    // Isolation : aucune lecture, écriture ou commande autorisée.
    fs.writeFileSync(configPath, JSON.stringify({
      $schema: 'https://opencode.ai/config.json',
      permissions: [
        { action: '*', resource: '*', effect: 'deny' }
      ]
    }, null, 2), 'utf8');

    const prompt = buildFilePrompt(count, chapterTitle);
    const result = await run([
      'run',
      '--standalone',
      '--format', 'json',
      '--model', model || MODEL,
      '--file', coursePath,
      prompt
    ], { cwd: workdir });

    const parsed = parseEvents(result.stdout);
    if (!parsed.text && result.code !== 0) {
      const error = new Error('opencode a échoué : ' + ((result.stderr || parsed.errors.join(' ')).trim().slice(0, 400) || 'code ' + result.code));
      error.status = 502;
      throw error;
    }
    if (!parsed.text) {
      const error = new Error('opencode n’a renvoyé aucun texte exploitable.');
      error.status = 502;
      throw error;
    }

    return { payload: extractJson(parsed.text), model: model || MODEL };
  } finally {
    try {
      fs.rmSync(workdir, { recursive: true, force: true });
    } catch (error) {
      // Nettoyage best-effort.
    }
  }
}

function generate(options) {
  return enqueue(() => doGenerate(options));
}

module.exports = {
  detect,
  listModels,
  generate,
  parseEvents,
  extractJson,
  model: MODEL,
  get binary() {
    return resolveBinary();
  }
};
