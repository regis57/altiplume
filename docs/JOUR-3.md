# Jour 3 — la sécurité, ce qui tient par construction et ce qui se vérifie sans cesse

Le premier jour avait prouvé que le jeu pouvait exister. Le deuxième, qu'on pouvait le
faire grandir sans rien casser, puis le passer au crible. Le troisième, le 13 octobre
2026, pose la question qui reste quand les outils ont parlé : **qu'est-ce qui est sûr
parce que c'est construit ainsi, et qu'est-ce qui l'est parce qu'on le vérifie
chaque semaine ?** Et surtout : *que prouve* chaque mesure, et que ne prouve-t-elle pas ?

Cette page est la conclusion des aspects de sécurité vus ce jour-là, dans l'ordre où
ils sont venus, puis la liste de ce qui tient par conception et de ce qui tourne en
continu. Le détail technique est sur la page [Sécurité](Securite) ; le récit, dans le
[Journal](Journal) ; la veille, dans [Jour 2](Jour-2).

## Dans l'ordre

1. **Rejouer pour trouver ce qui coince.** La journée a commencé en jouant, et le jeu
   a répondu avec trois défauts de cohérence : un contrat de trois sacs qu'aucune
   flotte ne pouvait porter restait dans la main du joueur pour toujours ; un vol
   « en route » s'affichait avec un message contradictoire et sans barre de
   progression ; le catalogue du monde restait servi du cache pendant une heure.
   Chacun a eu sa PR et sa contre-épreuve. Ce n'est pas de la sécurité au sens
   strict, mais la règle est la même : **un écran qui se contredit est un défaut de
   sûreté**, parce qu'il fait faire au joueur ce qu'il ne voulait pas.
2. **Un bouton « Sortir » dans l'en-tête.** La session se terminait depuis « Mon
   compte » seulement. Elle se termine maintenant en un clic, de toutes les pages du
   jeu. C'est de la vie privée par construction : la porte de sortie doit être aussi
   visible que la porte d'entrée, surtout sur un appareil partagé.
3. **« Qu'est-ce qui peut se faire avec GitHub seul ? »** La liste des mesures « non
   effectuées » a été reprise une par une, avec deux questions : combien d'actions
   extérieures demande-t-elle, et que prouve-t-elle ? Réponses honnêtes plutôt que
   zèle : certaines mesures ne prouvent que ce que d'autres prouvent déjà.
4. **Blacklight, passé sur altiplume.com.** L'inspecteur de vie privée de The Markup a
   visité le site depuis un serveur californien, en mobile : **zéro traqueur
   publicitaire, zéro cookie tiers, aucun pistage par empreinte, aucun enregistreur
   de session, aucune capture de frappe, aucun pixel Facebook, TikTok ou X, aucun
   remarketing Google.** Ce que ça prouve : l'argument « pas de publicité » est
   vérifié par un tiers indépendant, pas seulement affirmé.
5. **Le même contrôle, à chaque PR.** Un passage Blacklight est une photo. Un test de
   bout en bout en est le film : un vrai navigateur parcourt les pages publiques en
   français et en anglais, s'inscrit, fonde sa compagnie, ouvre l'aérodrome et le
   compte, et **échoue sur la moindre requête vers un autre domaine**, la moindre
   violation de la politique de sécurité du contenu, le moindre cookie étranger.
   Parcours de référence : 194 requêtes, toutes vers l'aérodrome ; un cookie, le nôtre.
   Contre-épreuve faite : un pixel externe injecté fait échouer le test.
6. **ZAP visite aussi le site public.** Jusqu'ici ZAP visitait l'image construite sur
   le runner, avant publication. Il visite maintenant altiplume.com tel que le
   visiteur le reçoit, **après Cloudflare**, chaque lundi : en-têtes, redirection,
   cookies, tels qu'ils arrivent vraiment. Passif seulement ; la cible est écrite en
   dur, parce que ce contrôle ne sert qu'à regarder chez soi.
