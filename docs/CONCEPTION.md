# Altiplume — Document de conception

Version 0.1 — 10 octobre 2026. Document vivant : il évolue avec le jeu, et chaque changement notable est consigné dans JOURNAL.md.

---

## 1. Intention

**Altiplume** est un jeu web cozy de gestion d'un aérodrome postal des années 1930, en pixel art 8 bits, jouable au doigt sur téléphone comme à la souris sur PC.

On hérite d'un petit aérodrome en herbe, à moitié ruiné, dans un monde inventé. On le restaure, on recrute des pilotes qui ont chacun leur caractère, et on ouvre des lignes de courrier vers des régions lointaines. Les vols durent du vrai temps : on joue cinq minutes le matin, on revient le soir voir si le courrier est arrivé.

**Trois piliers**, dans cet ordre de priorité :

1. **Le lieu.** L'aérodrome qu'on restaure et qu'on décore. C'est le cœur chaleureux du jeu, ce qui fait qu'on y revient.
2. **Les gens.** Les pilotes, leurs humeurs, leurs histoires. L'attachement émotionnel.
3. **Le réseau.** Les lignes, la rentabilité, l'expansion. La couche gestion, pour l'esprit.

**Ce qu'Altiplume n'est pas :** ni un jeu de stress (rien ne se perd si on ne se connecte pas), ni un jeu de compétition entre joueurs, ni une machine à micro-transactions.

**Promesse en une phrase :** *un aérodrome à soi, au bord du monde, où le courrier arrive toujours.*

---

## 2. Boucle de jeu

### Session courte (2 à 5 minutes, téléphone)
1. Les vols arrivés ont déposé revenus et courrier : on encaisse.
2. Trois cartes ont été tirées pour la journée : contrats, imprévus, opportunités. Elles prennent la place qui reste dans une main de cinq ; on joue ou on défausse celles qu'on veut.
3. On affecte un pilote et un avion à une ligne, on expédie.
4. Éventuellement un achat ou une réparation.

### Session longue (15 à 30 minutes, PC ou tablette)
- Restauration et décoration de l'aérodrome.
- Conversations avec les pilotes, lecture de leurs histoires.
- Planification du réseau : quelles lignes ouvrir, quels avions acheter.
- Événements de saison.

### Le temps réel
Un vol dure de 3 minutes (saut d'île) à 8 heures (traversée du Grand Blanc). Le joueur est prévenu à l'arrivée s'il l'a accepté (notification PWA). **Règle absolue : l'absence n'est jamais punie.** Le courrier attend, les pilotes se reposent, rien ne pourrit, rien n'expire.

---

## 3. Le monde

Un continent inventé, sans correspondance avec la géographie réelle. Cela donne au jeu une identité propre et évite toute question de frontière contestée à l'international.

| Région | Caractère | Défi de vol | Palette |
|---|---|---|---|
| **Vallées de Brume** | Région de départ, douce, verte | Brouillard matinal | Verts tendres, gris-bleu |
| **Côte de Saline** | Marais salants, ports, hydravions | Vent de mer, courtes pistes | Blanc crayeux, turquoise |
| **Hauts-Plateaux d'Ocre** | Altitude, air rare, villages perchés | Moteurs qui peinent, froid | Ocre, terre cuite, ciel violet |
| **Archipel des Lanternes** | Chaîne d'îles, sauts courts | Navigation, nuit | Bleu profond, lanternes orange |
| **Forêt de Cuivre** | Forêt dense, peu de pistes | Pannes, atterrissages délicats | Cuivre, vert sombre |
| **Désert de Verre** | Immensité chaude | Longues étapes, carburant | Sable pâle, blanc aveuglant |
| **Grand Blanc** | Glace du nord | Tempêtes, portée maximale | Blanc, bleu glacier |

Chaque région a son type de courrier (plis urgents, colis fragiles, semences, pièces de machine, lettres d'amour), sa météo, ses pilotes natifs et sa musique.

Les noms de lieux sont en français dans la version française et ont des équivalents natifs anglais (Mistvale, Saltshore, Ochre Reach, Lantern Isles, Copperwood, Glass Flats, Great White), jamais des traductions littérales.

---

## 4. Systèmes

### 4.1 L'aérodrome
Cinq zones à restaurer, chacune débloquant une capacité :
- **La piste** : longueur = types d'avions utilisables.
- **Le hangar** : nombre d'avions, qualité de l'entretien.
- **La tour** : météo visible, vols de nuit.
- **Le café** : recrutement des pilotes, moral, lieu des histoires.
- **L'atelier** : améliorations d'avions, réparations rapides.

Puis la décoration pure : fleurs, bancs, drapeaux, enseigne, peintures du hangar. Sans effet sur le jeu, sauf un léger bonus de moral des pilotes. C'est le Stardew en nous.

### 4.2 Les pilotes
- Des pilotes passent au café ; on les recrute avec une carte « pilote de passage », toujours le suivant d'une liste fixe (voir le [Monde](Monde)). Un pilote ne mène qu'un avion à la fois : tant qu'un avion attend le sien, cette carte vient en tête du tirage (§4.4, « Le hangar attend son pilote »).
- **Traits** (deux par pilote, huit en tout) : Nocturne, Économe, Tête brûlée, Météo dans la peau, Mains d'or, Longues routes, Cœur de village, Porte-bonheur.
- **Fatigue** et **moral** : un pilote fatigué ne vole pas moins bien : après huit heures de vol, il se repose au sol jusqu'à pouvoir repartir ; un pilote heureux casse moins (un quart d'incidents en moins à 20 de moral, un quart de plus à 0). La chance, qui fait venir plus d'opportunités, vient des traits, pas du moral.
- **Affinité** : grandit à chaque vol. Des paliers débloquent des **histoires personnelles** en quelques écrans dialogués. C'est le contenu émotionnel du jeu, celui qu'on écrira avec le plus de soin.
- Les pilotes ont des noms natifs selon la locale du joueur, et des origines réparties dans les sept régions du monde inventé.

### 4.3 Les avions
Cinq archétypes au lancement complet, trois dans la première version :

| Archétype | Portée | Capacité | Vitesse | Fiabilité | Note |
|---|---|---|---|---|---|
| Biplan courrier | courte | faible | lente | bonne | Le premier avion |
| Monoplan rapide | moyenne | faible | rapide | moyenne | Plis urgents |
| Trimoteur | longue | forte | moyenne | bonne | Le cheval de trait |
| Hydravion | moyenne | moyenne | lente | bonne | Obligatoire sur la Côte et l'Archipel |
| Long-courrier | très longue | moyenne | moyenne | fragile | Grand Blanc, Désert |

Usure à chaque vol, entretien au hangar : au sol, l'usure redescend de dix points par heure, une fois et quart plus vite avec l'établi, une fois et demie avec l'atelier (règle du 18 octobre 2026 ; un avion usé ne le reste pas, l'absence répare). Pièces améliorables à l'atelier (moteur, réservoir, soute, instruments).

