# Quiz Master â€” Coach de rÃ©vision

Transforme un cours Word (`.docx`) en quiz Ã  choix multiples **sans inventer de contenu** :
chaque question est construite Ã  partir d'une phrase, d'une dÃ©finition, d'une liste ou d'un
chiffre rÃ©ellement prÃ©sent dans le document source.

Application web (HTML + CSS + JavaScript, modules UMD), sans build ni dÃ©pendance : le DOCX
est lu localement, la progression est stockÃ©e dans `localStorage`, et un petit serveur Node
optionnel sert Ã  la gÃ©nÃ©ration de questions par IA (proxy OpenAI ou **opencode** local).

> Cours de dÃ©monstration inclus : **Manuel de Secourisme â€” CRT 2024**
> (Croix-Rouge Togolaise, DÃ©partement Secours et Gestion des Catastrophes),
> 9 chapitres, **146 questions** prÃªtes Ã  l'emploi.

---

## Sommaire

1. [AperÃ§u](#1-aperÃ§u)
2. [FonctionnalitÃ©s](#2-fonctionnalitÃ©s)
3. [DÃ©marrage rapide](#3-dÃ©marrage-rapide)
4. [Utilisation](#4-utilisation)
5. [Comment Ã§a marche](#5-comment-Ã§a-marche)
6. [Structure du projet](#6-structure-du-projet)
7. [DonnÃ©es et confidentialitÃ©](#7-donnÃ©es-et-confidentialitÃ©)
8. [Tests](#8-tests)
9. [DÃ©ploiement](#9-dÃ©ploiement)
10. [DÃ©pannage](#10-dÃ©pannage)
11. [Limites connues](#11-limites-connues)
12. [Feuille de route](#12-feuille-de-route)
13. [Licence](#13-licence)

---

## 1. AperÃ§u

| | |
|---|---|
| **Type** | Application web (HTML + CSS + JavaScript, modules UMD) |
| **DÃ©pendances** | Aucune (ni `npm install`, ni bundler) |
| **Backend** | Facultatif â€” `server/server.js` (Node.js 18+, zÃ©ro dÃ©pendance) |
| **Stockage** | `localStorage` (clÃ© `quizmaster.v1`) |
| **Langue** | FranÃ§ais |
| **Tests** | 25 tests logique + 11 tests IA (Node), 1 page d'intÃ©gration navigateur |

Le parcours complet :

```
DOCX  â†’  extraction du texte  â†’  dÃ©coupage en chapitres  â†’  gÃ©nÃ©ration de questions
      â†’  quiz continu (une ou plusieurs rÃ©ponses)  â†’  rÃ©sultats dÃ©taillÃ©s de toutes les questions
      â†’  statistiques, rÃ©pÃ©tition espacÃ©e, progression par chapitre
```

---

## 2. FonctionnalitÃ©s

### Import et gÃ©nÃ©ration
- Import par **glisser-dÃ©poser** ou sÃ©lecteur de fichier : `.docx`, `.txt` ou `.md`
  (les anciens `.doc` sont refusÃ©s avec un message explicite).
- Extraction du texte **entiÃ¨rement locale** (ZIP + `DecompressionStream`, repli sur Mammoth.js).
- DÃ©tection automatique des chapitres (`CHAPITRE I`, `PARTIE 2`, `MODULE`, `LEÃ‡ON`, `SECTION`â€¦).
- GÃ©nÃ©ration de questions ancrÃ©es dans le texte (dÃ©finitions, sigles, donnÃ©es chiffrÃ©es, listes,
  y compris **listes Ã  rÃ©ponses multiples**).
- Distracteurs tirÃ©s du **mÃªme cours**.
- Identifiants de questions **stables** : rÃ©importer le mÃªme cours conserve la progression.
- Nombre de questions par quiz configurable : **5, 10, 15 ou 20**.

### RÃ©vision (quiz continu)
- Questions enchaÃ®nÃ©es **sans correction immÃ©diate** : tu choisis **une ou plusieurs rÃ©ponses**
  puis tu cliques sur **Suivant** (aucune rÃ©ponse sÃ©lectionnÃ©e compte comme fausse).
- Ã€ la fin du quiz, une page de rÃ©sultats affiche **toutes les questions** avec :
  tes choix, la/les bonne(s) rÃ©ponse(s), l'explication et la source, et un filtre **Tout / Erreurs**.
- Deux modes : **quiz normal** (toutes les parties ou un chapitre) et **RÃ©viser mes erreurs**.
- SÃ©lection **adaptative** : les questions ratÃ©es et Ã©chues reviennent en prioritÃ©.
- **RÃ©pÃ©tition espacÃ©e** par boÃ®tes (0, 1, 3, 7, 14, 30 jours ; Ã©chec â†’ retour sous 10 minutes).
- Raccourcis clavier (voir [Â§4](#raccourcis-clavier)).

### Suivi
- Tableau de bord : maÃ®trise par chapitre, notions difficiles, historique des quiz,
  **activitÃ© des 7 derniers jours**.
- **Objectif quotidien** de rÃ©ponses (configurable) avec suivi du jour.
- Statistiques : prÃ©cision, sÃ©ries (streak), questions vues, niveau (`Nouveau` â†’ `Expert`).
- ThÃ¨me **sombre / clair / automatique**.

### DonnÃ©es
- **Export / import** de la progression et des banques de questions en JSON.
- Export des questions du cours actif en **CSV** ou en **Anki** (texte sÃ©parÃ© par tabulations).
- RÃ©initialisation sÃ©parÃ©e : statistiques seules, ou toutes les donnÃ©es.

### IA (optionnelle)
- Trois moteurs : **Local** (hors ligne, par dÃ©faut), **opencode local** (sans clÃ© API),
  ou **proxy IA** compatible OpenAI.
- **opencode** : le serveur appelle `opencode run` sur ta machine avec un modÃ¨le gratuit
  (ex. `opencode/deepseek-v4.1-flash-free`) ; aucune clÃ© API requise.
- **Proxy OpenAI-compatible** : la clÃ© API reste cÃ´tÃ© serveur, jamais dans le navigateur
  (OpenAI, Groq, Mistral, Ollama, LM Studio, OpenRouterâ€¦).
- Les questions renvoyÃ©es par l'IA sont **validÃ©es** cÃ´tÃ© serveur : les citations Â« source Â»
  introuvables dans le cours sont Ã©cartÃ©es.
- Sans IA configurÃ©e, le mode local reste actif.

### Hors ligne (PWA)
- Manifeste web et service worker : l'application peut Ãªtre installÃ©e et son interface
  mise en cache pour un usage hors ligne.
- La gÃ©nÃ©ration locale fonctionne hors ligne ; la gÃ©nÃ©ration IA nÃ©cessite le serveur/rÃ©seau.

---

## 3. DÃ©marrage rapide

### PrÃ©requis

| Usage | Requis |
|---|---|
| Consulter l'application | Un navigateur rÃ©cent (Chrome/Edge 80+, Firefox 113+, Safari 16.4+) |
| Serveur local / IA / PWA | **Node.js 18+** (testÃ© avec Node 20) |
| GÃ©nÃ©ration via opencode | [opencode](https://opencode.ai) installÃ© sur la machine |
| Lancer les tests | Node.js 18+ |

### Option A â€” sans serveur (le plus rapide)

Ouvre simplement `index.html` dans le navigateur. Le mode local fonctionne, mais l'IA et
l'installation PWA nÃ©cessitent un serveur HTTP.

### Option B â€” serveur local (recommandÃ©)

```powershell
npm start
# ou : node server/server.js
```

Puis ouvre **http://localhost:8787**.

- Port/hÃ´te personnalisables : `$env:PORT=9000; $env:HOST="127.0.0.1"; node server/server.js`
- Aucune installation : le serveur n'utilise que les modules natifs de Node.

### Option C â€” gÃ©nÃ©ration via opencode (sans clÃ© API)

1. Installe [opencode](https://opencode.ai) et vÃ©rifie : `opencode --version`.
2. Lance le serveur local (`npm start`), puis ouvre l'application.
3. **RÃ©glages â†’ GÃ©nÃ©ration des questions** :
   - Moteur : **opencode local**
   - ModÃ¨le : ex. `opencode/deepseek-v4.1-flash-free`
   - Cocher **Utiliser l'IA Ã  l'import des documents**
   - **Tester la connexion**, puis **Enregistrer**

> La gÃ©nÃ©ration IA peut prendre 1 Ã  2 minutes selon le modÃ¨le et la taille du cours.
> Les modÃ¨les gratuits d'opencode ne nÃ©cessitent pas de clÃ© (`opencode auth list`).

### Option D â€” proxy OpenAI-compatible

```powershell
$env:OPENAI_API_KEY="sk-..."                        # obligatoire
$env:OPENAI_MODEL="gpt-4o-mini"                     # facultatif
$env:OPENAI_BASE_URL="https://api.openai.com/v1"    # facultatif
$env:AI_PROVIDER="openai"                            # facultatif (auto par dÃ©faut)
node server/server.js
```

Puis dans **RÃ©glages** : moteur **Proxy IA personnalisÃ©**, renseigne le point d'API
(`http://localhost:8787/api/generate`), active l'IA, teste et enregistre.

> Sans `OPENAI_API_KEY` ni opencode installÃ©, `/api/generate` renvoie une erreur explicite ;
> l'application continue de fonctionner en mode local.

---

## 4. Utilisation

### Parcours type

1. **Accueil** â€” vue d'ensemble, objectif du jour, reprise du dernier cours.
2. **Mes cours** â€” importer un `.docx`, choisir le cours actif, puis un chapitre
   (ou Â« Toutes les parties Â»).
3. **Quiz** â€” pour chaque question, sÃ©lectionner une ou plusieurs rÃ©ponses puis cliquer sur
   **Suivant** (la progression indique le numÃ©ro de question, pas le score).
4. **RÃ©sultats** â€” score, durÃ©e, puis le **dÃ©tail de toutes les questions** (tes choix,
   bonnes rÃ©ponses, explications, sources) avec filtre Tout / Erreurs.
5. **Progression** â€” maÃ®trise par chapitre, notions difficiles, historique, activitÃ© sur 7 jours.
6. **RÃ©glages** â€” moteur IA, nombre de questions, objectif, thÃ¨me, exports et sauvegarde.

### Raccourcis clavier

| Touche | Action |
|---|---|
| `1` â€“ `4` ou `A` â€“ `D` | SÃ©lectionner / dÃ©sÃ©lectionner une proposition |
| `EntrÃ©e` | Passer Ã  la question suivante (ou voir les rÃ©sultats) |

---

## 5. Comment Ã§a marche

### 5.1 Pipeline

```
File (.docx)
   â”‚  DocxReader.readFile()
   â–¼
Texte structurÃ© (titres, paragraphes, puces)
   â”‚  QuestionGenerator.generate()
   â–¼
Banque : { document, chapters[{ id, title, questions[] }], stats }
   â”‚  QuizEngine.buildSession()
   â–¼
Session (sÃ©lection pondÃ©rÃ©e + rÃ©pÃ©tition espacÃ©e, rÃ©ponses mÃ©langÃ©es)
   â”‚  [rÃ©ponses collectÃ©es sans correction immÃ©diate]
   â–¼
QuizEngine.evaluate() â†’ ProgressManager.recordAnswer() + recordQuiz()
```

### 5.2 Extraction DOCX (`docx-reader.js`)

Les fichiers `.txt` et `.md` sont lus directement. Un `.docx` est une archive ZIP. Le module :

1. lit le **rÃ©pertoire central** du ZIP pour localiser `word/document.xml` ;
2. dÃ©compresse l'entrÃ©e avec l'API native `DecompressionStream('deflate-raw')` ;
3. convertit le XML Word en texte brut structurÃ© (`w:p`, `w:t`, `w:tab`, sauts de ligne) ;
4. nettoie les artefacts (espaces insÃ©cables, puces, numÃ©rotation).

Repli automatique sur **Mammoth.js** si l'API native n'est pas disponible.
Aucun fichier n'est envoyÃ© sur le rÃ©seau.

### 5.3 GÃ©nÃ©ration locale (`question-generator.js`)

Pour chaque chapitre, le gÃ©nÃ©rateur extrait des candidats puis les transforme en QCM Ã  4
propositions : dÃ©finitions, sigles/acronymes, donnÃ©es chiffrÃ©es, listes (appartenance,
exclusion, dÃ©nombrement, **rÃ©ponses multiples**). RÃ¨gles de qualitÃ© :

- 4 propositions **uniques**, distracteurs issus du mÃªme document ;
- phrases trop longues et intitulÃ©s de section Ã©cartÃ©s ;
- dÃ©doublonnage par clÃ© normalisÃ©e ; maximum **26 questions par chapitre** ;
- identifiants **stables** (rÃ©import = progression conservÃ©e).

### 5.4 SÃ©lection adaptative (`quiz-engine.js`)

Chaque question reÃ§oit un poids selon son historique (taux d'erreur, boÃ®te, Ã©chÃ©ance,
rÃ©cence). Les questions **jamais vues** sont prioritaires ; une part des places est rÃ©servÃ©e
aux questions Ã©chouÃ©es/Ã©chues. Tirage **pondÃ©rÃ© sans remise**, mÃ©lange des propositions.
Si un chapitre manque de questions, la session est complÃ©tÃ©e avec les autres chapitres
**du mÃªme document**.

Les questions Ã  rÃ©ponses multiples portent un champ `answers` (tableau d'indices) ; la
rÃ©ponse est correcte uniquement si la sÃ©lection correspond **exactement** Ã  l'ensemble attendu.

### 5.5 RÃ©pÃ©tition espacÃ©e (`progress-manager.js`)

| Ã‰vÃ©nement | Effet |
|---|---|
| Bonne rÃ©ponse | `box + 1` (max 5), Ã©chÃ©ance = aujourd'hui + `BOX_INTERVALS[box]` |
| Mauvaise rÃ©ponse | `box = 0`, Ã©chÃ©ance = maintenant + **10 minutes** |

`BOX_INTERVALS = [0, 1, 3, 7, 14, 30]` jours.

### 5.6 GÃ©nÃ©ration IA (`server/ai/*`, `ai-connector.js`)

```
Navigateur â”€â”€POST /api/generateâ”€â”€â–º serveur Node â”€â”€â–º opencode run  (local, sans clÃ©)
    { text, count, chapterTitle }        â”‚         â””â”€â–º fournisseur OpenAI-compatible
                                        â””â”€ validation des citations Â« source Â»
```

- **opencode** : exÃ©cute `opencode run --standalone --format json --file cours.txt` dans un
  rÃ©pertoire temporaire avec permissions refusÃ©es ; la sortie NDJSON est parsÃ©e et validÃ©e.
- **OpenAI-compatible** : clÃ© API cÃ´tÃ© serveur (`OPENAI_API_KEY`), jamais dans le navigateur.
- SÃ©curitÃ© serveur : limitation de dÃ©bit (30 requÃªtes / 10 min par IP par dÃ©faut), limite de
  corps (5 Mo), validation/normalisation des questions, en-tÃªtes de sÃ©curitÃ© et CSP, CORS
  + prÃ©-requÃªtes `OPTIONS`.

---

## 6. Structure du projet

```
CRT/
â”œâ”€â”€ index.html                 # Interface (vues, PWA, accessibilitÃ© ARIA)
â”œâ”€â”€ style.css                  # ThÃ¨me sombre/clair, responsive
â”œâ”€â”€ app.js                     # Navigation, quiz continu, rÃ©sultats, rÃ©glages
â”œâ”€â”€ docx-reader.js             # Extraction de texte .docx (ZIP natif, repli Mammoth)
â”œâ”€â”€ question-generator.js      # GÃ©nÃ©ration locale de questions + normalisation preset
â”œâ”€â”€ quiz-engine.js             # Moteur pur : sÃ©lection pondÃ©rÃ©e, correction multi-rÃ©ponses
â”œâ”€â”€ progress-manager.js        # Persistance, statistiques, SRS, activitÃ©, export
â”œâ”€â”€ ai-connector.js            # Client de l'API IA + validation des questions reÃ§ues
â”œâ”€â”€ manifest.webmanifest       # Manifeste PWA
â”œâ”€â”€ sw.js                      # Service worker (cache hors ligne, /api en rÃ©seau)
â”œâ”€â”€ data/
â”‚   â””â”€â”€ preset-course.js       # Banque CRT 2024 (9 chapitres, 146 questions)
â”œâ”€â”€ icons/                     # IcÃ´nes PWA (gÃ©nÃ©rÃ©es)
â”œâ”€â”€ server/
â”‚   â”œâ”€â”€ server.js              # Serveur statique + API (/api/generate, /api/ai/status)
â”‚   â””â”€â”€ ai/
â”‚       â”œâ”€â”€ index.js           # Orchestration, validation, limitation de dÃ©bit
â”‚       â”œâ”€â”€ opencode.js        # Fournisseur opencode local
â”‚       â”œâ”€â”€ openai.js          # Fournisseur OpenAI-compatible
â”‚       â””â”€â”€ prompt.js          # Construction du prompt et validation des citations
â”œâ”€â”€ tools/
â”‚   â””â”€â”€ generate-icons.js      # GÃ©nÃ©ration des icÃ´nes PNG sans dÃ©pendance
â”œâ”€â”€ tests/
â”‚   â”œâ”€â”€ test-logic.js          # 25 tests (extraction, gÃ©nÃ©ration, moteur, SRS)
â”‚   â”œâ”€â”€ test-opencode.js       # 11 tests IA (faux binaire, validation, dÃ©bit)
â”‚   â”œâ”€â”€ fixtures/fake-opencode.js
â”‚   â”œâ”€â”€ headless.html          # Test d'intÃ©gration navigateur
â”‚   â””â”€â”€ preview-generation.js  # AperÃ§u console des questions gÃ©nÃ©rÃ©es
â”œâ”€â”€ .github/workflows/
â”‚   â”œâ”€â”€ ci.yml                 # Tests Node (20/22)
â”‚   â””â”€â”€ static.yml             # DÃ©ploiement GitHub Pages
â”œâ”€â”€ package.json               # Scripts start/test/check (aucune dÃ©pendance)
â””â”€â”€ CRT 2024.docx              # Cours source de dÃ©monstration
```

Les modules cÅ“ur (`docx-reader`, `question-generator`, `quiz-engine`, `progress-manager`,
`ai-connector`) sont en UMD : utilisables dans le navigateur **et** dans Node.

---

## 7. DonnÃ©es et confidentialitÃ©

- **Aucun envoi rÃ©seau** en mode local : le DOCX est lu et dÃ©coupÃ© dans le navigateur.
- En mode IA, seul le **texte du chapitre** (60 000 caractÃ¨res max) est transmis au serveur
  local, qui peut l'envoyer Ã  opencode (local) ou Ã  un fournisseur configurÃ©.
- La clÃ© API (mode OpenAI) ne quitte jamais le serveur ; elle n'est jamais Ã©crite dans le navigateur.
- Progression et banques de questions vivent dans `localStorage` :

| ClÃ© | Contenu |
|---|---|
| `quizmaster.v1` | Statistiques, historique, rÃ©glages, mÃ©tadonnÃ©es des cours |
| `quizmaster.v1.bank.<id>` | Banque de questions d'un cours importÃ© |

> La progression est **propre Ã  chaque navigateur**. Pour changer d'appareil, utilise
> **RÃ©glages â†’ Exporter ma progression**, puis **Importer une sauvegarde**.

---

## 8. Tests

### VÃ©rification syntaxique et tests (Node, aucune dÃ©pendance)

```powershell
npm run check   # node --check sur les modules principaux
npm test        # tests/test-logic.js + tests/test-opencode.js
```

RÃ©sultat attendu : **25 + 11 rÃ©ussis, 0 Ã©chouÃ©**. Couverture :

- extraction du DOCX rÃ©el et dÃ©tection des chapitres ;
- validitÃ© de la banque prÃ©chargÃ©e et gÃ©nÃ©ration locale (dÃ©terminisme, types) ;
- moteur : sessions sans doublon, mÃ©lange, rÃ©ponses multiples (exact/partiel/trop large),
  sÃ©lection adaptative, questions Ã©chouÃ©es, mode rÃ©vision ;
- correction et messages de rÃ©sultat ;
- rÃ©pÃ©tition espacÃ©e, activitÃ© jour/semaine, historique, statistiques, progression par chapitre ;
- export / import / rÃ©initialisation ;
- simulation de 10 sessions successives ;
- fournisseur opencode : dÃ©tection, parsing NDJSON, validation des citations, gÃ©nÃ©ration
  avec faux binaire, limitation de dÃ©bit.

Les tests IA utilisent `tests/fixtures/fake-opencode.js` : aucun rÃ©seau, aucun appel rÃ©el
au modÃ¨le.

### Tests navigateur

```powershell
npm start
# puis ouvrir http://localhost:8787/tests/headless.html
```

---

## 9. DÃ©ploiement

### GitHub Pages (gratuit, sans backend)

Le workflow `.github/workflows/static.yml` publie la racine du dÃ©pÃ´t sur GitHub Pages Ã 
chaque push sur `main` (ou manuellement depuis l'onglet **Actions**).

- `Settings â†’ Pages` â†’ Source : **GitHub Actions**
- URL : `https://<utilisateur>.github.io/<repo>/`
- Fonctionne en mode **local** (gÃ©nÃ©ration dans le navigateur). L'IA (opencode/proxy) n'est
  pas disponible : il n'y a pas de serveur.

### Application + IA (Node)

```powershell
node server/server.js
# Variables utiles : PORT, HOST, AI_PROVIDER, OPENCODE_MODEL, OPENAI_API_KEY, OPENAI_MODEL
```

Sur un hÃ©bergeur Node (Render, Railway, Fly.ioâ€¦), commande de dÃ©marrage
`node server/server.js` : le serveur Ã©coute `process.env.PORT`. Application et API partagent
la mÃªme origine. Si tu exposes le serveur publiquement, garde la limitation de dÃ©bit active
et protÃ¨ge l'accÃ¨s selon ton besoin.

### Statique + fonction serverless

Possible en portant `server/ai/*` + la route `/api/generate` vers une fonction
(Netlify/Vercel/Cloudflare). `server/server.js` gÃ¨re dÃ©jÃ  CORS et les prÃ©-requÃªtes `OPTIONS`.

---

## 10. DÃ©pannage

| SymptÃ´me | Cause probable | Solution |
|---|---|---|
| `EADDRINUSE :::8787` | Un serveur tourne dÃ©jÃ  | Changer `PORT` ou fermer l'ancien processus |
| Â« Stockage local indisponible Â» | Navigation privÃ©e / cookies bloquÃ©s | Autoriser le stockage ou exporter la progression |
| Â« Texte de cours trop court Â» | Document quasi vide | VÃ©rifier que le texte est dans le corps du DOCX |
| Aucune question gÃ©nÃ©rÃ©e | Document peu structurÃ© | Ajouter des titres/listes, ou activer l'IA |
| opencode Â« introuvable Â» | opencode absent ou serveur non lancÃ© | Installer opencode, ouvrir via `http://localhost:8787`, vÃ©rifier `OPENCODE_BIN` |
| IA : `503` / erreur fournisseur | Pas de fournisseur disponible | Installer opencode ou dÃ©finir `OPENAI_API_KEY` cÃ´tÃ© serveur |
| IA lente / timeout | GÃ©nÃ©ration longue | RÃ©duire le nombre de questions, attendre 1â€“2 min, vÃ©rifier le modÃ¨le |
| Questions IA peu nombreuses | Citations non vÃ©rifiables Ã©cartÃ©es | Normal : seules les questions sourcÃ©es dans le cours sont conservÃ©es |
| PWA non installable | Ouvert en `file://` | Ouvrir via le serveur local (HTTPS/localhost) |

---

## 11. Limites connues

- **Pas de synchronisation multi-appareils** : progression locale au navigateur (export/import manuel).
- **Hors-ligne partiel** : l'interface est mise en cache, mais la gÃ©nÃ©ration IA et l'import
  enrichi par IA nÃ©cessitent rÃ©seau/serveur.
- **Extraction limitÃ©e Ã  DOCX / TXT / MD** : pas de PDF, ODT, PPTX ni `.doc` ancien.
- **GÃ©nÃ©ration locale heuristique** : pas de comprÃ©hension sÃ©mantique ; qualitÃ© dÃ©pend de la
  structure du document.
- **Pas de comptes ni de partage** de banques entre utilisateurs.
- **Tests navigateur** : logique couverte en Node, page d'intÃ©gration manuelle disponible mais
  pas d'E2E automatisÃ© (Playwright).

---

## 12. Feuille de route

### RÃ©alisÃ© rÃ©cemment
- [x] Quiz continu multi-rÃ©ponses avec **rÃ©sultats dÃ©taillÃ©s de toutes les questions** Ã  la fin.
- [x] Fournisseur **opencode local** (`opencode run`, sans clÃ© API), validation des citations.
- [x] CORS + `OPTIONS`, limitation de dÃ©bit, timeout IA, en-tÃªtes de sÃ©curitÃ©/CSP.
- [x] `package.json` + CI GitHub Actions (Node 20/22).
- [x] PWA (manifest, service worker, icÃ´nes) et thÃ¨me sombre/clair/auto.
- [x] Objectif quotidien, graphique d'activitÃ© 7 jours, nombre de questions configurable.
- [x] Export des questions en **CSV** et **Anki**.

### Ã€ faire
- [ ] Import **PDF / ODT / PPTX** et import multiple amÃ©liorÃ©.
- [ ] RÃ©gÃ©nÃ©ration ciblÃ©e d'un chapitre ; difficultÃ© adaptative paramÃ©trable.
- [ ] Sauvegarde/export automatisÃ© et synchronisation multi-appareils.
- [ ] Partage de banques de questions, tableau de bord enseignant.
- [ ] Internationalisation (i18n).
- [ ] E2E automatisÃ© (Playwright) et tests navigateur supplÃ©mentaires.

---

## 13. Licence

Aucune licence n'est encore dÃ©clarÃ©e dans ce dÃ©pÃ´t. Le contenu de dÃ©monstration
(`CRT 2024.docx` et `data/preset-course.js`) appartient Ã  la Croix-Rouge Togolaise ;
vÃ©rifier les droits avant toute redistribution.

Pour ouvrir le code, ajouter un fichier `LICENSE` (MIT ou Apache-2.0 sont adaptÃ©s Ã  ce type
de projet) et mettre Ã  jour cette section.