7. **La passkey, sur de vrais appareils.** Les tests de bout en bout utilisent un
   authentificateur virtuel. L'auteur confirme que la connexion par passkey
   fonctionne depuis le premier jour sur des appareils réels : **Windows et iPhone**.
   Ce que ça prouve en plus du test : le bon domaine, la synchronisation, le geste
   réel (visage ou empreinte) — ce qu'un simulateur ne peut pas dire.
8. **Le nmap, et une consigne de mesure fausse.** La première consigne disait de
   tester l'adresse de la maison depuis un téléphone en 4G. Or un outil comme GRC
   ShieldsUP teste *l'adresse d'où l'on vient* : en 4G, il aurait testé l'opérateur,
   et conclu « rien d'ouvert » sur la mauvaise cible. La consigne est corrigée : le
   test se lance **depuis la maison**, les serveurs de GRC regardent alors de
   l'extérieur. Premier résultat : le test **UPnP** (une box qui ouvre des ports
   toute seule est le piège classique) — **l'équipement n'a répondu à aucune des
   sondes**. Une mesure fausse qui dit « tout va bien » est pire qu'une mesure
   absente ; elle est dite et corrigée.
9. **Le balayage de ports a trouvé quelque chose.** Sur les 1 056 premiers ports,
   **deux répondaient : le 80 et le 443**, ouverts sur l'adresse de la maison vers le
   serveur web du NAS. La conception dit « aucun port ouvert » depuis le premier jour ;
   la mesure a dit autrement. Ce n'était ni le jeu (il sort par le tunnel et n'a besoin
   d'aucun port), ni une page qui donnait accès à quoi que ce soit : une page d'erreur
   « 403 » du serveur web du NAS. Mais un service joignable de n'importe où est
   un service reconnaissable, et la porte n'avait rien à faire là. La redirection a été
   retirée de la box et du NAS, et le balayage refait : **zéro port ouvert, 1 056
   invisibles, aucune réponse au ping, `TruStealth: PASSED`**. Une sonde sur trois ports
   hors de la plage (accès au NAS, service de médias à distance) : trois invisibles. La
   box n'a pas d'adresse IPv6, donc rien à tester de ce côté.
   Le moment le plus utile de la journée est celui où un outil a contredit la
   conception : **une garantie qu'on ne mesure pas n'est qu'une intention**, et cette
   fois, on l'a mesurée.
10. **OSV-Scanner, écarté, et pourquoi.** Il lit `package-lock.json` contre une base qui
   rassemble pour npm les mêmes avis que `npm audit`, déjà lancé à chaque PR ; Trivy
   relit les dépendances de l'image elle-même, chaque semaine ; Socket regarde ce que
   font les paquets, ce que nulle base d'avis ne voit. Un quatrième lecteur des mêmes
   avis ne trouverait pas plus, demanderait un binaire de plus à épingler, et ferait
   échouer la CI deux fois pour la même cause. **Savoir ne pas ajouter un outil fait
   partie de la sécurité** : chaque outil est une surface de plus.

## Ce qui tient par construction

Ce que le jeu garantit même si tous les outils tombaient en panne, parce que le
code et l'hébergement sont faits ainsi :

| Garantie | Comment |
|---|---|
| **Rien n'entre chez l'auteur** | Aucun port ouvert : le NAS *sort* vers Cloudflare par un tunnel. Vérifié par balayage depuis l'extérieur le 13/10, après avoir fermé deux ports restés ouverts. |
| **Rien à voler dans les mots de passe** | Il n'y en a pas : connexion par lien à usage unique ou passkey. Les jetons sont stockés en empreinte. |
| **Une session à soi** | Cookie `HttpOnly`, `Secure`, `SameSite=Lax` ; les écritures n'acceptent que du JSON (anti-CSRF) ; sortie en un clic. |
| **Une XSS n'aurait nulle part où aller** | CSP `default-src 'none'`, aucun script en ligne, Trusted Types exigés ; isolation du document par COOP, COEP et CORP. |
| **Aucune requête tierce** | Aucune ressource externe, aucune police, aucun script, aucune publicité ; la CSP l'interdit et un test le vérifie. |
| **Le client ne décide de rien** | Simulation autoritative côté serveur ; aucune valeur de jeu acceptée du navigateur. |
| **Chaque entrée est un contrat** | Schémas AJV stricts ; formulaire de contact qui n'est pas un relais (destinataire fixé par le serveur, rien écrit en base). |
| **Un abus coûte peu à contenir** | Deux compteurs de débit par personne (API, pages) ; la clé est une empreinte salée de l'adresse, gardée en mémoire. |
| **Une image qui n'a rien à installer** | Non-root, système de fichiers en lecture seule, sans npm ni autre gestionnaire de paquets ; provenance attestée. |
| **Peu de données, pas de traces** | Pas d'analytique, un seul cookie, journal d'audit sans donnée personnelle ; registre des traitements tenu. |

