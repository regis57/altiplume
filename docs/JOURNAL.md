# Journal de bord — Altiplume

Récit du projet, écrit pour être publié (wiki GitHub ou regis-hennequin.info). Un chapitre par étape marquante.

---

## Chapitre 1 — Un aérodrome dans la tête (10 octobre 2026)

Tout a commencé par une envie simple : un jeu web en pixel art, dans l'esprit de Stardew Valley, jouable sur téléphone, tablette et PC. Et une contrainte de départ, assumée : je ne sais pas coder. Je sais lire, décider, tester et dire non. Le reste, je le confie à une IA, en lui demandant du travail de niveau professionnel : DevSecOps, sécurité dès la conception, RGPD, accessibilité.

Deux pistes se sont affrontées. La ferme, évidente mais déjà vue mille fois, et pénible au doigt sur un écran de téléphone. L'aviation, qui me suit depuis longtemps : j'ai un récepteur ADS-B qui écoute les avions au-dessus de chez moi, et deux petites démos de jeux de cartes dans mon GitHub.

Le choix s'est fait vite : un petit aérodrome des années 1930, qu'on hérite en mauvais état. On le restaure, on recrute des pilotes avec leur caractère, on ouvre des lignes postales vers un monde inventé. Les contrats et les imprévus sont des cartes. Ça se joue au tap, en quelques minutes, et un vol dure du vrai temps : on revient plus tard voir si le courrier est arrivé.

Les décisions du jour :

- **Nom de travail :** Altiplume. Les domaines .com et .fr étaient libres ce soir-là.
- **Licence :** le code en AGPL-3.0, les graphismes, la musique et l'histoire en droits réservés. Qui reprend le code doit publier ses modifications ; l'âme du jeu reste à moi.
- **Pas de mot de passe :** seulement un email, un surnom et une passkey. Rien à voler.
- **Hébergement :** mon Synology DS218+ pour commencer, derrière un tunnel Cloudflare, sans aucun port ouvert. Un VPS plus tard, seulement si le succès l'exige.
- **Budget :** moins de 15 € sur l'année pour démarrer. J'ai été surpris.

La règle du jeu entre l'IA et moi est fixée : elle propose, la machine vérifie (tests, analyse de sécurité, licences), et moi je valide. Rien ne part en production sans mon clic.

Prochaine étape : acheter le domaine, ouvrir le dépôt, préparer le NAS.

---

## Chapitre 2 — (à venir) Le dépôt et le tunnel

---

## Chapitre 1 bis — Comment le jeu a trouvé son nom (10 octobre 2026)

« Courrier des Nuages » était joli, mais long, et intraduisible sans perdre sa musique. J'ai d'abord voulu « Cumulus & Cie » : l'INPI était vide, le nom sentait bon le registre commercial d'avant-guerre.

Deux obstacles, et une leçon.

Le premier est bêtement technique : un nom de domaine n'accepte que des lettres, des chiffres et des tirets. Le `&` est impossible. J'aurais passé ma vie à expliquer que le site ne s'écrit pas comme le jeu.

Le second est plus instructif. Vide à l'INPI ne veut pas dire libre. « Cumulus », c'est un groupe de radio américain qui pèse des centaines de stations et détient des marques dans le divertissement, c'est un système d'exploitation réseau chez NVIDIA, c'est un logiciel de gestion documentaire, et c'est même déjà le nom d'un petit jeu de game jam sur les nuages. J'aurais été le huitième résultat de recherche sur mon propre nom, pour toujours. **Un nom vide à l'INPI mais saturé sur le web reste un mauvais nom.**

Et « Cie » ne survit pas au passage de la Manche : un anglophone ne connaît pas l'abréviation et bute dessus. Or je visais l'international dès le départ.

D'où **Altiplume**. « AL-ti-ploom ». *Alti* se lit comme altitude dans toutes les langues latines et en anglais ; *plume* est un vrai mot anglais, qui désigne à la fois la plume de l'oiseau et le panache de fumée. Rien à décoder. Et surtout : zéro résultat sur le web. Pas une marque, pas une société, pas un jeu. C'est le signal le plus propre qu'on puisse espérer.

Le double sens est exactement celui que je cherchais — la plume du courrier, la plume de l'oiseau, et l'altitude.

Quant à « & Cie », il n'est pas perdu : il a trouvé sa vraie place dans le jeu. Les compagnies que le joueur fonde s'appelleront Altiplume & Cie, Brume Dorée & Cie — ou Featherline & Co. et Gilded Hangar Co. pour les joueurs anglophones, parce que le générateur de noms parle la langue du joueur.

---

## Chapitre 1 ter — Ce que dit vraiment un registre (10 octobre 2026)

Avant d'acheter le domaine, il fallait vérifier qu'Altiplume n'appartenait à personne. Cette vérification m'a appris trois choses que je ne soupçonnais pas.

**Un registre peut mentir par ressemblance.** Ma recherche sur data.inpi.fr a renvoyé une société nommée DEVIENNE. Rien à voir avec Altiplume : vérification faite auprès du registre national des entreprises, c'est un cabinet de conseil en gestion installé à Wattrelos depuis 2019. Le moteur de l'INPI fait du rapprochement approximatif et sort n'importe quoi quand il ne trouve rien. J'ai failli croire à un conflit qui n'existait pas. Le registre des entreprises, lui, ne contient aucune société, enseigne ni nom commercial « Altiplume ».

**Chercher au bon endroit n'est pas évident.** L'INPI mélange deux registres distincts sous la même barre de recherche : les entreprises et les marques. J'avais cherché dans le premier en croyant interroger le second. Ce sont deux droits différents.

**Et il faut toujours une recherche témoin.** Le site de l'INPI refusait d'afficher ses résultats dans le navigateur que nous utilisions. Impossible de distinguer « aucune marque » de « rien ne s'affiche ». La parade est simple et je la retiens : chercher un mot qui a forcément des résultats. « Plume » est revenu vide lui aussi — donc c'était bien le site qui était muet, pas le registre qui était vide.

Nous sommes alors passés par TMview, la base commune qui interroge d'un coup l'INPI, l'EUIPO et les offices de toute l'Europe. Même méthode : le mot témoin « altiplano » a renvoyé 432 marques, preuve que le moteur fonctionnait et ratissait large.

Et « altiplume » : **une seule marque au monde**. Déposée au Japon le 16 février 1993 par Mitsui & Co., en classe 28 — jouets et jeux. Expirée depuis le 29 mars 2006.

Je trouve ça beau, à vrai dire. Quelqu'un, dans un bureau de Tokyo, il y a trente-trois ans, a pensé au même mot que moi pour une histoire de jeu. Sa marque s'est éteinte il y a vingt ans. Le nom est redevenu libre, et c'est le seul fantôme sur la route.

L'EUIPO : zéro. L'Europe est vierge. On achète le domaine.

---

## Chapitre 3 — Une erreur qui vient de chez moi (10 octobre 2026, 22 h 56)

Ce soir, pour la première fois, une requête venue d'Internet est entrée dans mon NAS. Elle a échoué. C'était le but.

Le principe est simple à dire et contre-intuitif à faire : le serveur ne doit jamais être joignable directement. Aucun port ouvert sur la box, aucune redirection. À la place, un petit programme sur le NAS ouvre lui-même une connexion **sortante** vers Cloudflare et la garde ouverte. Quand quelqu'un demande `altiplume.com`, Cloudflare reçoit la demande, la fait passer par ce fil déjà tendu, et le NAS répond. De l'extérieur, le NAS n'existe pas. Il n'y a rien à attaquer.

Mettre ça en place a pris une heure et trois faux départs.

**Le premier** : l'interface de Cloudflare refusait d'avancer tant qu'aucun connecteur ne s'était présenté. Il fallait donc lancer le programme sur le NAS avant de finir la configuration — l'ordre que j'imaginais était inversé.

**Le deuxième** : le conteneur s'arrêtait toutes les deux secondes. Le journal disait « jeton non valide ». J'avais collé le jeton incomplet, ou abîmé — on ne saura jamais. Régénérer le jeton et le recopier avec l'icône prévue, plutôt qu'à la souris, a réglé la question. Leçon : **ne jamais sélectionner un secret à la main.**

**Le troisième** est le plus instructif. Le jeton accepté, le conteneur s'arrêtait encore, mais sans erreur cette fois : il affichait son numéro de version et se terminait, satisfait. Le champ « commande » de l'interface Synology montrait `version` en gris — je l'avais pris pour une valeur figée, c'était un texte d'exemple, et le champ était vide. Sans commande, le programme fait la seule chose qu'on lui demande par défaut : dire qui il est, puis partir. Un programme qui se termine proprement n'est pas forcément un programme qui fait quelque chose.

Puis l'écran Cloudflare est passé de *Inactive* à **Healthy**, avec quatre connexions vers des points de présence nommés `cdg` — l'aéroport de Paris, ce qui, pour un jeu d'aviation, m'a fait sourire.

J'ai déclaré que `altiplume.com` devait pointer vers un conteneur nommé `api`, qui n'existe pas encore. Et le test depuis l'extérieur a donné ceci :

> Bad gateway, erreur 502. Navigateur : OK. Cloudflare, Paris : OK. altiplume.com : **erreur**.

Je n'ai jamais été aussi content de lire « erreur ». Le domaine résout, le certificat est valide et a été émis sans que j'y touche, la requête a traversé Cloudflare, est entrée dans mon tunnel, est arrivée sur mon NAS — et là, elle a cherché un jeu qui n'est pas encore là. L'erreur vient de chez moi. C'est la preuve que tout le chemin existe.

Il ne reste qu'à poser le jeu au bout.

---

## Chapitre 4 — « ok » (10 octobre 2026, 23 h 33)

À 23 h 33, `https://altiplume.com/healthz` a répondu `{"status":"ok"}`.

Quinze caractères. Voici le chemin qu'ils ont parcouru pour exister.

Le code a été écrit vers 21 h. Il est parti sur GitHub dans une pull request, où cinq vérifications l'ont passé au crible — style, types, trente-sept tests, failles connues, licences. Je l'ai fusionné. Un second workflow l'a alors empaqueté dans une image, l'a démarrée à blanc pour vérifier qu'elle répondait, l'a publiée sur le registre de GitHub et y a attaché une attestation : la preuve signée que cette image précise vient de ce dépôt et de ce commit.

Puis j'ai collé un fichier de déploiement dans Container Manager. Mon Synology est allé chercher l'image sur GitHub, a créé un réseau privé, un volume, deux conteneurs. Le premier fait tourner le jeu en lecture seule, sans privilège, sous un utilisateur sans droits. Le second ouvre une connexion sortante vers Cloudflare et la garde ouverte.

Et quand une requête arrive sur `altiplume.com`, Cloudflare la fait passer par ce fil, le NAS répond, et personne, de l'extérieur, ne sait où il se trouve.

Trois choses que je retiens de cette dernière heure.

**J'avais tort sur un point, et le vérifier m'a évité une étape inutile.** J'étais persuadé que l'image publiée serait privée par défaut et qu'il faudrait la rendre publique à la main. Elle hérite de la visibilité du dépôt : elle était publique d'office. Une consigne de moins dans le mode d'emploi, et une leçon de plus : quand on écrit une procédure, on la rejoue avant de la donner.

**J'avais aussi une étape dans le mauvais ordre.** Le conteneur de tunnel temporaire, créé à la main plus tôt dans la soirée, portait le même nom que celui du projet. Il fallait le supprimer *avant* de créer le projet, pas après — sinon Docker refuse le doublon. Je l'ai vu en relisant, pas en échouant. C'est la bonne manière de le voir.

**Le moment le moins spectaculaire est le plus important.** Ce que j'ai à montrer ce soir, c'est une page blanche avec « ok » dessus. Personne ne s'extasiera. Mais tout ce qui viendra ensuite — l'aérodrome, les pilotes, les cartes, la musique — empruntera exactement ce chemin, sans qu'on ait à y retoucher. On a construit la route avant la maison, et la route tient.

Le registre des coûts dit dix euros. Le journal dit quatre chapitres. L'horloge dit qu'il est temps de dormir.


---

## Chapitre 5 — Une enveloppe par avion (11 octobre 2026, nuit)

Entre minuit et une heure, le jeu a gagné une porte d'entrée. Pas encore une pièce derrière, mais une porte, et le mécanisme de sa serrure.

**Ce qu'on peut faire ce matin sur altiplume.com** : ouvrir un compte avec une adresse et un pseudonyme ; recevoir un lien, l'ouvrir, être connecté ; changer son nom et sa langue ; télécharger tout ce que le jeu sait de soi dans un fichier ; tout effacer d'un geste. En français ou en anglais. Sans mot de passe nulle part.

**Trois décisions prises cette nuit**, chacune contre mon premier réflexe.

*La base de données est celle que Node embarque.* J'avais prévu une bibliothèque SQLite à compiler. Node 22 en contient une, sans rien à installer, sans binaire tiers à auditer. Elle est marquée « expérimentale » sur l'étiquette mais son interface est figée depuis des mois. Moins de dépendances, c'est moins de surface — et sur ce projet, c'est un principe, pas une économie.

*L'authentification est écrite dans le dépôt.* J'avais nommé une grosse bibliothèque qui fait tout. Mais « tout », on n'en a pas besoin : un lien à usage unique, une session, c'est deux cents lignes qu'on peut lire d'un trait. Chaque ligne est là, testée, et quand on ajoutera les passkeys, on prendra une petite bibliothèque spécialisée pour la seule partie qui mérite un spécialiste — la cryptographie WebAuthn.

*Le lien de connexion ne se consomme pas en l'ouvrant.* Les messageries et les antivirus pré-visitent les liens des emails ; un lien qui s'activerait au premier accès serait grillé avant que la personne l'ouvre. La page du lien porte donc un bouton, et c'est ce bouton qui confirme. Un clic de plus, et un problème classique en moins.

