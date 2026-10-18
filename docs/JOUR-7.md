# Jour 7 — la v0.3 est posée, le récit s'arrête

Sept jours. Le premier avait prouvé qu'un jeu pouvait exister en vingt-quatre heures ;
les suivants, qu'il pouvait grandir sans rien casser, se mesurer au lieu de s'affirmer,
dire vrai, montrer le chemin, puis vivre à côté d'un voisin. Le septième, le 17 octobre
2026, ne construit presque rien : il **nomme** ce qui est fait, et il s'arrête.

C'était prévu depuis le jour 5 : *le récit s'arrêtera au jour 7.* Cette page est donc la
dernière, et elle est close. Le jeu, lui, continue — mais il n'aura plus son chroniqueur
quotidien, et c'est une bonne nouvelle : un projet qui a besoin qu'on raconte chaque
journée est un projet qui n'a pas trouvé son rythme.

Le récit complet est dans le [Journal](Journal) ; la veille, dans [Jour 6](Jour-6).

## Dans l'ordre

1. **Le référencement, sans rien exposer.** Les pages publiques — l'accueil, l'aide, le
   contact, les trois textes juridiques — sont listées dans `/sitemap.xml`, en français
   et en anglais, reliées par `hreflang` pour qu'un moteur ne les compte pas deux fois.
   `/robots.txt` interdit le reste : l'API, les sondes, l'aérodrome, le compte, et
   surtout les pages de connexion — un lien de connexion indexé serait un lien périmé
   affiché au monde. Ces mêmes pages portent `noindex`, et un test vérifie que les deux
   listes concordent. L'accueil porte une fiche JSON-LD : un jeu, gratuit, dans le
   navigateur, sous AGPL. Aucun tiers, aucun script, aucun cookie.
2. **Le dépôt se trouve aussi.** Dix-sept sujets posés sur la page GitHub — le jeu
   (`game`, `cozy-game`, `pixel-art`, `8-bit`), la technique (`pwa`, `typescript`,
   `fastify`, `sqlite`, `passkeys`, `webauthn`), et ce qui distingue le projet
   (`self-hosted`, `gdpr`, `privacy-first`, `agpl`). `phaser`, proposé par le document
   de démarrage, a été retiré de la liste : le jeu n'utilise pas cette bibliothèque, et
   un sujet faux est une promesse fausse.
3. **Le NAS redémarre une fois par semaine, plus chaque jour.** L'alerte UptimeRobot du
   15 octobre avait révélé ce que l'auteur ne mesurait pas : chaque matin, le jeu se
   taisait une douzaine de minutes. Une fois par semaine, c'est une coupure sur sept.
   La fenêtre de maintenance chez UptimeRobot n'est pas posée : elle attendra de savoir
   si une alerte par semaine gêne vraiment.
4. **Les alertes DSM n'avaient pas besoin d'un test.** Le courriel de test était à
   l'ordre du jour depuis le 15 ; il était sans objet : l'auteur reçoit déjà les
   messages de son NAS. Une vérification qui a déjà eu lieu dans la vraie vie n'a pas à
   être rejouée pour la forme.
5. **La v0.3 est posée.** Le dépôt passe en `0.3.0`, avec une étiquette `v0.3.0`. Tout
   ce que le document de conception demandait pour ce palier était livré depuis le 14
   octobre — les saisons et leurs événements, la Forêt de Cuivre, le fret lourd,
   l'aérodrome qui grandit — mais rien ne le disait : la version affichée en haut de
   chaque page annonçait encore `0.2.0`. **Un travail qui n'est pas nommé n'est pas
   fini.**
6. **La feuille de route dit où en est la v1.0.** Quatre régions sur sept, six avions
   (l'objectif de cinq est dépassé), dix pilotes sur vingt, quatre musiques. Ces
   nombres ne changent pas. Deux conditions s'y ajoutent, qui ne sont pas du contenu :
   l'accessibilité **mesurée** — la seule ligne encore vide du tableau de
   [Sécurité](Securite) —, et une partie jouée de bout en bout sans y trouver de
   mécanisme qui ment. « 1.0 » voudra dire que le jeu sort d'essai, et on n'en sort pas
   sur un compte de régions.

## Ce qui reste à constater

Deux choses, et elles sont écrites ici pour ne pas être oubliées une fois le récit
terminé :

- **trois copies** dans le dossier des sauvegardes du NAS, après une exécution de la
  tâche (le script est corrigé depuis le 15 à 17 h 40, la mesure n'a pas été refaite) —
  **constaté le 18 octobre à 3 h 06** : trois copies, celles des 16, 17 et 18, et rien
  d'autre ;
- **trois versions au plus** dans la copie USB, mesurables à partir du 18 octobre —
  d'ici là, la version de la nuit du 15 contient encore les copies du 11.

## La semaine en une phrase

Sept jours, cent seize PR fusionnées, toutes vertes, toutes publiées sous le nom de l'auteur :
un jeu qui existe, qui tient tout seul sur un NAS domestique sans un port ouvert, dont
les textes ne mentent plus à son code, qui montre au joueur où il va, qui se sauvegarde
hors de sa machine et se surveille de l'extérieur — et qui porte enfin le numéro de ce
qu'il est.

## Ce qu'on en retient, après sept jours

Trois phrases reviennent, et ce sont les mêmes vues sous trois angles.

**Une règle qu'on ne vérifie que de son côté est une intention.** Les deux ports
ouverts du jour 3, la signature de PR du jour 4, le script de sauvegarde du jour 5 :
chaque fois, le dépôt disait vrai et la réalité disait autre chose. Ce qui compte se
mesure à l'arrivée.

**Un texte que personne ne confronte au code finit par mentir.** Les cartes du jour 4,
le cap du jour 5, la carte du Héron du jour 6. Le code faisait son travail ; c'est la
promesse qui avait glissé.

**Ce qui n'est pas nommé n'est pas fini.** Une sauvegarde jamais restaurée est une
hypothèse ; une alerte jamais reçue est une intention ; une version jamais posée est un
travail invisible. Aujourd'hui n'a rien construit, et c'est pourtant une journée de
travail.

## Où en est le projet, ce soir

**v0.3.0.** 4 régions et 24 escales, 6 avions, 10 pilotes (cinq femmes, cinq hommes),
106 cartes, 46 pages d'album, 4 saisons et 4 musiques ; **286 tests**, six parcours de
bout en bout dans un vrai navigateur ; quinze migrations de base de données. A+ sur les
trois notes, zéro traqueur, rien d'ouvert chez l'auteur, DNSSEC actif, cookie de session
en `__Host-`. Une copie chiffrée de la base hors du NAS, gardée trois jours, restaurée
une fois ; deux moniteurs qui regardent le site de l'extérieur.

À faire ensuite, sans récit pour le raconter : les deux constats ci-dessus ; le passage
à Ubuntu 26 après le 19 octobre ; la restauration d'essai et le balayage de ports chaque
trimestre ; l'accessibilité, à mesurer avec les personnes concernées. Puis, pour la
v1.0 : trois régions, dix pilotes, deux avions.

Jouable sur [altiplume.com](https://altiplume.com).