## Ce qui se vérifie sans cesse

Ce qui est vrai *aujourd'hui* parce qu'une machine le contrôle, et qui sonnerait
dès qu'un changement le ferait cesser de l'être :

| Contrôle | Quand | Ce qui fait échouer |
|---|---|---|
| **CodeQL**, **Opengrep** | Chaque PR et chaque fusion | Une alerte, ou une trouvaille de niveau ERROR |
| **`npm audit`**, **licences** | Chaque PR | Une faille élevée ; une licence hors liste |
| **Socket** | Chaque PR qui touche une dépendance | Un paquet suspect : script d'installation, accès réseau inattendu, nom imité |
| **ZAP, sur l'image** | Chaque PR qui touche l'appli, et chaque lundi | Une alerte moyenne ou haute non examinée |
| **ZAP, sur altiplume.com** | Chaque lundi, et à la demande | Même verdict, sur ce que le visiteur reçoit vraiment |
| **Trivy** | Avant toute publication d'image ; chaque lundi sur `latest` | Une faille critique corrigeable, ou un secret : l'image n'est pas publiée |
| **Aucune requête tierce** | Chaque PR | Une requête hors de chez nous, une violation de CSP, un cookie étranger |
| **Mise en page** | Chaque PR | Sur PC, l'album déborde d'un écran ou une page sort de sa case ; sur téléphone, la page défile sur le côté |
| **Contrôle externe** | Chaque lundi | Observatory, SSL Labs, DNS, en-têtes, redirection, version servie : un point sous l'attendu |
| **Tests de bout en bout** | À la demande | Six parcours dans un vrai navigateur : passkeys, courrier, saline, convoi, tiers, mise en page |

Et une règle sur les contrôleurs eux-mêmes : aucune action tierce ; le binaire
officiel de la release, d'une version qui a quelques semaines de recul, avec son
empreinte vérifiée à chaque exécution.

## Ce qui reste, honnêtement

- **L'accessibilité** : promise depuis la conception, à mesurer avec les personnes
  concernées plutôt qu'avec un score seul.
- **Le balayage de ports, à refaire** : il est fait et propre ; il se refait après tout
  changement de la box ou du NAS, et une fois par trimestre. Shodan reste à regarder.
- **Have I Been Pwned**, pour le domaine : faible enjeu (le jeu n'a aucun mot de passe
  à fuiter), mais le domaine se vérifie en deux minutes.
- **DMARC en `reject`** : on attend des rapports sans rejet légitime.
- **La supervision** : plus tard.
- **Une sauvegarde hors du NAS** : une copie quotidienne sur un disque USB, chiffrée,
  restaurée une fois pour de vrai. C'est la seule perte qu'on ne rattrape pas par un
  redéploiement ; elle protège de la panne, pas de l'intrusion, et attend sa décision.

## Les décisions de la journée

- **Une mesure sert à prouver quelque chose de précis.** Avant chaque contrôle : que
  prouve-t-il, et que ne prouve-t-il pas ? Sinon c'est de la décoration.
- **Une mesure fausse se dit et se corrige** le jour même, y compris quand elle
  disait « tout va bien ».
- **Moins d'outils, mieux choisis.** Un contrôle qui répète les autres est écarté,
  avec sa raison écrite.
- **Ce qui a été vérifié une fois doit l'être à chaque fois.** Blacklight devient un
  test ; le ZAP du site public devient une tâche du lundi.
- **L'adresse de la maison n'entre nulle part** : ni dans le dépôt, ni dans une PR, ni
  dans un secret, ni dans une capture publiée.
