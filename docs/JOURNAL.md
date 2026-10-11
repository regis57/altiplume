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
