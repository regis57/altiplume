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
2. Trois cartes ont été tirées pour la journée : contrats, imprévus, opportunités. On en garde ce qu'on veut dans une main de cinq.
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
- Un roster tournant au café ; on recrute avec un contrat d'embauche.
- **Traits** (deux par pilote) : Nocturne, Économe, Tête brûlée, Météo dans la peau, Mains d'or, Grand voyageur, Casanier, Porte-bonheur…
- **Fatigue** et **moral** : un pilote fatigué vole moins bien ; un pilote heureux apporte des cartes bonus.
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

Usure à chaque vol, entretien au hangar, pièces améliorables à l'atelier (moteur, réservoir, soute, instruments).

### 4.4 Les cartes
Le moteur de variété du jeu, et l'héritage des démos de Tarot et de 8 américain.

- **Main de 5**, tirage de 3 par jour (jour = 24 h réelles).
- **Contrats** : une destination, un chargement, un délai souple, une récompense. Le délai souple donne un bonus s'il est tenu, jamais de pénalité s'il ne l'est pas.
- **Imprévus** : météo, panne, pilote malade, grève du bac. Ils se résolvent par un choix (payer, attendre, risquer).
- **Opportunités** : un avion d'occasion, un pilote de passage, une fête au village.
- **Histoires** : cartes rares qui ouvrent un chapitre de pilote.

Le tirage est **déterministe côté serveur** (graine par joueur et par jour) : reproductible, auditable, impossible à manipuler depuis le navigateur.

### 4.5 L'économie
Deux monnaies, deux rôles distincts :
- **Francs** : la monnaie courante. Revenus des contrats ; dépenses en carburant, salaires, entretien, construction.
- **Cachets** : la monnaie de prestige. Gagnés à la première ouverture d'une ligne, à la fin d'une histoire de pilote, aux événements de saison. Ils débloquent les régions. On ne peut pas les acheter.

La rentabilité se joue sur le choix des lignes, l'adéquation avion/ligne, le repos des pilotes et l'entretien préventif. Pas de « timers d'énergie » à racheter.

### 4.6 Les saisons
Une saison = deux semaines réelles, une année = huit semaines. Chaque saison modifie la météo par région et apporte un événement (la Fête des Lanternes, la Grande Brume, la Moisson de Saline) avec ses cartes et ses décorations.

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
- Accord grammatical en genre et nombre géré par la banque (à implémenter proprement, le prototype `tools/name_generator.py` ne le fait pas encore).
- D'autres locales s'ajoutent par simple fichier de banque.

---

## 7. Direction artistique

