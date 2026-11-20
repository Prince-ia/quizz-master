# Quiz Master — Coach de révision

Transforme un cours Word (`.docx`) en quiz à choix multiples **sans inventer de contenu** :
chaque question est construite à partir d'une phrase, d'une définition, d'une liste ou d'un
chiffre réellement présent dans le document source.

Application **100 % côté navigateur**, sans build ni dépendance : le DOCX est lu localement,
la progression est stockée dans `localStorage`, et un petit serveur Node optionnel sert de
proxy pour une génération de questions par IA.

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
| **Type** | Application web statique (HTML + CSS + JavaScript, modules UMD) |
| **Dépendances** | Aucune (ni `npm install`, ni bundler) |
| **Backend** | Facultatif — `server/server.js` (Node.js 18+, zéro dépendance) |
| **Stockage** | `localStorage` (clé `quizmaster.v1`) |
| **Langue** | Français |
| **Tests** | 23 tests Node + 1 page d'intégration navigateur |

Le parcours complet :

```
DOCX  →  extraction du texte  →  découpage en chapitres  →  génération de questions
      →  session de 10 questions adaptative  →  correction + explication
      →  statistiques, répétition espacée, progression par chapitre
```

---

## 2. Fonctionnalités

### Import et génération
- Import par **glisser-déposer** ou sélecteur de fichier, un ou plusieurs fichiers
  `.docx`, `.txt` ou `.md` (les anciens `.doc` sont refusés avec un message explicite).
