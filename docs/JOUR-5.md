# Jour 5 — le jeu montre le chemin

Le quatrième jour avait fait dire vrai aux cartes. Le cinquième, le 15 octobre 2026,
commence par des captures d'écran du joueur, prises sur son téléphone entre deux vols :
la Côte de Saline ouverte, huit cachets en caisse, une seule Grive, et une fiche « Le
cap » qui lui indique la prochaine route.

La question du jour en découle : **quand le jeu dit au joueur où aller, l'envoie-t-il
au plus près, et lui dit-il tout ce qui l'en sépare ?** Le cap disait vrai, mais pas
tout : il désignait la route la plus lointaine, et taisait ce qui la rendait lointaine.

Cette page est le résumé de la journée, dans l'ordre où elle se déroule ; elle reste
ouverte tant que la journée continue. Le récit, à partir du chapitre 51, est dans le
[Journal](Journal) ; la veille, dans [Jour 4](Jour-4). Le récit s'arrêtera au jour 7.

## Dans l'ordre

1. **Le cap vise la route la plus proche.** La Côte ouverte, le cap annonçait
   « Prochaine route : Archipel des Lanternes » : livrer les six escales de la Côte, et
   15 cachets. Or la Forêt de Cuivre ne demandait plus que 4 cachets, sa page étant
   déjà dans l'album. Le cap prenait la première région fermée dans l'ordre de la liste,
   alors que les routes s'ouvrent dans n'importe quel ordre. Il vise maintenant la plus
   proche : d'abord celle dont la page est acquise, puis celle qui demande le moins
   d'escales hors d'atteinte, de livraisons, puis de cachets. Au premier jour d'une
   partie, rien ne change.
2. **Le cap dit ce qui manque à la flotte.** Sur les six escales de la Côte, quatre sont
   hors d'atteinte d'une Grive : Marais-Blanc est à 9,6 lieues quand elle en porte 8, et
   trois escales sont sur l'eau. Le cap le dit maintenant, escale par escale : pourquoi
   (hors de portée, sur l'eau, en clairière, piste trop courte), et ce qu'il y faut :
   l'avion le moins cher qui y va, la place au hangar ou au ponton, la piste plus longue,
   ou un pilote de Longues routes quand il suffit (avec lui, la Grive porte à 9,6 lieues
   exactement). Les règles sont celles du serveur ; dix tests sur les vrais chiffres du
   monde, dont la situation exacte du joueur, et une contre-épreuve : avec l'ancien
   choix, le test du 15 octobre échoue.
3. **Les cachets qui ne tombaient pas juste.** Dix-sept en caisse, dix pour la Côte, et
   huit ensuite : ouvrir une route colle une page dans l'album, et cette page rapporte un
   cachet. Rien à corriger.
4. **Ce que la nuit a montré.** Trois constats, sur pièces. La copie USB de 03 h 05 a
   réussi, en 11 secondes. UptimeRobot a envoyé sa première vraie alerte : le NAS
   redémarre chaque matin, et le jeu ne répond plus pendant une douzaine de minutes
   (de 6 h 56 à 7 h 08) ; l'alerte, puis le retour, sont arrivés par courriel. La chaîne
   marche ; reste à choisir entre une fenêtre de maintenance et un redémarrage plus rare.
   Et le dossier des sauvegardes du NAS gardait **sept copies**, pas trois : la tâche
   planifiée contenait encore `GARDER=30`. Le script recollé la veille n'avait pas été
   enregistré ; le Jour 4, le manifeste et le journal l'avaient écrit trop tôt. Corrigé à
   17 h 40, ligne relue dans la tâche. Conséquence assumée : la version USB de cette nuit
   contient encore les copies du 11 octobre, et ne sortira de la rotation que vers le 18 ;
   jusque-là, la promesse des 6 jours n'est pas tenue pour elles.
5. **Le Héron arrive à son heure.** Une carte proposait le Héron (5 600 F, la grande piste)
   à une compagnie de 818 F, au hangar plein, sur un pré fauché, et son bouton « Acheter »
   restait actif : le refus ne se découvrait qu'après le clic. Le Héron n'est plus tiré tant
   que la piste a deux crans de retard. Et chaque carte d'avion dit, avant le clic, comme
   les routes : le prix et ce qu'on a en caisse, la place au hangar ou au ponton, la piste
   qu'il faut. L'argent et la place grisent l'achat ; la piste avertit seulement, choix du
   joueur : *« On peut l'acheter avant d'avoir la piste ; il restera au sol jusque-là. »*
   Neuf tests, dont la situation exacte de la partie.

## La journée en une phrase

Quatre PR fusionnées, de la #108 à la #111, toutes vertes, toutes publiées sous le nom de
l'auteur : le cap ne suit plus l'ordre d'une liste, il vise la route la plus proche et
dit, escale par escale, l'avion, le ponton ou la piste qui manquent ; une carte d'avion
dit ce qu'il lui faut avant qu'on clique ; et la sauvegarde a montré qu'une étape faite à
la main n'était pas faite.

## Ce qu'on en retient

Le cap avait été écrit le 14 octobre pour un monde où il n'y avait qu'une route suivante.
Quand le monde s'est ramifié (deux routes au départ de la vallée), « la première de la
liste » a cessé d'être « la plus proche », et rien ne l'a signalé : les deux phrases
avaient toujours donné le même résultat. **Une règle qui a toujours eu raison par
coïncidence finit par avoir tort sans bruit.** Et une fiche qui dit ce qui manque doit le
dire en entier : une condition qu'on ne peut pas remplir avec ce qu'on a n'est pas une
condition, c'est une impasse, et le joueur doit l'apprendre avant de s'y engager. La
carte du Héron l'a redit le soir même.

La sauvegarde, elle, a redit la leçon du jour 4 sous une autre forme : **une étape faite à
la main se vérifie comme le reste.** Le script était juste dans le dépôt ; c'est sa copie,
collée dans la tâche du NAS, qui ne l'était pas, et personne n'avait relu la tâche.
Désormais, après chaque recollage : rouvrir la tâche, lire la ligne `GARDER=`, l'exécuter
une fois.

## Où en est le projet

4 régions et 24 escales, 6 avions, 10 pilotes (cinq femmes, cinq hommes), 106 cartes,
4 saisons et 4 musiques ; **277 tests**, six parcours de bout en bout dans un vrai
navigateur ; quinze migrations de base de données. Les garanties tiennent : A+ sur les
trois notes, zéro traqueur, rien d'ouvert chez l'auteur. La base a une copie chiffrée
hors du NAS, gardée 3 jours ; deux moniteurs surveillent le site de l'extérieur.

À faire ensuite : mettre en ligne le cap et les cartes d'avion (rafraîchir le NAS) ;
exécuter une fois la tâche de sauvegarde et constater qu'il ne reste que trois copies ;
corriger le Jour 4, le manifeste et le journal (« recollé le soir même ») et y ajouter
l'étape de vérification du déploiement ; dimanche 18, compter les versions de la copie
USB (trois au plus) ; décider du redémarrage quotidien du NAS ; un courriel de test de
DSM. Sans urgence : le passage à Ubuntu 26 après
le 19 octobre dans une PR dédiée, la restauration d'essai chaque trimestre, et
l'accessibilité, à mesurer avec les personnes concernées.

Jouable sur [altiplume.com](https://altiplume.com).

La suite : [Jour 6](Jour-6).
