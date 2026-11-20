# Quiz Master — Coach de révision

Transforme un cours Word (`.docx`) en quiz à choix multiples **sans inventer de contenu** :
chaque question est construite à partir d'une phrase, d'une définition, d'une liste ou d'un
chiffre réellement présent dans le document source.

Application web (HTML + CSS + JavaScript, modules UMD), sans build ni dépendance : le DOCX
est lu localement, la progression est stockée dans `localStorage`, et un petit serveur Node
optionnel sert à la génération de questions par IA (proxy OpenAI ou **opencode** local).

> Cours de démonstration inclus : **Manuel de Secourisme — CRT 2024**
> (Croix-Rouge Togolaise, Département Secours et Gestion des Catastrophes),
> 9 chapitres, **140 questions** prêtes à l'emploi.

---

## Sommaire

1. [Aperçu](#1-aperçu)
2. [Fonctionnalités](#2-fonctionnalités)
3. [Démarrage rapide](#3-démarrage-rapide)
4. [Utilisation](#4-utilisation)
5. [Comment ça marche](#5-comment-ça-marche)
6. [Structure du projet](#6-structure-du-projet)
7. [Données et confidentialité](#7-données-et-confidentialité)
8. [Tests](#8-tests)
9. [Déploiement](#9-déploiement)
10. [Dépannage](#10-dépannage)
11. [Limites connues](#11-limites-connues)
12. [Feuille de route](#12-feuille-de-route)
13. [Licence](#13-licence)

---

## 1. Aperçu

| | |
|---|---|
| **Type** | Application web (HTML + CSS + JavaScript, modules UMD) |
| **Dépendances** | Aucune (ni `npm install`, ni bundler) |
| **Backend** | Facultatif — `server/server.js` (Node.js 18+, zéro dépendance) |
| **Stockage** | `localStorage` (clé `quizmaster.v1`) |
| **Langue** | Français |
| **Tests** | 25 tests logique + 11 tests IA (Node), 1 page d'intégration navigateur |

Le parcours complet :

```
DOCX  →  extraction du texte  →  découpage en chapitres  →  génération de questions
      →  quiz continu (une ou plusieurs réponses)  →  résultats détaillés de toutes les questions
      →  statistiques, répétition espacée, progression par chapitre
```

---

## 2. Fonctionnalités

### Import et génération
- Import par **glisser-déposer** ou sélecteur de fichier : `.docx`, `.txt` ou `.md`
  (les anciens `.doc` sont refusés avec un message explicite).
- Extraction du texte **entièrement locale** (ZIP + `DecompressionStream`, repli sur Mammoth.js).
- Détection automatique des chapitres (`CHAPITRE I`, `PARTIE 2`, `MODULE`, `LEÇON`, `SECTION`…).
- Génération de questions ancrées dans le texte (définitions, sigles, données chiffrées, listes,
  y compris **listes à réponses multiples**).
- Distracteurs tirés du **même cours**.
- Identifiants de questions **stables** : réimporter le même cours conserve la progression.
- Nombre de questions par quiz configurable : **5, 10, 15 ou 20**.

### Révision (quiz continu)
- Questions enchaînées **sans correction immédiate** : tu choisis **une ou plusieurs réponses**
  puis tu cliques sur **Suivant** (aucune réponse sélectionnée compte comme fausse).
- À la fin du quiz, une page de résultats affiche **toutes les questions** avec :
  tes choix, la/les bonne(s) réponse(s), l'explication et la source, et un filtre **Tout / Erreurs**.
- Deux modes : **quiz normal** (toutes les parties ou un chapitre) et **Réviser mes erreurs**.
- Sélection **adaptative** : les questions ratées et échues reviennent en priorité.
- **Répétition espacée** par boîtes (0, 1, 3, 7, 14, 30 jours ; échec → retour sous 10 minutes).
- Raccourcis clavier (voir [§4](#raccourcis-clavier)).

### Suivi
- Tableau de bord : maîtrise par chapitre, notions difficiles, historique des quiz,
  **activité des 7 derniers jours**.
- **Objectif quotidien** de réponses (configurable) avec suivi du jour.
- Statistiques : précision, séries (streak), questions vues, niveau (`Nouveau` → `Expert`).
- Thème **sombre / clair / automatique**.

### Données
- **Export / import** de la progression et des banques de questions en JSON.
- Export des questions du cours actif en **CSV** ou en **Anki** (texte séparé par tabulations).
- Réinitialisation séparée : statistiques seules, ou toutes les données.

### IA (optionnelle)
- Trois moteurs : **Local** (hors ligne, par défaut), **opencode local** (sans clé API),
  ou **proxy IA** compatible OpenAI.
- **opencode** : le serveur appelle `opencode run` sur ta machine avec un modèle gratuit
  (ex. `opencode/deepseek-v4.1-flash-free`) ; aucune clé API requise.
- **Proxy OpenAI-compatible** : la clé API reste côté serveur, jamais dans le navigateur
  (OpenAI, Groq, Mistral, Ollama, LM Studio, OpenRouter…).
- Les questions renvoyées par l'IA sont **validées** côté serveur : les citations « source »
  introuvables dans le cours sont écartées.
- Sans IA configurée, le mode local reste actif.

### Hors ligne (PWA)
- Manifeste web et service worker : l'application peut être installée et son interface
  mise en cache pour un usage hors ligne.
- La génération locale fonctionne hors ligne ; la génération IA nécessite le serveur/réseau.

---

## 3. Démarrage rapide

### Prérequis

| Usage | Requis |
|---|---|
| Consulter l'application | Un navigateur récent (Chrome/Edge 80+, Firefox 113+, Safari 16.4+) |
| Serveur local / IA / PWA | **Node.js 18+** (testé avec Node 20) |
| Génération via opencode | [opencode](https://opencode.ai) installé sur la machine |
| Lancer les tests | Node.js 18+ |

### Option A — sans serveur (le plus rapide)

Ouvre simplement `index.html` dans le navigateur. Le mode local fonctionne, mais l'IA et
l'installation PWA nécessitent un serveur HTTP.

### Option B — serveur local (recommandé)

```powershell
npm start
# ou : node server/server.js
```

Puis ouvre **http://localhost:8787**.

- Port/hôte personnalisables : `$env:PORT=9000; $env:HOST="127.0.0.1"; node server/server.js`
- Aucune installation : le serveur n'utilise que les modules natifs de Node.

### Option C — génération via opencode (sans clé API)

1. Installe [opencode](https://opencode.ai) et vérifie : `opencode --version`.
2. Lance le serveur local (`npm start`), puis ouvre l'application.
3. **Réglages → Génération des questions** :
   - Moteur : **opencode local**
   - Modèle : ex. `opencode/deepseek-v4.1-flash-free`
   - Cocher **Utiliser l'IA à l'import des documents**
   - **Tester la connexion**, puis **Enregistrer**

> La génération IA peut prendre 1 à 2 minutes selon le modèle et la taille du cours.
> Les modèles gratuits d'opencode ne nécessitent pas de clé (`opencode auth list`).

### Option D — proxy OpenAI-compatible

```powershell
$env:OPENAI_API_KEY="sk-..."                        # obligatoire
$env:OPENAI_MODEL="gpt-4o-mini"                     # facultatif
$env:OPENAI_BASE_URL="https://api.openai.com/v1"    # facultatif
$env:AI_PROVIDER="openai"                            # facultatif (auto par défaut)
node server/server.js
```

Puis dans **Réglages** : moteur **Proxy IA personnalisé**, renseigne le point d'API
(`http://localhost:8787/api/generate`), active l'IA, teste et enregistre.

> Sans `OPENAI_API_KEY` ni opencode installé, `/api/generate` renvoie une erreur explicite ;
> l'application continue de fonctionner en mode local.

---

## 4. Utilisation

### Parcours type

1. **Accueil** — vue d'ensemble, objectif du jour, reprise du dernier cours.
2. **Mes cours** — importer un `.docx`, choisir le cours actif, puis un chapitre
   (ou « Toutes les parties »).
3. **Quiz** — pour chaque question, sélectionner une ou plusieurs réponses puis cliquer sur
   **Suivant** (la progression indique le numéro de question, pas le score).
4. **Résultats** — score, durée, puis le **détail de toutes les questions** (tes choix,
   bonnes réponses, explications, sources) avec filtre Tout / Erreurs.
5. **Progression** — maîtrise par chapitre, notions difficiles, historique, activité sur 7 jours.
6. **Réglages** — moteur IA, nombre de questions, objectif, thème, exports et sauvegarde.

### Raccourcis clavier

| Touche | Action |
|---|---|
| `1` – `4` ou `A` – `D` | Sélectionner / désélectionner une proposition |
| `Entrée` | Passer à la question suivante (ou voir les résultats) |

---

## 5. Comment ça marche

### 5.1 Pipeline

```
File (.docx)
   │  DocxReader.readFile()
   ▼
Texte structuré (titres, paragraphes, puces)
   │  QuestionGenerator.generate()
   ▼
Banque : { document, chapters[{ id, title, questions[] }], stats }
   │  QuizEngine.buildSession()
   ▼
Session (sélection pondérée + répétition espacée, réponses mélangées)
   │  [réponses collectées sans correction immédiate]
   ▼
QuizEngine.evaluate() → ProgressManager.recordAnswer() + recordQuiz()
```

### 5.2 Extraction DOCX (`docx-reader.js`)

Les fichiers `.txt` et `.md` sont lus directement. Un `.docx` est une archive ZIP. Le module :

1. lit le **répertoire central** du ZIP pour localiser `word/document.xml` ;
2. décompresse l'entrée avec l'API native `DecompressionStream('deflate-raw')` ;
3. convertit le XML Word en texte brut structuré (`w:p`, `w:t`, `w:tab`, sauts de ligne) ;
4. nettoie les artefacts (espaces insécables, puces, numérotation).

Repli automatique sur **Mammoth.js** si l'API native n'est pas disponible.
Aucun fichier n'est envoyé sur le réseau.

### 5.3 Génération locale (`question-generator.js`)

Pour chaque chapitre, le générateur extrait des candidats puis les transforme en QCM à 4
propositions : définitions, sigles/acronymes, données chiffrées, listes (appartenance,
exclusion, dénombrement, **réponses multiples**). Règles de qualité :

- 4 propositions **uniques**, distracteurs issus du même document ;
- phrases trop longues et intitulés de section écartés ;
- dédoublonnage par clé normalisée ; maximum **26 questions par chapitre** ;
- identifiants **stables** (réimport = progression conservée).

### 5.4 Sélection adaptative (`quiz-engine.js`)

Chaque question reçoit un poids selon son historique (taux d'erreur, boîte, échéance,
récence). Les questions **jamais vues** sont prioritaires ; une part des places est réservée
aux questions échouées/échues. Tirage **pondéré sans remise**, mélange des propositions.
Si un chapitre manque de questions, la session est complétée avec les autres chapitres
**du même document**.

Les questions à réponses multiples portent un champ `answers` (tableau d'indices) ; la
réponse est correcte uniquement si la sélection correspond **exactement** à l'ensemble attendu.

### 5.5 Répétition espacée (`progress-manager.js`)

| Événement | Effet |
|---|---|
| Bonne réponse | `box + 1` (max 5), échéance = aujourd'hui + `BOX_INTERVALS[box]` |
| Mauvaise réponse | `box = 0`, échéance = maintenant + **10 minutes** |

`BOX_INTERVALS = [0, 1, 3, 7, 14, 30]` jours.

### 5.6 Génération IA (`server/ai/*`, `ai-connector.js`)

```
Navigateur ──POST /api/generate──► serveur Node ──► opencode run  (local, sans clé)
    { text, count, chapterTitle }        │         └─► fournisseur OpenAI-compatible
                                        └─ validation des citations « source »
```

- **opencode** : exécute `opencode run --standalone --format json --file cours.txt` dans un
  répertoire temporaire avec permissions refusées ; la sortie NDJSON est parsée et validée.
- **OpenAI-compatible** : clé API côté serveur (`OPENAI_API_KEY`), jamais dans le navigateur.
- Sécurité serveur : limitation de débit (30 requêtes / 10 min par IP par défaut), limite de
  corps (5 Mo), validation/normalisation des questions, en-têtes de sécurité et CSP, CORS
  + pré-requêtes `OPTIONS`.

---

## 6. Structure du projet

```
CRT/
├── index.html                 # Interface (vues, PWA, accessibilité ARIA)
├── style.css                  # Thème sombre/clair, responsive
├── app.js                     # Navigation, quiz continu, résultats, réglages
├── docx-reader.js             # Extraction de texte .docx (ZIP natif, repli Mammoth)
├── question-generator.js      # Génération locale de questions + normalisation preset
├── quiz-engine.js             # Moteur pur : sélection pondérée, correction multi-réponses
├── progress-manager.js        # Persistance, statistiques, SRS, activité, export
├── ai-connector.js            # Client de l'API IA + validation des questions reçues
├── manifest.webmanifest       # Manifeste PWA
├── sw.js                      # Service worker (cache hors ligne, /api en réseau)
├── data/
│   └── preset-course.js       # Banque CRT 2024 (9 chapitres, 140 questions)
├── icons/                     # Icônes PWA (générées)
├── server/
│   ├── server.js              # Serveur statique + API (/api/generate, /api/ai/status)
│   └── ai/
│       ├── index.js           # Orchestration, validation, limitation de débit
│       ├── opencode.js        # Fournisseur opencode local
│       ├── openai.js          # Fournisseur OpenAI-compatible
│       └── prompt.js          # Construction du prompt et validation des citations
├── tools/
│   └── generate-icons.js      # Génération des icônes PNG sans dépendance
├── tests/
│   ├── test-logic.js          # 25 tests (extraction, génération, moteur, SRS)
│   ├── test-opencode.js       # 11 tests IA (faux binaire, validation, débit)
│   ├── fixtures/fake-opencode.js
│   ├── headless.html          # Test d'intégration navigateur
│   └── preview-generation.js  # Aperçu console des questions générées
├── .github/workflows/
│   ├── ci.yml                 # Tests Node (20/22)
│   └── static.yml             # Déploiement GitHub Pages
├── package.json               # Scripts start/test/check (aucune dépendance)
└── CRT 2024.docx              # Cours source de démonstration
```

Les modules cœur (`docx-reader`, `question-generator`, `quiz-engine`, `progress-manager`,
`ai-connector`) sont en UMD : utilisables dans le navigateur **et** dans Node.

---

## 7. Données et confidentialité

- **Aucun envoi réseau** en mode local : le DOCX est lu et découpé dans le navigateur.
- En mode IA, seul le **texte du chapitre** (60 000 caractères max) est transmis au serveur
  local, qui peut l'envoyer à opencode (local) ou à un fournisseur configuré.
- La clé API (mode OpenAI) ne quitte jamais le serveur ; elle n'est jamais écrite dans le navigateur.
- Progression et banques de questions vivent dans `localStorage` :

| Clé | Contenu |
|---|---|
| `quizmaster.v1` | Statistiques, historique, réglages, métadonnées des cours |
| `quizmaster.v1.bank.<id>` | Banque de questions d'un cours importé |

> La progression est **propre à chaque navigateur**. Pour changer d'appareil, utilise
> **Réglages → Exporter ma progression**, puis **Importer une sauvegarde**.

---

## 8. Tests

### Vérification syntaxique et tests (Node, aucune dépendance)

```powershell
npm run check   # node --check sur les modules principaux
npm test        # tests/test-logic.js + tests/test-opencode.js
```

Résultat attendu : **25 + 11 réussis, 0 échoué**. Couverture :

- extraction du DOCX réel et détection des chapitres ;
- validité de la banque préchargée et génération locale (déterminisme, types) ;
- moteur : sessions sans doublon, mélange, réponses multiples (exact/partiel/trop large),
  sélection adaptative, questions échouées, mode révision ;
- correction et messages de résultat ;
- répétition espacée, activité jour/semaine, historique, statistiques, progression par chapitre ;
- export / import / réinitialisation ;
- simulation de 10 sessions successives ;
- fournisseur opencode : détection, parsing NDJSON, validation des citations, génération
  avec faux binaire, limitation de débit.

Les tests IA utilisent `tests/fixtures/fake-opencode.js` : aucun réseau, aucun appel réel
au modèle.

### Tests navigateur

```powershell
npm start
# puis ouvrir http://localhost:8787/tests/headless.html
```

---

## 9. Déploiement

### GitHub Pages (gratuit, sans backend)

Le workflow `.github/workflows/static.yml` publie la racine du dépôt sur GitHub Pages à
chaque push sur `main` (ou manuellement depuis l'onglet **Actions**).

- `Settings → Pages` → Source : **GitHub Actions**
- URL : `https://<utilisateur>.github.io/<repo>/`
- Fonctionne en mode **local** (génération dans le navigateur). L'IA (opencode/proxy) n'est
  pas disponible : il n'y a pas de serveur.

### Application + IA (Node)

```powershell
node server/server.js
# Variables utiles : PORT, HOST, AI_PROVIDER, OPENCODE_MODEL, OPENAI_API_KEY, OPENAI_MODEL
```

Sur un hébergeur Node (Render, Railway, Fly.io…), commande de démarrage
`node server/server.js` : le serveur écoute `process.env.PORT`. Application et API partagent
la même origine. Si tu exposes le serveur publiquement, garde la limitation de débit active
et protège l'accès selon ton besoin.

### Statique + fonction serverless

Possible en portant `server/ai/*` + la route `/api/generate` vers une fonction
(Netlify/Vercel/Cloudflare). `server/server.js` gère déjà CORS et les pré-requêtes `OPTIONS`.

---

## 10. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `EADDRINUSE :::8787` | Un serveur tourne déjà | Changer `PORT` ou fermer l'ancien processus |
| « Stockage local indisponible » | Navigation privée / cookies bloqués | Autoriser le stockage ou exporter la progression |
| « Texte de cours trop court » | Document quasi vide | Vérifier que le texte est dans le corps du DOCX |
| Aucune question générée | Document peu structuré | Ajouter des titres/listes, ou activer l'IA |
| opencode « introuvable » | opencode absent ou serveur non lancé | Installer opencode, ouvrir via `http://localhost:8787`, vérifier `OPENCODE_BIN` |
| IA : `503` / erreur fournisseur | Pas de fournisseur disponible | Installer opencode ou définir `OPENAI_API_KEY` côté serveur |
| IA lente / timeout | Génération longue | Réduire le nombre de questions, attendre 1–2 min, vérifier le modèle |
| Questions IA peu nombreuses | Citations non vérifiables écartées | Normal : seules les questions sourcées dans le cours sont conservées |
| PWA non installable | Ouvert en `file://` | Ouvrir via le serveur local (HTTPS/localhost) |

---

## 11. Limites connues

- **Pas de synchronisation multi-appareils** : progression locale au navigateur (export/import manuel).
- **Hors-ligne partiel** : l'interface est mise en cache, mais la génération IA et l'import
  enrichi par IA nécessitent réseau/serveur.
- **Extraction limitée à DOCX / TXT / MD** : pas de PDF, ODT, PPTX ni `.doc` ancien.
- **Génération locale heuristique** : pas de compréhension sémantique ; qualité dépend de la
  structure du document.
- **Pas de comptes ni de partage** de banques entre utilisateurs.
- **Tests navigateur** : logique couverte en Node, page d'intégration manuelle disponible mais
  pas d'E2E automatisé (Playwright).

---

## 12. Feuille de route

### Réalisé récemment
- [x] Quiz continu multi-réponses avec **résultats détaillés de toutes les questions** à la fin.
- [x] Fournisseur **opencode local** (`opencode run`, sans clé API), validation des citations.
- [x] CORS + `OPTIONS`, limitation de débit, timeout IA, en-têtes de sécurité/CSP.
- [x] `package.json` + CI GitHub Actions (Node 20/22).
- [x] PWA (manifest, service worker, icônes) et thème sombre/clair/auto.
- [x] Objectif quotidien, graphique d'activité 7 jours, nombre de questions configurable.
- [x] Export des questions en **CSV** et **Anki**.

### À faire
- [ ] Import **PDF / ODT / PPTX** et import multiple amélioré.
- [ ] Régénération ciblée d'un chapitre ; difficulté adaptative paramétrable.
- [ ] Sauvegarde/export automatisé et synchronisation multi-appareils.
- [ ] Partage de banques de questions, tableau de bord enseignant.
- [ ] Internationalisation (i18n).
- [ ] E2E automatisé (Playwright) et tests navigateur supplémentaires.

---

## 13. Licence

Aucune licence n'est encore déclarée dans ce dépôt. Le contenu de démonstration
(`CRT 2024.docx` et `data/preset-course.js`) appartient à la Croix-Rouge Togolaise ;
vérifier les droits avant toute redistribution.

Pour ouvrir le code, ajouter un fichier `LICENSE` (MIT ou Apache-2.0 sont adaptés à ce type
de projet) et mettre à jour cette section.