- Extraction du texte **entièrement locale** (ZIP + `DecompressionStream`, repli sur Mammoth.js).
- Détection automatique des chapitres (`CHAPITRE I`, `PARTIE 2`, `MODULE`, `LEÇON`, `SECTION`…).
- Génération de questions ancrées dans le texte, en quatre familles :
  - **définitions** (« Qu'est-ce que … ? ») ;
  - **sigles et acronymes** (développement ↔ sigle) ;
  - **données chiffrées** (fourchettes, années, quantités) ;
  - **listes** (appartenance, exclusion, dénombrement).
- Distracteurs tirés du **même cours** (autres définitions / listes du document).
- Identifiants de questions **stables** : réimporter le même cours conserve la progression.

### Révision
- Session de **10 questions** par défaut, ordre et propositions mélangés.
- Deux modes : **quiz normal** (toutes les parties ou un chapitre) et **Réviser mes erreurs**.
- Correction immédiate avec **explication** et **source** (titre du chapitre).
- Sélection **adaptative** : les questions ratées et échues reviennent en priorité.
- **Répétition espacée** par boîtes (0, 1, 3, 7, 14, 30 jours ; échec → retour sous 10 minutes).
- Raccourcis clavier (voir [§4](#raccourcis-clavier)).

### Suivi
- Tableau de bord : maîtrise par chapitre, notions difficiles, historique des quiz.
- Statistiques : précision, séries (streak), questions vues, niveau (`Nouveau` → `Expert`).
- Compteur d'occupation du stockage local.

### Données
- **Export / import** de la progression et des banques de questions en JSON.
- Réinitialisation séparée : statistiques seules, ou toutes les données.

### IA (optionnelle)
- Proxy local qui garde la **clé API côté serveur**, jamais dans le navigateur.
- Compatible avec tout fournisseur exposant une API **OpenAI-compatible**
  (OpenAI, Groq, Mistral, Ollama, LM Studio, OpenRouter…).
- Questions renvoyées par l'IA **validées et normalisées** ; toute question incomplète est écartée.
- Sans proxy configuré, le mode local reste actif.

---

## 3. Démarrage rapide

### Prérequis

| Usage | Requis |
|---|---|
| Consulter l'application | Un navigateur récent (Chrome/Edge 80+, Firefox 113+, Safari 16.4+) |
| Serveur local + proxy IA | **Node.js 18+** (testé avec Node 20) |
| Lancer les tests | Node.js 18+ |

### Option A — sans serveur (le plus rapide)

Ouvre simplement `index.html` dans le navigateur. Tout fonctionne, sauf l'IA.

### Option B — serveur local (recommandé)

```powershell
node server/server.js
```

Puis ouvre **http://localhost:8787**.

- Port personnalisable : `$env:PORT=9000; node server/server.js`
- Aucune installation : le serveur n'utilise que les modules natifs de Node.

### Option C — mode IA

```powershell
$env:OPENAI_API_KEY="sk-..."                        # obligatoire
$env:OPENAI_MODEL="gpt-4o-mini"                     # facultatif
$env:OPENAI_BASE_URL="https://api.openai.com/v1"    # facultatif (autre fournisseur compatible)
node server/server.js
```

Puis dans l'application : **Réglages → Génération des questions**

1. Point d'API : `http://localhost:8787/api/generate`
2. Cocher **Activer la génération par IA**
3. Cliquer sur **Tester la connexion**, puis **Enregistrer**

> Sans `OPENAI_API_KEY`, `/api/generate` répond `503` avec un message explicite ;
> l'application continue de fonctionner en mode local.

---

## 4. Utilisation

### Parcours type

1. **Accueil** — vue d'ensemble (précision, quiz terminés, questions vues, niveau).
2. **Mes cours** — importer un `.docx`, choisir le cours actif, puis un chapitre
   (ou « Toutes les parties »).
3. **Quiz** — répondre, valider, lire l'explication, enchaîner.
4. **Résultats** — score, durée, liste des erreurs, boutons *Rejouer* / *Réviser mes erreurs*.
5. **Progression** — maîtrise par chapitre, notions difficiles, historique.
6. **Réglages** — IA, export/import, réinitialisation.

### Raccourcis clavier

| Touche | Action |
|---|---|
| `1` – `4` ou `A` – `D` | Sélectionner une proposition |
| `Entrée` | Valider la réponse, puis passer à la question suivante |

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
Session de 10 questions (pondérée + répétition espacée)
   │  QuizEngine.evaluate()
   ▼
Résultat → ProgressManager.recordAnswer() + recordQuiz()
```

### 5.2 Extraction DOCX (`docx-reader.js`)

Les fichiers `.txt` et `.md` sont lus directement. Un `.docx` est une archive ZIP. Le module :

1. lit le **répertoire central** du ZIP pour localiser `word/document.xml` ;
2. décompresse l'entrée avec l'API native `DecompressionStream('deflate-raw')` ;
3. convertit le XML Word en texte brut structuré (`w:p`, `w:t`, `w:tab`, sauts de ligne) ;
4. nettoie les artefacts (espaces insécables, puces, numérotation).

Repli automatique sur **Mammoth.js** si l'API native n'est pas disponible.
Aucun fichier n'est envoyé sur le réseau.

### 5.3 Découpage en chapitres

`splitChapters()` repère les grands titres (`CHAPITRE`, `PARTIE`, `MODULE`, `LEÇON`,
`SECTION` suivis d'un numéro romain ou arabe) et crée un chapitre par section.
Les segments de moins de 250 caractères (lignes de sommaire) sont ignorés.
Si aucun titre n'est détecté, tout le document devient un chapitre unique
« Contenu du cours ».

### 5.4 Génération locale (`question-generator.js`)

Pour chaque chapitre, le générateur extrait des **candidats** puis les transforme en QCM à
4 propositions :

| Famille | Source dans le texte | Limite / chapitre |
|---|---|---|
| Définition | phrases de type « … est / désigne / signifie … » | 12 |
| Donnée chiffrée | fourchettes, années, quantités avec unités | 5 + 4 + 4 |
| Sigle / acronyme | `SIGLE (Expression développée)` | 4 |
| Liste | puces précédées d'une introduction annonçant la liste | 6 |

Règles de qualité :

- 4 propositions **uniques**, distracteurs issus du même document ;
- phrases trop longues, objectifs pédagogiques et intitulés de section écartés ;
- dédoublonnage par clé normalisée ;
- **maximum 26 questions par chapitre**, mélange déterministe (identifiants stables).

> Sur le manuel CRT 2024, la génération locale produit **67 questions** en plus des
> 140 questions préchargées.

### 5.5 Sélection adaptative (`quiz-engine.js`)

Chaque question reçoit un **poids** :

```
poids = 16 + 95 × taux d'erreur
      + 20  si boîte 0 ou plus d'erreurs que de réussites
      + 22…82 si la question est échue (majoration croissante, plafond 60 jours)
      × 0,3 si elle n'est pas encore échue
      − 3 × boîte (max −15)
      × 0,12 si elle vient d'être posée (état `recent`)
```

- Les questions **jamais vues** ont un poids de 100.
- **40 % des places** (au moins 1) sont réservées aux questions échouées et échues.
- Tirage **pondéré sans remise** (`weightedSample`), puis mélange des propositions.
- Si un chapitre manque de questions, la session est complétée avec les autres chapitres
  **du même document** (jamais d'un autre cours).

### 5.6 Répétition espacée (`progress-manager.js`)

| Événement | Effet |
|---|---|
| Bonne réponse | `box + 1` (max 5), échéance = aujourd'hui + `BOX_INTERVALS[box]` |
| Mauvaise réponse | `box = 0`, échéance = maintenant + **10 minutes** |

`BOX_INTERVALS = [0, 1, 3, 7, 14, 30]` jours.

### 5.7 Mode IA (`ai-connector.js` + `server/server.js`)

```
Navigateur ──POST /api/generate──► serveur Node ──► fournisseur OpenAI-compatible
   { text, count, chapterTitle }        (clé API côté serveur)      { questions: [...] }
```

- Le serveur limite le corps à **3 Mo**, le nombre de questions à **5–60**, et exige
  au moins 100 caractères de texte.
- Le prompt impose un JSON strict ; `extractJson()` tolère les blocs Markdown.
- Côté client, `normalizeQuestions()` vérifie : 4 options non vides et distinctes,
  index de réponse valide, explication présente. Les questions invalides sont **ignorées**.

---

## 6. Structure du projet

```
CRT/
├── index.html                 # Interface complète (6 vues, accessibilité ARIA)
├── style.css                  # Thème sombre, responsive, prefers-reduced-motion
├── app.js                     # Navigation, import, session de quiz, rendu
├── docx-reader.js             # Extraction de texte .docx (ZIP natif, repli Mammoth)
├── question-generator.js      # Génération locale de questions + normalisation du preset
├── quiz-engine.js             # Moteur pur : sélection pondérée, correction, messages
├── progress-manager.js        # Persistance, statistiques, répétition espacée, export
├── ai-connector.js            # Client du proxy IA + validation des questions reçues
├── data/
│   └── preset-course.js       # Banque CRT 2024 (9 chapitres, 140 questions)
├── server/
│   └── server.js              # Serveur statique + proxy /api/generate (zéro dépendance)
├── tests/
│   ├── test-logic.js          # 23 tests Node (extraction, génération, moteur, SRS)
│   ├── headless.html          # Test d'intégration navigateur (via le serveur local)
│   └── preview-generation.js  # Aperçu console des questions générées
├── CRT 2024.docx              # Cours source de démonstration
└── .gitignore
```

### Rôle des modules

| Module | Responsabilité | Dépend du DOM ? |
|---|---|---|
| `docx-reader.js` | Fichier → texte | Non (Web API seulement) |
| `question-generator.js` | Texte → banque de questions | Non |
| `quiz-engine.js` | Banque + stats → session, correction | Non |
| `progress-manager.js` | État persistant, statistiques, export | Non (storage injectable) |
| `ai-connector.js` | Appel du proxy, validation | Non (`fetch`) |
| `app.js` | Orchestration et interface | **Oui** |

Les cinq premiers modules sont en UMD : utilisables dans le navigateur **et** dans Node,
ce qui permet de les tester sans DOM.

---

## 7. Données et confidentialité

- **Aucun envoi réseau** en mode local : le DOCX est lu et découpé dans le navigateur.
- En mode IA, seul le **texte du chapitre** (12 000 caractères max) est transmis au proxy.
- La clé API ne quitte jamais le serveur ; elle n'est jamais écrite dans le navigateur.
- Progression et banques de questions vivent dans `localStorage` :

| Clé | Contenu |
|---|---|
| `quizmaster.v1` | Statistiques, historique, réglages, métadonnées des cours |
| `quizmaster.v1.bank.<id>` | Banque de questions d'un cours importé |

> Conséquence : la progression est **propre à chaque navigateur**. Pour changer d'appareil,
> utilise **Réglages → Exporter ma progression**, puis **Importer une sauvegarde**.

Format d'export :

```json
{
  "app": "quiz-master",
  "version": 1,
  "exportedAt": 1730000000000,
  "state": { "documents": [], "quizzes": [], "questionStats": {}, "settings": {} },
  "banks": { "<documentId>": { "document": {}, "chapters": [] } }
}
```

---

## 8. Tests

### Tests de logique (Node, aucune dépendance)

```powershell
node tests/test-logic.js
```

Résultat attendu : **23 réussis, 0 échoué**. Couverture :

- extraction du DOCX réel et détection des chapitres ;
- validité de la banque préchargée (140 questions, ≥ 10 par chapitre) ;
- génération locale : richesse, diversité des types, déterminisme ;
- moteur : 10 questions sans doublon, mélange des options, filtrage par chapitre,
  priorité aux questions inédites, retour des questions échouées ;
- correction et messages de résultat ;
- répétition espacée, historique, statistiques, progression par chapitre ;
- export / import / réinitialisation ;
- simulation de 10 sessions successives.

### Aperçu des questions générées

```powershell
node tests/preview-generation.js
```

### Test d'intégration navigateur

Lance le serveur, puis ouvre **http://localhost:8787/tests/headless.html**.
La page pilote l'application dans une iframe : navigation, quiz complet, import réel du
DOCX, export de sauvegarde, bibliothèque.

---

## 9. Déploiement

L'application étant statique, tout hébergement de fichiers convient. Le proxy IA, lui,
nécessite un environnement Node ou une fonction serverless.

### GitHub Pages (gratuit, sans backend)

Le dépôt contient déjà le workflow `.github/workflows/static.yml` : chaque push sur `main`
publie la racine du dépôt sur GitHub Pages.

1. `Settings → Pages` → Source : **GitHub Actions**
2. Pousser sur `main`, ou lancer le workflow manuellement depuis l'onglet **Actions**
3. URL : `https://<utilisateur>.github.io/quizz-master/`

Fonctionne sans configuration (chemins relatifs). **L'IA n'est pas disponible** :
il n'y a pas de serveur pour détenir la clé. Le workflow publie tout le dépôt
(`tests/`, le `.docx` inclus) ; restreindre `path` dans le workflow si besoin.

### Render / Railway / Fly.io (application + IA)

| Réglage | Valeur |
|---|---|
| Build command | *(vide)* |
| Start command | `node server/server.js` |
| Variables | `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL` |

Le serveur écoute déjà `process.env.PORT`. Application et proxy partagent la même origine :
**aucun problème de CORS**. (Sur l'offre gratuite Render, le service s'endort après
inactivité : le premier chargement est lent.)

### Netlify / Vercel / Cloudflare Pages (statique + fonction)

- Application : build vide, répertoire de publication `.` (ou glisser-déposer le dossier).
- IA : convertir `server/server.js` en fonction serverless (`netlify/functions/generate.js`,
  `api/generate.js` sur Vercel, `functions/api/generate.js` sur Cloudflare).

La fonction doit impérativement :

- lire la clé dans les variables d'environnement ;
- répondre aux requêtes **`OPTIONS`** (preflight) ;
- renvoyer `Access-Control-Allow-Origin` pour l'origine de l'application.

> ⚠️ `server/server.js` ne gère pas encore CORS : en l'état, un déploiement « statique
> sur un domaine + proxy sur un autre » est bloqué par le navigateur.

### Avant de publier

- Ne jamais committer de clé API (`.gitignore` couvre déjà `.env`).
- Définir un quota/budget côté fournisseur IA.
- Vérifier que `CRT 2024.docx` peut être distribué (droits sur le contenu).

---

## 10. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `EADDRINUSE :::8787` | Un serveur tourne déjà | Utiliser `$env:PORT=9000` ou fermer l'ancien processus |
| « Stockage local indisponible » | Navigation privée / cookies bloqués | Autoriser le stockage ou exporter la progression |
| « Texte de cours trop court » | Document quasi vide | Vérifier que le texte est dans le corps du DOCX (pas dans des images) |
| Aucune question générée | Document sans titres ni listes exploitables | Ajouter des titres `CHAPITRE`/`PARTIE`, ou activer l'IA |
| IA : `503` | `OPENAI_API_KEY` absente | Définir la variable **avant** de lancer le serveur |
| IA : erreur réseau / CORS | Proxy sur un autre domaine | Héberger l'app et le proxy sur la même origine, ou ajouter CORS |
| Questions IA rejetées | Réponse non conforme | Vérifier le modèle ; le client écarte les questions incomplètes |

---

## 11. Limites connues

- **Pas de synchronisation multi-appareils** : la progression est locale au navigateur
  (export/import manuel uniquement).
- **Pas de mode hors-ligne** : aucune PWA / service worker pour l'instant.
- **Extraction limitée à DOCX / TXT / MD** : pas de PDF, ODT, PPTX ni `.doc` ancien.
- **Génération locale heuristique** : pas de compréhension sémantique ; les questions sont
  littérales et parfois répétitives sur les documents peu structurés.
- **Pas de difficulté progressive** : les 10 questions sont tirées pondérément, sans niveau.
- **CORS absent** côté serveur (voir §9).
- **Pas de limitation de débit** sur `/api/generate` : à protéger avant exposition publique.
- **Accessibilité partielle** : ARIA présent, mais pas d'audit lecteur d'écran ni de
  gestion fine du focus après validation.
- **Tests** : logique couverte, mais pas de tests unitaires pour `ai-connector.js` ni
  d'E2E automatisé (Playwright).

---

## 12. Feuille de route

### Priorité haute — robustesse et déploiement

- [ ] **CORS + `OPTIONS`** dans `server/server.js` (déploiement découplé).
- [ ] **`package.json`** avec `start`, `test`, `engines` + **CI GitHub Actions**
      (tests sur chaque push).
- [ ] **Limitation de débit** et **timeout** sur l'appel IA (protection du proxy public).
- [ ] Tests unitaires `ai-connector.js` + E2E Playwright des parcours.
- [ ] `Content-Security-Policy` et en-têtes de sécurité dans `server.js`.

### Priorité moyenne — expérience utilisateur

- [ ] **PWA** : `manifest.json` + service worker → installation et révision hors-ligne.
- [ ] **Thème clair / sombre** avec `prefers-color-scheme` et bascule manuelle.
- [ ] **Objectif quotidien** (« 10 questions par jour ») et rappel de révision.
- [ ] **Graphiques de progression** (évolution de la précision, heatmap d'activité).
- [ ] **Sauvegarde automatique** de la progression (File System Access API ou export planifié).
- [ ] Amélioration de l'accessibilité : focus après validation, annonces `aria-live`,
      contrastes, navigation clavier complète.

### Priorité moyenne — contenu

- [ ] Import **PDF / ODT / PPTX** et import multiple en une fois.
- [ ] **Régénération ciblée** d'un chapitre sans réimporter tout le cours.
- [ ] **Difficulté adaptative** (facile/moyen/difficile) et paramétrage du nombre de questions.
- [ ] Export des questions vers **Anki / CSV / PDF** pour réviser hors de l'application.
- [ ] Mode **« cours »** : fiche de révision générée à partir des définitions et listes.

### Plus tard — produit

- [ ] **Comptes et synchronisation** multi-appareils (backend + base de données).
- [ ] **Partage de banques de questions** entre utilisateurs (import par lien).
- [ ] **Tableau de bord enseignant** : suivi d'un groupe, taux de réussite par notion.
- [ ] **Internationalisation** (i18n) et prise en charge d'autres langues de cours.
- [ ] Génération IA **par lot avec relecture** (aperçu avant ajout à la banque).

---

## 13. Licence

Aucune licence n'est encore déclarée dans ce dépôt. Le contenu de démonstration
(`CRT 2024.docx` et `data/preset-course.js`) appartient à la Croix-Rouge Togolaise ;
vérifier les droits avant toute redistribution.

Pour ouvrir le code, ajouter un fichier `LICENSE` (MIT ou Apache-2.0 sont adaptés à ce type
de projet) et mettre à jour cette section.