**Ce que les tests ont attrapé** avant moi. Ma limite d'envoi par adresse ne comptait jamais plus d'un lien, parce que chaque nouveau lien effaçait le précédent — l'ancien est maintenant marqué « remplacé », il compte encore. Le serveur web, par défaut, *retirait* en silence les champs inattendus d'une requête au lieu de les refuser — pour une API d'authentification, je préfère le refus. Et les pseudonymes : « Régis », « REGIS » et « R3gis » étaient trois noms différents pour la base, donc trois façons de se faire passer pour quelqu'un. Ils n'en sont plus qu'un.

**Et une chose que les tests n'ont pas attrapée.** Node n'exécute le TypeScript que s'il peut l'effacer, et j'avais utilisé une tournure qui ne s'efface pas. Les tests passaient, parce que l'outil de test compile. Le serveur, lui, refusait de démarrer. J'ai corrigé, et surtout activé l'option du compilateur qui interdit cette syntaxe : la prochaine fois, c'est la machine qui le verra, pas moi au milieu de la nuit.

**La page.** Je ne voulais pas le gabarit qu'on voit partout — fond crème, titre en serif, accent terracotta. Le fond est une brume de petit matin ; le formulaire d'inscription *est* une enveloppe, avec la bordure à chevrons rouge et bleu du courrier aérien de l'époque ; quand le lien part, un cachet de la poste s'imprime dessus avec la date. C'est le seul endroit où j'ai dépensé de l'audace. Le texte est composé en Atkinson Hyperlegible, une police dessinée pour les lecteurs malvoyants : un choix qui dit quelque chose de ce qu'on veut être. Les contrastes ont été mesurés, pas estimés — trois couleurs ont dû foncer pour passer.

Il est une heure moins le quart. Le parcours complet — inscription, lien, compte, renommage, export, suppression — a été joué dans un vrai navigateur, de bout en bout. Soixante-dix tests. Il manque les passkeys, le QR, et le jeu. Mais quelqu'un, ce matin, pourrait ouvrir un aérodrome.

---

## Chapitre 6 — AltiBoss (11 octobre 2026, 00 h 59)

À 00 h 59, le premier compte d'Altiplume a été ouvert. Par moi, avec ma propre adresse, depuis mon téléphone, sur mon NAS.

Entre temps, Brevo avait été branché : domaine authentifié en quelques minutes — Cloudflare propage presque instantanément —, expéditeur `courrier@altiplume.com` accepté sans confirmation parce que le domaine l'était déjà, et une clé d'API plutôt qu'une clé SMTP, après m'être trompé d'onglet une fois. Puis la fusion, le `.env` à quatre lignes, et la procédure de mise à jour qu'on avait trouvée une heure plus tôt.

L'email est arrivé dans la boîte de réception, pas dans les indésirables, signé par mon domaine. Le bouton, la page, « Ouvrir », et la page de compte avec mon pseudonyme. Tout le chemin — formulaire, serveur, Brevo, Gmail, lien, session — a tenu du premier coup.

Et la première relecture utile est venue d'une capture d'écran : en passant la page en anglais, le message « Enregistré. » et la date d'ouverture sont restés en français. Deux détails que soixante-dix tests n'ont pas vus et qu'un regard humain a attrapés en une seconde. C'est le rôle de l'un et de l'autre.

Le registre des coûts n'a pas bougé : Brevo est gratuit à cette échelle. Dix euros, toujours.

---

## Chapitre 7 — Le téléphone devient la clé (11 octobre 2026, 01 h 25)

Le lien par email fonctionne, mais il demande d'attendre un courrier. Cette nuit, le jeu a appris deux gestes plus courts.

**La passkey.** Sur la page de compte, un bouton « Ajouter une passkey sur cet appareil ». Le téléphone demande l'empreinte ou le visage, et crée une paire de clés : la privée reste dans le téléphone, la publique vient chez nous. Se connecter, ensuite, c'est signer un défi aléatoire que le serveur envoie — un geste, pas un email. Le serveur n'a rien à voler : une clé publique ne sert à rien sans l'appareil. Et l'appareil, lui, ne reçoit que le pseudonyme — jamais l'adresse email. J'ai pris une petite bibliothèque spécialisée pour la seule partie qui le mérite, la cryptographie WebAuthn, comme on se l'était promis au chapitre 5.

**Le QR.** Sur un ordinateur, on ne veut ni taper son adresse ni ouvrir sa messagerie. La page de connexion affiche un QR code et six chiffres. On lit le QR avec le téléphone, déjà connecté ; il affiche les mêmes six chiffres et demande « C'est bien votre écran ? ». Oui — et l'ordinateur ouvre le compte tout seul. Les six chiffres sont là pour une raison précise : si quelqu'un glisse *son* QR sous vos yeux, les chiffres ne correspondent pas, et vous répondez non.

Trois secrets jouent dans cette scène, et aucun ne sert deux fois. Le code dans le QR ne sert qu'au téléphone pour désigner la demande. Le jeton que garde l'ordinateur ne sert qu'à récupérer l'issue — il n'est jamais dans le QR, donc une photo de l'écran ne donne rien. Et les six chiffres servent à la personne. Le code du QR voyage dans le fragment de l'adresse, après le `#` : un navigateur ne l'envoie jamais au serveur par l'URL, donc jamais dans un journal. Le tout expire en quatre-vingt-dix secondes.

**Comment on teste un téléphone sans téléphone.** Pour les tests du serveur, j'ai écrit un authenticateur logiciel d'une centaine de lignes : une clé P-256, un compteur, et les deux réponses WebAuthn telles qu'un navigateur les sérialise. Il permet de jouer les mauvais scénarios qu'un vrai appareil ne produirait jamais volontiers — une signature pour un autre site, un défi rejoué, une clé clonée dont le compteur recule. Vingt et un tests de plus, quatre-vingt-onze en tout. Puis, dans un vrai Chromium, un authenticateur *virtuel* a rejoué tout le parcours : inscription, ajout de la clé, renommage, déconnexion, connexion par passkey, QR approuvé depuis le téléphone, QR refusé, téléphone pas encore connecté, clé supprimée qui ne connecte plus.

**Les deux détails de la capture d'écran** sont corrigés au passage : les messages et les dates portent maintenant leur clé et leur horodatage sur l'élément lui-même, et suivent la langue quand on la change. Le test de bout en bout le vérifie — pour ne plus dépendre d'un regard humain la prochaine fois.

Une surprise de chemin : la police pixel rendait le « 9 » du code à six chiffres presque identique à un « S ». Pour un code qu'on compare d'un écran à l'autre, c'est inacceptable ; les chiffres sont en Atkinson, la police lisible. Le pixel reste pour les titres.

Il est 01 h 25. Rien n'a coûté un centime de plus.

---

## Chapitre 7 bis — Le script d'il y a une heure (11 octobre 2026, 01 h 40)

Régis a fusionné et redéployé en dix minutes, puis m'a envoyé une capture : la page de connexion affichait `login.showQr` à la place du bouton, et cliquer ne faisait rien.

La page était neuve. Le script, lui, datait d'une heure. J'avais mis une règle de cache d'une heure sur tous les fichiers du client, sans distinguer la page — qui doit toujours être fraîche — des scripts qu'elle appelle. Le navigateur avait donc chargé le nouveau HTML, qui parlait de boutons que l'ancien `app.js`, toujours en cache, ne connaissait pas.

La correction est celle que tous les sites sérieux appliquent : chaque script et chaque feuille de style porte dans son nom une empreinte de son contenu (`app.7b4f378b.js`). Une nouvelle version a un nouveau nom ; l'ancienne peut rester en cache un an, elle ne sera plus jamais demandée. Et la page HTML, qui désigne la version courante, n'est plus mise en cache du tout. Un test vérifie désormais ces trois en-têtes.

C'est le deuxième bogue de production attrapé par une capture d'écran de Régis. Les deux fois, en moins d'une minute. Je commence à croire que c'est son super-pouvoir.

---

## Chapitre 8 — Le chemin de la Croisette (11 octobre 2026, nuit)

Régis a dit : « Invente tout. » Et puis, une ligne plus bas : « Dans ta story, intègre le chemin de la Croisette. C'est là où j'ai grandi. »

C'est le genre de phrase qu'on reçoit avec précaution. Un monde inventé est une chose ; le chemin d'enfance de quelqu'un en est une autre. J'ai cherché le mot avant d'écrire une ligne. Une *croisette*, en Lorraine comme en Provence, c'est une petite croix — de chemin, de carrefour, de pierre. La Croisette de Cannes s'appelle ainsi pour la même raison. L'anglais a un mot exact pour cela, *crosslet*, celui des blasons, et il sonne comme un vrai nom de ruelle anglaise. On n'a pas traduit Cannes.

Alors tout commence là. L'aérodrome du joueur est au bout du **chemin de la Croisette** (*Crosslet Lane*). À la fourche, une petite croix de pierre penche un peu, et les pilotes la touchent du doigt avant de décoller. « Pas par superstition, dit Marthe. Pour dire au chemin qu'on revient. »

**Ce qui existe maintenant**, en deux langues, testé, dans le dépôt : six villages des Vallées de Brume, chacun avec son courrier et son caractère — Pont-de-Brume la ville de marché, Les Tilleuls où les vaches ont la priorité, Moulin-Gris sous la brume, Haut-Ferrand sur sa crête, Lanterne-du-Val et sa poste du soir, Combe-aux-Rosées au bout de tout. Trois avions, trois oiseaux. Vingt contrats, dix imprévus, quatre opportunités. Deux zones à restaurer, dix décorations, douze cachets pour l'album.

Et quatre pilotes. Régis a demandé autant de femmes que d'hommes — « c'est pas très années trente peut-être, mais en 2026, ça compte ». Il a raison, et ce n'était même pas difficile : Marthe Vaudrin, qui volait d'ici avant votre naissance ; Ilias Ferrant, qui envoie la moitié de sa paie à l'auberge du col ; Ysé Loranne, qui porte une lanterne de cuivre qu'elle n'a jamais allumée ; Aurèle Combray, qui répare avec du fil de fer et garde une photo dans sa casquette. Chacun a trois scènes d'histoire, à hauteur de comptoir, qui s'ouvrent au fil des vols. Je les ai écrites d'abord en français, puis en anglais — pas traduites, réécrites. Un test vérifie qu'aucune phrase n'est identique dans les deux langues.

Il y a aussi un mort. Bastien, l'ancien propriétaire, celui qui a appris à voler à Marthe et mesurait les pilotes au crayon sur la poutre du hangar. Il n'apparaît jamais ; on ne le connaît que par ce que les autres en disent. C'est souvent comme ça qu'on connaît les gens qui comptent.

**La question de Régis** : faut-il un système de récompense pour que les pilotes reviennent ? Oui, et il est écrit maintenant au chapitre 4.7 de la conception. Six leviers : le courrier arrivé pendant qu'on dormait, les trois cartes du jour, l'aérodrome qu'on voit changer, les histoires, l'album de cachets — une collection de « premières », pas un classement —, et le compteur mondial anonyme. Et trois refus : pas de série quotidienne, pas de minuteur d'énergie, pas de classement permanent. Stardew Valley n'a rien de tout cela et personne n'y joue moins pour autant.

Les tests du monde ont attrapé quatre incohérences avant qu'un joueur les voie : un contrat de colis pour un village qui n'en recevait pas, un hameau proche mieux payé qu'une ville plus loin. Ce sont des tests sur du contenu, pas sur du code, et ils valent autant.

---

## Chapitre 9 — Il lui faut un nom (11 octobre 2026, petit matin)

La compagnie existe maintenant, ou plutôt : elle peut exister. Quand on se connecte pour la première fois, on n'arrive plus sur une page de compte mais sur une page qui dit « Il lui faut un nom. » Trois noms proposés — « Poste Aérienne Brume », « Les Ailes de Saline », « Comptoir du Zéphyr » —, un bouton pour en tirer d'autres, une ligne pour écrire le sien. On fonde. Et l'aérodrome apparaît.

Ce qu'on voit : un ciel en pixels qui suit l'heure de la personne — brume de jour, rose à l'aube, encre la nuit avec une lune —, la piste et ses pierres blanches, le hangar, la manche à air, la Grive garée devant, et tout à gauche, au bout du chemin, la petite croix. Dessous, le nom de la compagnie, l'adresse « Chemin de la Croisette, Vallées de Brume », trois cents francs, un cachet. Puis Marthe, avec ses deux traits et son portrait ; la Grive et ses chiffres ; la piste et le hangar à leur premier niveau, avec ce que coûtera le suivant ; et l'album, douze pages, dont une seule collée : *Fondation*, datée d'aujourd'hui.

Les histoires de Marthe sont là, mais verrouillées — « après le vol 3 », « après le vol 7 », « après le vol 12 ». Le serveur ne les envoie pas tant que l'affinité n'y est pas ; elles ne sont pas dans le catalogue public, on ne peut pas les lire en trichant. Quand on en lit une pour la première fois, une page de plus se colle dans l'album.

Les trois proposition de noms sont reproductibles : même joueur, même jour, mêmes noms. Ce n'est pas un détail. Si un joueur dit « on m'a proposé un nom que je n'aurais pas dû voir », on peut rejouer son tirage.

Deux choses attrapées par les captures d'écran avant Régis, cette fois : sur un téléphone, la navigation à quatre entrées débordait de l'écran — elle passe maintenant sous le logo ; et le bouton jour/nuit montrait les deux icônes à la fois en mode clair, une affaire de priorité de règles CSS que seul un œil voit.

Il reste le plus important, et c'est la prochaine étape : le courrier. Les cartes du jour, affecter Marthe à la Grive, expédier vers Pont-de-Brume, attendre cinq vraies minutes, encaisser. Le jour où ça fusionnera, Altiplume sera un jeu.

---

## Chapitre 10 — Le premier vol (11 octobre 2026, 3 h 30)

Altiplume est un jeu.

Pas un grand jeu. Un petit : on fonde la compagnie, on trouve trois cartes sur le comptoir, on prend *Le journal du matin* pour Pont-de-Brume, on choisit la Grive et Marthe, on lit « ≈ 5 min aller simple · coût ≈ 14 F », on appuie sur Envoyer. La Grive disparaît du parking de la scène. Une jauge apparaît sous « En vol ». La caisse dit 286. Et on pose le téléphone.