### 4.4 Les cartes
Le moteur de variété du jeu, et l'héritage des démos de Tarot et de 8 américain.

- **Main de 5**, tirage de 3 par jour (jour = 24 h réelles). Les jours d'absence tirent aussi leurs cartes, au retour, du plus ancien au plus récent : seules se perdent celles qui n'ont pas la place dans la main (deux jours suffisent à remplir une main vide).
- **Contrats** : une destination, un chargement, un délai souple, une récompense. Le délai souple donne un bonus s'il est tenu, jamais de pénalité s'il ne l'est pas.
- **Imprévus** : météo, panne, pilote malade, grève du bac. Ils se résolvent par un choix (payer, attendre, risquer).
- **Opportunités** : un avion d'occasion, un pilote de passage, une fête au village.
- **Histoires** : pas de carte. Les trois scènes d'un pilote s'ouvrent par l'affinité, à 3, 7 et 12 vols faits ensemble.

Le tirage est **déterministe côté serveur** (graine par joueur et par jour) : reproductible, auditable, impossible à manipuler depuis le navigateur.

**L'escale attend sa lettre** (14 octobre 2026) : parmi les contrats, ceux d'une escale qui n'a encore jamais reçu de courrier pèsent trois fois plus, sans changer la part des imprévus et des occasions. Sans cette règle, la dernière escale d'une région ne dépendait que de la chance : pour Lanterne-du-Val, 24 % par jour, et un joueur sur dix attendait plus de neuf jours. Avec elle : 48 % par jour, neuf joueurs sur dix en quatre jours.

**Le hangar attend son pilote** (31 octobre 2026) : tant que la compagnie a plus d'avions que de pilotes, la première carte du tirage est une carte d'embauche, sauf si l'une d'elles attend déjà en main. S'il y en a plusieurs dans le paquet (la Forêt et l'Archipel ont la leur), le tirage choisit au poids, avec la même graine. Le reste du tirage ne change pas, une main pleine ne reçoit toujours rien, et quand les dix pilotes sont engagés, il n'y a plus de carte d'embauche à tirer. Le constat de Régis, le 31 octobre : deux Grives au hangar, Prosper seul pour les mener, et dix jours sans carte pilote — or un pilote ne mène qu'un avion à la fois, et la seconde Grive restait au sol. Mesuré dans cet état (deux Grives, un pilote, Côte et Forêt ouvertes, main vide), avant la règle : la carte d'embauche ne sortait que 7,7 % des jours, et 45 % des joueurs passaient dix jours sans la voir ; ses dix jours étaient le cas ordinaire.