- **Une garantie se mesure.** « Aucun port ouvert » était écrit ; deux ports étaient
  ouverts. On ne l'écrit plus sans date de mesure.
- **Un constat se publie quand il est corrigé,** pas avant : la page dit ce qui a été
  trouvé et fermé, jamais l'adresse.
- **Un écran qui se contredit se répare** avant d'ajouter quoi que ce soit.
- **Le hasard ne bloque pas un joueur.** Une escale qui n'a jamais reçu de courrier
  attend sa lettre, et ses cartes viennent plus souvent.
- **Un bouton grisé dit pourquoi.** Chaque condition, son état, et ce qui reste à faire.

## Le soir : le jeu, rejoué

Tard le soir, la sécurité faite, une heure de jeu sur le vrai compte a fait remonter
ce que les tests ne voient pas : ce que le joueur *comprend*.

1. **Le bouton « Sortir » n'apparaissait pas.** Il était dans le code depuis le matin,
   mais pas sur le NAS : `/v1/version` répondait encore la révision d'avant. L'étiquette
   de version du deuxième jour a tranché en trente secondes, sans chercher dans le code ;
   un rafraîchissement du NAS, et le bouton était là.
2. **L'album demandait quatre écrans de défilement.** Quarante-six pages en trois
   colonnes étroites, chaque rangée étirée à la hauteur de la plus longue légende, dans
   une colonne de droite quatre fois plus haute que celle de gauche. Désormais : des
   timbres de même taille sur toute la largeur, le compte des pages en pastille, et la
   règle des cachets écrite au-dessus. Les décorations passent en grille, le livre de
   bord rejoint ce qui vole. Sur PC, la page passe de **10 625 à 5 677 pixels** de haut
   et l'album de **3 619 à 656** : il tient dans un écran. Un test de mise en page le
   garde, à chaque PR, sur PC et sur téléphone.
3. **Cinq escales sur six, et la sixième ne venait pas.** Aucun verrou dans le code :
   Lanterne-du-Val ne dépendait que du tirage, 24 % de chances par jour, et un joueur sur
   dix attendait plus de neuf jours. Nouvelle règle : **l'escale attend sa lettre**.
   Parmi les contrats, ceux d'une escale jamais livrée pèsent trois fois plus, sans
   changer la part des imprévus. 48 % par jour, neuf joueurs sur dix servis en quatre
   jours.
4. **« J'ai dix cachets, et la route reste grisée. »** Il fallait aussi la page « Toute
   la vallée », et la carte de la route ne le disait qu'en gris. Chaque route fermée
   affiche maintenant ses deux conditions, chacune avec son état, et **nomme les escales
   qui restent à livrer**. Au passage, un test qui manquait : ce que vaut une page en
   cachets (un, deux pour Haut-Ferrand, trois pour Combe-aux-Rosées).
5. **« Est-ce que je gagnerai plus, plus tard ? »** Mesuré, pas promis : par contrat,
   bien plus (75 francs nets dans la vallée, 190 dans la forêt, 366 dans l'Archipel) ;
   par heure de vol, à peu près pareil, parce que les vols lointains sont longs. Ce qui
   fait grandir une séance, c'est la flotte : environ 125 francs l'heure aujourd'hui,
   210 avec un Pic, 460 avec quatre avions et quatre pilotes. Le détail est dans la
   [Conception](Conception), section 4.5.

## Où en est le projet, ce soir

Le jeu et ses garanties : 4 régions et 24 escales, 6 avions, 10 pilotes (cinq femmes,
cinq hommes), 106 cartes, 4 saisons, un aérodrome qui se voit grandir ; **230 tests**,
six parcours de bout en bout dans un vrai navigateur. Observatory, securityheaders,
SSL Labs : **A+**. Blacklight : **zéro partout**. Passkey : **Windows et iPhone**.
Chaque PR passe sous CodeQL, Opengrep, ZAP, Trivy, Socket, `npm audit`, licences, le
test « aucune requête tierce » et le test de mise en page ; chaque lundi, le site réel
et l'image en service sont revus. Toujours le même budget : un nom de domaine, environ dix euros par an.
Jouable sur [altiplume.com](https://altiplume.com).