Cinq vraies minutes plus tard — ou le lendemain matin, c'est pareil — on revient, et il y a une ligne verte en haut de la page : « Marthe Vaudrin est rentrée de Pont-de-Brume · +30 F · délai tenu ». Et deux lignes rouges : « Nouvelle page dans l'album : Premier vol », « Nouvelle page dans l'album : Pont-de-Brume ». La caisse dit 316. Le livre de bord a deux lignes. Marthe a un vol d'affinité. Il lui en faut trois pour raconter l'histoire de la croix.

**Comment ça marche sans rien faire tourner.** Il n'y a aucune tâche de fond. Quand on lit l'état de la compagnie, le serveur regarde l'heure, rattrape ce qui s'est passé — les vols arrivés, le tirage du jour s'il a changé — et le note une fois pour toutes. Entre deux lectures, le NAS dort. Trente personnes ou trente mille, c'est le même code ; seul le nombre de lectures change.

**Ce qui est tiré au sort l'est avec une graine.** Les cartes du jour dépendent du joueur et du jour ; l'aléa de chaque vol dépend du joueur et du numéro du vol. On peut tout rejouer. Si quelqu'un dit « mon avion a eu un incident trois fois de suite, c'est truqué », on peut lui montrer le tirage. Ce n'est pas de la méfiance ; c'est ce qui rend un jeu honnête vérifiable.

**Les règles tiennent en dix lignes**, elles sont dans MONDE.md, et dix-huit tests les surveillent : le coût d'un départ, la durée d'un vol, l'occupation de l'avion, le bonus versé ou non, la fatigue qui monte et redescend, les six villages qui ouvrent la vallée, le vol de nuit aux lanternes, l'imprévu tranché, l'avion acheté si le hangar a la place, le pilote de passage, la fête. Puis un vrai navigateur a rejoué le tout, en reculant l'horodatage du vol dans la base pour ne pas attendre cinq minutes — le serveur, lui, n'a pas d'horloge truquée.

Il reste beaucoup : restaurer la piste et le hangar, acheter les décorations, voir l'avion voler dans la scène, entendre la musique, recevoir une notification quand le courrier arrive. Mais ce matin, quand Régis se réveillera, il pourra expédier un sac de courrier et revenir le soir voir s'il est arrivé. C'était la phrase de la page d'accueil. Elle est vraie.

---

## Chapitre 11 — Les marteaux jusqu'à Pont-de-Brume (11 octobre 2026, 4 h 15)

On peut maintenant dépenser ses francs à autre chose qu'au courrier : restaurer la piste (roulée, puis grande — le Martinet, puis le Héron peuvent se poser) et le hangar (une porte neuve, un établi, puis l'atelier — deux avions, puis trois). Et poser dix décorations qui ne servent à rien, sauf un peu de moral pour tout le monde, et beaucoup pour la personne qui regarde.

Parce que c'est là que ça se voit. Chaque chose construite ou posée apparaît dans la scène : la piste s'éclaircit et s'allonge jusqu'au ruisseau ; la porte du hangar change ; les géraniums fleurissent sous les fenêtres ; le banc attend face à la piste, le pommier à côté ; la manche à air prend ses rayures rouges et blanches ; le drapeau de la vallée claque ; la boîte aux lettres rouge se plante au bout du chemin ; deux tables de café ; la lanterne de cuivre ; et l'enseigne, au-dessus de la porte, avec le nom de la compagnie peint dessus. Le hangar, une fois repeint, est vert de gris avec sa porte en rouge cachet — on le voit depuis Pont-de-Brume, paraît-il.

Quarante lignes de SVG en pixels de deux par deux, et une règle CSS par objet. Rien de spectaculaire ; mais quand j'ai vu la capture d'écran avec tout posé — le nom « Messageries de la Croisette » sur la planche au-dessus de la porte rouge — j'ai pensé que c'était la première image du jeu que j'aurais envie de montrer.

---

## Chapitre 12 — L'avion vole, et il y a de la musique (11 octobre 2026, 5 h)

Deux choses qui ne changent rien aux règles et tout à la sensation.

**L'avion vole.** Quand un vol est en cours, une petite Grive traverse le ciel de la scène : vers la droite à l'aller, en montant puis en descendant ; vers la gauche au retour, retournée. Sa position est calculée à chaque image à partir des horodatages du serveur — on ne triche pas, on affiche —, et pour les personnes qui ont demandé moins de mouvement à leur appareil, elle se pose à sa place sans animation. Le soleil, lui, suit l'heure : à gauche le matin, à droite le soir ; la nuit, c'est la lune qui fait le trajet.

**La musique.** Le thème qu'on a composé hier en Python — la valse lumineuse en ré majeur — n'est pas devenu un fichier audio. Il est devenu du code : la même partition, les mêmes timbres de puce 2A03, jouée par le navigateur avec Web Audio. Pas un octet à télécharger, une boucle sans couture, et un bouton « ♪ Musique » en haut de l'aérodrome, coupé par défaut, qui se souvient de votre choix mais ne redémarre qu'à votre premier geste — les navigateurs l'exigent, et ils ont raison.

J'ai hésité sur ce dernier point. Un jeu cozy avec sa musique coupée par défaut, c'est un peu un café sans odeur de café. Mais on ouvre Altiplume cinq minutes le matin dans un train, ou le soir à côté de quelqu'un qui dort. Le silence par défaut est la politesse de ce jeu-là. Et le bouton n'est jamais loin.

Dix PR attendent Régis ce matin — ou plutôt six, empilées de #15 à #21, à fusionner dans l'ordre. C'est beaucoup. C'est aussi, en une nuit, tout ce que la page d'accueil promettait.

---

## Chapitre 13 — « Compagnie des la Croisette » (11 octobre 2026, 10 h 30)

Régis a fusionné les sept PR de la nuit en une heure, et la première chose qu'il a vue en fondant sa compagnie, c'est une faute de français. Le générateur de noms assemblait « Compagnie des » et « la Croisette » sans se demander si l'article tenait debout. En français, un lieu ne se colle pas à un mot : il arrive avec son article, contracté ou non — *de la* Brume, *du* Cuivre, *des* Lanternes, *de l'*Ocre. Les lieux portent maintenant leur article, les motifs ne le fournissent plus, et un test tire trois cents graines pour vérifier qu'aucun « des la » ne repasse.

Sa compagnie, elle, est réparée par la base elle-même au démarrage : une migration cherche « des la Croisette » et le corrige. Il n'a rien à refaire.

La matinée a aussi appris quelque chose sur GitHub : des PR empilées et des fusions « squash » ne font pas bon ménage. Chaque fusion transformait la suivante en champ de conflits, parce que les mêmes changements existaient sous deux formes. Le remède a été simple — réaligner chaque branche sur `main` après chaque fusion — mais il demandait d'être là. Prochaine fois : une PR à la fois, ou des branches indépendantes.

---

## Chapitre 14 — « Votre courrier est arrivé » (11 octobre 2026, 13 h)

Jusqu'ici, on revenait à l'aérodrome parce qu'on y pensait. À partir de maintenant, c'est l'aérodrome qui vient à vous.

**L'application.** Altiplume s'installe sur l'écran d'accueil du téléphone, avec son icône — la plume en pixels, générée en PNG depuis la même grille que le logo. Elle s'ouvre plein écran, sans barre d'adresse. Rien n'est mis en cache : un jeu en temps réel n'a rien à gagner à vivre hors ligne, et le serveur reste le seul à savoir ce qui est vrai.

**La notification.** Un bouton cloche sur l'aérodrome. Rien n'est demandé au chargement, jamais : c'est la personne qui appuie, le navigateur demande la permission, et le jeu reçoit une adresse d'abonnement et deux clés. Quand un vol se pose, le serveur — qui regarde ses vols toutes les trente secondes — chiffre « Marthe s'est posée à Pont-de-Brume. +30 F · délai tenu. » pour cet appareil et l'envoie au service de notification du navigateur, qui le transporte sans pouvoir le lire. Un vol prévient une fois, jamais deux ; un vol posé depuis plus d'une heure ne prévient plus, on l'a vu depuis.

**Pourquoi j'ai écrit le chiffrement moi-même.** Il existe une bibliothèque pour ça. Mais c'est deux cents lignes de standard — un échange de clés, une dérivation, un chiffrement authentifié, une signature — et une clé secrète passe par là. J'ai préféré que chaque ligne soit dans le dépôt, lisible, et testée par un *second* programme écrit dans le test, qui joue le rôle du navigateur et déchiffre ce que le premier a chiffré. Si l'un des deux se trompe, le test le voit. Ils sont d'accord.

**Apple.** Sur iPhone, les notifications d'un site web n'existent que si le site est installé sur l'écran d'accueil. Le jeu le dit à la place de cacher le bouton. C'est leur règle ; on l'explique.

La clé secrète se génère sur le NAS lui-même, par la même image que le jeu, et ne quitte jamais le `.env`. Neuf tests de plus — cent trente-six en tout.

**14 h 23.** Sur l'écran verrouillé de l'iPhone de Régis, sous la plume : « Your mail has arrived from Altiplume — Martha Vaudrin has landed at Mistbridge. +18 F · deadline met. » Toute la chaîne — NAS, chiffrement, signature, Apple, téléphone — a tenu du premier coup. Le « oui à cliquer sur le téléphone » du premier soir, c'était ça.

---

## Chapitre 15 — « Ça me laisse pas refaire une mission » (11 octobre 2026, 14 h)

Régis voulait tester la notification. Il a ouvert l'aérodrome : « Rien en main. De nouvelles cartes arrivent demain. » Marthe attendait devant le hangar, et il n'y avait rien à lui donner.

C'était dans la conception depuis le début — trois cartes par jour, c'est le rythme du jeu — et c'était faux quand même. Un joueur qui a tout joué à midi n'a aucune raison de revenir avant demain, et un jeu qui dit « revenez demain » le premier jour ne sera pas réouvert le second.

La réponse est une carte qui n'en est pas une : **la ligne régulière**. Le sac de Pont-de-Brume, 18 francs, sans bonus, jamais tirée, toujours posée au bas du comptoir, impossible à défausser. C'est le pain de la compagnie ; les contrats restent la fortune. On peut toujours faire voler quelqu'un — et c'est tout ce que demandait Régis, et tout ce qu'un joueur demande.

Un paragraphe de conception et vingt minutes. Les tests vérifient qu'elle part la main vide, autant de fois qu'on veut, et qu'aucun tirage ne la contient jamais.


---

## Chapitre 16 — Les deux gestes (11 octobre 2026, 14 h 30)

« Sur mobile, on peut pas avoir un raccourci dans notre interface pour créer l'icône ? La simplicité, tu te souviens ? »

Non, on ne peut pas — pas sur iPhone. Apple interdit à tout site de se poser lui-même sur l'écran d'accueil ; seul le geste Partager → « Sur l'écran d'accueil » le fait, pour tous les sites du monde. Sur Android, Chrome propose l'installation et le jeu a déjà son bouton.

Ce qu'on peut faire, c'est ne pas laisser chercher. Sur iPhone, hors application installée, l'aérodrome montre maintenant une fiche avec les deux gestes dessinés en pixels — le carré à la flèche, puis le carré au plus — et explique pourquoi : plein écran, et les notifications. « Plus tard » la replie pour une semaine. Deux gestes, c'est le minimum qu'Apple nous laisse ; on les montre avec le doigt.

*Au passage, le test instable de ce matin est démasqué : il glissait une carte précise dans la main du joueur, et un jour sur cent le tirage quotidien l'y avait déjà mise — doublon, erreur. Il ne s'en formalise plus.*

---

## Chapitre 17 — La vache sur la piste (11 octobre 2026, 14 h 45)

« Comment je peux faire décoller Marthe si j'ai une vache sur la piste ? Rien n'a été bloqué. »

Régis a raison, et c'est le genre de chose qu'on ne voit qu'en jouant. Les imprévus étaient des cartes comme les autres : on pouvait les laisser dans un coin et expédier quand même. Une vache qui n'empêche rien n'est pas une vache, c'est une illustration.

Désormais, un imprévu en main **bloque la piste** : aucun vol ne part — ligne régulière comprise — tant qu'on n'a pas tranché, et on ne peut pas le « laisser passer » : il n'a plus ce bouton. Le bouton *Expédier* des contrats se grise avec une ligne rouge qui dit pourquoi. On choisit — attendre le fermier, pousser la bête, payer — et la piste se libère.

C'est un petit changement de règle et une grande différence de sens : le jeu dit maintenant ce qu'il montre.
## Chapitre 18 — Revenir d'un geste (11 octobre 2026, 15 h 10)

Régis a filmé ses cinq premières minutes sur iPhone, avec un compte neuf. Le chemin tient : inscription, email, « Ouvrir », trois noms, « Wings of Saltshore », la fiche « Sur l'écran d'accueil » — qu'il a suivie, et l'icône est apparue —, la cloche. Puis sa remarque : « il faut inviter, dès le premier écran, à créer sa passkey. Sinon c'est pénible. »

Il a raison. La passkey était rangée dans « Mon compte », là où personne ne va le premier jour. Or c'est elle qui décide si revenir est un geste ou une corvée : avec, c'est l'empreinte ; sans, c'est un email à attendre.

L'aérodrome porte maintenant, tant qu'aucune clé n'existe, une invitation en trois lignes : *Revenir d'un geste — Créer ma passkey — Plus tard*. « Plus tard » la fait taire trois jours, puis elle revient, gentiment. Dès qu'une clé existe, elle disparaît pour de bon et la gestion reste dans « Mon compte », comme avant. Le même code sert aux deux endroits ; le parcours de bout en bout, avec l'authenticateur virtuel, joue l'invitation, le « plus tard », la création et la disparition.

---

## Chapitre 19 — Les cinq premières minutes (11 octobre 2026, 15 h 30)

Deux vidéos de Régis, l'une sur PC, l'autre sur iPhone, avec un compte neuf à chaque fois. On y voit ce qu'aucun test ne mesure : où l'œil hésite.