Ce que la règle change, mesuré le 31 octobre 2026 par un robot qui joue les vraies règles du serveur sans jamais se tromper — ses chiffres sont **un plafond**, pas ceux d'un joueur —, 60 joueurs sur 45 jours, mêmes graines avant et après (l'outil de mesure n'est pas encore dans le dépôt) :

| Profil | Deux équipages volent : médiane des 60 joueurs | Pas encore au jour 30 (dont : jamais en 45 jours) | Jours avec un avion sans pilote, sur 45 (moyenne) | Gain net des vols par jour (recettes moins salaires et entretien) |
|---|---|---|---|---|
| La compagnie de Régis au 31 octobre, passages réalistes | jour 12 → dès le premier tirage | 8 sur 60 (dont 4) → aucun | 14,5 → 0 | 189,6 → 215,2 F (+13,5 %) |
| Compagnie neuve, deux passages de dix minutes | jour 28 → jour 20 | 23 sur 60 (dont 7) → 11 (dont 3) | 5,3 → 0,3 | 196,4 → 205,5 F (+4,6 %) |
| Compagnie neuve, une heure par jour | jour 29 → jour 23 | 23 sur 60 (dont 8) → 13 (dont 5) | 4,6 → 0,3 | 186,1 → 197,1 F (+5,9 %) |

La médiane compte les 60 joueurs : celui qui n'a pas deux équipages au bout des 45 jours compte parmi les plus lents, il n'est pas écarté. Les profils, aux heures de Paris : **passages réalistes** (P_REALISTE dans l'étude), un passage de dix minutes à 9 h, manqué deux jours sur trois, et un passage de vingt minutes à 18 h, la ligne régulière une fois par passage, le vol le plus proche d'abord ; **deux passages de dix minutes** (P_REGIS), à 8 h et à 18 h ; **une heure par jour** (P_UNE_HEURE), à 18 h. La compagnie de Régis est approchée : deux Grives, Prosper seul, la vallée livrée, la Côte et la Forêt ouvertes, la main vide au départ. Dans les compagnies neuves, le deuxième avion arrive au même jour qu'avant (médiane des 60 joueurs : jour 20 avec deux passages, jour 23 à une heure par jour) : la règle ne fait pas venir l'avion, elle fait venir son pilote, au tirage qui suit l'achat et non le jour même — ce qui laisse 0,3 jour d'avion sans pilote en moyenne.

### 4.5 L'économie
Deux monnaies, deux rôles distincts :
- **Francs** : la monnaie courante. Revenus des contrats ; dépenses en carburant, salaires, entretien, construction.
- **Cachets** : la monnaie de prestige. Chaque page de l'album en rapporte un (premier vol, première livraison à une escale, une histoire entendue, une saison, toute une région…) ; une première livraison lointaine en rapporte deux ou trois. Ils ouvrent les routes des régions, et ne servent qu'à ça. On ne peut pas les acheter.

La rentabilité se joue sur le choix des lignes, l'adéquation avion/ligne, le repos des pilotes et l'entretien préventif. Pas de « timers d'énergie » à racheter.

**Ce que rapporte une séance** (mesuré le 13 octobre 2026, simulation du vrai tirage). Le nombre de cartes est fixe, trois par jour ; ce qui change d'une région à l'autre, c'est ce que vaut chaque carte. Par contrat, les régions lointaines paient beaucoup plus ; par heure de vol, à peu près pareil, parce que leurs vols sont longs :

| Région | Net moyen par contrat | Aller-retour | Par heure de vol |
|---|---|---|---|
| Vallées de Brume | 75 F | 29 min | 155 F |
| Forêt de Cuivre | 190 F | 90 min | 127 F |
| Côte de Saline | 191 F | 89 min | 128 F |
| Archipel | 366 F | 126 min | 174 F |

Ce qui fait grandir une séance d'une heure, c'est la **flotte**, parce qu'un vol lointain se lance en partant et rapporte pendant l'absence : environ **125 F** avec la Grive seule, **210 F** avec un Pic et un hangar à deux places, **235 F** avec un deuxième pilote, **330 F** avec la Côte et la Sterne, **460 F** avec l'Archipel, le Goéland et quatre pilotes (avant imprévus, hors prime d'hiver). Ouvrir une route sans l'avion qui va avec ne rapporte presque rien : la Grive seule n'atteint que deux escales de la Forêt.

