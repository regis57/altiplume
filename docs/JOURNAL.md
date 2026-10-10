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

## Chapitre 2 — Le terrain avant la maison (10 octobre 2026, le soir)

Le domaine acheté, le dépôt créé, j'ai passé une heure à cliquer des cases de sécurité avant d'écrire la moindre ligne de jeu. C'est contre-intuitif, et c'était la bonne décision.

**Première leçon : le gratuit était du côté où je ne regardais pas.** Je m'apprêtais à payer GitHub Pro pour avoir des branches protégées sur un dépôt privé. Or sur le plan gratuit, les branches protégées, l'analyse de code, la détection de secrets et les minutes d'intégration continue ne sont offertes que sur les dépôts **publics**. Passer public dès le premier jour m'a tout donné pour zéro euro — et comme le code est sous AGPL et que je voulais publier ce journal, c'était de toute façon la destination.

**Deuxième leçon : un réglage qui a l'air fait ne l'est pas forcément.** J'ai coché le secret scanning en croyant avoir activé la protection anti-poussée. Ce sont deux choses différentes : l'une m'alerte *après* qu'une clé est partie sur un dépôt public, l'autre l'empêche *de partir*. La vérification par l'API l'a montré, pas la lecture de la page. Et quand le bouton affiche « Disable », cela signifie que la protection est active — le bouton indique l'action possible, pas l'état.

Trois autres réglages n'étaient pas passés non plus : la résolution des conversations, les méthodes de fusion, le signalement privé de vulnérabilité. **Relire l'interface ne suffit pas ; il faut interroger la source.**

**Troisième leçon, la plus intéressante.** Deux cases de la page des règles portent des noms rassurants et m'auraient bloqué. « Restrict updates » gèle la branche, y compris pour mes propres fusions. Et exiger une approbation est un piège pour quelqu'un qui travaille seul : GitHub interdit d'approuver sa propre pull request. Travaillant sans relecteur humain, ma sécurité ne peut pas venir d'un second regard — elle doit venir de tests qui, eux, ne se fatiguent pas.

D'où la chaîne de cinq vérifications : style, types, tests, failles connues, licences. Rien n'entre dans `main` sans qu'elles passent.

**Ce qui est déjà en place.** Les actions sont épinglées par empreinte, pas par étiquette : une étiquette se déplace, une empreinte non. C'est précisément par là que plusieurs projets se sont fait compromettre ces dernières années.

Et le vérificateur de licences a servi dès sa première exécution : il a attrapé une dépendance sous MPL-2.0 arrivée en transitive. Plutôt que d'élargir la liste à l'aveugle, je l'ai affiné pour distinguer production et développement — le risque juridique naît de la distribution, et un outil de compilation ne part jamais chez les joueurs. Au passage, l'audit a révélé deux failles critiques dans la bibliothèque de tests ; une montée de version les a effacées.

**Ce qui tient déjà debout, côté jeu.** Deux morceaux de code, petits et bien testés, qui portent les décisions de conception.

Le premier calcule l'état d'un vol sans aucune tâche de fond : un vol parti à telle heure pour telle durée est arrivé si l'heure actuelle a dépassé la somme. Le serveur ne consomme rien quand personne ne joue, ce qui est la condition pour tenir sur mon NAS. Un test vérifie noir sur blanc qu'un vol reste arrivé dix ans plus tard : la promesse « une absence ne coûte jamais rien » est devenue une assertion exécutable, pas une intention.

Le second tire les cartes du jour de façon déterministe, à partir du joueur, du jour et de l'usage. Reproductible, vérifiable, et hors de portée du navigateur.

Trente-sept tests, tous verts. Pas encore un gramme de jeu — mais un terrain sur lequel on peut construire sans avoir peur.