Sur PC, l'aérodrome était une colonne étroite au milieu d'un grand écran — une page de téléphone agrandie. Sur grand écran, il s'étale maintenant sur deux colonnes : le courrier et les pilotes à gauche, le chantier et l'album à droite, la scène au-dessus, centrée, le soleil entier.

Rien ne disait quoi faire après la fondation. Une fiche « Votre premier vol, en trois gestes » — choisir un sac, expédier, revenir dans quelques minutes — reste tant qu'aucun sac n'est rentré, puis s'efface d'elle-même.

Et sous le cachet « lien envoyé », l'adresse où le lien part, en gras : une faute de frappe se voit tout de suite, au lieu de se découvrir dix minutes plus tard devant une boîte vide.

## Chapitre 20 — La route descend vers la mer (11 octobre 2026, 16 h)

« Je souhaite poursuivre les développements de notre v2. » La feuille de route disait : Côte de Saline, Archipel, hydravion, décoration complète. On commence par la Côte, parce que c'est elle qui demande la machine la plus neuve.

**Une région, c'est d'abord une règle.** Jusqu'ici, le monde avait une seule région et le code le savait trop bien : la liste des destinations, c'était *la* liste. Il a fallu lui apprendre qu'une destination appartient à une région, qu'une carte dépend de la région de sa destination, et qu'une compagnie a des routes ouvertes — la vallée dès la fondation, les autres plus tard. Rien de visible, mais tout le reste s'appuie dessus.

**Ce qui ouvre la route.** Les cachets. Le document de conception le disait depuis le premier soir : *la monnaie de prestige, on ne peut pas l'acheter, elle débloque les régions.* Elle n'avait encore rien débloqué. Maintenant : la page « Toute la vallée » dans l'album, dix cachets sur la table, et la Côte de Saline est ouverte. Les cachets partent ; la page « La route de la Côte » arrive. Tant que la route est fermée, pas une carte de la Côte ne se tire : le courrier du jour reste celui de la vallée, et le joueur ne voit pas de contrats qu'il ne peut pas honorer.

**Six escales, dont trois sur l'eau.** Port-Sel et sa capitainerie, les Œillets des sauniers, Marais-Blanc sur ses pilotis, l'Anse-aux-Goémons entre ses bouées, le Phare de Brisant et ses deux gardiens, l'Île Sainte-Ambre au large. Les distances continuent celles de la vallée : la Grive porte jusqu'au port et jusqu'à la digue des Œillets, le Martinet jusqu'au marais, et pour le reste il faut se poser sur l'eau.

**La Sterne et le ponton.** Un hydravion ne se pose que sur l'eau, et seulement sur l'eau — la Sterne ne se posera pas sur une digue, et la Grive n'amerrira pas. Elle ne dort pas au hangar non plus : il lui faut un ponton sur la rivière, une zone de plus à restaurer, 1 500 F, visible dans la scène dès qu'il existe, avec la Sterne amarrée quand elle est au repos. Le hangar compte les avions de terre, le ponton compte les hydravions ; aucun ne prend la place de l'autre.

**Les chiffres.** Quinze contrats, mieux payés que ceux de la vallée parce que plus loin (de 92 à 176 F), deux imprévus de la Côte — un grain au large, la marée qui a tout changé —, deux opportunités, neuf pages d'album. Le vent de mer ajoute un quart d'heure deux fois sur cinq. Et une page « Toute la Côte » quand les six escales ont reçu leur courrier, qui dit déjà : *au large, des lanternes.*

**Les compagnies existantes** reçoivent leur rive nue et leur route de la vallée par une migration, sans rien perdre. Un parcours de bout en bout joue tout cela dans un vrai navigateur : la route fermée, le bouton inactif qui nomme la page manquante, l'ouverture, le ponton, l'achat, l'amerrissage et ses deux pages.

## Chapitre 21 — L'interlude sécurité (11 octobre 2026, 16 h 30)

Régis a passé altiplume.com dans les moulinettes gratuites : Observatory de Mozilla, **B+** ; securityheaders, **A** « plafonné » ; l'évaluateur CSP de Google, deux remarques ; SSL Labs ; MXToolbox. « Mais je ne sais pas quoi faire. Sachant qu'on ne doit pas bloquer l'application non plus. »

**Lire avant d'agir.** L'API d'Observatory dit tout : onze tests sur douze réussis, un seul échec, qui coûte vingt points — `http://altiplume.com` répond une page au lieu de renvoyer vers HTTPS. Le même défaut plafonne securityheaders. SSL Labs donne **B** pour une raison qu'on ne voit pas depuis le serveur : Cloudflare accepte encore TLS 1.0 et 1.1, par défaut. Et côté courrier, Brevo signe bien (DKIM), mais le domaine n'a pas de SPF et sa DMARC ne fait que regarder (`p=none`).

**Ce qui est du code, et ce qui ne l'est pas.** Trois des quatre écarts sont des réglages Cloudflare — gratuits, cinq minutes, aucun risque pour le jeu — et des enregistrements DNS. Ils sont écrits noir sur blanc dans la nouvelle page [Sécurité](SECURITE.md), avec les valeurs exactes. Le code, lui, a pris sa part : le serveur redirige en 301 toute requête arrivée en clair (et seulement celles-là — si l'en-tête du tunnel manquait, pas de boucle), sans poser HSTS sur une réponse en clair, et laisse passer le contrôle de santé que la tâche du NAS appelle depuis l'intérieur du conteneur.

**Trusted Types.** La remarque de Google méritait mieux qu'un haussement d'épaules. Avec `require-trusted-types-for 'script'`, le navigateur refuse toute chaîne brute dans un puits d'injection — `innerHTML`, l'adresse d'un service worker — sauf si elle est passée par une politique nommée. Le client n'en a qu'une, « altiplume », pour ses deux seuls usages : les textes traduits du dictionnaire embarqué, et `/sw.js`. Tout le reste parle au DOM par `textContent` et `createElement`. Une faille XSS, s'il en existait une, n'aurait plus rien à injecter. Le parcours de bout en bout vérifie dans Chromium que la politique existe, qu'une adresse brute est refusée, et que les textes à balises s'affichent toujours. La CSP passe aussi à `default-src 'none'` — chaque famille de ressources nommée, le reste refusé — et le document est isolé des autres origines (COEP).

**Que ça reste vrai.** Un contrôle hebdomadaire interroge Observatory, SSL Labs, le DNS et le site lui-même, compare à l'attendu, et échoue tant qu'un point est en dessous. Il tournera rouge lundi si les réglages Cloudflare ne sont pas faits — c'est exactement son rôle.

## Chapitre 22 — Après redéploiement (11 octobre 2026, 19 h)

Régis a redéployé, rejoué un compte neuf, et relancé les moulinettes : Observatory **A+ (140/100, douze tests sur douze)**, securityheaders **A+**, SSL Labs **A+ sur les quatre adresses**, l'évaluateur CSP de Google **quatorze directives vertes** — il ne reste que la remarque sur `'self'`, qui parle de JSONP et de fichiers déposés par les utilisateurs, deux choses que le jeu n'a pas. Le contrôle hebdomadaire était déjà vert. Les notes sont dans la page Sécurité, avec les neuf lignes encore « non effectué » ; ce sont les prochains interludes.

**Et un bug, trouvé en rejouant.** Les histoires des pilotes s'ouvraient en anglais sur une page en français. La cause : le compte avait été créé en anglais, et l'endroit qui sert les scènes regardait la langue de l'inscription au lieu de celle de la page — le seul endroit à faire ça, les autres recevaient déjà la langue courante. C'est corrigé, avec le test qui va avec : la langue de la page l'emporte, toujours.
## Chapitre 23 — Plus de pixels (11 octobre 2026, 19 h 30)

« 8 bits, on est d'accord, mais essaie de faire plus de pixels : tout me semble trop large. Des nuances et des nuages dans le ciel, de la verdure à l'horizon, pas juste une tache verte, un hangar plus appealing. »