**Le premier mois** (crible du 14 octobre 2026). À une heure par jour, la vallée est livrée en cinq jours (neuf pour neuf joueurs sur dix) et la route suivante s'ouvre dans la foulée ; mais la Grive n'y atteint que deux escales, et le deuxième avion arrivait vers le jour 36. Trois à quatre semaines à rejouer la même vallée, c'était trop. Deux décisions : la **Grive d'occasion** (1 500 F, plus 700 F de hangar) passe deux fois plus souvent dans les cartes — avec son pilote, qui suit au tirage d'après depuis le 31 octobre (§4.4), deux équipages volent vers le jour 23 ; au jour 30, 13 joueurs sur 60 n'y sont pas encore, dont 5 qui n'y arrivent pas en 45 jours (re-mesuré le 31 octobre 2026 sur 60 joueurs, une heure par jour à 18 h, heure de Paris ; un plafond, le robot ne se trompe jamais) — et le cap la signale tant qu'on n'a qu'un avion ; le **Pic et la Sterne baissent d'un huitième** (3 675 F et 4 725 F ; 3 150 F et 3 850 F en occasion), ce qui ramène le Pic vers le jour 28 avec une Grive, plus tôt avec deux.

### 4.6 Les saisons
Les saisons suivent le vrai calendrier (printemps le 20 mars, été le 21 juin, automne le 23 septembre, hiver le 21 décembre) : quand il neige chez le joueur, il neige sur la Croisette. Chaque saison change une ou deux règles, jamais plus, et aucune ne punit l'absence : les semences au printemps, moins de brume et de vent de mer l'été, plus de brume l'automne, des vols plus longs mais mieux payés l'hiver. Deux contrats et un imprévu par saison ne se tirent qu'en leur temps ; la scène change de couleurs. Le détail est dans le [Monde](Monde). (L'ébauche d'origine — deux semaines par saison, des fêtes à événements — a été abandonnée le 12 octobre au profit du calendrier réel.)

### 4.7 Pourquoi on revient — les récompenses

Pas de série à ne pas rompre, pas d'énergie à racheter, rien qui punisse l'absence. Ce qui fait revenir, c'est ce qu'on *trouve* en revenant, et ce qu'on *garde*. Six leviers, tous dans la v0.1 sauf mention :

| Levier | Ce que le joueur ressent | Où ça vit |
|---|---|---|
| **Le courrier arrivé** | « Pendant que je dormais, la Grive est rentrée avec quarante francs et une lettre. » Chaque retour est une petite récolte, jamais une corvée. | Vols sans tick, revenus crédités à la lecture |
| **Les trois cartes du jour** | Une raison d'ouvrir le jeu une fois par jour, parce que la journée est différente — jamais une obligation : la main de cinq garde les cartes non jouées. | Tirage déterministe par jour |
| **L'aérodrome qui change** | Une piste roulée, une porte neuve, une enseigne, un banc : du progrès qu'on *voit* à l'écran, qui ne régresse jamais. | Zones et décorations |
| **Les histoires** | Un pilote qui finit par vous raconter d'où il vient. On vole *pour* entendre la suite. C'est le contenu qu'on écrit avec le plus de soin. | Affinité par vol ; scènes à 3, 7, 12 vols |
| **L'album de cachets** | Chaque « première » colle une page dans un album de timbres : premier vol, chaque village, un vol de nuit, dix délais tenus, une histoire entendue, toute la vallée. Une collection à compléter, pas un classement. Les cachets débloquent aussi les régions. | `STAMPS` dans le monde ; dans l'aérodrome, une grille de timbres sur toute la largeur, avec le compte des pages et des cachets gagnés ; chaque page porte sa valeur (+1, +2, +3) |
| **Le compteur mondial** | « Ce mois-ci, les aviateurs du monde ont acheminé 12 408 plis. » On fait partie de quelque chose, sans se comparer à personne. | Agrégat anonyme (section 5) |

En v2 s'ajoutent le défi hebdomadaire volontaire (section 5) et les saisons, dont chaque événement apporte ses cartes et ses cachets rares.

Ce qu'on refuse, et pourquoi : les séries quotidiennes (elles transforment un plaisir en dette), les minuteurs d'énergie (ils vendent du temps), les classements permanents (ils récompensent la disponibilité, pas le jeu). Stardew Valley n'en a aucun et personne n'y joue moins pour autant.

---

## 5. Le social, mesuré

Décision du 10 octobre 2026, consignée dans JOURNAL.md.

- **Au lancement : un compteur mondial anonyme.** « Ce mois-ci, les aviateurs du monde ont acheminé N plis. » Agrégat sans aucune donnée personnelle. Sentiment d'appartenance, zéro compétition.
- **En v2 : un défi hebdomadaire sur inscription volontaire.** Une épreuve standardisée, mêmes conditions pour tous, classement remis à zéro chaque semaine, pseudonyme seul, retrait possible à tout moment.
- **Jamais au lancement : chat, liste d'amis, messagerie.** Ces fonctions imposent modération, obligations DSA et risques pour les mineurs, hors de portée d'un développeur seul.
- **Pseudonymes** : filtre anti-insultes multilingue à l'inscription, bouton de signalement, modification possible.