- **Résolution interne** de la scène : 320 × 180, mise à l'échelle par entiers (×4 = 1280 × 720, ×6 = 1920 × 1080). Sur téléphone en portrait, la scène occupe le tiers haut de l'écran en 320 × 180 letterboxée ; les panneaux d'interface (cartes, lignes, pilotes) occupent le reste.
- **Interface en DOM/CSS, pas en canvas.** Décision structurante : l'interface d'un jeu de gestion est faite de listes, de cartes et de boutons. En DOM, elle est lisible par les lecteurs d'écran, navigable au clavier, redimensionnable, traduisible. Seule la scène de l'aérodrome est en canvas.
- **Palette** : 32 couleurs maximum, chaudes, inspirée des affiches de compagnies aériennes des années 1930. Ciel pâle, ocre, laiton, vert-de-gris, bleu brume, rouge cachet. Chaque région emprunte 8 couleurs à la palette commune et en ajoute 4 propres.
- **Sprites** : décor 16 × 16, pilotes 24 × 32, avions 32 × 16 (vue de trois quarts, trois frames d'hélice).
- **Typographie** : une police pixel sous licence OFL pour les titres ; pour le texte courant, une police **lisible** (sans-serif OFL, taille ≥ 16 px CSS), parce que les polices pixel pures échouent aux critères de lisibilité. Un réglage « Tout en pixel » pour les puristes.
- **Animation** : douce, lente, jamais clignotante. Fumée des moteurs, drapeaux au vent, pilotes qui marchent. Tout respecte `prefers-reduced-motion`.

---

## 8. Musique et son

- Synthèse façon puce 2A03 (deux carrés, un triangle, un bruit), composée en Python pur dans `music/`, donc entièrement à nous et modifiable note par note.
- **Thème principal** : valse lumineuse en ré majeur, 96 BPM (v2 du 10 octobre). Un thème par région, une variante nuit, un thème de saison.
- Sons courts pour les actions (tampon de cachet, moteur qui démarre, cloche d'arrivée). Jamais d'information portée **uniquement** par le son.
- Volume musique et effets séparés, mémorisés, coupés par défaut sur mobile au premier lancement (respect de l'autoplay et du contexte).

---

## 9. Accessibilité (WCAG 2.2 niveau AA)

Objectif ferme, pas une case à cocher. Le choix de l'interface en DOM rend l'essentiel atteignable.

- Contraste ≥ 4,5:1 pour tout texte, ≥ 3:1 pour les éléments d'interface : la palette définit des **paires texte/fond homologuées**, et le pipeline vérifie les contrastes automatiquement.
- Navigation complète au clavier, focus visible, ordre logique.
- Lecteur d'écran : chaque panneau est une région ARIA nommée ; les arrivées de vols annoncées dans une zone `aria-live` polie ; la scène canvas a une description textuelle équivalente.
- Cibles tactiles ≥ 44 × 44 px CSS.
- Aucune information portée par la couleur seule (icône + texte toujours).
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
 Phaser (scène)                   DNS, TLS,                  api  (Node/Fastify)
 DOM (interface)                  anti-DDoS,                 web  (statique)
 Service worker                   cache statique             cloudflared
                                                             sqlite (volume)
```

### Choix
| Couche | Choix | Licence | Pourquoi |
|---|---|---|---|
| Scène | Phaser 3 | MIT | Mûr, pixel-perfect, grande communauté |
| Interface | DOM + CSS, TypeScript sans framework lourd | — | Accessibilité, légèreté, longévité |
| PWA | Service worker, manifest | — | Installable, coquille hors-ligne, notifications |
| API | Node 22 LTS + Fastify | MIT | Rapide, léger sur un NAS, écosystème sûr |
| Auth | Code propre au projet (lien magique, sessions) + SimpleWebAuthn pour les passkeys | MIT | Sans mot de passe ; chaque ligne du flux est dans le dépôt et testée (décision du 11/10, voir journal) |
| Base | SQLite via `node:sqlite` (intégré à Node), mode WAL | — | Aucune dépendance native ; un fichier, suffisant jusqu'à des dizaines de milliers de joueurs |
| Emails | Brevo (API) | — | Européen, gratuit à notre échelle |

Migration ultérieure vers Postgres possible sans changer l'application (couche d'accès isolée).

### Simulation autoritative côté serveur
- Le client envoie des **intentions** ; le serveur valide et résout.
- **Pas de tick** : l'état se calcule à la lecture à partir des horodatages (un vol parti à T avec une durée D est arrivé si maintenant ≥ T + D). Aucun cron, aucune charge à vide : idéal pour un NAS.
- RNG déterministe par joueur et par jour, graine côté serveur.
- Écritures idempotentes (identifiant de requête) : un double tap n'expédie pas deux fois.

### Modèle de données (esquisse)
`players` (id, email, nickname, locale, created_at, consent_*), `passkeys`, `sessions`, `companies`, `aerodrome_zones`, `pilots`, `planes`, `routes`, `flights` (departed_at, duration_s, outcome_seed), `cards`, `hands`, `ledger` (chaque mouvement de francs ou de cachets, append-only), `world_stats` (agrégats anonymes).

Le `ledger` append-only est la source de vérité de l'économie : on peut rejouer, auditer, corriger.

### API
REST JSON, versionnée (`/v1`), OpenAPI généré et publié, validation stricte des schémas en entrée (rien n'entre sans schéma).

---

## 12. Sécurité dès la conception

Cible : OWASP ASVS niveau 2.

- **Données minimales** : email, pseudonyme, clé publique de passkey, locale, état du jeu. Pas de mot de passe. Pas d'adresse IP conservée au-delà de 7 jours (anti-abus seulement). Pas d'analytique tierce.
- **En-têtes** : CSP stricte avec nonces (aucun script inline), HSTS préchargé, `Referrer-Policy: strict-origin`, `Permissions-Policy` minimale, COOP/COEP.
- **Auth** : liens magiques à usage unique, 10 minutes ; passkeys liées au domaine ; flux QR pour PC avec code à confirmer sur le téléphone, 60 secondes, usage unique ; sessions en cookies `HttpOnly`, `Secure`, `SameSite=Lax`.
- **Limitation de débit** par IP et par compte sur l'auth et les écritures.
- **Serveur autoritatif** sur tout ce qui a une valeur.
- **Secrets** : variables d'environnement sur le NAS, jamais dans Git ; gitleaks bloque tout commit fautif.
- **Chaîne d'approvisionnement** : dépendances épinglées par hachage, Dependabot, audit automatique, liste blanche de licences (MIT, BSD, Apache-2.0, ISC, CC0, OFL), SBOM CycloneDX publié, image Docker signée (cosign) et vérifiée au démarrage, conteneurs non-root en lecture seule.
- **Sauvegardes** chiffrées, quotidiennes, restauration testée chaque trimestre et consignée.
- **Journalisation** structurée sans données personnelles, 30 jours.
- `SECURITY.md` avec contact et délai de réponse ; divulgation responsable bienvenue.

---

## 13. RGPD et conformité

- **Registre des traitements** tenu dans `docs/legal/`.
- **Bases légales** : exécution du contrat pour le compte et le jeu ; consentement pour la publicité personnalisée (bandeau certifié Google) et pour le futur classement volontaire.
- **Droits** : export JSON complet en un clic, suppression immédiate en cascade, rectification du pseudonyme, tout depuis les réglages.
- **Conservation** : compte inactif supprimé après 24 mois, avec deux avertissements par email.
- **Mineurs** : âge minimum 15 ans (France), déclaration à l'inscription, langage adapté à tous les âges dans le jeu.
- **Sous-traitants** listés dans la politique de confidentialité : Cloudflare, Brevo, Google (AdSense). Transferts hors UE documentés.
- **Documents** : mentions légales, CGU, politique de confidentialité, politique cookies, tous en FR et EN, relus par un professionnel avant lancement.
- **Statut** : micro-entreprise dès les premiers revenus.

---

## 14. Monétisation, et ses limites

- **Un seul bandeau**, hors de la zone de jeu, jamais entre un geste et son résultat.
- **Publicités récompensées** (H5 Games Ads, sur candidature) strictement optionnelles : un contrat bonus, jamais une condition de progression. Pas de formulation du type « soutenez-nous », interdite par Google.
- **Récupération anti-adblock** de Google sur PC (message non fermable avec bouton « Soutenir » vers Buy Me a Coffee) ; rappel doux seulement sur mobile.
- **Buy Me a Coffee** dans les crédits et les réglages. Un don offre une plaque gravée au café de l'aérodrome : visible, cosmétique, sans effet sur le jeu.
- **Jamais** : coffres aléatoires payants, achat de francs ou de cachets, timers à racheter, publicité interstitielle non sollicitée.

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

Hors v0.1 : classement, saisons, autres régions, publicité (on attend d'avoir du trafic pour AdSense).

## 16. Feuille de route

| Version | Contenu | Repère |
|---|---|---|
| **v0.1** | La tranche ci-dessus | Jouable par des proches |
| **v0.2** | Côte de Saline + Archipel, hydravion, histoires de pilotes, décoration complète | Ouverture publique, AdSense |
| **v0.3** | Saisons et événements, défi hebdomadaire volontaire, publicités récompensées | Première « année » de jeu |
| **v1.0** | Les sept régions, cinq avions, 20 pilotes, bande-son complète | Passage VPS si nécessaire |

## 17. Risques et parades

| Risque | Parade |
|---|---|
| Volume de pixel art (sept régions) | Palette commune, tilesets réutilisables, une région à la fois, v0.1 n'en a qu'une |
| Dérive de périmètre d'un développeur seul | Ce document fait foi ; tout ajout passe par une entrée au JOURNAL et un arbitrage |
| Refus AdSense ou H5 Games Ads | Le jeu ne dépend pas de la pub ; Buy Me a Coffee suffit à couvrir 10 €/an |
| Bande passante du NAS | Statique servi et mis en cache par Cloudflare ; l'API ne transporte que du JSON léger |
| Conflit de marque tardif | Vérification INPI/EUIPO avant achat ; dépôt INPI envisagé dès les premiers revenus |
| Triche | Serveur autoritatif dès la première ligne, RNG côté serveur, ledger append-only |
| Fuite de données | Il n'y a presque rien à fuir : pas de mot de passe, pas d'IP, pas de profil |
