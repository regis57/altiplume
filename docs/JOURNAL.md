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