Tout score, tout compteur vient du serveur. Le navigateur n'envoie que des **intentions** (« expédie ce pilote sur cette ligne »), jamais des résultats.

---

## 6. Génération des noms de compagnie

Le joueur fonde une compagnie ; trois noms lui sont proposés, il peut en tirer d'autres ou écrire le sien (soumis au filtre).

- **Deux banques natives, fr et en**, jamais de traduction automatique. Un nom français traduit sonne traduit.
- **Motifs d'époque par langue** : « {Nom} {Adj} & Cie », « Compagnie des {Lieu} », « Comptoir du {Nom} », « Messageries {Nom} » en français ; « {Adj} {Noun} & Co. », « The {Noun} Line », « {Noun}line Mail Co. », « {Place} Airmail » en anglais.
- **Liste d'exclusion** de marques et compagnies réelles (comparaison sans accents ni casse), étoffée au fil du projet.
- Les motifs français n'emploient que des mots féminins ou masculins déjà accordés (« Brume Dorée », « Comptoir du Zéphyr ») : pas d'accord à calculer. D'autres locales s'ajoutent par simple fichier de banque.
- Implémentation : `packages/server/src/world/names.ts`, déterministe par graine (les trois noms proposés à un joueur sont rejouables), testée sur mille tirages contre la liste d'exclusion.

---

## 7. Direction artistique