La première scène faisait 160 pixels de large et chaque chose y était un rectangle. Celle-ci en fait 320, et chaque chose y est un dessin : le ciel en trois bandes avec deux lignes tramées entre elles, comme sur les vieilles consoles ; des nuages à deux tons qui dérivent (sauf si l'on a demandé moins de mouvement) ; une crête lointaine avec sa ligne de sapins et de feuillus ; des collines proches avec des buissons et de vrais arbres, tronc compris ; des touffes d'herbe ; le hangar en tôle ondulée avec sa grande porte à deux battants, sa fenêtre, sa cheminée ; le biplan avec ses deux ailes, ses haubans, ses roues ; la rivière avec son ponton de planches. La nuit : des étoiles, la lune, la fenêtre du hangar allumée, et la lanterne qui fait un halo.

**Chaque décoration a maintenant son dessin**, de jour comme de nuit : les jardinières sous la fenêtre, le banc face à la piste, la boîte aux lettres rouge au bout du chemin, la lanterne de cuivre, le pommier avec ses pommes, le drapeau de la vallée avec sa plume, les tables du café sous un parasol rayé, la manche à air rayée, l'enseigne au nom de la compagnie, et la peinture du hangar qui passe la porte en rouge cachet.

**Comment c'est fait.** Pas de logiciel de dessin : chaque élément est un petit tableau de lettres dans un script, une lettre par pixel, une légende qui dit quelle classe CSS porte chaque lettre. Le script fusionne les pixels voisins en rectangles et écrit le SVG dans la page. Les couleurs restent dans la feuille de style — c'est elle qui fait l'aube, le crépuscule, la nuit. Deux mille rectangles, quatorze kilo-octets compressés. Un second script rend huit aperçus (nu / tout posé × quatre moments) pour juger avant de pousser.

Et oui, ça évolue avec le jeu : la piste change quand on la restaure, le hangar quand on l'agrandit ou le peint, le ponton apparaît quand on le construit, la Sterne s'y amarre quand elle est là. La Côte de Saline aura sa propre scène ; ce chapitre-là est pour plus tard.

## Chapitre 24 — La boîte aux lettres (11 octobre 2026, 20 h 30)

Les mentions légales avaient encore un champ entre crochets : l'adresse de contact. Deux questions de Régis : « ai-je le droit à une redirection Cloudflare vers mon Gmail, ou y a-t-il un truc avec Brevo ? » et « ne faut-il pas plutôt un formulaire que d'afficher une adresse ? »

**Brevo envoie, il ne reçoit pas.** Pour recevoir, Cloudflare Email Routing suffit, c'est gratuit, et ça donne un alias jetable : si `bonjour@` finit aspiré par les robots, on en crée un autre en dix secondes et on change une ligne. Une vraie boîte, on la traîne à vie.

**Le piège, lui, était dans le SPF.** Cloudflare propose d'ajouter son propre enregistrement SPF au domaine. Or il y en avait déjà un, celui de Brevo — et deux SPF sur le même nom ne font pas un SPF plus fort, ils font un SPF invalide. Les liens de connexion seraient tombés les premiers. Un seul enregistrement, deux `include`, et tout va bien : `v=spf1 include:spf.brevo.com include:_spf.mx.cloudflare.net -all`.

**Formulaire ou adresse ? Les deux.** L'adresse est publiée, parce que la loi attend un moyen de contact identifiable et qu'un formulaire seul se discute. Mais le formulaire est mis en avant : les gens de bonne foi cliquent le bouton, les robots aspirent une adresse qu'on peut jeter.

**Ce qui tient les robots dehors**, sans captcha ni service tiers — la CSP ne les laisserait pas entrer de toute façon : un champ-piège invisible à l'écran, au clavier et aux lecteurs d'écran ; un délai minimum de rédaction, parce qu'un robot remplit et soumet en une demi-seconde ; trois envois par heure et par adresse IP ; des longueurs bornées. Un robot repéré reçoit exactement la même réponse qu'un humain : il n'apprend rien.

**Et ce qui empêche le pire.** Le destinataire vient de la configuration du serveur, jamais du navigateur : sans cette règle, le formulaire serait un relais à spam ouvert sur Internet, et c'est le domaine qui finirait sur les listes noires. Le sujet et l'adresse de réponse sont nettoyés de tout caractère de contrôle — un retour à la ligne dans un sujet, c'est une tentative d'injection d'en-tête. Le message est échappé dans la version HTML du courriel. Et il n'y a pas d'injection SQL possible, pour une raison simple : **rien n'est écrit en base**. Le message traverse le serveur et s'en va. Le journal note qu'un message est parti, sans son contenu ni son auteur.

Le contrôle hebdomadaire a appris deux choses au passage : que le domaine a maintenant des MX — mais seulement ceux de Cloudflare, et il alerte sur tout autre serveur de courrier —, et qu'un contrôle qui n'a rien pu mesurer n'est pas un contrôle réussi. Il passait au vert quand le réseau tombait ; il échoue, maintenant.

## Chapitre 25 — Trois francs (11 octobre 2026, 21 h)

Régis avait décoré son aérodrome — le café, la lanterne, le pommier, le drapeau —, et il lui restait trois francs. La ligne régulière en coûtait quatorze au départ. Plus rien ne décollait. « Suis-je bloqué pour toujours ? Banqueroute ? Souviens-toi de l'esprit Stardew Valley : on doit pouvoir grinder tranquille. »

Il avait raison, et c'était pire qu'un bug : c'était une règle du jeu violée. *L'absence n'est jamais punie* — la maladresse non plus ne devrait pas l'être. Dans Stardew, on peut tout dépenser en graines ; le lendemain, on peut toujours aller pêcher.

**La poste avance les frais.** C'est la correction, et elle se raconte dans le monde : sur la ligne régulière, rien n'est débité au départ ; la poste avance le salaire et le carburant, et les retient sur le tarif à l'arrivée. Dix-huit francs moins quatorze : quatre francs nets par aller-retour. Peu, mais sûr — et de zéro, quatre allers-retours suffisent à reprendre un contrat. Les contrats, eux, gardent leur règle : il faut pouvoir avancer les frais soi-même.

Il fallait aussi vérifier qu'aucune autre porte ne se fermait. Un imprévu bloque la piste tant qu'on ne l'a pas tranché ; si toutes ses réponses coûtaient de l'argent, une caisse vide resterait coincée pour de bon. Ce n'est pas le cas — chaque imprévu a une réponse gratuite — et c'est maintenant un test : le jour où quelqu'un écrira un imprévu sans issue, la machine refusera.

**En écrivant l'aide, trois autres promesses non tenues.** Pour expliquer le jeu, il faut le relire comme un joueur, et le relire comme un joueur, c'est vérifier que chaque phrase est vraie. Trois ne l'étaient pas :

- *« Chaque première livraison vaut un cachet — deux pour Haut-Ferrand, trois pour la Combe. »* Les données le disaient, le code donnait un cachet partout. Corrigé, et les compagnies existantes reçoivent ce qui leur était dû.
- *« Piste roulée : le Martinet peut se poser. »* La piste de la Croisette ne changeait rien à rien. Elle compte maintenant : pour décoller de chez soi, il faut la piste qui va avec l'avion.
- *« Porte neuve, établi : l'entretien coûte moins. »* Il ne coûtait pas moins. Il coûte moins.

Deux autres restent écrites dans le jeu sans effet encore — le moral des pilotes, et le trait « Nocturne ». L'aide n'en promet rien ; elles sont sur la liste.

**Et l'aide.** « *Best support is no support* : il faut quelque chose de bien dès le départ. » Une page, *Comment on joue*, dans les deux langues, liée depuis l'en-tête de chaque page et depuis la fiche du premier vol. Elle commence par trois gestes en une minute, puis répond aux questions qu'on se pose vraiment : le courrier du jour, la ligne régulière, pourquoi un vol ne part pas, à quoi servent les francs et les cachets, les pilotes, l'aérodrome, les routes, et ce qui se passe quand on n'est pas là. Elle ne dit jamais « récompense » : on ne gagne pas des points, on fait des choses, et l'album s'en souvient. Elle finit par sept petites questions — dont la première : *« Je n'ai plus de francs, je suis bloqué ? »* Non.

Bonne nouvelle au passage : sur Windows, Chrome a proposé d'installer Altiplume sur le bureau, et la notification est arrivée.

## Chapitre 26 — Tenir parole (11 octobre 2026, 21 h 30)

Trois promesses écrites, aucune tenue. On les a tenues.

**« Après 24 mois sans connexion, le compte est supprimé, précédé de deux avertissements par email. »** C'est dans la politique de confidentialité et dans le registre depuis le premier soir — et rien, nulle part, ne le faisait. Le ménage horaire du serveur s'en charge maintenant : à vingt-deux mois, un premier email, dans la langue de la personne, qui dit que rien n'est perdu et qu'une connexion suffit ; à vingt-trois, un dernier ; à vingt-quatre, l'effacement — le compte, la compagnie, les pilotes, l'album, tout suit. Revenir, à n'importe quel moment, remet le compteur à zéro. Et le serveur n'efface jamais sans avoir envoyé les deux avertissements, même s'il a dormi deux ans d'un coup. Rien de tout cela n'arrivera avant 2028 ; mais une promesse RGPD n'attend pas d'être testée par un plaignant pour devoir être vraie.

**Le moral et le trait « Nocturne »** s'affichaient sans rien changer. Un pilote heureux casse moins, désormais : à vingt de moral, un quart d'incidents en moins ; à zéro, un quart de plus. Et la nuit, aux lanternes, le risque d'incident double — sauf pour Ysé, qui est Nocturne, et qui vole de nuit comme de jour. L'aide le dit, en une phrase.

**Pour que ça ne se reproduise plus**, trois tests lisent le code de la simulation et vérifient que chaque effet de trait, chaque propriété de zone, et le moral y sont réellement utilisés. Le jour où quelqu'un ajoutera un trait « Mains de fée » sans lui donner d'effet, la machine refusera — avant qu'un joueur ne le remarque.
## Chapitre 27 — Le jour aux bateaux, la nuit au courrier (11 octobre 2026, 22 h)

Troisième région, celle qui donne enfin son sens à un mot écrit depuis la première nuit : *Nocturne*. L'Archipel des Lanternes, c'est six îles basses au large de la Côte, une lanterne au bout de chaque ponton, et une poste qui arrive le soir. Tout se pose sur l'eau ; quatre îles sur six se volent de nuit, là où le risque d'incident double — sauf pour qui vole de nuit comme de jour.

La route s'ouvre contre quinze cachets, une fois toute la Côte livrée. Les îles sont loin : de quatorze à dix-neuf lieues. La Sterne n'y va qu'avec Aurèle, et pas jusqu'au bout. Pour le reste, il faut le **Goéland**, l'hydravion long-courrier que la compagnie des bateaux-poste revend à Port-Sel, et un second ponton pour l'amarrer. Douze contrats, dont une lettre pour quelqu'un parti vers le Grand Blanc, à laisser à la dernière lanterne.

**Deux pilotes de plus**, pour garder la parité à six : Solenn Darrieux, de la Forêt de Cuivre, Nocturne et Mains d'or, qui porte une petite lanterne de cuivre à la ceinture et finira par la mettre au bout de votre ponton ; Teodor Vashti, du Désert de Verre, Longues routes et Porte-bonheur, qui écrit trois chiffres sur sa manche avant chaque vol et laisse une lettre à la dernière île pour un frère resté dans le désert. Trois scènes chacun, à hauteur de comptoir.

**Chaque route a maintenant son paysage** : une petite vignette en tête de chaque carte de région, dessinée pixel par pixel comme la scène — la vallée et sa croix, les marais salants et le phare, les îles et leurs lanternes qui se reflètent dans la nuit. Fermée, la route est en demi-teinte ; ouverte, elle prend ses couleurs. Ce sont les « scènes de la Côte et de l'Archipel » promises au chapitre 23 : pas une scène entière — l'aérodrome reste à la Croisette — mais ce qu'on voit de là-bas quand on regarde la carte.

## Chapitre 28 — Prosper (12 octobre 2026, 10 h 30)

« Renomme le personnage principal Marthe Vaudrin, et son nom de famille, en Prosper Chickenman (homme). »

Marthe était là depuis la première nuit. Elle avait quarante-quatre ans, un blouson de cuir trop grand, et c'est elle qui touchait la croix du chemin avant de décoller. Elle s'appelle maintenant Prosper Chickenman, et c'est un homme. Le reste ne change pas : le même âge, les mêmes traits — *Météo dans la peau*, *Cœur de village* —, la même histoire en trois scènes, le hangar de Bastien, la marque au crayon sur la poutre. Seuls les accords ont suivi, et les autres pilotes qui parlent de lui.

Une migration fait le reste : les compagnies déjà fondées gardent leur pilote, son affinité, son moral, les scènes déjà lues. Personne ne perd ses douze vols ensemble parce qu'un nom a changé.

**Une règle a sauté au passage, et il faut le dire.** Le 11 octobre, la première consigne de Régis sur le monde était : *« si tu utilises des prénoms, aie autant de personnages hommes que femmes »*. Marthe partie, l'effectif est de deux femmes pour quatre hommes. Je ne l'ai pas corrigé de ma propre initiative — ce sont ses personnages — mais je ne l'ai pas non plus laissé passer en silence : le test qui vérifiait la parité vérifie maintenant l'écart exact, avec la date et la raison. Il échouera si quelqu'un y touche sans le vouloir, et il redeviendra une vraie parité quand les deux prochaines pilotes arriveront. Elles sont décrites dans la bible du monde, avec leurs régions et leurs traits.

**Et les tarifs montent.** La ligne régulière passe de 18 à 25 francs, et tous les contrats suivent dans la même proportion — un facteur 25/18, appliqué aux récompenses comme aux primes de délai. Les coûts, eux, ne bougent pas : un aller-retour sur la ligne régulière rapporte maintenant 11 francs nets au lieu de 4. La progression est plus généreuse d'environ 40 %. Les trois garde-fous tiennent : aucun contrat ne coûte plus qu'il ne rapporte, les villages lointains restent mieux payés que les proches, et la ligne régulière n'a toujours pas de prime.

## Chapitre 29 — Les minutes qui ne bougeaient pas (12 octobre 2026, 12 h)

« Le rafraîchissement du voyage — la barre de temps et les minutes affichées — n'est pas correct, je crois. »

Il avait raison, et le défaut n'était pas celui qu'on croit. Les chiffres étaient justes : trente minutes d'aller, trente de retour, et « arrivée dans 5 min, retour dans 35 min » décrivait exactement la situation. Le problème, c'est qu'ils ne **bougeaient** pas. La page ne se redessinait qu'une fois toutes les trente secondes, en redemandant tout au serveur. Entre deux, la barre restait figée et les minutes aussi. On regarde son téléphone, rien ne change, on en conclut que c'est cassé — et on a raison d'en douter.

Désormais une horloge locale bat **à la seconde**, et ne touche que deux choses : la largeur de la jauge et la ligne de texte. Aucun réseau. Le serveur n'est redemandé que lorsqu'il a quelque chose de neuf à dire — un vol qui se pose, un avion qui rentre — ou quand on revient sur l'onglet après une mise en veille, parce que les minuteurs d'un onglet caché sont gelés par le navigateur. Résultat mesuré dans un vrai Chromium : le compte à rebours descend tout seul, aucun appel réseau pendant seize secondes, et au moment exact de l'atterrissage la page se resynchronise d'elle-même et affiche les nouvelles. Avant, il fallait attendre jusqu'à trente secondes.

**Et une étiquette manquait.** « En route · 5 min · retour dans 35 min » : ce « 5 min » tout nu ne disait pas de quoi il parlait. Il dit maintenant « arrivée dans 5 min ».

## Chapitre 30 — Garance et Hedda (12 octobre 2026, 12 h 30)

« Rétablis la parité homme-femme pour le futur. Que l'histoire tienne ensemble. »

Deux pilotes, donc, et pas n'importe lesquelles : celles qui manquaient aux fils déjà tendus.

**Garance Thuillier**, vingt-neuf ans, de Pont-de-Brume — la ville de marché de l'autre côté de la rivière, celle du tout premier contrat. Elle a grandi sur le quai, cachée entre les caisses de poisson, à noter les atterrissages de la Croisette avant de savoir écrire. *Tête brûlée* et *Cœur de village* : elle se pose trop court et déteste s'éloigner. Son histoire répond à celle de Prosper : il garde depuis le premier jour un crayon dont il n'a jamais dit pour qui, et sur la poutre du hangar il n'y a qu'une seule marque. Garance, treize ans après son premier vol seul, demande qu'on trace la sienne.

**Hedda Vilmorin**, quarante-neuf ans, du **Grand Blanc** — la région que personne n'a encore atteinte. *Longues routes* et *Économe* : au nord, le litre de trop est du poids et le litre qui manque est de la glace. Elle répond à Teodor, qui laisse une lettre à la dernière lanterne pour un frère resté dans le désert. Elle ne lui apporte pas de nouvelles — ce serait trop facile, et faux. Elle lui explique ce que le nord fait des lettres : il les garde dans une boîte, parfois dix ans, et parfois quelqu'un revient et son nom est dessus. Elle lui donne une raison de continuer à écrire.

Huit pilotes, quatre femmes, quatre hommes, huit lieux d'origine. La parité, rompue le matin même par un renommage, est rétablie le jour même — et le test est redevenu strict. La bible du monde a maintenant une section « Les fils qui se rejoignent » : la poutre de Bastien, les lettres qui attendent, la lanterne de cuivre, la croix du chemin. Pour que ceux qui écriront les suivants sachent à quoi ils répondent.

## Chapitre 31 — Huit heures de vol, pas huit vols (12 octobre 2026, 14 h)

« La fatigue est trop longue et les missions à répétition trop courtes et vite recoupées par la fatigue. Difficile d'évoluer, je trouve. »

C'était vrai, et c'était un défaut de conception, pas un réglage trop sévère : la fatigue comptait des **vols**, pas du **temps de vol**. Un aller-retour de dix minutes à Pont-de-Brume coûtait autant qu'une traversée de deux heures et demie dans l'Archipel — un point, parfois deux. Huit points et le pilote posait sa casquette. Autrement dit : **huit sauts de dix minutes, quatre-vingts minutes de jeu, puis vingt-quatre heures d'attente**, puisqu'un point ne s'effaçait qu'en trois heures. La ligne régulière, celle qui doit permettre de remonter tranquillement, était précisément celle que la règle punissait le plus.

La fatigue compte maintenant des **minutes de vol**, aller et retour compris, au trait du pilote près. Un saut à Pont-de-Brume pèse dix minutes ; un aller-retour de plateau, une heure ; une traversée de l'Archipel, deux heures et demie. Un pilote se repose quand il a **huit heures de vol** dans les bras. Et surtout, deux changements qui font toute la différence :

- **En l'air, rien ne s'efface** — la fatigue ne se mesure plus depuis le décollage mais depuis le retour au sol. Un pilote ne se repose pas en travaillant.
- **Au sol, une minute de repos efface deux minutes de vol.** Une longue journée se rattrape dans l'après-midi, pas le lendemain.

Mesuré sur la ligne régulière, sans souffler une seule minute entre deux départs : **36 allers-retours d'affilée et 396 francs** avant que Prosper ne pose sa casquette, contre huit avant. Et après une heure au sol, il repart. Pour les longues routes, rien ne s'est adouci : sept allers-retours de plateau suffisent encore à l'arrêter — c'est bien le but, une traversée doit se payer.

**Deux détails de lecture, au passage.** La liste des pilotes disait « trop fatigué·e » ; maintenant que chacun a un genre, elle dit « trop fatigué » ou « trop fatiguée », et surtout elle ajoute **dans combien de temps il reprend son service**. Une attente qu'on sait finir n'est plus la même attente. Le joueur continue de voir dix crans — une heure de vol par cran — et pas des minutes : la mécanique est interne, la lecture reste simple.

Les anciennes valeurs de fatigue n'avaient plus le même sens : une migration offre une nuit de repos à tous les pilotes en service. Le test « jamais bloqué » garde la trace du défaut avec sa date, et vérifie désormais la trentaine d'allers-retours et le retour en service dans l'heure.

## Chapitre 32 — Dire ce qui tourne (12 octobre 2026, 18 h 30)

« Affiche un ruban sur le site en haut à droite avec la version. Je pense qu'il faut indiquer qu'on expérimente à ce stade. »

Deux heures plus tôt, une PR fusionnée, un redéploiement lancé — et la production servait encore l'image d'avant. Dix minutes à s'en apercevoir, parce que rien, nulle part, ne disait ce qui tournait. C'est exactement le trou que ce chapitre bouche.

**Une étiquette en haut à droite de chaque page** : `ESSAI v0.2.0`. Petite, en pointillés, le mot du stade au rouge du cachet. Au survol, la version exacte : `v0.2.0 · 7f3a91c4d2b1 · 2026-10-12`, le commit précis. Elle mène à **`/version`**, une page qui dit en français et en anglais ce qu'« essai » veut dire : le jeu se joue de bout en bout, mais les règles sont réajustées quand elles se révèlent mauvaises — la fatigue, le matin même —, une partie peut devenir plus facile ou plus exigeante d'un jour à l'autre, et c'est le stade du projet, pas un accident. Avec, en regard, ce qui ne bougera pas : **rien n'est effacé**, l'absence n'est jamais punie, les données appartiennent au joueur. Et ce qui peut arriver : un petit serveur chez son auteur, aucune garantie de disponibilité, c'est gratuit.

**Le numéro ne peut pas mentir**, parce que personne ne le saisit à la main. La version vient de `package.json` — passé de `0.0.1`, resté là depuis le premier jour, à `0.2.0`, ce que le jeu est vraiment. Le commit et la date sont gravés par la chaîne de publication, en arguments de construction de l'image, et le client les écrit dans chaque page au moment où il se construit. Hors conteneur, tout cela vaut « dev » : une construction locale ne prétend pas être une image publiée. L'image porte aussi les étiquettes standard OCI, celles que `docker inspect` sait lire.

**Et la machine peut le lire aussi.** Une route publique `/v1/version` rend les mêmes trois valeurs — rien de secret, le dépôt est public sous AGPL et l'étiquette l'affiche déjà. La sonde `/healthz`, elle, reste muette : ce n'est pas son rôle. Surtout, **le contrôle de sécurité hebdomadaire lit maintenant cette route** et marque un point sous l'attendu si le NAS répond « dev » ou ne répond pas : un redéploiement qui échoue en silence ne pourra plus passer inaperçu une semaine.

Vérifié dans un vrai Chromium, en 390 et en 1280 pixels, de jour comme de nuit, en français comme en anglais : l'étiquette tient sur la ligne de navigation sans la bousculer, elle disparaît à l'impression, et elle annonce « Version et stade du projet » aux lecteurs d'écran.

## Chapitre 33 — Par avion (12 octobre 2026, 19 h)

« Fais les cartes de partage social, dans chaque langue. Et décision : pas d'AdSense. Je mettrai seulement Buy Me a Coffee, plus tard. Pas tout de suite. »

Jusqu'ici, un lien Altiplume collé dans une conversation n'affichait rien : une adresse nue, sans image, sans phrase. Il montre maintenant une carte.

**La carte est tirée de la vraie scène du jeu.** Pas d'illustration à part, pas de promesse que le jeu ne tient pas : l'aérodrome au crépuscule, le hangar restauré, la Grive sur la piste, la Sterne au ponton, et sur l'enseigne, *Altiplume*. Le texte vit dans le ciel — « Un petit aérodrome, quelque part dans les nuages. » — et le ciel de la carte prolonge celui de la scène sans couture, parce que le script lit sa couleur dans l'image. En haut, la bande à chevrons du courrier aérien, la même que l'enveloppe d'inscription. À droite, l'étiquette bleue **PAR AVION**.

Ce détail-là n'est pas décoratif. Depuis 1929, l'Union postale universelle impose « Par avion » sur les étiquettes de courrier aérien du monde entier, **en français, quelle que soit la langue du pays** — le français est la langue officielle de l'UPU. Une étiquette américaine dit « PAR AVION » puis, dessous, « BY AIR MAIL ». La carte anglaise fait exactement ça. La carte française n'a pas besoin de traduction.

**Une carte par langue, et le lien choisit.** Les robots qui fabriquent les aperçus — LinkedIn, WhatsApp, Signal, Mastodon, iMessage — ne lisent pas de JavaScript ; ils voient l'en-tête tel que le serveur l'envoie. La construction du client produit donc chaque page en deux exemplaires, d'en-tête français et d'en-tête anglais, et le serveur sert le second quand le lien porte `?lang=en`. La réécriture est étroite : une page connue, `lang=en` exactement, rien d'autre — ni une API, ni un fichier. Et l'adresse **suit la langue de lecture** : qui lit en anglais voit `?lang=en` dans sa barre d'adresse, si bien qu'un lien copié montre, une fois collé, la carte dans la langue où on lisait. Celui qui ouvre ce lien lit en anglais, lui aussi, même si son navigateur est en français. Au passage, le titre de l'onglet se traduit enfin : il restait en français quand on basculait.

**Une exception de sécurité, une seule, et dite.** Le site interdit à tout autre site d'afficher ses fichiers (`Cross-Origin-Resource-Policy: same-origin`). Pour les deux images de partage, et pour elles seules, c'est `cross-origin` : elles sont faites pour être affichées ailleurs. Un test vérifie que l'exception ne déborde pas — ni la page, ni une icône, ni la même image avec un paramètre en plus.

**Et la décision, consignée.** Pas de publicité : ni bandeau, ni vidéos récompensées, ni message anti-bloqueur. Le document de conception prévoyait AdSense depuis le premier jour ; il dit maintenant pourquoi on y renonce — une seule balise de régie aurait fait tomber `connect-src 'self'`, les trois notes A+ mesurées, l'argument « zéro traqueur », et imposé un bandeau de consentement, pour un jeu qui coûte dix euros par an. La politique de confidentialité, le registre des traitements et le suivi des coûts disent la même chose. Buy Me a Coffee viendra plus tard, sous la forme d'un simple lien sortant : rien ne se chargera depuis chez eux tant qu'on n'aura pas cliqué.

## Chapitre 34 — La Forêt de Cuivre (12 octobre 2026, 19 h 45)

« Fais A, et ne te rate pas sur le storytelling. »

Le monde avait deux lanternes de cuivre et aucune forêt. Ysé portait la sienne au sac depuis la v0.1 ; Solenn, venue de la Forêt de Cuivre, avait la sienne à la ceinture, achetée par sa mère à la fabrique de l'Anse-des-Lanternes, « au bout du monde ». Personne ne s'était demandé d'où venait le cuivre. La quatrième région répond à cette question, et c'est par elle qu'il fallait commencer.

**Une hêtraie qui garde ses feuilles.** Derrière la crête de Haut-Ferrand, des hêtres si vieux que leurs feuilles restent aux branches tout l'hiver, rousses — les botanistes disent *marcescence*, les gens de la forêt disent que les arbres gardent leur monnaie. Dessous, une mine, Vert-de-Gris, où tout est vert : le ruisseau, les toits, les mains des mineurs. Son cuivre part aux îles en feuilles et revient en lanternes. Les deux lanternes du jeu sont nées ici ; elles ne le savaient pas.

**Six escales, et une seconde route.** Les Charbonnières et leurs meules qui fument ; Villechaudron, la ville des cent marteaux, qui a le bureau de poste de toute la forêt ; les Scieries, où le père de Solenn a réparé toutes les roues ; l'abbaye de Sonnefeuille, la seule fonderie de cloches, dont les moines sonnent quand ils vous entendent pour que vous trouviez la trouée ; Vert-de-Gris ; et le Hêtre-Roi, l'arbre du cœur de la forêt, dans le tronc duquel on laissait le courrier au facteur des bois. La route s'ouvre comme celle de la Côte, une fois toute la vallée livrée, contre douze cachets. Jusqu'ici le jeu était un couloir : la vallée, puis la mer, puis les îles. Il a maintenant **une fourche** : la mer ou les arbres, et c'est le joueur qui choisit par où il grandit.

**La clairière, et l'avion qui va avec.** Trois escales sont des clairières, plus courtes que la plus courte des pistes. Seul le **Pic** s'y pose — un monoplan à aile haute, des volets qui descendent comme des paupières, des pneus ballons ; il décolle en cinquante pas. Il n'est pas rapide ; il n'a pas besoin de l'être. Celui qu'on peut acheter attend sous une bâche à Villechaudron : le receveur voulait faire porter le courrier de la forêt par avion, et n'a jamais appris à le piloter. Sous les hêtres, l'humidité fait tousser les moteurs : le risque d'incident y est multiplié par 1,5, et un pilote aux Mains d'or y vaut de l'or. Le premier atterrissage entre les arbres colle une page à l'album : « Dans la clairière ».

**Deux pilotes, et ce qu'ils rapportent.** Les histoires du jeu ne sont pas indépendantes — c'est une règle écrite depuis le chapitre 30 : chaque nouveau fil doit répondre à un fil existant.

*Gaspard Sorbier*, cinquante-deux ans, a porté le courrier de la forêt à pied pendant trente ans : trois jours de marche pour un aller, le jeudi au Hêtre-Roi. Au-dessus des arbres, il nomme les sentiers par les trous dans les feuilles — « c'est la même forêt ; simplement, je ne l'avais jamais vue à l'endroit ». Dans le creux du vieil arbre, il trouve une lettre verdie adressée « au facteur » : depuis qu'il a arrêté, c'est à lui qu'on écrit, pour lui dire que le courrier arrive vite maintenant, et qu'on regrette un peu le jeudi. Hedda, le soir, dit seulement : « Chez nous, c'était une boîte en fer-blanc. » Et à la dernière scène, il apporte au hangar un vieux sac de toile au pochoir à demi effacé : **CROISETTE**. Il y a trente ans, un biplan a lâché ce sac dans la clairière du Hêtre-Roi, le premier courrier tombé du ciel dans la forêt ; Gaspard l'a porté le reste du chemin. Bastien a battu des ailes. Ils ne se sont jamais rencontrés. Gaspard accroche le sac sous la poutre aux marques de crayon, et Prosper le touche du bout des doigts, comme la croix du chemin.

*Rosalie Martel*, vingt-six ans, fille du forgeron de Haut-Ferrand — celui dont la compagnie porte les pièces depuis le premier contrat. Elle redresse un capot cabossé en cent coups de marteau, parce qu'à Haut-Ferrand « on ne jette pas ce qui sonne encore ». Elle retourne la lanterne de Solenn et y trouve un marteau et une étoile : le poinçon de sa grand-mère, chaudronnière à Villechaudron. « On ne sait jamais qui on éclaire. » Et elle déplie à la fin le dessin d'une cloche, que le vieux frère Anselme veut couler une dernière fois à Sonnefeuille, pour la chapelle de Sainte-Lueur qui n'en a jamais eu — là où les enfants guettent le courrier en comptant les hublots. Elle pose le doigt sur le poids. « Ça ne tiendra jamais dans un seul avion. » C'est la porte du chapitre suivant.

**Dix pilotes, cinq femmes, cinq hommes.** La bible du monde annonçait encore que « les deux prochains seraient des hommes » : une phrase écrite avant l'arrivée de Garance et Hedda, et qui aurait rompu la parité si on l'avait suivie. Elle dit maintenant une femme et un homme à chaque palier. Le test le vérifie : il échouerait sinon.

**Un défaut trouvé en dessinant.** Pour vérifier la vignette de la forêt, j'ai regardé les trois autres affichées pour de vrai. Leurs arbres, leur herbe et leurs hydravions étaient **noirs** depuis la v0.2 : leurs couleurs n'étaient définies que pour la grande scène, et les vignettes vivent ailleurs. C'est corrigé ici — les arbres de la vallée sont verts, la Sterne de la Côte a retrouvé ses ailes. Sur la vignette de la forêt : des hêtres roux, la fumée des charbonniers, le clocher de Sonnefeuille au toit vert-de-gris, et le Pic posé dans la clairière.

Douze contrats, deux imprévus, trois opportunités, neuf pages d'album. L'aide en ligne présente maintenant les deux routes de la vallée, et pas seulement la Côte.

## Chapitre 35 — Deux avions pour un courrier (12 octobre 2026, 20 h 15)

Rosalie l'avait dit en posant le doigt sur le poids de sa cloche : « Ça ne tiendra jamais dans un seul avion. » Le jeu ne savait pas faire voler deux avions ensemble. Il sait, maintenant.

**Le convoi.** Quand l'avion choisi ne porte pas tous les sacs, le formulaire d'expédition ouvre un second équipage — un avion d'escorte, son pilote. Les deux décollent ensemble et volent au pas du plus lent ; on paie deux salaires et deux entretiens ; chaque moteur a son propre aléa, et un incident retarde tout le convoi ; chaque pilote se fatigue et s'attache pour lui-même. La récompense tombe une fois, à l'arrivée. À l'écran, c'est un seul vol, « Convoi · Garance Thuillier et Prosper Chickenman · Grive G-2 et Grive G-2 » ; dans les nouvelles, « sont rentrés », ou « sont rentrées » si ce sont deux pilotes femmes. Les vols à un seul avion tirent exactement les mêmes nombres qu'avant : les aléas du convoi sont tirés après les leurs.

**Le fret lourd.** Sept cartes portent la mention « Fret lourd · deux avions ». Le pressoir des Tilleuls, la veille de la récolte. La chaudière du dispensaire de Combe-aux-Rosées, qui a passé l'hiver à trois couvertures par lit. Le treuil de la capitainerie de Port-Sel. Et la chaîne de la cloche : la cire pour le moule, puis le bronze — trois sacs que seul un Pic peut poser dans le verger de Sonnefeuille, et un Pic n'en porte que deux —, puis la cloche elle-même, six sacs, deux hydravions, vers la chapelle de Sainte-Lueur qui n'en a jamais eu. Le bronze ne se tire qu'une fois Sonnefeuille livrée ; la cloche, qu'une fois le bronze coulé. Trois pages d'album : « Le premier convoi », « La coulée », « La cloche de Sainte-Lueur » — celle-là dit que les enfants ne comptent plus les hublots.

**Ce qu'on a trouvé en chemin, et qui n'était pas beau.** Pour être sûr que le fret lourd demandait vraiment deux avions, j'ai écrit un test qui vérifie, pour chaque contrat du jeu, qu'il existe un avion **achetable** capable de se poser à l'escale, d'y aller, et de porter tous les sacs. Il a échoué tout de suite, et pas sur le fret lourd :

- **Trois contrats étaient impossibles à livrer** depuis la v0.1 et la v0.2. *Sacs de farine* (trois sacs pour Moulin-Gris), *Sel pour les quais* (trois sacs pour Port-Sel), *Colis pour les pilotis* (trois sacs pour Marais-Blanc) : aucun avion qui se pose dans ces escales n'en porte plus de deux. Un joueur qui les tirait ne pouvait que les laisser passer. La farine et le sel étaient du fret lourd sans le savoir — le texte du sel disait déjà « Lourd » — : ils le sont devenus, et paient pour deux équipages. Les colis du marais redescendent à deux sacs.
- **Le Héron ne pouvait pas être acheté.** Aucune carte ne le vendait, depuis le premier jour. La grande piste, à 2 400 francs, ne servait donc à rien, et le contrat *Nouvelles du bout du monde* (trois sacs pour la Combe) n'était faisable qu'avec lui. Il est maintenant en vente aux Messageries de Pont-de-Brume, qui le remplacent par deux camions — « il lui faut la grande piste : c'est à ça qu'elle sert ». Une seconde Grive aussi, chez le meunier de Moulin-Gris, qui envoie désormais sa farine par camion et dont l'avion sent la farine pour toujours.

Le test reste : un contrat ordinaire se livre avec un seul avion achetable, un fret lourd avec deux, et aucun avion du jeu n'est hors d'atteinte.

**Et une faute de français, vieille aussi.** « Prosper est rentré de Les Tilleuls. » Les nouvelles et le livre de bord disent maintenant « des Tilleuls », « au Hêtre-Roi », « aux Œillets », « départ pour les Scieries », et même l'article qu'on dit sans l'écrire : « de l'Île-du-Bout », « au Phare de Brisant ». L'anglais n'avait rien à contracter.

## Chapitre 36 — Les saisons (12 octobre 2026, 20 h 30)

Le document de conception avait mis un repère sur la v0.3 : *la première année de jeu*. Une année, il faut qu'elle passe.

**Les saisons d'Altiplume sont celles du calendrier.** Pas un cycle accéléré, pas une saison par semaine : quand il neige chez le joueur, il neige sur la Croisette. Les bornes sont fixes et en temps universel — 20 mars, 21 juin, 23 septembre, 21 décembre — pour que deux joueurs au même instant vivent la même saison, où qu'ils soient. Aujourd'hui, c'est l'automne, jusqu'au 20 décembre : c'est écrit sous le nom de la compagnie, avec ce que la saison change.

**Une règle par saison, et aucune qui punisse.** C'était la contrainte : le jeu a pour loi que l'absence n'est jamais punie, et une saison est une absence de plusieurs mois pour quelqu'un qui ne joue qu'en été. Donc pas de route fermée par la neige, pas de contrat qui pourrit à l'automne. Le printemps remplit les sacs de semences (ils se tirent deux fois plus souvent) ; l'été chasse la brume et le vent de mer (deux fois moins de retards) ; l'automne ramène la brume (une fois et demie plus) ; l'hiver rallonge les vols de 15 % — mais le courrier y vaut plus cher, et une **prime de froid** de 20 % s'ajoute à chaque tarif. L'hiver est plus lent, et il paie mieux : on n'y perd rien.

**Huit contrats et quatre imprévus de saison**, qui ne viennent qu'en leur temps. Les greffons des vergers des Tilleuls, avant que la sève monte ; les clochettes blanches qu'on s'offre à Lanterne-du-Val le premier matin de mai. La glace des poissonniers de Port-Sel en pleine chaleur ; les cartes postales des visiteurs de Sainte-Ambre — « la chapelle, la plage, la chapelle encore ». Les bondes du cidre nouveau, avant que tout déborde ; les sacs des châtaignes de la crête. Les étrennes de Pont-de-Brume, des oranges, des mitaines, un almanach ; le sirop et les couvertures pour la Combe, « qui a encore froid malgré la chaudière » — celle que le fret lourd a livrée au chapitre précédent. Et les giboulées, l'orage de chaleur, les feuilles mouillées sur la piste, la neige qu'on fait déblayer par le cantonnier pour un bol de soupe.

**La scène change de saison.** Les couleurs de la terre et des arbres suivent la saison ; le ciel, lui, reste celui de l'heure. Au printemps, des pétales sur les deux feuillus du premier plan. L'été, des verts profonds et des boutons d'or dans le pré. À l'automne, les feuillus roussissent — les sapins restent des sapins — et des feuilles tombent. L'hiver, la neige couvre le sol, la piste et la pente du toit du hangar, les branches sont givrées, il neige ; et la nuit, la neige bleuit au lieu de virer au vert. Ceux qui ont demandé à réduire les animations voient tout cela immobile.

**Une année, dans l'album.** La première livraison de chaque saison colle sa page — Premier printemps, Premier été, Premier automne, Premier hiver — et les quatre réunies en collent une cinquième : « Une année. Quatre saisons sur la piste de la Croisette. Le chemin vous connaît. » Elle ne peut pas s'obtenir en moins d'un an, et elle ne demande rien d'autre que de revenir.

## Chapitre 37 — L'aérodrome qui grandit (12 octobre 2026, 20 h 45)

Le 11 octobre, en regardant la scène pour la première fois, Régis avait demandé « un hangar d'aéroport plus appealing… mais j'imagine que ça évolue aussi dans le jeu, n'est-ce pas ? » La réponse honnête était : assez peu. Restaurer le hangar changeait la couleur d'une porte. Acheter un Héron ne changeait rien du tout : il n'y avait qu'un seul avion dessiné sur le terrain, toujours le même biplan.

**Le hangar change de silhouette à chaque niveau.** Au premier, c'est bien la « porte de travers » que promet son nom : de la rouille sur la tôle, la porte qui bâille au milieu, une planche qui manque au bardage. Au deuxième, un appentis s'adosse au mur gauche, et derrière sa fenêtre on devine l'établi. Au troisième, l'atelier pousse à droite, un toit en dents de scie et des verrières, et sa cheminée fume. La peinture du hangar, quand on l'achète, repeint aussi ce qui a poussé.

**La tour, enfin.** Le document de conception la promettait depuis la v0.1 — « la tour, le café et l'atelier viendront ». La voilà, en trois âges : un poteau avec un fanion, puis la vigie sur ses quatre pieds, avec son échelle et sa croix de Saint-André, puis une vraie tour, une pièce vitrée en haut et un feu qui tourne. Elle ne fait pas voler plus loin ; elle fait voler plus tranquille. La vigie regarde le ciel avant chaque départ, et la brume et le vent de mer surprennent un quart moins souvent ; le feu ramène les vols de nuit, et ils cassent un tiers moins. Au crépuscule et la nuit, on le voit clignoter.

**Chaque avion a sa place, et son dessin.** Cinq nouveaux dessins rejoignent le biplan : le Martinet, monoplan bas et rouge ; le Héron, trimoteur en tôle ondulée, plus long que tout le reste ; le Pic, aile haute et pneus ballons ; la Sterne au ponton ; le Goéland et sa coque blanche, amarré au second ponton qui flotte au milieu de la rivière. Trois places au parking, deux à l'eau : la flotte entière tient dans le paysage. Un avion en vol laisse sa place vide, et on sait d'un coup d'œil qui est à la maison.

**Deux décorations de plus**, qui répondent à ce qui existe déjà. Le pigeonnier sur son mât, entre la manche à air et le drapeau : les pigeons voyageurs portaient le courrier avant les avions, ils ont droit à une retraite. Et deux ruches au pied du pommier — « la cire de Lanterne-du-Val a fait une cloche ; celle-ci fera des bougies pour le café ».

Une migration donne son poteau à chaque compagnie déjà fondée. Le script d'aperçu de la scène montre maintenant les trois âges de l'aérodrome — premier jour, milieu, tout restauré — en plus des heures et des saisons : dix-sept images à regarder avant de pousser.

Les quatre chapitres de « A » sont écrits : la Forêt de Cuivre, le fret lourd, les saisons, l'aérodrome qui grandit. Ils tiennent ensemble par leurs fils — le cuivre des lanternes, le sac de Bastien, la cloche de Sainte-Lueur, la chaudière de la Combe qui a encore froid l'hiver, les ruches au pied du pommier — et c'est à eux qu'il faudra répondre en écrivant la suite.

## Chapitre 38 — Le crible (12 octobre 2026, 21 h 50)

« Dis-moi si Trivy et OWASP ZAP, avec Semgrep et Socket/OSV, sont gratuits, et si oui comment mettre en œuvre chacun. Ne fais pas sans mon go. »

Puis le go : « Fais PR par PR, et donne-moi la séquence exacte. »

La veille, l'interlude sécurité avait regardé le site **de l'extérieur** : ce que Mozilla, Qualys ou Google voient d'altiplume.com, trois A+. Il restait l'autre moitié, celle qu'aucune plateforme publique ne voit : ce qu'il y a **dans** l'image, ce que répond l'application quand on la visite page par page, ce que dit le code, ce que font les paquets qu'on installe. Quatre outils, tous gratuits, une PR chacun.

**Le premier piège était dans les outils eux-mêmes.** En mars 2026, l'action GitHub officielle de Trivy a été compromise : ses étiquettes de version ont été réécrites pour pointer vers du code piégé, et le binaire 0.69.4 l'était aussi. Quiconque écrivait `uses: aquasecurity/trivy-action@v0` dans son workflow, comme le proposait la documentation, a donné ses secrets à un inconnu en croyant se protéger. Le dépôt avait déjà une règle — aucune action tierce, seulement celles de GitHub, épinglées par empreinte —, elle a pris tout son sens. Les quatre contrôleurs sont donc pris de la même façon : le **binaire officiel**, téléchargé depuis la release du projet, dans **une version qui a quelques semaines de recul** — Opengrep v1.30.1 et pas la v1.30.2 sortie cinq jours plus tôt —, et son **empreinte SHA-256** inscrite dans le workflow, vérifiée à chaque exécution avant de lancer quoi que ce soit. Pour Trivy, l'empreinte vient du fichier de sommes de la release ; pour ZAP, du manifeste que le projet publie ; pour Opengrep, j'ai vérifié la signature Sigstore à la main avant d'épingler : signée par le workflow de publication du dépôt opengrep, et personne d'autre.

**Trivy** passe maintenant l'image au crible avant chaque publication. L'ordre a changé : l'image est construite, chargée, démarrée, scannée, et **seulement ensuite** publiée. Une faille critique dont le correctif existe déjà bloque la publication — le NAS garde alors la version d'avant, ce qui vaut mieux qu'une version trouée. Le lundi, l'image en service est rescannée : une faille découverte après coup ne doit pas attendre la prochaine mise à jour pour se voir. Au passage, l'image a perdu npm, npx, corepack et yarn. Elle n'a rien à installer ; c'est souvent dans npm que Trivy trouve ses failles ; et un outil absent ne peut pas être détourné. La CI vérifie qu'ils ne reviennent pas.

**OWASP ZAP** visite l'aérodrome comme un joueur curieux, mais un joueur qui lit chaque en-tête. En passif seulement : il ne lance aucune attaque et n'envoie aucun formulaire — on ne bombarde pas son propre aérodrome, même en essai. La CI démarre l'image exactement comme sur le NAS, en production, en lecture seule, et ZAP en fait le tour : cinquante-huit adresses, l'API comprise. Avant d'ouvrir la PR, je l'ai lancé ici. **Aucune alerte haute ; aucune moyenne réelle.** Il en a levé une moyenne quand même : « absence de jeton anti-CSRF » sur la page de l'aérodrome. C'était un `<form method="dialog">`, qui ferme une boîte de dialogue et n'envoie rien à personne ; les vrais envois passent par l'API, qui n'accepte que du JSON avec un cookie `SameSite=Lax`. Et une faible : « message d'erreur de débogage » dans les conditions d'utilisation — la phrase anglaise « still under construction », qui dit que le jeu est en essai. Les deux sont déclarées faux positifs dans le plan de ZAP, chacune avec sa raison. Puis la contre-épreuve : sans ces deux déclarations, le contrôle échoue. Un garde-fou qui ne mord jamais ne garde rien.

**Opengrep** relit le code. C'est la reprise libre de Semgrep, née quand Semgrep a refermé une partie de son moteur ; mêmes règles, même syntaxe. Le premier passage a rendu **cent cinquante trouvailles**. Cent cinq venaient de règles écrites pour d'autres projets : jQuery, parce que le client appelle `$` son raccourci vers `getElementById` ; React et i18next, parce que le dictionnaire maison a des clés qui leur ressemblent ; `replaceAll`, « non portable » pour des navigateurs qui n'existent plus. Ces trois familles sont écartées dans le workflow, chacune avec sa raison écrite à côté. Deux trouvailles étaient de niveau ERROR, et c'était une seule ligne : l'unique endroit où le client écrit du HTML. Il vient du dictionnaire embarqué, jamais du réseau, et passe par la politique Trusted Types du site ; c'est voulu, et c'est maintenant annoté, avec la raison. Les vingt-huit restantes ont été lues une par une, et aucune n'est réelle. **Zéro ERROR.** Ce sera la règle à chaque PR.

**Socket** regarde les dépendances autrement que `npm audit`. L'audit demande « ce paquet a-t-il une faille connue ? » ; Socket demande « que fait-il ? » — un script lancé à l'installation, un accès réseau inattendu, du code obscurci, un mainteneur qui vient de changer, un nom qui imite un paquet connu. C'est la forme qu'ont prise les attaques de ces derniers mois, et un audit de failles ne la voit pas. Socket est le seul des quatre qui demandait une main humaine : une application GitHub s'installe par le propriétaire du dépôt, pas par un agent. Régis l'a installée sur ce seul dépôt ; le premier rapport est arrivé, vert, dans la minute qui a suivi la fusion.

**Une chose n'a pas pu être mesurée ici**, et il faut le dire : la base de failles de Trivy n'est pas joignable depuis la machine où j'écris. Le premier vrai passage de Trivy a donc eu lieu dans la CI de sa propre PR. Il est vert : aucune faille critique corrigeable. Le détail des failles élevées vit dans le résumé du job, pas dans ce journal.

Les quatre PR fusionnées, tout est vert sur `main`, et le Release qui a publié l'aérodrome qui grandit est passé par Trivy avant de pousser l'image. La page [Sécurité](Securite) a maintenant deux moitiés : ce qui se voit du dehors, ce qui se contrôle du dedans. Et une troisième, plus courte chaque soir : ce qui n'a pas encore été fait — l'accessibilité, avec les personnes concernées ; Blacklight ; nmap depuis l'extérieur ; Have I Been Pwned ; OSV-Scanner ; ZAP contre le site public ; une passkey sur un vrai appareil.

## Chapitre 39 — L'escorte fantôme (12 octobre 2026, 23 h 15)

« Je lance mon expédition habituelle, mais la page montre le placeholder de l'avion d'escorte… qui n'est pas débloqué pour moi. »

Avec la capture. La Grive partie sur la ligne régulière, Régis rouvre *Expédier* sur cette même ligne régulière — un sac, vingt-cinq francs, le trajet le plus modeste du jeu — et le formulaire lui propose **« Le convoi : un second avion vole avec le premier »**, un *Avion d'escorte*, *Son pilote*, deux listes vides, et par-dessus : « Trop lourd pour cet avion ». Pour un sac. À quelqu'un qui n'a qu'un seul avion.

**La cause tient en une ligne**, écrite la veille au soir avec le fret lourd :

```ts
const needsWing = () => (modelOf(planeSelect.value)?.capacity ?? 0) < bags;
```

Quand le seul avion de la compagnie est en l'air, la liste *Avion* n'a plus une seule option qu'on puisse choisir : sa valeur est vide, la recherche du modèle ne trouve rien, la capacité retombe sur zéro — et zéro est plus petit qu'un sac. **Une flotte absente était lue comme une flotte trop petite.** Ce `?? 0`, qui a l'air d'une précaution, affirmait quelque chose de faux : il n'y a pas d'avion, donc l'avion est minuscule.

Le serveur, lui, n'a jamais rien accepté de tel, et sa règle était juste depuis le début. Les deux cent dix tests passaient. C'est un défaut que seul un joueur pouvait trouver, parce qu'il ne casse rien : il **raconte une fausse histoire**. Il montre une mécanique de fret lourd à quelqu'un qui ne l'a pas encore rencontrée, et il la lui montre au pire moment — celui où il ne peut rien faire partir, et où il cherche pourquoi.

**Le formulaire sait maintenant distinguer trois situations**, et une petite fonction à part s'en charge, pour qu'on puisse l'éprouver sans navigateur : *rien à montrer* (aucun avion choisi, ou un seul suffit) ; *la demande d'escorte* (la charge déborde **et** un second équipage est libre au sol) ; *l'explication seule* (la charge déborde, mais il n'y a personne pour accompagner — alors le message, sans les deux listes vides qui promettent un choix qui n'existe pas).

**Et le bouton dit pourquoi il ne part pas.** Avant, « Envoyer » restait ouvert, le clic filait au serveur et revenait en erreur. Il se ferme désormais, avec la raison : *« Aucun avion au sol : ils sont tous en vol. Le courrier attendra qu'un moteur refroidisse. »* — ou, si ce sont les pilotes qui manquent, qu'ils volent ou qu'ils se reposent. Une attente expliquée n'est plus la même attente ; c'était déjà la leçon du chapitre 31.

Quatre tests tiennent la fonction, et le parcours de bout en bout du courrier rouvre maintenant la ligne régulière pendant que la Grive vole, dans un vrai Chromium : convoi caché, bouton fermé, message attendu. Puis la contre-épreuve, comme pour les faux positifs de ZAP la veille : l'ancien calcul remis en place, le parcours échoue — *échec : convoi caché quand on n'a qu'un avion*. Un garde-fou dont on n'a pas vu les dents n'en a peut-être pas.


## Chapitre 40 — La cohérence (13 octobre 2026, 0 h 30 – 10 h)

« Je suis loin de pouvoir faire une mission à trois sacs… ma carte va rester bloquée, éternellement ? Pas de cohérence. Rétablis la cohérence du jeu, merci. »

Huit captures, et trois défauts qui se tenaient par la main. Une carte de trois sacs pour la Combe, tirée chez quelqu'un qui n'a qu'une Grive à deux sacs : **le jeu proposait un contrat que la flotte ne pouvait pas porter**, et la carte restait en main, prenant la place d'une autre, jour après jour. Un vol affiché « en route » avec un message contraire et sans barre de progression : l'écran, refusé par le serveur, ne se remettait pas d'aplomb. Et le catalogue du monde, servi du cache pendant une heure, montrait un aérodrome qui n'existait plus.

Trois PR. Le tirage connaît désormais la flotte : un contrat qu'aucun avion du hangar ne peut porter n'est plus tiré, et celui qui dort en main sans avion pour lui repart par la route au tirage suivant — *« quelqu'un d'autre l'a porté »*, comme le reste. L'écran, quand le serveur refuse, redemande l'état au lieu de garder sa version ; et il le fait aussi quand rien ne vole. Le catalogue, enfin, n'est plus jamais servi sans demander : `no-cache` et une empreinte par langue.

Puis, au réveil : « Pourquoi on n'a pas de bouton pour sortir dans la session du jeu ? » Il n'y en avait qu'un, au fond de *Mon compte*. Un téléphone se prête, un PC se partage : **« Sortir » rejoint l'en-tête**, sur toutes les pages du jeu.

## Chapitre 41 — Ce que prouve une mesure (13 octobre 2026, 18 h 35)

« Qu'est-ce qui peut se faire dans cette liste à partir de GitHub seul, ou avec un minimum d'action extérieure ? Chacun sert à prouver quoi ? »

La bonne question n'était pas *quels outils*, mais *que prouve chacun*. Reprise ligne à ligne, la liste des mesures « non effectuées » s'est triée d'elle-même.

**OSV-Scanner est écarté**, et la raison est écrite : il lit les mêmes avis que `npm audit`, Trivy relit déjà l'image, Socket regarde ce que font les paquets. Un quatrième lecteur des mêmes avis ne trouverait rien de plus et ferait échouer la CI deux fois pour la même cause. Savoir ne pas ajouter un outil fait partie de la sécurité.

**Blacklight**, l'inspecteur de The Markup, a visité le site : zéro traqueur, zéro cookie tiers, aucun pistage par empreinte, aucun enregistreur de session, aucune capture de frappe, aucun pixel. L'argument « pas de publicité » vérifié par un tiers. Et parce qu'une photo ne vaut pas un film, **le même contrôle tourne désormais à chaque PR** : un vrai navigateur parcourt le jeu, s'inscrit, fonde sa compagnie, et échoue sur la moindre requête vers un autre domaine. Contre-épreuve : un pixel injecté, le test tombe.

**ZAP visite aussi le site en ligne**, tel que le visiteur le reçoit après Cloudflare. **La passkey** fonctionnait depuis le premier jour sur Windows et iPhone : consigné.

Et une erreur, dite le jour même. La première consigne pour le balayage de ports disait : un téléphone en 4G. Or l'outil teste *l'adresse d'où l'on vient* — en 4G, celle de l'opérateur. Il aurait conclu « rien d'ouvert » sur la mauvaise cible. **Une mesure fausse qui dit « tout va bien » est pire qu'une mesure absente.** La consigne est corrigée : le test se lance depuis la maison.

## Chapitre 42 — Deux ports (13 octobre 2026, 19 h 15)

Le test UPnP d'abord : aucune réponse aux sondes. Puis le balayage, depuis la maison, vu de l'extérieur : sur 1 056 ports, 1 054 invisibles. **Et deux ouverts : le 80 et le 443.**

La conception dit « aucun port ouvert » depuis le premier jour. Le tunnel Cloudflare n'en a besoin d'aucun ; le jeu sort, rien n'entre. Mais quelque chose répondait. Une visite de l'adresse dans un navigateur : une page « 403 » du serveur web du NAS. Ni page de connexion, ni contenu, rien qui ressemble à une intrusion — seulement une porte entrouverte, reconnaissable de n'importe où, et qui n'avait rien à faire là : une vieille redirection, sans doute posée pour un certificat que le tunnel a rendu inutile.

Retirée côté NAS, vérifiée côté box. Deux heures plus tard, le même balayage : **zéro ouvert, 1 056 invisibles, aucune réponse au ping, `TruStealth: PASSED`**. Puis les ports que la grille ne couvre pas — l'accès au NAS, un service de médias : invisibles aussi. Et pas d'IPv6 sur la box.

L'adresse de la maison n'est écrite nulle part : ni dans le dépôt, ni dans une PR, ni dans une capture. Le constat n'a été publié qu'une fois la porte fermée. Et le manifeste porte maintenant une phrase qu'il n'avait pas : *« Aucun port ouvert » était une intention, pas une mesure, et la mesure l'a démentie.* Le balayage se refait après tout changement de la box ou du NAS, et une fois par trimestre.

## Chapitre 43 — Le joueur (13 octobre 2026, 23 h 25 – 14 octobre, 0 h 50)

La sécurité faite, Régis a joué. Une heure, sur le vrai compte, à la vraie vitesse. Et le jeu a appris ce que ses tests ne pouvaient pas lui dire : **ce que le joueur comprend.**

« Je n'ai pas de bouton de déconnexion, hormis dans Mon compte. » Le bouton était dans le code depuis le matin. Mais `/v1/version` répondait la révision d'avant : le NAS servait l'image de la veille. **L'étiquette de version du deuxième jour a tranché en trente secondes**, sans ouvrir une ligne de code. Un rafraîchissement, et « Sortir » était là.

Puis une capture dézoomée, exprès, pour montrer la descente : l'album de cachets demandait **quatre écrans de défilement** — quarante-six pages en trois colonnes étroites, chaque rangée étirée à la hauteur de la plus longue légende, dans une colonne quatre fois plus haute que sa voisine. L'album est devenu une grille de timbres de même taille sur toute la largeur ; la page a perdu la moitié de sa hauteur, l'album tient dans un écran, et un test de mise en page le garde à chaque PR.

« Je suis sûr qu'il y a un piège, et au-delà des cartes, je suis bloqué. » Cinq escales des Vallées sur six ; la sixième, Lanterne-du-Val, ne venait pas. Aucun verrou dans le code : seulement le tirage, 24 % de chances par jour, et un joueur sur dix attendant plus de neuf jours sans rien pouvoir y faire. **L'escale attend sa lettre** : parmi les contrats, ceux d'une escale jamais livrée pèsent trois fois plus. Ni plus ni moins d'imprévus ; neuf joueurs sur dix servis en quatre jours.

« J'ai dix cachets, et la route reste grisée. » La route demandait aussi la page « Toute la vallée », et ne le disait qu'en gris. Chaque route fermée affiche maintenant ses deux conditions, chacune avec son état, et nomme les escales qui restent à livrer. Et le « dix » ? C'était le nombre de pages : dix pages qui valaient treize cachets, sans que l'écran le dise. **Chaque page porte désormais sa valeur en coin**, l'album fait le compte, et un test vérifie que la somme des pages égale toujours la caisse — la règle n'avait, jusque-là, aucun test.

« Est-ce que je gagnerai plus en débloquant la suite ? » Mesuré, pas promis : par contrat, bien plus ; par heure de vol, à peu près pareil. Ce qui fait grandir une séance, c'est la flotte — environ 125 francs l'heure avec la Grive seule, 210 avec un Pic, 460 avec quatre avions. C'est écrit dans la Conception, avec le tableau.

## Chapitre 44 — Les coulisses (14 octobre 2026, 0 h 50 – 1 h 30)

« Pourquoi ZAP est "skippé" sur les étapes de check des PR ? » Parce que la visite du site public vivait dans le même fichier que celle de l'image, et qu'elle ne doit jamais tourner pendant une PR. Voulu, mais inquiétant : elle a rejoint le contrôle du lundi, et la ligne « ignoré » a disparu.

Un passage manuel de ZAP rendait zéro alerte, mais un mot : *« ZAP errors logged — 2 »*. Lesquelles ? Le journal restait sur le runner. Le même ZAP, la même empreinte, le même plan, relancés en local, ont répondu : ses propres mises à jour, coupées exprès, et un profil Firefox dont il ne se sert pas. Rien sur le site. Mais on ne refera pas l'enquête : le journal part désormais avec les rapports, et ses erreurs s'affichent dans le résumé.

Dans la marge du même job, une note de GitHub : *ubuntu-latest passera à Ubuntu 26 le 19 octobre*. Les parcours s'appuient sur le Chrome de la machine, ZAP sur son Java. Les quinze jobs sont figés sur `ubuntu-24.04` ; on changera exprès, dans une PR.

Et la dernière capture de la nuit, depuis l'iPhone : « Quand je suis en français, depuis une langue d'origine anglaise, j'ai des mélanges. » Les titres en français ; « The regular run → Mistbridge », « Restore · 1500 F », « Weather Sense » en anglais. Le bouton de langue ne retraduisait que les libellés fixes ; le monde restait dans la langue du chargement. **Et les tests ne le voyaient pas, parce que ceux qui changeaient de langue rechargeaient eux-mêmes la page juste après** — ils contournaient le défaut sans le dire. L'aérodrome se recharge maintenant seul, dans la nouvelle langue ; un parcours bascule dans les deux sens et vérifie qu'il ne reste pas un mot de l'autre. Contre-épreuve : sur l'ancien code, il échoue.

Vingt et une PR dans la journée, de la #68 à la #88. Le troisième jour se ferme sur une leçon qui vaut pour les trois : un test qui contourne un défaut est pire qu'un test absent, et une garantie qu'on ne mesure pas n'est qu'une intention.
