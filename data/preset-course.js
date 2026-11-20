/*
 * Quiz Master — Banque de questions préchargée
 * Source : « CRT 2024.docx » — Manuel de Secourisme, édition août 2024
 * Croix-Rouge Togolaise — Département Secours et Gestion des Catastrophes
 *
 * Toutes les questions, réponses et explications sont tirées du contenu réel
 * du document. Aucune information n'a été inventée.
 */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (typeof window !== 'undefined') window.QUIZMASTER_PRESET = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    document: {
      id: 'crt-2024',
      name: 'Secourisme — Manuel CRT 2024',
      source: 'CRT 2024.docx',
      edition: 'Édition août 2024',
      organization: 'Croix-Rouge Togolaise — Département Secours et Gestion des Catastrophes',
      preloaded: true
    },
    chapters: [
      /* ------------------------------------------------------------------ */
      {
        id: 'ch1',
        title: 'Chapitre I — Généralités sur le secourisme',
        questions: [
          {
            q: "Que associe le secourisme selon le manuel ?",
            o: [
              "Une technique et un état d'esprit",
              "Un diplôme et une expérience professionnelle",
              "Un médicament et un protocole hospitalier",
              "Une tenue et un véhicule d'intervention"
            ],
            a: 0,
            e: "Le secourisme est une méthode de premiers secours qui associe une technique (qu'il faut apprendre, connaître et exercer) et un état d'esprit (esprit d'initiative, de substitution, être prêt à servir).",
            s: 'Chapitre I — Définitions'
          },
          {
            q: "Qui est le volontaire secouriste ?",
            o: [
              "Celui qui sait porter le premier secours efficacement à une victime sans aggraver son état, avant l'arrivée d'une équipe spécialisée ou médicalisée",
              "Un médecin urgentiste intervenant uniquement à l'hôpital",
              "Toute personne présente sur les lieux d'un accident, même sans formation",
              "Un agent de sécurité chargé de constater les dégâts"
            ],
            a: 0,
            e: "Le volontaire secouriste est celui qui sait porter le premier secours efficacement à une victime sans aggraver son état avant l'intervention d'une équipe spécialisée ou médicalisée. Il constitue le premier maillon primordial d'une chaîne de secours.",
            s: 'Chapitre I — Le volontaire secouriste'
          },
          {
            q: "Quelle est la place du secouriste dans la chaîne de secours ?",
            o: [
              "Il est le premier maillon primordial",
              "Il est le dernier maillon, après l'hôpital",
              "Il remplace le médecin",
              "Il n'intervient qu'après les sapeurs-pompiers"
            ],
            a: 0,
            e: "Le volontaire secouriste « constitue ainsi le premier maillon primordial d'une chaîne de secours ».",
            s: 'Chapitre I — Le volontaire secouriste'
          },
          {
            q: "Que signifie la règle du PAS ?",
            o: [
              "Protéger, Alerter, Secourir",
              "Prévenir, Analyser, Soigner",
              "Protéger, Allonger, Surveiller",
              "Préparer, Alerter, Secourir"
            ],
            a: 0,
            e: "Devant un accident, l'action du secouriste se décompose en trois gestes : Protéger, Alerter, Secourir. On dit que le secouriste fait le PAS.",
            s: 'Chapitre I — Conduite à tenir devant un accident'
          },
          {
            q: "À quoi sert la protection autour d'un accident ?",
            o: [
              "À créer une zone de sécurité pour éviter un autre accident ou un sur-accident",
              "À empêcher les témoins de filmer la scène",
              "À déplacer systématiquement la victime",
              "À bloquer la circulation jusqu'à l'arrivée de la police"
            ],
            a: 0,
            e: "La protection consiste à créer une zone de sécurité autour de l'accident ou des victimes ; elle permet de protéger les victimes, les sauveteurs, les témoins et les biens, et d'éviter un autre accident ou un sur-accident.",
            s: 'Chapitre I — Protéger'
          },
          {
            q: "Parmi ces situations, laquelle fait partie des trois circonstances qui imposent une protection ?",
            o: [
              "Le danger initial ayant provoqué l'accident peut persister",
              "La victime refuse d'être transportée",
              "Les témoins sont trop nombreux",
              "L'ambulance est déjà en route"
            ],
            a: 0,
            e: "Les trois circonstances sont : le danger initial peut persister ; la situation peut s'aggraver ; l'accident peut lui-même être générateur de danger.",
            s: 'Chapitre I — Protéger'
          },
          {
            q: "Qu'est-ce que l'alerte ?",
            o: [
              "L'action d'informer un service d'urgence, les autorités et toute personne susceptible d'aider, de la présence de victimes et de la nature de l'assistance apportée",
              "Le fait de crier pour rassembler la foule",
              "Le transport de la victime vers l'hôpital",
              "La vérification du pouls de la victime"
            ],
            a: 0,
            e: "L'alerte est l'action qui consiste à informer un service d'urgence, les autorités et toute personne susceptible d'aider de la présence d'une ou plusieurs victimes, ainsi que de la nature de l'assistance apportée.",
            s: 'Chapitre I — Alerter'
          },
          {
            q: "Quel est le numéro des sapeurs-pompiers indiqué dans le manuel ?",
            o: ['118', '117', '172', '22 21 21 10'],
            a: 0,
            e: "En ville, le manuel cite la police (117), les sapeurs-pompiers (118), la Croix-Rouge Togolaise (22 21 21 10) et l'hôpital (22 21 25 01).",
            s: 'Chapitre I — Alerter en ville'
          },
          {
            q: "Quel numéro faut-il appeler pour joindre la Croix-Rouge Togolaise selon le cours ?",
            o: ['22 21 21 10', '118', '117', '172'],
            a: 0,
            e: "Le manuel indique la Croix-Rouge Togolaise au 22 21 21 10 (et l'hôpital au 22 21 25 01).",
            s: 'Chapitre I — Alerter en ville'
          },
          {
            q: "Au village, quel numéro est cité pour la gendarmerie ?",
            o: ['172', '117', '118', '22 21 25 01'],
            a: 0,
            e: "Au village, le manuel cite la gendarmerie (172), les agents de santé, les autorités locales et la section locale de la Croix-Rouge Togolaise s'il y en a.",
            s: 'Chapitre I — Alerter au village'
          },
          {
            q: "Comment doit être transmise l'alerte ?",
            o: [
              "Rapide et précise, par les moyens les plus appropriés disponibles",
              "Lente et détaillée, pour ne rien oublier",
              "Uniquement par téléphone, jamais autrement",
              "Après avoir terminé tous les soins"
            ],
            a: 0,
            e: "L'alerte, transmise au service d'urgence par les moyens les plus appropriés disponibles, doit être rapide et précise afin de diminuer les délais de mise en œuvre de la chaîne de secours et de soins.",
            s: 'Chapitre I — Alerter'
          },
          {
            q: "Le bilan réalisé par le secouriste se fait en combien de temps ?",
            o: [
              "Deux temps : bilan des fonctions vitales puis bilan des autres lésions",
              "Un seul temps : le pouls",
              "Trois temps : pouls, tension, température",
              "Quatre temps : tête, tronc, bras, jambes"
            ],
            a: 0,
            e: "Le secouriste fait rapidement le bilan en deux temps : le bilan des fonctions vitales (conscience, respiration, circulation) et le bilan des autres lésions (fractures, lésions de la peau).",
            s: 'Chapitre I — Secourir'
          },
          {
            q: "Quelles sont les trois fonctions vitales du bilan ?",
            o: [
              "Conscience, respiration, circulation",
              "Vision, audition, parole",
              "Pouls, tension, température",
              "Respiration, digestion, motricité"
            ],
            a: 0,
            e: "Le bilan des fonctions vitales consiste à vérifier la conscience, la respiration et la circulation : c'est le triangle de la vie.",
            s: 'Chapitre I — Secourir'
          },
          {
            q: "Selon le manuel, quelle proportion de la population devrait connaître les gestes d'urgence pour épargner des vies ?",
            o: [
              "Une personne sur cinq",
              "Une personne sur cent",
              "Une personne sur deux",
              "Une personne sur mille"
            ],
            a: 0,
            e: "L'introduction précise que des vies pourraient être épargnées « si une personne sur 5 connaissait les gestes d'urgence ».",
            s: 'Chapitre I — Introduction'
          }
        ]
      },

      /* ------------------------------------------------------------------ */
      {
        id: 'ch2',
        title: "Chapitre II — Examen d'un blessé",
        questions: [
          {
            q: "Que représente le triangle de la vie ?",
            o: [
              "Conscience – Respiration – Circulation",
              "Tête – Tronc – Jambes",
              "Protéger – Alerter – Secourir",
              "Pouls – Tension – Température"
            ],
            a: 0,
            e: "Le bilan des fonctions vitales consiste à observer rapidement la victime et à rechercher le triangle de la vie : CONSCIENCE – RESPIRATION – CIRCULATION.",
            s: 'Chapitre II — Bilan des fonctions vitales'
          },
          {
            q: "Comment le secouriste vérifie-t-il la conscience de la victime ?",
            o: [
              "En posant des questions simples, en donnant des ordres simples ou en la stimulant par pincement",
              "En prenant uniquement le pouls",
              "En palpant les jambes de la victime",
              "En attendant qu'elle ouvre les yeux d'elle-même"
            ],
            a: 0,
            e: "Le secouriste pose des questions simples, donne des ordres simples ou stimule la victime par pincement. Si elle répond, elle est consciente ; sinon, elle est inconsciente.",
            s: 'Chapitre II — La conscience'
          },
          {
            q: "Quelle est la fréquence respiratoire normale chez l'adulte ?",
            o: [
              "15 à 20 mouvements par minute",
              "25 à 30 mouvements par minute",
              "60 à 80 mouvements par minute",
              "100 à 120 mouvements par minute"
            ],
            a: 0,
            e: "Le mouvement respiratoire normal est de 15 à 20 mouvements/minute chez l'adulte, et de 25 à 30 chez le nourrisson.",
            s: 'Chapitre II — La respiration'
          },
          {
            q: "Quelle est la fréquence respiratoire normale chez le nourrisson ?",
            o: [
              "25 à 30 mouvements par minute",
              "15 à 20 mouvements par minute",
              "60 à 80 mouvements par minute",
              "100 à 120 mouvements par minute"
            ],
            a: 0,
            e: "Chez le nourrisson, la fréquence respiratoire normale est de 25 à 30 mouvements par minute.",
            s: 'Chapitre II — La respiration'
          },
          {
            q: "Quel est le pouls normal chez l'adulte ?",
            o: [
              "60 à 80 battements par minute",
              "100 à 120 battements par minute",
              "15 à 20 battements par minute",
              "Plus de 120 battements par minute"
            ],
            a: 0,
            e: "Le pouls normal est de 60 à 80 fois/mn chez l'adulte et de 100 à 120/mn chez le nourrisson.",
            s: 'Chapitre II — La circulation'
          },
          {
            q: "Quel est le pouls normal chez le nourrisson ?",
            o: [
              "100 à 120 battements par minute",
              "60 à 80 battements par minute",
              "15 à 20 battements par minute",
              "25 à 30 battements par minute"
            ],
            a: 0,
            e: "Le pouls normal du nourrisson est de 100 à 120 battements par minute.",
            s: 'Chapitre II — La circulation'
          },
          {
            q: "Comment le secouriste contrôle-t-il la respiration de la victime ?",
            o: [
              "En posant la main entre le thorax et l'abdomen pour voir si elle respire",
              "En écoutant uniquement le cœur",
              "En prenant le pouls au poignet",
              "En soulevant la victime par les épaules"
            ],
            a: 0,
            e: "Il pose la main entre le thorax et l'abdomen de la victime pour voir si elle respire.",
            s: 'Chapitre II — La respiration'
          },
          {
            q: "Comment se déroule le bilan des autres lésions ?",
            o: [
              "Le secouriste palpe et tâte la victime de la tête aux pieds à la recherche d'anomalies",
              "Il interroge seulement la victime sur ses antécédents",
              "Il examine uniquement la partie du corps qui fait mal",
              "Il attend les résultats des examens de l'hôpital"
            ],
            a: 0,
            e: "Le secouriste palpe et tâte la victime de la tête aux pieds à la recherche des autres lésions : lésions de la peau, fractures, etc.",
            s: 'Chapitre II — Bilan des autres lésions'
          },
          {
            q: "En cas de lésions multiples, quelle priorité le secouriste doit-il respecter ?",
            o: [
              "Les atteintes des fonctions vitales",
              "Les plaies les plus visibles",
              "Les fractures les plus douloureuses",
              "L'ordre dans lequel les lésions ont été découvertes"
            ],
            a: 0,
            e: "Le secouriste agit selon la conclusion du bilan en privilégiant les atteintes des fonctions vitales.",
            s: 'Chapitre II — Bilan des autres lésions'
          },
          {
            q: "Comment reconnaît-on une circulation menacée ?",
            o: [
              "Pouls filant avec saignement, pouls imprenable ou pouls faible",
              "Pouls régulier et bien frappé",
              "Respiration calme à 18 mouvements/minute",
              "Peau chaude et rosée"
            ],
            a: 0,
            e: "La circulation est menacée en cas de pouls filant avec saignement, de pouls imprenable (hémorragie externe) ou de pouls faible (hémorragie interne).",
            s: 'Chapitre II — La circulation'
          },
          {
            q: "Une victime qui ne répond ni aux questions ni aux ordres simples est :",
            o: [
              "Inconsciente",
              "Forcément en arrêt respiratoire",
              "Nécessairement en arrêt cardiaque",
              "Simplement fatiguée"
            ],
            a: 0,
            e: "Si la victime répond, elle est consciente ; si elle ne répond pas, elle est inconsciente. L'absence de réponse ne signifie pas à elle seule un arrêt respiratoire.",
            s: 'Chapitre II — La conscience'
          },
          {
            q: "Que compare-t-on pour juger de la respiration ?",
            o: [
              "La fréquence, l'amplitude et le rythme des mouvements respiratoires",
              "La couleur des yeux et des cheveux",
              "La taille et le poids de la victime",
              "La température des mains uniquement"
            ],
            a: 0,
            e: "On parle de troubles respiratoires lorsque les mouvements respiratoires sont modifiés dans leur fréquence, leur amplitude ou leur rythme.",
            s: 'Chapitre II — La respiration'
          }
        ]
      },

      /* ------------------------------------------------------------------ */
      {
        id: 'ch3',
        title: 'Chapitre III — Troubles de la conscience',
        questions: [
          {
            q: "Comment le manuel définit-il la conscience ?",
            o: [
              "La capacité du cerveau à entretenir les relations avec le monde extérieur",
              "La capacité du cerveau à assurer les réflexes de sécurité",
              "L'aptitude à marcher sans aide",
              "La capacité du cœur à battre régulièrement"
            ],
            a: 0,
            e: "La conscience est la capacité du cerveau à entretenir les relations avec le monde extérieur ; la vigilance est la capacité du cerveau à assurer les réflexes de sécurité (toux, déglutition).",
            s: 'Chapitre III — Définitions'
          },
          {
            q: "Qu'est-ce que la vigilance ?",
            o: [
              "La capacité du cerveau à assurer les réflexes de sécurité comme la toux et la déglutition",
              "La capacité à entretenir des relations avec le monde extérieur",
              "La vitesse de réaction aux ordres simples",
              "L'état de somnolence d'une personne fatiguée"
            ],
            a: 0,
            e: "La vigilance est la capacité du cerveau d'assurer les réflexes de sécurité (la toux et la déglutition).",
            s: 'Chapitre III — Définitions'
          },
          {
            q: "Quels sont les signes du premier degré des troubles de la conscience ?",
            o: [
              "Pas de réponse aux questions et ordres simples, mais la victime répond aux stimulations ; les réflexes de sécurité sont conservés",
              "Aucune réponse aux stimulations fortes, réflexes conservés",
              "Réflexes de sécurité abolis",
              "Arrêt respiratoire complet"
            ],
            a: 0,
            e: "Au premier degré : pas de réponse aux questions et aux ordres simples ; la victime est somnolente mais répond aux stimulations et excitations ; les réflexes de sécurité (toux, déglutition) sont conservés.",
            s: 'Chapitre III — Les signes'
          },
          {
            q: "Qu'est-ce qui distingue le troisième degré des troubles de la conscience ?",
            o: [
              "Les réflexes de sécurité sont abolis",
              "La victime répond aux ordres simples",
              "La victime est simplement somnolente",
              "Seule la parole est troublée"
            ],
            a: 0,
            e: "Au troisième degré : pas de réponse aux questions et ordres simples, pas de réponse aux stimulations fortes, et les réflexes de sécurité sont abolis.",
            s: 'Chapitre III — Les signes'
          },
          {
            q: "Parmi ces causes, laquelle est une cause traumatique de trouble de conscience ?",
            o: [
              "Une chute ou un coup violent sur la tête",
              "L'absorption de produits dangereux",
              "Une crise convulsive liée à l'hypertension",
              "Une méningite"
            ],
            a: 0,
            e: "Les causes traumatiques sont la chute ou le coup violent sur la tête. Les causes médicales regroupent notamment les causes méningées, l'hypertension artérielle et les crises convulsives ; les causes toxiques concernent l'alcool, l'automédication et la drogue.",
            s: 'Chapitre III — Les causes'
          },
          {
            q: "Parmi ces causes, laquelle est une cause toxique de trouble de conscience ?",
            o: [
              "L'automédication",
              "Une fracture du crâne",
              "Une crise convulsive",
              "Une hémorragie interne"
            ],
            a: 0,
            e: "Les causes toxiques sont l'absorption de produits dangereux (alcool...), l'automédication et la drogue.",
            s: 'Chapitre III — Les causes'
          },
          {
            q: "Pourquoi les troubles de conscience peuvent-ils entraîner une détresse respiratoire ?",
            o: [
              "À cause de l'encombrement des voies aériennes, par la chute de la langue ou l'accumulation de mucosités",
              "Parce que le cœur s'arrête toujours immédiatement",
              "Parce que la victime respire trop vite",
              "Parce que le cerveau consomme plus d'oxygène"
            ],
            a: 0,
            e: "La détresse respiratoire peut survenir par suite de l'encombrement des voies aériennes, soit par la chute de la langue, soit par l'accumulation de mucosités.",
            s: 'Chapitre III — Les conséquences'
          },
          {
            q: "Quelle est la conduite à tenir devant une victime présentant un trouble de conscience ?",
            o: [
              "Allonger, assurer la liberté des voies aériennes (LVA), mettre en PLS, évacuer sous surveillance",
              "Asseoir la victime et lui donner à boire",
              "La laisser seule pour appeler les secours",
              "La secouer fortement jusqu'à ce qu'elle réagisse"
            ],
            a: 0,
            e: "La conduite à tenir : allonger la victime, assurer la Liberté des Voies Aériennes (LVA), la mettre en Position Latérale de Sécurité (PLS) et évacuer sous surveillance.",
            s: 'Chapitre III — Conduite à tenir'
          },
          {
            q: "Quelle est la définition de la PLS ?",
            o: [
              "Une position qui permet d'éviter l'asphyxie chez un blessé ou un malade",
              "Une position assise pour faciliter la respiration",
              "Une technique de massage cardiaque",
              "Une méthode pour immobiliser la colonne vertébrale"
            ],
            a: 0,
            e: "La Position Latérale de Sécurité est une position qui permet d'éviter l'asphyxie chez un blessé ou un malade.",
            s: 'Chapitre III — La PLS'
          },
          {
            q: "Parmi ces situations, laquelle NÉCESSITE une mise en PLS ?",
            o: [
              "Une victime inconsciente",
              "Une victime consciente qui respire normalement et n'a aucun traumatisme",
              "Une victime qui saigne abondamment du bras",
              "Une victime qui a simplement mal à la tête"
            ],
            a: 0,
            e: "Les indications de la PLS sont : inconscience, risque d'inconscience, traumatisme crânien, asphyxie ayant sa respiration spontanée, vomissements, difficultés respiratoires.",
            s: 'Chapitre III — Indications de la PLS'
          },
          {
            q: "Que comprend la libération des voies aériennes (LVA) ?",
            o: [
              "Dégager les voies respiratoires, desserrer col, cravate, ceinture, soutien-gorge et chaussures, nettoyer la bouche, retirer la prothèse dentaire et basculer la tête en arrière",
              "Masser le thorax et souffler dans la bouche",
              "Immobiliser la tête et les jambes",
              "Faire boire de l'eau à la victime"
            ],
            a: 0,
            e: "La LVA consiste à dégager les voies respiratoires, desserrer tout ce qui gêne, nettoyer la bouche (enlever la prothèse dentaire), puis basculer la tête en arrière.",
            s: 'Chapitre III — Libération des voies aériennes'
          },
          {
            q: "Dans quel cas faut-il deux secouristes pour réaliser la PLS ?",
            o: [
              "En cas de suspicion de lésion de la colonne vertébrale ou de traumatisme crânien",
              "Chez toute femme enceinte",
              "Chez toute personne âgée",
              "Uniquement si la victime pèse plus de 80 kg"
            ],
            a: 0,
            e: "La PLS peut être effectuée par un seul secouriste, mais en cas de suspicion de lésion de la colonne vertébrale ou de traumatisme crânien, il faut deux secouristes.",
            s: 'Chapitre III — La PLS'
          },
          {
            q: "Que faut-il surveiller après la mise en PLS ?",
            o: [
              "Le triangle de la vie : circulation, respiration, conscience",
              "Uniquement la couleur des ongles",
              "La tension artérielle toutes les heures",
              "La température corporelle"
            ],
            a: 0,
            e: "Après la mise en PLS, il faut surveiller le triangle de la vie (circulation – respiration – conscience), prévenir les secours publics et évacuer à l'hôpital.",
            s: 'Chapitre III — Après la PLS'
          },
          {
            q: "Quelle mesure de prévention est citée contre les troubles de conscience ?",
            o: [
              "Porter le casque",
              "Boire de l'alcool avec modération",
              "Pratiquer l'automédication",
              "Éviter les campagnes anti-drogue"
            ],
            a: 0,
            e: "La prévention consiste à porter le casque, éviter l'automédication, éviter l'alcoolisme et faire la campagne anti-drogue.",
            s: 'Chapitre III — Prévention'
          }
        ]
      },

      /* ------------------------------------------------------------------ */
      {
        id: 'ch4',
        title: 'Chapitre IV — Détresse respiratoire',
        questions: [
          {
            q: "Comment est définie la détresse respiratoire ?",
            o: [
              "Le mauvais fonctionnement de l'appareil respiratoire entraînant le manque d'oxygène au niveau des tissus",
              "L'arrêt total et définitif du cœur",
              "Une perte de connaissance passagère",
              "Une hémorragie interne"
            ],
            a: 0,
            e: "La détresse respiratoire est le mauvais fonctionnement de l'appareil respiratoire entraînant le manque d'oxygène au niveau des tissus.",
            s: 'Chapitre IV — Définition'
          },
          {
            q: "Parmi ces causes, laquelle peut provoquer une détresse respiratoire ?",
            o: [
              "L'inhalation d'air toxique ou pollué",
              "Une fracture du poignet",
              "Une entorse de la cheville",
              "Une plaie simple au genou"
            ],
            a: 0,
            e: "Les causes sont nombreuses : corps étrangers, pendaison, étranglement, étouffement, inhalation de liquide ou d'air toxique, gêne ou paralysie des muscles respiratoires, défaillance ou arrêt cardiaque, maladies (polio, tuberculose...).",
            s: 'Chapitre IV — Les causes'
          },
          {
            q: "Quels signes traduisent une détresse respiratoire ?",
            o: [
              "Modification des mouvements respiratoires dans leur fréquence, amplitude et rythme",
              "Augmentation de la température corporelle uniquement",
              "Douleur isolée au genou",
              "Pouls lent et régulier"
            ],
            a: 0,
            e: "Les signes sont la modification des mouvements respiratoires dans leur fréquence, amplitude et rythme, pouvant aller jusqu'à l'absence de mouvements respiratoires.",
            s: 'Chapitre IV — Les signes'
          },
          {
            q: "Quelle est l'évolution d'une détresse respiratoire non traitée ?",
            o: [
              "Détresse respiratoire → asphyxie par arrêt respiratoire → mort",
              "Détresse respiratoire → guérison spontanée systématique",
              "Détresse respiratoire → fracture → infection",
              "Détresse respiratoire → simple fatigue passagère"
            ],
            a: 0,
            e: "La conséquence est : détresse respiratoire → asphyxie par arrêt respiratoire → mort.",
            s: 'Chapitre IV — Les conséquences'
          },
          {
            q: "Quelle est la conduite à tenir dans tous les cas de détresse respiratoire ?",
            o: [
              "Soustraire la victime à la cause sans y succomber, alerter, puis libérer les voies aériennes (LVA)",
              "Donner à boire, allonger, attendre",
              "Pratiquer immédiatement un massage cardiaque",
              "Faire marcher la victime pour stimuler la respiration"
            ],
            a: 0,
            e: "Dans tous les cas : soustraire la victime de la cause sans y succomber, alerter pour avoir de l'aide, et faire la LVA pour faciliter la respiration spontanée ou artificielle.",
            s: 'Chapitre IV — Conduite à tenir'
          },
          {
            q: "Que faire pour une victime consciente ayant des difficultés à respirer ?",
            o: [
              "LVA et position de confort, la couvrir ou la ventiler selon la température, surveiller et évacuer sous surveillance",
              "La mettre immédiatement en PLS",
              "Pratiquer le bouche-à-bouche",
              "La faire boire abondamment"
            ],
            a: 0,
            e: "Pour une victime consciente : zone de sécurité si nécessaire, LVA + position de confort, couvrir si elle a froid ou ventiler s'il fait chaud, surveiller et évacuer sous surveillance.",
            s: 'Chapitre IV — Conduite à tenir suivant les cas'
          },
          {
            q: "Que faire pour une victime inconsciente dont la respiration est menacée ?",
            o: [
              "Alerter, sécuriser, LVA + PLS, surveiller et évacuer sous surveillance",
              "La laisser sur le dos sans rien faire",
              "Pratiquer uniquement un massage cardiaque",
              "L'asseoir et lui donner à boire"
            ],
            a: 0,
            e: "Pour une victime inconsciente : alerter, zone de sécurité, LVA + PLS, couvrir ou ventiler selon la température, surveiller, évacuer sous surveillance.",
            s: 'Chapitre IV — Conduite à tenir suivant les cas'
          },
          {
            q: "Que faire en cas d'arrêt respiratoire ?",
            o: [
              "Alerter, sécuriser, LVA puis pratiquer la respiration artificielle",
              "Mettre la victime en PLS et attendre",
              "Donner à boire à la victime",
              "Faire asseoir la victime"
            ],
            a: 0,
            e: "En cas d'arrêt respiratoire : alerter, zone de sécurité, LVA, respiration artificielle (bouche-à-bouche, bouche-à-nez ou bouche-à-bouche-nez pour les bébés), puis surveiller et évacuer d'urgence.",
            s: 'Chapitre IV — Conduite à tenir suivant les cas'
          },
          {
            q: "Comment pratique-t-on le bouche-à-bouche ?",
            o: [
              "Pincer les narines, placer sa bouche autour de celle de la victime et donner 2 insufflations lentes et profondes",
              "Souffler 20 fois rapidement dans la bouche",
              "Souffler uniquement par le nez en bouchant la bouche",
              "Masser le ventre puis souffler"
            ],
            a: 0,
            e: "Après avoir basculé la tête en arrière et nettoyé la bouche, on pince les narines, on place sa bouche autour de celle de la victime et on donne 2 insufflations lentes et profondes.",
            s: 'Chapitre IV — Le bouche-à-bouche'
          },
          {
            q: "Quelle particularité présente le bouche-à-nez ?",
            o: [
              "Le secouriste insuffle l'air par le nez de l'asphyxié, la bouche étant fermée par le pouce sous la lèvre inférieure",
              "Il faut pincer les narines",
              "Il s'effectue uniquement chez l'adulte",
              "Il remplace toujours le bouche-à-bouche"
            ],
            a: 0,
            e: "Dans le bouche-à-nez, le secouriste place une main sur le front et l'autre sous le menton, le pouce sous la lèvre inférieure pour fermer la bouche, puis insuffle l'air par le nez.",
            s: 'Chapitre IV — Le bouche-à-nez'
          },
          {
            q: "Que faire si les mouvements respiratoires reprennent après la ventilation artificielle ?",
            o: [
              "Mettre la victime en PLS, puis surveiller",
              "Continuer les insufflations sans arrêt",
              "Faire boire la victime",
              "La laisser sur le dos et partir"
            ],
            a: 0,
            e: "Si les mouvements respiratoires ont repris, il faut mettre la victime en PLS, puis surveiller. S'il y a toujours absence de mouvements respiratoires, continuer les insufflations et vérifier le triangle de la vie toutes les 4 séries.",
            s: 'Chapitre IV — Ventilation artificielle'
          },
          {
            q: "À quoi sert la méthode d'Heimlich ?",
            o: [
              "À dégager les voies aériennes obstruées par un corps étranger",
              "À immobiliser une fracture du bras",
              "À arrêter une hémorragie externe",
              "À refroidir une brûlure"
            ],
            a: 0,
            e: "La méthode d'Heimlich est citée dans le cas particulier du corps étranger dans les voies aériennes, pour dégager l'obstruction.",
            s: 'Chapitre IV — Cas particulier'
          },
          {
            q: "Quelle est la définition de la ventilation artificielle ?",
            o: [
              "L'ensemble des méthodes qui consistent à relancer la respiration et la circulation d'une personne asphyxiée",
              "L'utilisation d'un respirateur à l'hôpital uniquement",
              "Le fait de ventiler une pièce fermée",
              "Une technique d'immobilisation du thorax"
            ],
            a: 0,
            e: "La ventilation artificielle est l'ensemble des méthodes qui consistent à relancer la respiration et la circulation d'une personne asphyxiée.",
            s: 'Chapitre IV — Ventilation artificielle'
          },
          {
            q: "Parmi ces mesures, laquelle est une prévention de la détresse respiratoire ?",
            o: [
              "Ne pas laisser traîner bouteilles vides, produits, sacs plastiques, médicaments et alcools à la portée des enfants",
              "Aérer uniquement en été",
              "Laisser les enfants jouer avec des sacs en plastique",
              "Conserver les produits ménagers à hauteur des enfants"
            ],
            a: 0,
            e: "La prévention comprend notamment : éviter de mettre des objets dans la bouche, ne pas se jeter à l'eau si on ne sait pas nager, éviter les milieux riches en gaz toxiques, aérer les habitations et ne pas laisser produits/médicaments/alcools à la portée des enfants.",
            s: 'Chapitre IV — Prévention'
          }
        ]
      },

      /* ------------------------------------------------------------------ */
      {
        id: 'ch5',
        title: 'Chapitre V — Détresse circulatoire',
        questions: [
          {
            q: "Comment est définie la détresse circulatoire ?",
            o: [
              "La défaillance ou le mauvais fonctionnement de l'appareil circulatoire",
              "Le mauvais fonctionnement de l'appareil respiratoire",
              "Une perte de conscience brutale",
              "Une lésion de la peau"
            ],
            a: 0,
            e: "La détresse circulatoire est la défaillance ou le mauvais fonctionnement de l'appareil circulatoire.",
            s: 'Chapitre V — Définition'
          },
          {
            q: "Quel signe général caractérise la détresse circulatoire ?",
            o: [
              "Un pouls rapide et faible, supérieur ou égal à 120 battements",
              "Un pouls lent et fort",
              "Une respiration lente et profonde",
              "Une peau chaude et sèche"
            ],
            a: 0,
            e: "Les signes généraux sont : pouls rapide et faible (≥ 120 battements), pâleur des conjonctives, ventilation rapide (≥ 20).",
            s: 'Chapitre V — Les signes'
          },
          {
            q: "Parmi ces signes, lequel accompagne souvent une détresse circulatoire ?",
            o: [
              "Des sueurs froides et une cyanose des ongles",
              "Une rougeur intense du visage",
              "Une soif absente",
              "Un pouls très lent"
            ],
            a: 0,
            e: "Autres signes : anxiété, soif, cyanose des ongles et extrémités froides, sueurs froides.",
            s: 'Chapitre V — Les signes'
          },
          {
            q: "Quelles sont les causes de la détresse circulatoire citées ?",
            o: [
              "Atteinte du cœur, crise cardiaque et hémorragies",
              "Fracture du poignet et entorse",
              "Brûlure du premier degré",
              "Piqûre d'insecte uniquement"
            ],
            a: 0,
            e: "Les causes sont l'atteinte du cœur, la crise cardiaque et les hémorragies.",
            s: 'Chapitre V — Les causes'
          },
          {
            q: "Quelle position adopter pour une victime en crise cardiaque ?",
            o: [
              "La position demi-assise",
              "La position allongée jambes surélevées",
              "La PLS systématiquement",
              "La position debout"
            ],
            a: 0,
            e: "La victime est installée confortablement : soit en position demi-assise (crise cardiaque), soit allongée à plat dos avec les membres inférieurs surélevés.",
            s: 'Chapitre V — Conduite à tenir'
          },
          {
            q: "Que faire si la victime en détresse circulatoire est inconsciente ?",
            o: [
              "La mettre en PLS, alerter, rassurer et évacuer sous surveillance",
              "La laisser assise",
              "Lui donner à boire",
              "La faire marcher"
            ],
            a: 0,
            e: "Si la victime est inconsciente : PLS, alerter, rassurer, évacuer sous surveillance.",
            s: 'Chapitre V — Conduite à tenir'
          },
          {
            q: "Qu'est-ce qu'une hémorragie ?",
            o: [
              "L'écoulement du sang hors des vaisseaux sanguins",
              "Une douleur vive au niveau d'une articulation",
              "Une obstruction des voies respiratoires",
              "Une lésion de la peau par la chaleur"
            ],
            a: 0,
            e: "L'hémorragie est l'écoulement du sang hors des vaisseaux sanguins. Il existe trois sortes : externe, interne et extériorisée.",
            s: 'Chapitre V — Les hémorragies'
          },
          {
            q: "Quels sont les trois types d'hémorragie ?",
            o: [
              "Externe, interne et extériorisée",
              "Artérielle, veineuse et capillaire",
              "Simple, grave et mortelle",
              "Ouverte, fermée et mixte"
            ],
            a: 0,
            e: "Le manuel distingue l'hémorragie externe, l'hémorragie interne et l'hémorragie extériorisée.",
            s: 'Chapitre V — Les hémorragies'
          },
          {
            q: "Quelle est la conduite à tenir devant une hémorragie externe ?",
            o: [
              "Appuyer, allonger avec le membre blessé surélevé, alerter",
              "Donner à boire, asseoir, attendre",
              "Mettre immédiatement la victime en PLS",
              "Appliquer de la chaleur sur la plaie"
            ],
            a: 0,
            e: "La conduite à tenir se résume en trois gestes : appuyer, allonger (membre blessé surélevé), alerter.",
            s: 'Chapitre V — Hémorragie externe'
          },
          {
            q: "Qu'est-ce qu'un pansement compressif ?",
            o: [
              "Un pansement serré placé sur la plaie pour arrêter une hémorragie simple après un appui efficace",
              "Un simple sparadrap décoratif",
              "Un bandage destiné à immobiliser une fracture",
              "Un pansement qui ne doit jamais être retiré à l'hôpital"
            ],
            a: 0,
            e: "Si l'appui est efficace (le sang s'arrête), on met un pansement compressif sur la plaie, on maintient le membre surélevé et on évacue sous surveillance.",
            s: 'Chapitre V — Hémorragie externe'
          },
          {
            q: "Quels sont les points de compression cités dans le manuel ?",
            o: [
              "Huméral, fémoral et pli de l'aine",
              "Radial, cubital et poplité",
              "Carotidien, axillaire et temporal",
              "Plantaires et palmaires"
            ],
            a: 0,
            e: "Les points de compression présentés sont le point huméral, le point fémoral et le point du pli de l'aine.",
            s: 'Chapitre V — Les points de compression'
          },
          {
            q: "Que faire devant une hémorragie interne ?",
            o: [
              "Agir en extrême urgence, allonger jambes relevées, rassurer, couvrir, ne pas donner à boire et évacuer sans rabaisser les jambes",
              "Asseoir la victime et lui donner de l'eau",
              "Appliquer un garrot au hasard",
              "Attendre que le saignement s'arrête seul"
            ],
            a: 0,
            e: "Devant une hémorragie interne : agir en extrême urgence, allonger la victime jambes relevées, la rassurer, la couvrir, ne pas lui donner à boire, évacuer en urgence sans rabaisser les jambes.",
            s: 'Chapitre V — Hémorragie interne'
          },
          {
            q: "Qu'est-ce qu'une hémorragie extériorisée ?",
            o: [
              "Un écoulement de sang par les orifices naturels : nez, bouche, organes génitaux, anus, oreilles",
              "Un saignement visible à travers une plaie de la peau",
              "Un saignement caché à l'intérieur de l'organisme",
              "Un saignement uniquement d'origine dentaire"
            ],
            a: 0,
            e: "L'hémorragie extériorisée est l'écoulement du sang par les orifices naturels : nez, bouche, organes génitaux, anus, oreilles.",
            s: 'Chapitre V — Hémorragie extériorisée'
          },
          {
            q: "Que faire en cas de saignement de nez ?",
            o: [
              "Pincer la narine qui saigne, débarbouiller le visage à l'eau froide, tête baissée",
              "Faire pencher la tête en arrière",
              "Introduire un coton profondément dans le nez",
              "Allonger la victime sur le dos sans rien faire"
            ],
            a: 0,
            e: "Pour le nez : pincer la narine qui saigne, débarbouiller le visage avec de l'eau froide, la tête baissée. Si l'hémorragie ne s'arrête pas, évacuer sous surveillance.",
            s: 'Chapitre V — Hémorragie extériorisée'
          },
          {
            q: "Que faire en cas de saignement de l'oreille ?",
            o: [
              "Ne rien mettre dans l'oreille, allonger le blessé sur l'oreille qui saigne et évacuer d'urgence",
              "Introduire un tampon dans l'oreille",
              "Allonger le blessé sur l'oreille opposée",
              "Faire un lavage à grande eau"
            ],
            a: 0,
            e: "En cas de saignement de l'oreille : ne rien mettre dans l'oreille, allonger le blessé sur l'oreille qui saigne, évacuer d'urgence sous surveillance.",
            s: 'Chapitre V — Hémorragie extériorisée'
          },
          {
            q: "En cas de traumatisme crânien avec écoulement de sang par le nez, que faire ?",
            o: [
              "Mettre la victime en PLS et évacuer d'urgence sous surveillance",
              "Pencher la tête en arrière",
              "Donner à boire à la victime",
              "Boucher le nez avec un tampon"
            ],
            a: 0,
            e: "En cas de traumatisme crânien avec écoulement de sang par le nez : mettre en PLS et évacuer d'urgence sous surveillance.",
            s: 'Chapitre V — Hémorragie extériorisée'
          },
          {
            q: "Lors d'une hémorragie externe grave, que fait le secouriste seul une fois le point de compression réussi ?",
            o: [
              "Il relâche progressivement le point de compression et pose un pansement compressif",
              "Il relâche brutalement la pression",
              "Il laisse la victime sans surveillance",
              "Il donne à boire à la victime"
            ],
            a: 0,
            e: "Le secouriste seul relâche progressivement le point de compression pour éviter que le caillot formé ne se brise, puis pose un pansement compressif. En équipe, un coéquipier prépare le pansement compressif.",
            s: 'Chapitre V — Hémorragie externe grave'
          }
        ]
      },

      /* ------------------------------------------------------------------ */
      {
        id: 'ch6',
        title: 'Chapitre VI — Les atteintes de la peau',
        questions: [
          {
            q: "Quel est le rôle principal de la peau rappelé dans le cours ?",
            o: [
              "Protéger notre organisme",
              "Produire le sang",
              "Faciliter la digestion",
              "Assurer la circulation du sang"
            ],
            a: 0,
            e: "La peau est l'enveloppe qui entoure notre corps ; elle a plusieurs rôles, en particulier celui de la protection de notre organisme.",
            s: 'Chapitre VI — Rappel anatomique'
          },
          {
            q: "Comment est définie une plaie ?",
            o: [
              "Une déchirure de la peau",
              "Une brûlure par la chaleur",
              "Une fracture de l'os",
              "Une infection du sang"
            ],
            a: 0,
            e: "La plaie est une déchirure de la peau. Le module comporte deux parties : les plaies et les brûlures.",
            s: 'Chapitre VI — Les plaies'
          },
          {
            q: "Quels sont les signes d'une plaie ?",
            o: [
              "Douleur, rougeur, gonflement, saignement",
              "Fièvre, toux, éternuements",
              "Pâleur, sueurs froides, soif",
              "Cloques et carbonisation"
            ],
            a: 0,
            e: "Les signes d'une plaie sont : douleur, rougeur, gonflement et saignement.",
            s: 'Chapitre VI — Les plaies'
          },
          {
            q: "Quelles sont les conséquences possibles d'une plaie ?",
            o: [
              "L'infection et le tétanos",
              "La fracture et la luxation",
              "La déshydratation et l'asphyxie",
              "La perte de conscience immédiate"
            ],
            a: 0,
            e: "Les conséquences d'une plaie sont l'infection et le tétanos ; c'est pourquoi toute plaie, même minime, doit être soignée et le tétanos prévenu par la vaccination.",
            s: 'Chapitre VI — Les plaies'
          },
          {
            q: "Parmi ces éléments, lequel est un facteur de gravité d'une plaie ?",
            o: [
              "Son siège (mains, yeux, visage, orifices naturels)",
              "La couleur des vêtements",
              "L'âge du secouriste",
              "La distance de l'hôpital uniquement"
            ],
            a: 0,
            e: "Une plaie est grave selon son étendue (dépassant une pièce de 25 F), sa profondeur, son siège (mains, yeux, visage, orifices naturels), son terrain (3e âge, nourrisson, alcoolique, diabétique), si elle est souillée ou si le porteur n'est pas vacciné contre le tétanos. Un seul facteur suffit.",
            s: 'Chapitre VI — Facteurs de gravité'
          },
          {
            q: "Que signifie le sigle CAT utilisé dans le manuel ?",
            o: [
              "Conduite à tenir",
              "Certificat d'aptitude technique",
              "Centre d'application thérapeutique",
              "Contrôle des accidents du travail"
            ],
            a: 0,
            e: "CAT signifie « conduite à tenir » : l'action du volontaire secouriste est fonction du type de plaie (simple ou grave).",
            s: 'Chapitre VI — Conduite à tenir'
          },
          {
            q: "Que faire devant une plaie grave ?",
            o: [
              "Ne pas y toucher, l'emballer, allonger la victime, couvrir, rassurer et évacuer sous surveillance",
              "Désinfecter largement et laisser à l'air libre",
              "Retirer les corps étrangers visibles",
              "Faire boire la victime abondamment"
            ],
            a: 0,
            e: "Devant une plaie grave : ne pas y toucher ni enlever quelque particule que ce soit, emballer la plaie, allonger la victime (membre atteint surélevé si nécessaire), couvrir, rassurer, évacuer sous surveillance.",
            s: 'Chapitre VI — Conduite à tenir'
          },
          {
            q: "Que faire devant une plaie simple ?",
            o: [
              "Se laver les mains, désinfecter, laver à l'eau et au savon, mettre un pansement propre, surveiller et prévenir le tétanos",
              "Emballer la plaie sans la nettoyer",
              "Retirer les corps étrangers et suturer soi-même",
              "Appliquer de la chaleur"
            ],
            a: 0,
            e: "Pour une plaie simple : désinfection, lavage soigneux des mains, rasage des poils autour de la plaie, lavage à l'eau et au savon (Marseille ou pH neutre), nettoyage de l'intérieur vers l'extérieur, pansement propre, surveillance et prévention du tétanos.",
            s: 'Chapitre VI — Conduite à tenir'
          },
          {
            q: "Quel savon est recommandé pour laver une plaie simple ?",
            o: [
              "Le savon de Marseille non parfumé ou un savon à pH neutre",
              "Un savon parfumé antibactérien",
              "De l'alcool pur",
              "De l'eau de javel pure"
            ],
            a: 0,
            e: "Le matériel conseillé comprend du savon de Marseille non parfumé (ou pH neutre), de l'eau potable, des pansements propres, deux cuvettes, des ciseaux et une lame de rasoir neuve à usage unique.",
            s: 'Chapitre VI — Matériel'
          },
          {
            q: "Comment est définie une brûlure ?",
            o: [
              "Une lésion cutanée causée par la chaleur ou des produits chimiques",
              "Une déchirure de la peau par un objet tranchant",
              "Une fracture de l'os",
              "Une infection de la peau par un parasite"
            ],
            a: 0,
            e: "Une brûlure est une lésion cutanée causée par la chaleur ou des produits chimiques.",
            s: 'Chapitre VI — Les brûlures'
          },
          {
            q: "Quels sont les trois degrés de brûlure ?",
            o: [
              "1er degré : rougeur ; 2e degré : cloques ; 3e degré : peau carbonisée",
              "1er degré : cloques ; 2e degré : carbonisation ; 3e degré : rougeur",
              "1er degré : douleur ; 2e degré : infection ; 3e degré : tétanos",
              "1er degré : brûlure ; 2e degré : plaie ; 3e degré : fracture"
            ],
            a: 0,
            e: "1er degré : la peau est rouge (ex. coup de soleil) ; 2e degré : présence de cloques remplies de liquide clair ; 3e degré : peau carbonisée, muscles, nerfs, vaisseaux et os pouvant être atteints.",
            s: 'Chapitre VI — Les brûlures'
          },
          {
            q: "Que faire devant une brûlure du premier degré ?",
            o: [
              "Mettre la partie brûlée sous l'eau froide pendant 10 minutes puis laisser sécher à l'air",
              "Percer les cloques puis laisser à l'air",
              "Appliquer un corps gras",
              "Emballer immédiatement sans refroidir"
            ],
            a: 0,
            e: "Pour une brûlure du 1er degré : mettre la partie brûlée sous l'eau froide pendant 10 minutes, puis laisser sécher à l'air.",
            s: 'Chapitre VI — Conduite à tenir'
          },
          {
            q: "Que ne faut-il JAMAIS faire devant une brûlure du deuxième degré ?",
            o: [
              "Percer les cloques",
              "Refroidir à l'eau",
              "Sécher à l'air",
              "Couvrir si la localisation le permet"
            ],
            a: 0,
            e: "Pour une brûlure du 2e degré : refroidir 10 minutes, sécher à l'air, ne jamais percer les cloques, couvrir éventuellement si la localisation le permet, surveiller et évacuer en cas d'aggravation.",
            s: 'Chapitre VI — Conduite à tenir'
          },
          {
            q: "Que faire devant une brûlure par produit chimique ?",
            o: [
              "Laver l'endroit brûlé à grande eau et longtemps, puis évacuer",
              "Appliquer un produit neutralisant",
              "Emballer sans laver",
              "Percer les cloques"
            ],
            a: 0,
            e: "En cas de brûlure par produits chimiques : laver l'endroit brûlé à grande eau et longtemps, puis évacuer.",
            s: 'Chapitre VI — Cas particulier'
          },
          {
            q: "Que faire en cas de brûlure par électrocution ?",
            o: [
              "Couper si possible la source d'énergie ou retirer la victime avec un bâton sec, puis évacuer de toute urgence",
              "Toucher directement la victime pour la dégager",
              "Arroser la victime d'eau",
              "Attendre que le courant se coupe tout seul"
            ],
            a: 0,
            e: "En cas d'électrocution : si possible couper la source d'énergie, ou retirer la victime de la source électrique avec un bâton sec pour éviter de s'électrocuter soi-même, puis évacuer de toute urgence à l'hôpital.",
            s: 'Chapitre VI — Cas particulier'
          }
        ]
      },

      /* ------------------------------------------------------------------ */
      {
        id: 'ch7',
        title: "Chapitre VII — Les atteintes de l'appareil locomoteur",
        questions: [
          {
            q: "Quels sont les différents types d'os cités dans le cours ?",
            o: [
              "Os longs, os plats et os courts",
              "Os durs, os mous et os spongieux",
              "Os rouges, os blancs et os jaunes",
              "Os fixes, os mobiles et os semi-mobiles"
            ],
            a: 0,
            e: "Les types d'os sont : os long (membres supérieurs et inférieurs, ex. fémur), os plat (os de la tête, omoplate) et os court (vertèbres, phalanges).",
            s: 'Chapitre VII — Définitions et généralités'
          },
          {
            q: "Quel est le rôle des ligaments ?",
            o: [
              "Relier les os entre eux au niveau des articulations",
              "Produire les globules rouges",
              "Protéger les organes internes",
              "Permettre la contraction des muscles"
            ],
            a: 0,
            e: "Les ligaments relient les os entre eux au niveau des articulations.",
            s: 'Chapitre VII — Définitions et généralités'
          },
          {
            q: "Qu'est-ce qu'une fracture ?",
            o: [
              "Une cassure de l'os",
              "Un déboîtement de l'os",
              "Une déchirure des ligaments",
              "Une contraction musculaire brusque"
            ],
            a: 0,
            e: "Il y a fracture quand l'os est cassé. On distingue les fractures fermées (l'os cassé n'apparaît pas à l'extérieur) et les fractures ouvertes (os cassé avec une plaie à l'extérieur).",
            s: 'Chapitre VII — Les fractures'
          },
          {
            q: "Quelle est la différence entre une fracture fermée et une fracture ouverte ?",
            o: [
              "Dans la fracture ouverte, l'os cassé s'accompagne d'une plaie à l'extérieur",
              "La fracture fermée est toujours plus grave",
              "La fracture ouverte ne nécessite jamais d'évacuation",
              "La fracture fermée est une simple entorse"
            ],
            a: 0,
            e: "Fracture fermée : l'os cassé n'apparaît pas à l'extérieur. Fracture ouverte : l'os cassé s'accompagne d'une plaie à l'extérieur.",
            s: 'Chapitre VII — Les fractures'
          },
          {
            q: "Quels sont les principaux signes d'une fracture ?",
            o: [
              "Douleur et impotence fonctionnelle, avec éventuellement déformation, gonflement, hématome, hémorragie",
              "Fièvre et frissons",
              "Toux et difficultés respiratoires uniquement",
              "Cloques et carbonisation"
            ],
            a: 0,
            e: "Signes principaux : douleur, impotence fonctionnelle. Autres signes : déformation, gonflement, hématome, hémorragie (en cas de fracture ouverte).",
            s: 'Chapitre VII — Les fractures'
          },
          {
            q: "Que faire devant une fracture fermée ?",
            o: [
              "Immobiliser le membre sans le bouger, puis évacuer sous surveillance",
              "Réduire la fracture en tirant sur le membre",
              "Faire marcher la victime",
              "Masser la zone douloureuse"
            ],
            a: 0,
            e: "Devant une fracture, il faut immobiliser la fracture avant tout déplacement, dans la position où on l'a trouvée. Pour une fracture fermée : immobiliser le membre sans le bouger, évacuer sous surveillance.",
            s: 'Chapitre VII — Conduite à tenir'
          },
          {
            q: "Que faire devant une fracture ouverte ?",
            o: [
              "Arrêter l'hémorragie, emballer la plaie sans y toucher, immobiliser sans bouger, évacuer sous surveillance",
              "Remettre l'os en place puis désinfecter",
              "Laver la plaie à grande eau et laisser à l'air",
              "Faire boire la victime"
            ],
            a: 0,
            e: "Pour une fracture ouverte : arrêter l'hémorragie s'il y en a, emballer la plaie sans y toucher, immobiliser sans bouger, évacuer sous surveillance.",
            s: 'Chapitre VII — Fracture ouverte'
          },
          {
            q: "Comment immobiliser une fracture de l'avant-bras ?",
            o: [
              "Attelles ou gouttières + écharpe simple",
              "Écharpe simple + contre-écharpe",
              "Attelles + liens larges réunissant les deux membres",
              "Un simple pansement compressif"
            ],
            a: 0,
            e: "Membres supérieurs : avant-bras → attelles ou gouttières + écharpe simple ; bras → écharpe simple + contre-écharpe. Membres inférieurs : jambe ou cuisse → attelles ou liens larges réunissant les 2 membres.",
            s: 'Chapitre VII — Immobilisations'
          },
          {
            q: "Comment immobiliser une fracture du bras ?",
            o: [
              "Écharpe simple + contre-écharpe",
              "Attelles ou gouttières uniquement",
              "Liens larges réunissant les deux jambes",
              "Immobilisation sur plan dur"
            ],
            a: 0,
            e: "Pour le bras, l'immobilisation se fait par une écharpe simple + contre-écharpe.",
            s: 'Chapitre VII — Immobilisations'
          },
          {
            q: "Que faire devant une fracture du crâne ?",
            o: [
              "Emballer la fracture et évacuer en PLS sous surveillance",
              "Asseoir la victime et lui donner à boire",
              "Immobiliser sur plan dur uniquement",
              "Attendre les secours sans intervenir"
            ],
            a: 0,
            e: "Fracture du crâne : emballer la fracture, évacuer en PLS sous surveillance.",
            s: 'Chapitre VII — Fracture du crâne'
          },
          {
            q: "Quels signes peuvent faire suspecter une fracture de la colonne vertébrale ?",
            o: [
              "Paralysie des membres, fourmillements, sensation de décharge électrique, déformation de la colonne",
              "Cloques et rougeur de la peau",
              "Urines sanglantes uniquement",
              "Toux et crachats sanguinolents"
            ],
            a: 0,
            e: "Signes : douleur, impotence fonctionnelle, personne souvent allongée sur le dos, paralysie des membres, fourmillements, sensation de décharge électrique aux extrémités, déformation de la colonne vertébrale.",
            s: 'Chapitre VII — Fracture de la colonne vertébrale'
          },
          {
            q: "Quelle est la conduite à tenir devant une fracture de la colonne vertébrale ?",
            o: [
              "Respecter l'axe tête-cou-tronc sans mobiliser, immobiliser sur plan dur et évacuer sous surveillance",
              "Asseoir la victime pour la rassurer",
              "La porter sur le dos d'un secouriste",
              "La mettre en position demi-assise"
            ],
            a: 0,
            e: "Il faut respecter l'axe tête-cou-tronc sans le mobiliser, immobiliser sur plan dur et évacuer sous surveillance.",
            s: 'Chapitre VII — Fracture de la colonne vertébrale'
          },
          {
            q: "Quel signe particulier peut accompagner une fracture du bassin ?",
            o: [
              "Des urines sanglantes ou rosées",
              "Des cloques sur la peau",
              "Une toux sèche",
              "Une perte de la vue"
            ],
            a: 0,
            e: "Signes de fracture du bassin : douleur, impotence fonctionnelle, parfois urines sanglantes ou rosées. Conduite à tenir : immobiliser sur plan dur, évacuer sous surveillance.",
            s: 'Chapitre VII — Fracture du bassin'
          },
          {
            q: "Quelle position adopter pour une fracture de côte ?",
            o: [
              "Évacuer en position demi-assise sur le côté blessé en surveillant la respiration",
              "Allonger sur le ventre",
              "Mettre en PLS systématiquement",
              "Asseoir penché en avant, jambes tendues"
            ],
            a: 0,
            e: "Pour une fracture de côte (douleur, difficultés respiratoires, toux, crachat sanguinolent) : évacuer en position demi-assise sur le côté blessé en surveillant la respiration.",
            s: 'Chapitre VII — Fracture de côte'
          },
          {
            q: "Qu'est-ce qu'une luxation ?",
            o: [
              "Un déboîtement de l'os au niveau d'une articulation entraînant coupure, déchirure ou étirement des ligaments",
              "Une cassure de l'os",
              "Une déchirure des ligaments avec articulation en place",
              "Une contraction musculaire douloureuse"
            ],
            a: 0,
            e: "Une luxation est un déboîtement de l'os au niveau d'une articulation entraînant coupure, déchirure ou étirement des ligaments.",
            s: 'Chapitre VII — Les luxations'
          },
          {
            q: "Qu'est-ce qu'une entorse ?",
            o: [
              "Une déchirure, un étirement ou une rupture des ligaments, l'articulation restant en place",
              "Un déboîtement de l'os",
              "Une cassure de l'os",
              "Une contraction musculaire brusque"
            ],
            a: 0,
            e: "L'entorse est une déchirure, un étirement ou une rupture des ligaments, mais l'articulation reste en place.",
            s: 'Chapitre VII — Les entorses'
          },
          {
            q: "Que faire devant une entorse ?",
            o: [
              "Mettre du froid (eau froide, glaçon), immobiliser et évacuer sous surveillance",
              "Masser énergiquement l'articulation",
              "Appliquer de la chaleur",
              "Faire marcher la victime immédiatement"
            ],
            a: 0,
            e: "Devant une entorse : mettre du froid sur l'entorse (eau froide, glaçon, éther), immobiliser, évacuer sous surveillance.",
            s: 'Chapitre VII — Les entorses'
          },
          {
            q: "Que faire devant une crampe musculaire ?",
            o: [
              "Étirer le muscle et le masser, sans taper sur le muscle",
              "Taper fortement sur le muscle",
              "Appliquer de la chaleur sans masser",
              "Immobiliser sur plan dur"
            ],
            a: 0,
            e: "Devant une crampe : procéder à l'étirement du muscle, masser le muscle, ne pas taper sur le muscle. Les crampes sont des contractions brusques, rapides et douloureuses dues à des efforts excessifs et prolongés.",
            s: 'Chapitre VII — Les crampes musculaires'
          }
        ]
      },

      /* ------------------------------------------------------------------ */
      {
        id: 'ch8',
        title: 'Chapitre VIII — Ramassage, brancardage et transports improvisés',
        questions: [
          {
            q: "Qu'est-ce que le ramassage (ou relevage) ?",
            o: [
              "Une technique qui consiste à installer un blessé sur un brancard sans aggraver son état en vue de son évacuation",
              "Le transport d'un blessé sur le dos d'un secouriste",
              "Une technique de massage cardiaque",
              "L'immobilisation d'une fracture"
            ],
            a: 0,
            e: "Le ramassage ou relevage est une technique qui consiste à installer un blessé sur un brancard sans aggraver son état en vue de son évacuation.",
            s: 'Chapitre VIII — Ramassage'
          },
          {
            q: "Qui assure la direction des opérations lors d'un ramassage ?",
            o: [
              "Le volontaire secouriste le plus expérimenté (chef d'équipe)",
              "Le blessé lui-même s'il est conscient",
              "Le témoin le plus proche",
              "Le chauffeur de l'ambulance, toujours"
            ],
            a: 0,
            e: "La direction des opérations est assurée par le volontaire secouriste le plus expérimenté (chef d'équipe).",
            s: 'Chapitre VIII — Direction des opérations'
          },
          {
            q: "Pourquoi les ordres du chef d'équipe doivent-ils être clairs et forts ?",
            o: [
              "Pour être entendus et compris de toute l'équipe et synchroniser les mouvements",
              "Pour impressionner les témoins",
              "Pour remplacer l'alerte aux secours",
              "Pour éviter d'utiliser un brancard"
            ],
            a: 0,
            e: "Les ordres sont indispensables et doivent être entendus et compris de toute l'équipe : langage clair, voix forte et bien articulée. Le chef vérifie et donne les ordres ; les coéquipiers répondent et exécutent.",
            s: 'Chapitre VIII — Les ordres'
          },
          {
            q: "Quels sont les trois points de soutien lors du relevage ?",
            o: [
              "Tête-cou-épaule, le tronc, les mollets et chevilles",
              "Tête, bras, pieds",
              "Thorax, bassin, genoux",
              "Cou, dos, talons"
            ],
            a: 0,
            e: "Premier point : tête-cou-épaule ; deuxième point : le tronc ; troisième point : les mollets et les chevilles.",
            s: 'Chapitre VIII — Points de soutien'
          },
          {
            q: "Quelle technique de relevage est retenue par la Croix-Rouge Togolaise ?",
            o: [
              "Le pont néerlandais",
              "Le pont amélioré",
              "Le relevage à la cuillère",
              "Le transport à la bouée"
            ],
            a: 0,
            e: "Le pont néerlandais est retenu par la Croix-Rouge Togolaise pour son efficacité et ses exigences limitées ; il faut 3 ou 4 porteurs.",
            s: 'Chapitre VIII — Le pont néerlandais'
          },
          {
            q: "Combien de secouristes sont obligatoires pour le relevage en cas de fracture de la colonne vertébrale ou du bassin ?",
            o: [
              "Quatre secouristes",
              "Deux secouristes",
              "Trois secouristes",
              "Un seul secouriste suffit"
            ],
            a: 0,
            e: "En cas de fracture de la colonne vertébrale et du bassin, il faut obligatoirement 4 secouristes pour le relevage (procédé du pont amélioré).",
            s: 'Chapitre VIII — Pont amélioré'
          },
          {
            q: "Qu'est-ce que le brancardage ?",
            o: [
              "La technique qui consiste à transporter une victime au moyen d'un brancard",
              "Le fait de fabriquer un brancard avec des branches",
              "L'installation de la victime sur un plan dur",
              "Le massage de la victime pendant le transport"
            ],
            a: 0,
            e: "Le brancardage est une technique qui consiste à transporter une victime au moyen d'un brancard, afin de l'amener au véhicule de transport ou au centre de soins sans aggraver son état.",
            s: 'Chapitre VIII — Le brancardage'
          },
          {
            q: "Quels éléments composent un brancard ?",
            o: [
              "Une toile forte tendue par deux compas entre deux hampes, des poignées, des pieds et 2 à 3 sangles",
              "Un simple drap tenu par quatre secouristes",
              "Une planche de bois sans sangles",
              "Un fauteuil roulant"
            ],
            a: 0,
            e: "Le brancard comprend une toile forte tendue par deux compas entre deux hampes, chaque hampe munie de deux poignées et de deux pieds, et 2 à 3 sangles pour maintenir le blessé.",
            s: 'Chapitre VIII — Le brancard'
          },
          {
            q: "Dans quel sens transporte-t-on une victime vivante sur un brancard ?",
            o: [
              "La tête en avant, dans le sens de la marche",
              "Les pieds en avant, dans le sens de la marche",
              "Toujours en position assise",
              "Peu importe le sens"
            ],
            a: 0,
            e: "La règle générale est de transporter une victime en vie la tête en avant dans le sens de la marche, alors que le cadavre sera transporté les pieds en avant.",
            s: 'Chapitre VIII — Brancardage à deux'
          },
          {
            q: "Lors d'un brancardage à quatre ou cinq, où se place le chef ?",
            o: [
              "À l'arrière, pour donner les ordres",
              "À l'avant, pour ouvrir la route",
              "Au milieu, entre les hampes",
              "Devant le brancard, dos tourné"
            ],
            a: 0,
            e: "Les quatre brancardiers prennent chacun un poignet (deux devant, deux derrière) ; le chef est à l'arrière et donne les ordres de brancardage.",
            s: 'Chapitre VIII — Brancardage à quatre et cinq'
          },
          {
            q: "Pourquoi les brancardiers ne doivent-ils pas marcher au pas ?",
            o: [
              "Parce que cela provoque des secousses rythmées désagréables pour la victime",
              "Parce que c'est interdit par le règlement",
              "Parce que cela fatigue moins les porteurs",
              "Parce que le brancard avance plus vite"
            ],
            a: 0,
            e: "La marche doit être la plus douce et régulière possible ; les brancardiers ne marchent pas au pas, car il se produit un phénomène de secousses rythmées fort désagréable pour la victime.",
            s: 'Chapitre VIII — Brancardage à deux'
          },
          {
            q: "À partir de combien de secouristes n'est-il plus nécessaire de poser le brancard sur l'obstacle ?",
            o: [
              "À partir de quatre secouristes",
              "À partir de deux secouristes",
              "À partir de trois secouristes",
              "À partir de cinq secouristes"
            ],
            a: 0,
            e: "À partir de quatre secouristes, il n'est plus nécessaire de poser le brancard sur l'obstacle : la manœuvre s'effectue en huit temps.",
            s: "Chapitre VIII — Passage d'obstacle à quatre"
          },
          {
            q: "Quel ordre du chef déclenche le déplacement du brancard lors d'un franchissement d'obstacle ?",
            o: [
              "« Envoyez »",
              "« Posez »",
              "« Halte »",
              "« Épaules »"
            ],
            a: 0,
            e: "Au commandement « Envoyez », le brancard coulisse sur les mains des secouristes avant, soutenu par le brancardier arrière ; l'ordre « Halte » vient stopper la manœuvre.",
            s: "Chapitre VIII — Franchissement d'obstacle"
          },
          {
            q: "Parmi ces techniques, laquelle est un transport improvisé cité dans le cours ?",
            o: [
              "Le procédé de la chaise",
              "La PLS",
              "Le pansement compressif",
              "La méthode d'Heimlich"
            ],
            a: 0,
            e: "Les transports improvisés cités sont : procédé de la chaise, mains triangulaires, mains carrées, transport sur une chaise, califourchon ou à la maman, transport sur une bûche, coup-de-pompier, transport à la bouée, procédé à l'anneau ou torchette.",
            s: 'Chapitre VIII — Transports improvisés'
          },
          {
            q: "Quel est le rôle du chef d'équipe pendant le ramassage ?",
            o: [
              "Reconnaître l'état du blessé, choisir le parcours, vérifier le terrain et donner les ordres",
              "Porter seul la victime",
              "Remplacer le brancard par une couverture",
              "Alerter uniquement les secours"
            ],
            a: 0,
            e: "Le chef reconnaît l'état du blessé, surveille son installation, l'encourage, le couvre, vérifie les conditions du terrain, choisit le parcours, assume les tâches difficiles et indique les manœuvres par des ordres.",
            s: 'Chapitre VIII — Direction des opérations'
          }
        ]
      },

      /* ------------------------------------------------------------------ */
      {
        id: 'ch9',
        title: 'Chapitre IX — Le Mouvement Croix-Rouge et Croissant-Rouge',
        questions: [
          {
            q: "Où et quand commence l'histoire de la Croix-Rouge ?",
            o: [
              "Le 24 juin 1859 à Solferino, dans le nord de l'Italie",
              "Le 26 février 1959 à Lomé",
              "Le 17 février 1862 à Genève",
              "Le 8 mai 1945 à Paris"
            ],
            a: 0,
            e: "L'historique de la Croix-Rouge commence le 24 juin 1859 à Solferino, dans le nord de l'Italie, lors de la bataille entre Français et Italiens contre les Autrichiens.",
            s: 'Chapitre IX — La bataille de Solferino'
          },
          {
            q: "Combien de victimes la bataille de Solferino a-t-elle faites en quelques heures ?",
            o: [
              "40 000 victimes, morts et blessés",
              "4 000 victimes",
              "400 000 victimes",
              "1 000 victimes"
            ],
            a: 0,
            e: "Un violent affrontement fera en quelques heures 40 000 victimes, morts et blessés, au terme de 16 heures de violents combats.",
            s: 'Chapitre IX — La bataille de Solferino'
          },
          {
            q: "Qui a été choqué par l'abandon des blessés à Solferino ?",
            o: [
              "Jean Henry Dunant",
              "Gustave Moynier",
              "Louis Appia",
              "Guillaume-Henri Dufour"
            ],
            a: 0,
            e: "L'abandon des blessés livrés à leur souffrance choquera un homme de passage : Jean Henry Dunant, qui organisa les secours sans discrimination avec l'aide des habitants des villages voisins.",
            s: 'Chapitre IX — Solferino'
          },
          {
            q: "Quel livre Henry Dunant publie-t-il en 1862 ?",
            o: [
              "« Un souvenir de Solferino »",
              "« Le droit de la guerre »",
              "« Les principes fondamentaux »",
              "« Histoire de la Croix-Rouge »"
            ],
            a: 0,
            e: "En 1862, Henry Dunant écrit « Un souvenir de Solferino », où il raconte le drame de cette guerre. Il le fait imprimer à ses frais et l'adresse aux familles régnantes d'Europe, aux hommes politiques, militaires et philanthropes.",
            s: 'Chapitre IX — Un souvenir de Solferino'
          },
          {
            q: "Qui composent le Comité des cinq ?",
            o: [
              "Gustave Moynier, Guillaume-Henri Dufour, Louis Appia, Théodore Maunoir et Jean-Henri Dunant",
              "Dunant, Moynier et trois médecins anglais",
              "Cinq généraux suisses",
              "Cinq délégués de la Croix-Rouge française"
            ],
            a: 0,
            e: "Le comité des cinq est composé de Gustave Moynier (avocat), Guillaume-Henri Dufour (militaire), Louis Appia (médecin), Théodore Maunoir (médecin) et Jean-Henri Dunant (homme d'affaires).",
            s: 'Chapitre IX — Le Comité des cinq'
          },
          {
            q: "Quel signe distinctif est adopté lors de la première Conférence internationale de Genève (26 octobre 1863) ?",
            o: [
              "Une croix rouge sur fond blanc",
              "Un croissant rouge sur fond blanc",
              "Un cristal rouge",
              "Une étoile blanche sur fond rouge"
            ],
            a: 0,
            e: "C'est au cours de cette conférence que sont adoptés le signe distinctif (une croix rouge sur fond blanc), l'emblème de la Croix-Rouge et la création du Comité International de la Croix-Rouge.",
            s: 'Chapitre IX — Évolution'
          },
          {
            q: "En quelle année les quatre Conventions de Genève ont-elles été adoptées ?",
            o: ['1949', '1864', '1919', '1977'],
            a: 0,
            e: "Après la Seconde Guerre mondiale, une conférence diplomatique adopte les quatre Conventions de Genève de 1949, complétées par trois Protocoles additionnels adoptés en 1977 et en 2005.",
            s: 'Chapitre IX — Évolution'
          },
          {
            q: "Quels sont les sept principes fondamentaux du Mouvement ?",
            o: [
              "Humanité, impartialité, neutralité, indépendance, volontariat, unité, universalité",
              "Humanité, solidarité, neutralité, indépendance, bénévolat, unité, universalité",
              "Liberté, égalité, fraternité, neutralité, volontariat, unité, paix",
              "Humanité, impartialité, neutralité, autonomie, volontariat, unité, mondialité"
            ],
            a: 0,
            e: "Le Mouvement est uni et guidé par les Sept Principes fondamentaux : Humanité, Impartialité, Neutralité, Indépendance, Volontariat, Unité et Universalité.",
            s: 'Chapitre IX — Le Mouvement international'
          },
          {
            q: "Que signifie le principe d'impartialité ?",
            o: [
              "Ne faire aucune distinction de nationalité, race, religion, condition sociale ou appartenance politique",
              "Ne jamais prendre parti dans un conflit armé",
              "Rester indépendant des pouvoirs publics",
              "Être présent dans tous les pays du monde"
            ],
            a: 0,
            e: "L'impartialité : le Mouvement ne fait aucune distinction de nationalité, de race, de religion, de condition sociale et d'appartenance politique ; il secourt à la mesure de la souffrance.",
            s: 'Chapitre IX — Impartialité'
          },
          {
            q: "Que signifie le principe de neutralité ?",
            o: [
              "S'abstenir de prendre part aux hostilités et aux controverses d'ordre politique, racial, religieux et idéologique",
              "Refuser toute aide aux militaires",
              "Ne dépendre d'aucun gouvernement",
              "Secourir uniquement les civils"
            ],
            a: 0,
            e: "Neutralité : afin de garder la confiance de tous, le Mouvement s'abstient de prendre part aux hostilités et, en tout temps, aux controverses d'ordre politique, racial, religieux et idéologique.",
            s: 'Chapitre IX — Neutralité'
          },
          {
            q: "Quel est le rôle du Comité International de la Croix-Rouge (CICR) ?",
            o: [
              "Il est l'organe fondateur du Mouvement, promoteur et gardien du droit international humanitaire et des Principes fondamentaux",
              "Il coordonne les catastrophes naturelles dans le monde",
              "Il gère les hôpitaux des Sociétés nationales",
              "Il finance les programmes de développement"
            ],
            a: 0,
            e: "Le CICR est l'organe fondateur du Mouvement ; il est le promoteur et le gardien du droit international humanitaire et des Principes fondamentaux. Créé en 1863 à Genève, son siège est au 19, avenue de la Paix, 1202 Genève.",
            s: 'Chapitre IX — Le CICR'
          },
          {
            q: "En quelle année la Fédération internationale (FISCR) a-t-elle été fondée ?",
            o: ['1919', '1863', '1949', '2005'],
            a: 0,
            e: "La Fédération internationale des Sociétés de la Croix-Rouge et du Croissant-Rouge (FISCR) a été fondée en 1919 ; elle dirige et coordonne l'assistance internationale du Mouvement.",
            s: 'Chapitre IX — La Fédération internationale'
          },
          {
            q: "Quand le Croissant-Rouge est-il utilisé comme emblème ?",
            o: [
              "Depuis 1876",
              "Depuis 1863",
              "Depuis 1949",
              "Depuis 2005"
            ],
            a: 0,
            e: "La Croix-Rouge est utilisée depuis 1863, le Croissant-Rouge depuis 1876 et le Cristal-Rouge depuis 2005.",
            s: 'Chapitre IX — Les emblèmes'
          },
          {
            q: "Quand le Cristal-Rouge a-t-il été adopté ?",
            o: ['2005', '1863', '1876', '1949'],
            a: 0,
            e: "Le Cristal-Rouge a été adopté en 2005, avec le troisième Protocole additionnel relatif au Cristal Rouge.",
            s: 'Chapitre IX — Les emblèmes'
          },
          {
            q: "Quelle est la différence entre l'usage protecteur et l'usage indicatif de l'emblème ?",
            o: [
              "L'emblème est de grande dimension à titre protecteur et de petite dimension à titre indicatif",
              "L'usage protecteur est réservé aux militaires, l'indicatif aux civils",
              "L'usage indicatif est interdit dans les hôpitaux",
              "Il n'y a aucune différence"
            ],
            a: 0,
            e: "L'emblème est de grande dimension lorsqu'il est utilisé à titre protecteur (manifestation visible de la protection accordée par les Conventions de Genève) et de petite dimension à titre indicatif.",
            s: "Chapitre IX — Usages de l'emblème"
          },
          {
            q: "Quels sont les trois types d'abus de l'emblème cités ?",
            o: [
              "L'imitation, l'usurpation et la perfidie",
              "La vente, le prêt et la location",
              "L'imitation, la publicité et le commerce",
              "L'usurpation, la contrefaçon et le vol"
            ],
            a: 0,
            e: "Les types d'abus sont l'imitation, l'usurpation et la perfidie. L'abus est un usage non autorisé, souvent dû à l'ignorance, au manque d'information ou à une intention de promotion personnelle.",
            s: "Chapitre IX — Abus de l'emblème"
          },
          {
            q: "Qu'est-ce que le droit international humanitaire (DIH) ?",
            o: [
              "L'ensemble des lois et règles qui définissent les comportements des militaires, du personnel soignant et de la population civile lors des conflits armés",
              "Une loi nationale togolaise sur les secours",
              "Le règlement intérieur de la Croix-Rouge Togolaise",
              "Un traité commercial international"
            ],
            a: 0,
            e: "Le DIH, aussi appelé « droit des conflits armés » ou « droit de la guerre », est l'ensemble des lois et règles qui définissent les comportements des militaires, du personnel soignant et de la population civile lors des conflits armés.",
            s: 'Chapitre IX — Le DIH'
          },
          {
            q: "Quand la Croix-Rouge Togolaise a-t-elle été fondée ?",
            o: [
              "Le 26 février 1959",
              "Le 13 septembre 1960",
              "Le 7 septembre 1961",
              "Le 2 octobre 1961"
            ],
            a: 0,
            e: "La CRT est fondée le 26 février 1959 sur les bases des Conventions de Genève et des principes fondamentaux ; elle est reconnue le 13 septembre 1960 comme association de secours volontaire possédant la personnalité juridique.",
            s: 'Chapitre IX — La Croix-Rouge Togolaise'
          },
          {
            q: "Quand la CRT a-t-elle été admise comme membre de la Fédération internationale ?",
            o: [
              "Le 2 octobre 1961, comme 87e membre",
              "Le 26 février 1959",
              "Le 7 septembre 1961",
              "Le 13 septembre 1960"
            ],
            a: 0,
            e: "La CRT est reconnue le 7 septembre 1961 par le CICR et admise le 2 octobre 1961 comme 87e membre par la Fédération (FISCR).",
            s: 'Chapitre IX — La Croix-Rouge Togolaise'
          },
          {
            q: "Où se trouve le siège de la Croix-Rouge Togolaise ?",
            o: [
              "51, Rue Boko Soga à Amoutiévé – Lomé",
              "19, avenue de la Paix à Genève",
              "26, rue de Solferino à Paris",
              "Boulevard du 13 Janvier à Lomé"
            ],
            a: 0,
            e: "Le siège de la CRT se trouve au 51, Rue Boko Soga à Amoutiévé – Lomé (BP 655, Tél 22 21 21 10 / 22 21 12 96).",
            s: 'Chapitre IX — La Croix-Rouge Togolaise'
          },
          {
            q: "Quel programme de la CRT s'occupe de la lutte contre la traite et l'exploitation des enfants ?",
            o: [
              "Le programme info-diffusion",
              "Le programme santé",
              "Le programme jeunesse",
              "Le programme développement des ressources"
            ],
            a: 0,
            e: "Dans le programme info-diffusion se retrouve le volet du Projet de Lutte contre la Traite et l'Exploitation des Enfants, qui s'occupe de la sensibilisation sur ce phénomène.",
            s: 'Chapitre IX — Programme info-diffusion'
          }
        ]
      }
    ]
  };
});