- **Résolution interne** de la scène : 320 × 144, dessinée pixel par pixel en SVG par `scripts/scene-build.mjs`. Elle prend la largeur de la page, 16 rem de haut au plus, et sur un écran large elle se recadre en gardant le bas de l'image plutôt que de se déformer ; les panneaux d'interface (cartes, lignes, pilotes) occupent le reste.
- **Interface en DOM/CSS, pas en canvas.** Décision structurante : l'interface d'un jeu de gestion est faite de listes, de cartes et de boutons. En DOM, elle est lisible par les lecteurs d'écran, navigable au clavier, redimensionnable, traduisible. La scène de l'aérodrome est un SVG ; le seul canvas du jeu est le QR code de la connexion.
- **Palette** : 32 couleurs maximum, chaudes, inspirée des affiches de compagnies aériennes des années 1930. Ciel pâle, ocre, laiton, vert-de-gris, bleu brume, rouge cachet. Chaque région emprunte 8 couleurs à la palette commune et en ajoute 4 propres.
- **Sprites** : décor 16 × 16, pilotes 24 × 32, avions 32 × 16 (vue de trois quarts, trois frames d'hélice).
- **Typographie** : une police pixel sous licence OFL pour les titres ; pour le texte courant, une police **lisible** (sans-serif OFL, taille ≥ 16 px CSS), parce que les polices pixel pures échouent aux critères de lisibilité. Un réglage « Tout en pixel » pour les puristes.
- **Animation** : douce, lente, jamais clignotante. Fumée des moteurs, drapeaux au vent, pilotes qui marchent. Tout respecte `prefers-reduced-motion`.
- **La page de l'aérodrome sur grand écran** (14 octobre 2026) : deux colonnes équilibrées, à gauche ce qui vole (les vols, le courrier du jour, les pilotes, le hangar, le livre de bord), à droite ce qui se construit (les zones, les routes) ; en dessous, sur toute la largeur, les collections : les décorations en grille, puis l'album en timbres de même taille, nom et légende sur deux lignes. Sur un PC en 1440 × 900, l'album entier tient dans un écran. Un test de bout en bout le vérifie à chaque PR, sur PC et sur téléphone.

---

## 8. Musique et son

- Synthèse façon puce 2A03 (deux carrés, un triangle), **jouée dans le navigateur par Web Audio** (`packages/client/src/music.ts`) : aucun fichier audio à charger, une boucle de seize mesures sans couture, et une musique qui est du code — entièrement à nous, modifiable note par note. **Quatre thèmes, un par saison** (14 octobre 2026) : la valse de printemps (le thème d'origine, aussi composé en Python dans `tools/music/`), la ritournelle d'été, la berceuse d'automne, le chant d'hiver ; c'est la saison du calendrier qui choisit.
- **Thème principal** : valse lumineuse en ré majeur, 96 BPM (v2 du 10 octobre). Un thème par région, une variante nuit, un thème de saison.
- Sons courts pour les actions (tampon de cachet, moteur qui démarre, cloche d'arrivée). Jamais d'information portée **uniquement** par le son.
- Volume musique et effets séparés, mémorisés, coupés par défaut sur mobile au premier lancement (respect de l'autoplay et du contexte).

---

## 9. Accessibilité (WCAG 2.2 niveau AA)

Objectif ferme, pas une case à cocher. Le choix de l'interface en DOM rend l'essentiel atteignable.

- Contraste ≥ 4,5:1 pour tout texte, ≥ 3:1 pour les éléments d'interface : la palette définit des **paires texte/fond homologuées**, et le pipeline vérifie les contrastes automatiquement.
- Navigation complète au clavier, focus visible, ordre logique.
- Lecteur d'écran : chaque panneau est une région ARIA nommée ; les arrivées de vols annoncées dans une zone `aria-live` polie ; la scène SVG est décorative et cachée aux lecteurs d'écran (`aria-hidden`) : l'état du jeu se lit dans les panneaux.
- Cibles tactiles ≥ 44 × 44 px CSS.
- Aucune information portée par la couleur seule (icône + texte toujours). Exemple : les conditions d'une route fermée portent ✓ ou ✗, la couleur, et « fait » / « manque » pour les lecteurs d'écran.
- Un texte coupé à l'écran (les légendes de l'album, sur deux lignes) reste **entier dans la page** : lu par les lecteurs d'écran, affiché au survol.
- `prefers-reduced-motion` respecté ; pas de clignotement ; animations stoppables.
- Pas de limite de temps punitive : le temps réel des vols ne retire jamais rien.
- Taille de texte ajustable jusqu'à 200 % sans perte.
- Audit automatisé (axe-core) dans le pipeline + test manuel au lecteur d'écran avant chaque version majeure.

---

## 10. Internationalisation

- **FR et EN au lancement**, architecture prête pour d'autres langues.
- Messages au format ICU (pluriels, genres), jamais de concaténation de chaînes.
- Mise en page prête pour les langues de droite à gauche.
- Nombres, dates, durées formatés selon la locale.
- Banques de noms (pilotes, compagnies, lieux) par locale, natives.
- Fichiers de traduction dans le dépôt : sous AGPL, la communauté peut proposer des langues.

---

## 11. Architecture technique

### Vue d'ensemble
```
[Navigateur / PWA]  ──HTTPS──▶  [Cloudflare]  ──Tunnel──▶  [NAS : conteneurs]
 SVG (scène)                      DNS, TLS,                  api  (Node/Fastify)
 DOM (interface)                  anti-DDoS,                 web  (statique)
 Service worker                   cache statique             cloudflared
                                                             sqlite (volume)
```

### Choix
| Couche | Choix | Licence | Pourquoi |
|---|---|---|---|
| Scène | SVG dessiné pixel par pixel, généré par `scripts/scene-build.mjs` | — | Aucune dépendance ; net à toutes les tailles ; les couleurs vivent dans `styles.css` et suivent l'heure et le mode nuit |
| Interface | DOM + CSS, TypeScript sans framework lourd | — | Accessibilité, légèreté, longévité |
| PWA | Service worker, manifest, Web Push écrit dans le dépôt (VAPID + aes128gcm, node:crypto) | — | Installable, notifications « courrier arrivé » ; pas de cache hors-ligne : le serveur fait autorité (décision du 11/10) |
| API | Node 22 LTS + Fastify | MIT | Rapide, léger sur un NAS, écosystème sûr |
| Auth | Code propre au projet (lien magique, sessions) + SimpleWebAuthn pour les passkeys | MIT | Sans mot de passe ; chaque ligne du flux est dans le dépôt et testée (décision du 11/10, voir journal) |
| Base | SQLite via `node:sqlite` (intégré à Node), mode WAL | — | Aucune dépendance native ; un fichier, suffisant jusqu'à des dizaines de milliers de joueurs |
| Emails | Brevo (API) | — | Européen, gratuit à notre échelle |

Migration ultérieure vers Postgres possible sans changer l'application (couche d'accès isolée).

### Simulation autoritative côté serveur
- Le client envoie des **intentions** ; le serveur valide et résout.
- **Pas de tick** : l'état se calcule à la lecture à partir des horodatages (un vol parti à T avec une durée D est arrivé si maintenant ≥ T + D). Aucun cron, aucune charge à vide : idéal pour un NAS.
- RNG déterministe par joueur et par jour, graine côté serveur.
- Pas d'identifiant de requête : un double appui n'expédie pas deux fois parce que le bouton se désactive pendant l'envoi, et que le serveur refuse un avion ou un pilote déjà en vol.

### Modèle de données (esquisse)
`players` (id, email, nickname, locale, created_at, consent_*), `passkeys`, `sessions`, `companies`, `aerodrome_zones`, `pilots`, `planes`, `routes`, `flights` (departed_at, duration_s, outcome_seed), `cards`, `hands`, `ledger` (chaque mouvement de francs, en ajout seulement), `world_stats` (agrégats anonymes).

Le `ledger` (le livre de bord) garde, en ajout seulement, les mouvements de francs depuis la fondation : départs, arrivées, cartes jouées, achats, chantiers ; il note aussi, à zéro franc, les embauches et les routes ouvertes. Il ne porte ni le capital de départ ni les cachets : la caisse et les cachets de la compagnie sont dans `companies`, et les cachets se lisent dans l'album. Il sert à relire une partie, pas à la reconstruire.

### API
REST JSON, versionnée (`/v1`), OpenAPI généré et publié, validation stricte des schémas en entrée (rien n'entre sans schéma).

---

## 12. Sécurité dès la conception

Cible : OWASP ASVS niveau 2.

- **Données minimales** : email, pseudonyme, clé publique de passkey, locale, état du jeu. Pas de mot de passe. Les adresses IP ne vivent que dans les journaux techniques, pour le diagnostic et l'anti-abus : 30 Mo au plus par conteneur, effacés à chaque mise à jour du jeu, sans durée fixe (décision du 18 octobre 2026 : le texte suit le réglage). Pas d'analytique tierce.
- **En-têtes** : CSP stricte sans nonce, parce qu'il n'y a aucun script ni style en ligne, HSTS préchargé, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimale, COOP/COEP.
- **Auth** : liens magiques à usage unique, 10 minutes ; passkeys liées au domaine (découvrables, l'authenticateur ne reçoit que le pseudonyme, dix par compte, compteur de signatures vérifié) ; flux QR pour PC avec code à six chiffres à confirmer sur le téléphone, 90 secondes, usage unique, trois secrets distincts (code d'appareil dans le QR — en fragment d'URL —, jeton d'interrogation gardé par le PC, code lisible pour la personne) ; sessions en cookies `HttpOnly`, `Secure`, `SameSite=Lax`.
- **Limitation de débit** par adresse IP (celle que donne Cloudflare, gardée en mémoire sous forme d'empreinte salée) : 120 requêtes d'API et 600 de pages par minute, et des plafonds plus serrés sur l'authentification, les écritures et le contact. En IPv6, l'adresse compte par bloc /64 (celui d'un abonné). En plus, trois liens de connexion au plus par adresse email et par quart d'heure, et un plafond pour tout le jeu, compté par jour (minuit UTC) : 250 liens, dont 150 inscriptions au plus, pour rester sous les 300 courriels par jour de Brevo et garder des liens aux joueurs inscrits (depuis le 18 octobre 2026). Pas de compteur par compte.
- **Serveur autoritatif** sur tout ce qui a une valeur.
- **Secrets** : variables d'environnement sur le NAS, jamais dans Git ; gitleaks bloque tout commit fautif.
- **Chaîne d'approvisionnement** : dépendances épinglées par hachage, Dependabot, audit automatique, liste blanche de licences (MIT, BSD, Apache-2.0, ISC, CC0, OFL), SBOM CycloneDX publié, image Docker signée (cosign) et vérifiée au démarrage, conteneurs non-root en lecture seule.
- **Sauvegardes** chiffrées, quotidiennes, restauration testée chaque trimestre et consignée.
- **Journalisation** structurée : une ligne par requête, avec la méthode, le chemin sans ce qui suit « ? » et l'adresse IP du visiteur ; Docker garde trois fichiers de 10 Mo, et la politique de confidentialité annonce 7 jours.
- `SECURITY.md` avec contact et délai de réponse ; divulgation responsable bienvenue.

---

## 13. RGPD et conformité

- **Registre des traitements** tenu dans `docs/legal/`.
- **Bases légales** : exécution du contrat pour le compte et le jeu ; consentement pour le futur classement volontaire. Pas de publicité, donc pas de bandeau de consentement (décision du 12/10, § 14).
- **Droits** : export JSON complet en un clic, suppression immédiate en cascade, rectification du pseudonyme, tout depuis les réglages.
- **Conservation** : compte inactif supprimé après 24 mois, avec deux avertissements par email.
- **Mineurs** : âge minimum 15 ans (France), déclaration à l'inscription, langage adapté à tous les âges dans le jeu.
- **Sous-traitants** listés dans la politique de confidentialité : Cloudflare, Brevo. Transferts hors UE documentés. Aucune régie publicitaire.
- **Documents** : mentions légales, CGU, politique de confidentialité, politique cookies, tous en FR et EN, relus par un professionnel avant lancement.
- **Statut** : micro-entreprise dès les premiers revenus.

---

## 14. Monétisation, et ses limites

**Décision du 12 octobre 2026 : pas de publicité.** Ni AdSense, ni publicités
récompensées, ni récupération anti-bloqueur. Le plan d'origine (ci-dessous, barré
dans l'esprit) supposait une régie Google : une seule balise publicitaire aurait
fait tomber `connect-src 'self'`, les trois notes A+ mesurées, l'argument « zéro
traqueur », et imposé un bandeau de consentement. Le jeu coûte une dizaine d'euros
par an ; il n'a pas besoin de vendre l'attention de ses joueurs pour vivre.

- **Buy Me a Coffee, par étapes** — une bière, sur la page de l'auteur. Depuis le
  12/10, le lien existe **sur la page GitHub du dépôt seulement** (`.github/FUNDING.yml` et la section *Soutenir* du
  README) : ceux qui lisent le code peuvent remercier, les joueurs ne voient rien.
  Dans le jeu, plus tard, et alors un lien sortant dans les crédits et les
  réglages, jamais un script embarqué : rien ne se charge depuis chez eux tant
  qu'on n'a pas cliqué. Un don ne donnera jamais d'avantage ; au mieux une plaque
  gravée au café de l'aérodrome, visible et cosmétique.
- **Jamais** : publicité, coffres aléatoires payants, achat de francs ou de
  cachets, timers à racheter.

*Abandonné le 12/10 :* un bandeau AdSense hors de la zone de jeu ; des publicités
récompensées H5 Games Ads ; la récupération anti-bloqueur de Google sur PC.

---

## 15. Périmètre de la première version (v0.1, « la tranche »)

Ce qu'on livre d'abord, pour jouer vite et apprendre vite :

- Une région : les Vallées de Brume, 6 destinations.
- 3 avions (biplan, monoplan, trimoteur), 4 pilotes avec traits et une histoire chacun.
- 20 cartes contrat, 10 cartes imprévu, 4 cartes opportunité.
- Aérodrome : piste et hangar restaurables, 10 décorations.
- Compte sans mot de passe (lien magique + passkey + QR), CGU, confidentialité, export, suppression.
- FR et EN.
- Compteur mondial anonyme.
- Thème musical principal + 6 sons.
- Pipeline complet, hébergement NAS.

Hors v0.1 : classement, saisons, autres régions. (La publicité, prévue ici à l'origine, est abandonnée : § 14.)

## 16. Feuille de route

| Version | Contenu | Repère | Statut |
|---|---|---|---|
| **v0.1** | La tranche ci-dessus | Jouable par des proches | ✅ 11 octobre 2026 (les [24 heures](Les-24-heures)) |
| **v0.2** | Côte de Saline + Archipel, hydravion, histoires de pilotes, décoration complète | Ouverture publique, en essai | ✅ 12 octobre 2026 (version `0.2.0`) |
| **v0.3** | Saisons et événements, la Forêt de Cuivre, le fret lourd, l'aérodrome qui grandit | Première « année » de jeu | ✅ **17 octobre 2026** (étiquette `v0.3.0`) |
| **v1.0** | Les sept régions, cinq avions, 20 pilotes, bande-son complète | Passage VPS si nécessaire | En cours |

**Où en est la v1.0** (mesuré le 17 octobre) : 4 régions sur 7 — il manque les
Hauts-Plateaux d'Ocre, le Désert de Verre et le Grand Blanc ; **6 avions** sur les cinq
demandés, l'objectif est donc dépassé (deux autres viendront avec les régions
manquantes : le planeur postal et le long-courrier terrestre) ; 10 pilotes sur 20, à
compléter par paires pour que la parité tienne à chaque palier ; 4 musiques de saison.
Ces nombres ne changent pas : la v1.0 reste définie par eux.

**Deux conditions s'y ajoutent, qui ne sont pas du contenu.** « 1.0 » veut dire que le
jeu sort d'essai (`stage` ne dira plus « essai » sur `/v1/version`), et on n'en sort pas
sur un compte de régions :

1. **L'accessibilité mesurée**, pas seulement soignée — avec les outils et avec des
   personnes concernées. C'est la seule ligne encore vide du tableau de [Sécurité](Securite).
2. **Une partie jouée de bout en bout sans trouver de mécanisme qui ment** : c'est le
   crible du jour 4 appliqué à la partie entière, et c'est ce que l'auteur fait depuis
   le jour 5 — le cap et la carte du Héron en sont sortis.

## 17. Risques et parades

| Risque | Parade |
|---|---|
| Volume de pixel art (sept régions) | Palette commune, tilesets réutilisables, une région à la fois, v0.1 n'en a qu'une |
| Dérive de périmètre d'un développeur seul | Ce document fait foi ; tout ajout passe par une entrée au JOURNAL et un arbitrage |
| Financement | Pas de publicité (décision du 12/10) ; Buy Me a Coffee, plus tard, suffit à couvrir ~10 €/an |
| Bande passante du NAS | Statique servi et mis en cache par Cloudflare ; l'API ne transporte que du JSON léger |
| Conflit de marque tardif | Vérification INPI/EUIPO avant achat ; dépôt INPI envisagé dès les premiers revenus |
| Triche | Serveur autoritatif dès la première ligne, RNG côté serveur, ledger append-only |
| Fuite de données | Il n'y a presque rien à fuir : pas de mot de passe, pas d'IP, pas de profil |
