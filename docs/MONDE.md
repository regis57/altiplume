# Le monde d'Altiplume — bible du jeu

Ce document décrit ce qui existe dans le jeu : les lieux, les gens, les machines,
les cartes. Il est écrit en français ; chaque nom a un équivalent **natif** en
anglais, jamais une traduction littérale. Le contenu lui-même vit dans
`packages/server/src/world/`, testé, en deux langues.

## La Croisette

Tout commence au bout du **chemin de la Croisette**. C'est un chemin qui quitte le
village, longe les vergers et monte doucement jusqu'à une piste en herbe. À la
fourche, là où il se sépare de la route de Pont-de-Brume, une petite croix de pierre
penche un peu. Personne ne sait plus qui l'a posée. Les pilotes la touchent du doigt
avant de décoller — pas par superstition, dit Prosper, mais « pour dire au chemin
qu'on revient ».

L'aérodrome du joueur s'appelle **l'Aérodrome de la Croisette** (*Crosslet Field*),
adresse : *Chemin de la Croisette, Vallées de Brume* (*Crosslet Lane, Mistvale*).
On en hérite tel quel : une piste de deux cents pas, un hangar dont la porte ferme
mal, une Grive dans le hangar, et Prosper, qui était déjà là.

*Croisette* : en Lorraine comme en Provence, une « croisette » est une petite croix
— de chemin, de carrefour, de pierre. L'anglais *crosslet* désigne exactement cela
(c'est le mot des blasons pour une petite croix) et sonne comme un vrai nom de
chemin anglais. On n'a pas traduit *Cannes*.

## Les Vallées de Brume (*Mistvale*)

La région de départ. Douce, verte, une rivière lente, des vergers, et un brouillard
qui s'attarde jusqu'à dix heures. Six villages, de la plus proche à la plus lointaine.
Les distances sont en **lieues** (l'unité du monde) ; la Grive fait 12 lieues à
l'heure, soit cinq minutes la lieue.

| Village | Anglais | Lieues | Vol (Grive) | Piste | Particularité | Courrier |
|---|---|---|---|---|---|---|
| **Pont-de-Brume** | Mistbridge | 1 | 5 min | moyenne | La ville de marché, le bureau de poste, le journal | lettres, journaux, colis, plis urgents |
| **Les Tilleuls** | Lindenhollow | 1,6 | 8 min | courte | Un pré ; les vaches ont la priorité | semences, colis, lettres |
| **Moulin-Gris** | Greymill | 2,2 | 11 min | moyenne | Brume jusqu'à dix heures | lettres, colis, fragile |
| **Haut-Ferrand** | Ferncrest | 2,8 | 14 min | courte | Perché, forge, vent de crête | pièces, colis, lettres, urgent |
| **Lanterne-du-Val** | Lanternhollow | 3,6 | 18 min | moyenne | Lanternes le long de la piste, poste du soir | lettres d'amour, lettres, fragile |
| **Combe-aux-Rosées** | Dewcombe | 6 | 30 min | longue | Le bout de la vallée, dispensaire, route des plateaux | médicaments, urgent, lettres, colis |

Chaque première livraison vaut un **cachet** (1 pour les proches, 2 pour Haut-Ferrand
et Lanterne-du-Val, 3 pour la Combe). Les six villages livrés collent la page « Toute
la vallée », qui ouvre **deux routes** : la Côte de Saline et la Forêt de Cuivre.

## La Côte de Saline (*Saltshore*) — v0.2

Au bout de la vallée, la route descend vers la mer. Des marais salants découpés en
bassins — des *œillets* —, un port qui sent le goudron, un phare sur ses brisants et
deux îles qu'on n'atteint qu'en se posant sur l'eau. Le vent de mer est franc et
change d'avis ; les pistes sont courtes parce que la terre est chère.

**La route s'ouvre** contre **10 cachets**, une fois la page « Toute la vallée »
dans l'album : c'est le prix d'une carte marine et d'un bail sur un bout de quai. Les
cachets sont la monnaie de prestige ; ils servent à ça. La page « La route de la
Côte » s'ajoute à l'album. Tant que la route est fermée, aucune carte de la Côte ne
se tire : le courrier du jour reste celui de la vallée.

Six escales, de la plus proche à la plus lointaine. Les distances continuent celles
de la vallée (la Combe est à 6 lieues). Trois escales sont des plans d'eau.

| Escale | Anglais | Lieues | Vol (Sterne) | Piste | Particularité | Courrier |
|---|---|---|---|---|---|---|
| **Port-Sel** | Saltharbour | 7,5 | 32 min | moyenne | La capitainerie fait bureau de poste ; vent de mer | lettres, colis, sel, urgent |
| **Les Œillets** | Panbrook | 7,9 | 34 min | courte (une digue) | Le village des sauniers, des jardins sur les digues | sel, semences, lettres |
| **Marais-Blanc** | Whitefen | 9,6 | 41 min | moyenne | Un bourg sur pilotis, un dispensaire, la brume de sel | médicaments, lettres, sel, colis |
| **Anse-aux-Goémons** | Wrackcove | 10,5 | 45 min | **eau** | On se pose entre les bouées, une barque vient | coquillages, lettres, fragile |
| **Phare de Brisant** | Breaker Light | 11,5 | 49 min | **eau** | Deux gardiens ; la nuit, on vise la lumière | lettres, pièces, urgent |
| **Île Sainte-Ambre** | Amber Holm | 13 | 56 min | **eau** | L'île du large, sa chapelle, ses lettres attendues | lettres d'amour, lettres, fragile, coquillages |

Port-Sel et les Œillets sont à portée de la Grive ; Marais-Blanc demande le
Martinet ; les trois escales sur l'eau demandent la **Sterne**. Chaque première
livraison vaut 2 ou 3 cachets ; les six escales collent « Toute la Côte » (au large,
des lanternes — l'Archipel viendra). Le premier amerrissage colle « Sur l'eau ».

**Le vent de mer** (Port-Sel, l'Anse, Sainte-Ambre) ajoute un quart d'heure deux fois
sur cinq (une sur cinq avec « Météo dans la peau »). La brume de Marais-Blanc suit la
règle de Moulin-Gris. Le phare suit celle des lanternes : une arrivée après le
coucher du soleil vaut « Vol de nuit ». La nuit du jeu est celle du joueur : de 21 h à
6 h, à son heure (depuis le 14/10 ; avant, 20 h à 6 h UTC pour tout le monde).

Deux imprévus propres à la Côte (un grain annoncé par le télégraphe, les basses eaux au ponton) et
deux opportunités (une Sterne des douanes réformée à Port-Sel, la carte marine du
gardien) ne se tirent qu'une fois la route ouverte.

## L'Archipel des Lanternes (*Lantern Isles*) — v0.2

Six îles basses au large de la Côte, une lanterne au bout de chaque ponton. La poste
y arrive le soir : le jour appartient aux bateaux, la nuit au courrier. **Tout se
pose sur l'eau**, et quatre îles sur six se volent de nuit — c'est la région du trait
Nocturne. **La route s'ouvre** contre **15 cachets**, une fois « Toute la Côte » dans
l'album.

| Île | Anglais | Lieues | Vol (Goéland) | Particularité | Courrier |
|---|---|---|---|---|---|
| **Île-aux-Fanaux** | Beacon Holm | 14 | 52 min | Douze lanternes, une par famille ; nuit | lettres, colis, lettres d'amour |
| **Grand-Récif** | Long Reef | 15 | 56 min | Un lagon, à quitter avant la marée basse ; vent | coquillages, lettres, pièces |
| **Sainte-Lueur** | Glimmerkirk | 16 | 60 min | La chapelle, l'école, les enfants sur le ponton ; nuit | lettres, journaux, colis, médicaments |
| **Le Rocher-Noir** | Blackstack | 17 | 64 min | Trois guetteurs, un chien, un sémaphore ; vent | pièces, journaux, lettres, urgent |
| **Anse-des-Lanternes** | Lanterncove | 18 | 68 min | Le bourg, la fabrique de lanternes, la poste de minuit ; nuit | lettres, colis, fragile, urgent |
| **Île-du-Bout** | Lastholm | 19 | 71 min | La dernière île ; après, le Grand Blanc ; nuit | lettres, lettres d'amour, fragile |

La Sterne n'atteint les trois premières qu'avec un pilote de Longues routes (14 × 1,2) ;
le **Goéland** atteint tout. Chaque première livraison vaut 3 cachets ; les six îles
collent « Tout l'Archipel ». Deux imprévus (la lanterne du ponton fendue, l'invitation des îles),
une opportunité (un pilote qui se présente au hangar), et le Goéland, vendu à Port-Sel une fois la
Côte ouverte.

## La Forêt de Cuivre (*Copperwood*) — v0.3

Derrière la crête de Haut-Ferrand commence une hêtraie si vieille que ses feuilles
restent aux branches tout l'hiver, couleur de cuivre (les botanistes disent
*marcescence* ; les gens de la forêt disent que les arbres gardent leur monnaie).
Sous elle, une mine : **c'est le cuivre de la forêt que la fabrique de
l'Anse-des-Lanternes martèle en lanternes**, et qui revient éclairer les îles et
jusqu'au ponton de la Croisette. Les deux lanternes de cuivre du jeu, celle d'Ysé et
celle de Solenn, sont nées ici.

**La route s'ouvre** contre **12 cachets**, une fois « Toute la vallée » dans
l'album — comme la Côte, sans l'attendre : **deux routes partent de la vallée**, la
mer ou les arbres, et le joueur choisit par où il grandit. La page « La route de la
forêt » s'ajoute à l'album.

| Escale | Anglais | Lieues | Vol (Pic) | Piste | Particularité | Courrier |
|---|---|---|---|---|---|---|
| **Les Charbonnières** | Charwood | 7 | 32 min | courte | Le camp des charbonniers, les meules qui fument ; sous-bois | lettres, colis, pièces |
| **Villechaudron** | Kettleby | 8 | 37 min | moyenne | Les cent marteaux des chaudronniers, le bureau de poste de la forêt | cuivre, lettres, colis, urgent |
| **Les Scieries** | Millhurst | 9 | 42 min | courte | Trois scieries, le parc à grumes ; le père de Solenn y a réparé toutes les roues ; sous-bois | pièces, lettres, colis |
| **Sonnefeuille** | Ringleaf | 10 | 46 min | **clairière** | L'abbaye, la fonderie de cloches ; les moines sonnent pour guider l'approche ; sous-bois | lettres, fragile, semences |
| **Vert-de-Gris** | Verdigris | 11 | 51 min | **clairière** | La vieille mine ; tout y est vert ; sous-bois | pièces, médicaments, lettres, cuivre |
| **Le Hêtre-Roi** | Kingbeech | 12 | 55 min | **clairière** | L'arbre du cœur de la forêt, le creux où le facteur des bois relevait le courrier ; nuit | lettres, lettres d'amour, journaux |

**La clairière** est une piste plus courte qu'une piste courte. Seul le **Pic** s'y
pose ; lui, en revanche, se pose partout sur la terre et décolle de la Croisette
sans qu'on ait roulé la piste. Les Charbonnières et Villechaudron sont à portée de la
Grive ; les Scieries aussi, avec un pilote de Longues routes (8 × 1,2 = 9,6). Le
premier atterrissage en clairière colle « Dans la clairière » ; les six escales,
« Toute la forêt ».

**L'humidité des sous-bois** (les Charbonnières, les Scieries, Sonnefeuille,
Vert-de-Gris) multiplie le risque d'incident par **1,5** : les moteurs y toussent.
Un pilote aux Mains d'or compense en partie. Le Hêtre-Roi suit la règle des lanternes :
une arrivée après le coucher du soleil vaut « Vol de nuit ».

Douze contrats, deux imprévus (un hêtre tombé du chargement de bois au bout de la piste, l'humidité qui
fait tousser le moteur) et trois opportunités (le Pic du receveur de Villechaudron,
le relevé des clairières du garde, une lettre de candidature) ne se tirent qu'une fois
la route ouverte. Deux contrats préparent la suite : la cire pour le moule de
Sonnefeuille, et une lettre pour le creux du Hêtre-Roi.

## Le fret lourd — v0.3

Certains courriers pèsent plus qu'aucun avion capable de se poser là-bas n'en
porte : ils partent en **convoi**, à deux avions et deux pilotes. Le joueur choisit
un premier avion ; s'il ne porte pas tous les sacs, le formulaire ouvre un second
équipage (avion d'escorte et pilote). Les deux décollent ensemble et volent au pas
du plus lent ; on paie les deux salaires et les deux entretiens ; chaque avion a son
propre aléa, et un incident retarde tout le convoi ; chaque pilote se fatigue et gagne
en affinité pour lui-même. La récompense est versée une fois, à l'arrivée de la tête.
Le premier convoi colle « Le premier convoi ».

| Contrat | Escale | Sacs | Avions qui s'y posent | Récompense |
|---|---|---|---|---|
| Sacs de farine | Moulin-Gris | 3 | Grive, Martinet, Pic (2 au plus) | 140 F + 25 |
| Le pressoir des Tilleuls | Les Tilleuls | 3 | Grive, Pic (2) | 150 F + 30 |
| La chaudière du dispensaire | Combe-aux-Rosées | 6 | dont le Héron (5) | 420 F + 60 |
| Sel pour les quais | Port-Sel | 3 | Grive, Martinet, Pic (2) | 330 F + 40 |
| Le treuil de la capitainerie | Port-Sel | 3 | Grive, Martinet, Pic (2) | 380 F + 50 |
| Le bronze de la cloche | Sonnefeuille | 3 | le Pic seul (2) | 520 F + 70 |
| La cloche de Sainte-Lueur | Sainte-Lueur | 6 | Sterne (3), Goéland (4) | 1 400 F + 160 |

**La cloche** est une chaîne : la cire pour le moule (un contrat ordinaire de
Sonnefeuille), puis le bronze — qui ne se tire qu'une fois Sonnefeuille livrée, et
colle « La coulée » —, puis la cloche elle-même, qui ne se tire qu'après la coulée,
part à deux hydravions vers la chapelle de Sainte-Lueur et colle « La cloche de
Sainte-Lueur ». C'est l'histoire de Rosalie Martel, racontée par les cartes.

**La farine et le sel** étaient du fret lourd sans le savoir : trois sacs, pour des
escales où aucun avion n'en porte plus de deux. Ces deux cartes — et le colis de
Marais-Blanc, ramené à deux sacs — étaient **impossibles à livrer** depuis la v0.1 et
la v0.2. Un test vérifie maintenant que chaque contrat ordinaire se livre avec un
seul avion achetable, et chaque fret lourd avec deux.

## Les saisons — v0.3

Les saisons suivent le calendrier, en temps universel : printemps le 20 mars, été
le 21 juin, automne le 23 septembre, hiver le 21 décembre. Quand il neige chez le
joueur, il neige sur la Croisette. Chaque saison change une ou deux règles, et aucune
ne punit l'absence :

| Saison | Ce qui change | Dans la scène |
|---|---|---|
| **Printemps** | les contrats de semences se tirent deux fois plus souvent | des pétales sur les feuillus, un vert neuf |
| **Été** | brume et vent de mer retardent deux fois moins souvent | des verts profonds, des boutons d'or dans le pré |
| **Automne** | la brume revient une fois et demie plus souvent | les feuillus roussissent, des feuilles qui tombent |
| **Hiver** | les vols durent 15 % de plus, et **tous les tarifs paient 20 % de plus** (la prime de froid) | la neige au sol et sur le toit, le givre, des flocons |

Huit contrats de saison (deux chacune : les greffons et les clochettes de mai ; la
glace des poissonniers et les cartes postales de Sainte-Ambre ; les bondes du cidre
nouveau et les sacs des châtaignes ; les étrennes et le sirop de la Combe) et quatre
imprévus (les giboulées, l'orage de chaleur, les feuilles sur la piste, la neige) ne
se tirent qu'en leur temps. La première livraison de chaque saison colle sa page ;
les quatre réunies collent « Une année » — c'est le repère de la v0.3 : *la première
année de jeu*.

## Les avions

| Modèle | Anglais | Type | Portée | Sacs | Vitesse | Fiabilité | Piste | Prix |
|---|---|---|---|---|---|---|---|---|
| **Grive G-2** | Thrush G-2 | biplan courrier | 8 | 2 | 12 l/h | 94 % | courte | 1 800 F (la première est dans le hangar ; une seconde d'occasion, 1 500 F, à Moulin-Gris) |
| **Martinet M-1** | Swift M-1 | monoplan rapide | 10 | 1 | 24 l/h | 86 % | moyenne | 3 200 F |
| **Héron H-3** | Heron H-3 | trimoteur | 16 | 5 | 15 l/h | 92 % | longue | 6 500 F (5 600 F en occasion, aux Messageries de Pont-de-Brume) |

| **Sterne S-1** | Tern S-1 | hydravion | 14 | 3 | 14 l/h | 90 % | **eau** | 5 400 F (4 400 F en occasion, à Port-Sel) |
| **Goéland G-4** | Gull G-4 | hydravion long-courrier | 22 | 4 | 16 l/h | 91 % | **eau** | 7 800 F (6 600 F en occasion, à Port-Sel) |
| **Pic P-1** | Woodpecker W-1 | monoplan à aile haute | 12 | 2 | 13 l/h | 93 % | **clairière** | 4 200 F (3 600 F en occasion, à Villechaudron) |

Six oiseaux, six caractères : la Grive pardonne tout, le Martinet file et
casse, le Héron porte et exige une grande piste, la Sterne se pose sur l'eau — et
seulement sur l'eau. Elle ne dort pas au hangar : il lui faut un **ponton**. Le Goéland
porte plus loin et plus lourd, et préfère la nuit calme au vent de mer. Le **Pic** se
pose où se pose un pic : sur cinquante pas, entre les arbres. Il n'est pas rapide ; il
n'a pas besoin de l'être. Il dort au hangar, comme la Grive.

## Les pilotes

Dix pilotes, cinq femmes et cinq hommes, dix lieux d'origine.

> **Parité.** La règle du projet, depuis le premier jour. Le renommage du 12 octobre
> (Marthe Vaudrin → Prosper Chickenman, homme) l'avait rompue ; Garance Thuillier et
> Hedda Vilmorin la rétablissent le jour même. La Forêt de Cuivre en amène deux de plus,
> un homme et une femme. Un test la vérifie à chaque PR.

L'ordre du tableau est aussi l'ordre de recrutement : la carte « pilote de passage »
propose toujours le premier qui n'est pas encore embauché ; les trois cartes de ce
genre ne disent donc ni d'où il vient ni où il se présente, pour que le texte ne
démente jamais le pilote qui arrive. Chacun a deux
traits (qui changent des chiffres de la simulation, pas seulement une phrase) et une
histoire en trois scènes qui s'ouvrent à 3, 7 et 12 vols faits ensemble.

| Pilote | Âge | Origine | Traits | Histoire |
|---|---|---|---|---|
| **Prosper Chickenman** | 44 | Vallées de Brume | Météo dans la peau · Cœur de village | *Le premier jour de brume* — la croix du chemin, la brume qui lève au quart, la marque au crayon dans le hangar de Bastien |
| **Ilias Ferrant** | 27 | Hauts-Plateaux d'Ocre | Tête brûlée · Économe | *Le col et la lettre* — la moitié de la paie pour l'auberge du col, plein gaz, le Grand Blanc un jour |
| **Ysé Loranne** | 31 | Archipel des Lanternes | Nocturne · Porte-bonheur | *Les lanternes du Val* — une lanterne sur six, le bateau-poste, la lanterne de cuivre au bout de la piste |
| **Aurèle Combray** (*Aurel*) | 58 | Côte de Saline | Mains d'or · Longues routes | *Le moteur qui tousse* — du fil de fer, la photo dans la casquette, l'atelier qu'il ne vendra pas |
| **Solenn Darrieux** | 36 | Forêt de Cuivre | Nocturne · Mains d'or | *La lanterne de la forêt* — ce qu'on voit la nuit, le moteur de son père, la lanterne de cuivre au bout du ponton |
| **Teodor Vashti** | 41 | Désert de Verre | Longues routes · Porte-bonheur | *Le compte des étoiles* — trois chiffres sur la manche, le foulard du frère, la lettre vers le Grand Blanc |
| **Garance Thuillier** | 29 | Pont-de-Brume | Tête brûlée · Cœur de village | *De l'autre côté de la rivière* — le quai du marché, trois mètres de trop, la seconde marque sur la poutre |
| **Hedda Vilmorin** | 49 | Grand Blanc | Longues routes · Économe | *Ce que le nord garde* — le litre de trop, les boîtes de la dernière lanterne, pourquoi elle est descendue |
| **Gaspard Sorbier** | 52 | Villechaudron (Forêt de Cuivre) | Météo dans la peau · Économe | *Trente ans à pied* — la forêt vue à l'endroit, le creux du Hêtre-Roi, le sac de Bastien |
| **Rosalie Martel** | 26 | Haut-Ferrand | Mains d'or · Cœur de village | *La marque au marteau* — ce qui sonne encore, le poinçon sur la lanterne de Solenn, la cloche de Sonnefeuille |

Prosper est là dès le premier jour. Les autres passent au café et se recrutent
avec une carte « pilote de passage ». **Bastien**, l'ancien propriétaire, est mort
avant le début du jeu ; il n'apparaît que dans ce que les autres en disent.

### Les fils qui se rejoignent

Les histoires ne sont pas indépendantes : elles se répondent, et il faut que cela
reste vrai quand on en ajoute.

- **La poutre de Bastien.** Prosper montre une marque au crayon, seule sur la poutre,
  et garde un crayon « depuis le premier jour » sans dire pour qui. Garance, treize ans
  après son premier vol seul, demande à être mesurée : c'est lui qui trace la seconde.
- **Les lettres qui attendent.** Teodor laisse une lettre à la dernière lanterne de
  l'Île-du-Bout, pour un frère resté dans le désert (et le contrat *Une lettre vers le
  Grand Blanc* fait la même chose). Hedda, qui vient du nord, explique ce que deviennent
  ces lettres : elles attendent dans une boîte, parfois dix ans, et parfois quelqu'un
  revient. Elle ne lui donne pas de nouvelles de son frère — elle lui donne la raison
  de continuer à écrire.
- **La lanterne de cuivre.** Solenn la porte à la ceinture, la tient de sa mère, et
  finit par l'accrocher au bout du ponton. C'est sous cette lanterne que Hedda raconte
  pourquoi elle est descendue du Grand Blanc.
- **La croix du chemin.** On la touche avant de décoller « pour dire au chemin qu'on
  revient ». Prosper l'explique au premier chapitre ; tout le monde le fait ensuite.
- **Le sac de Bastien.** Il y a trente ans, Bastien a lâché un sac de courrier dans la
  clairière du Hêtre-Roi — le premier courrier tombé du ciel dans la forêt. Gaspard,
  jeune facteur des bois, l'a porté le reste du chemin et a gardé le sac. Il le
  rapporte, et l'accroche sous la poutre aux marques de crayon. Prosper le touche comme
  la croix du chemin.
- **Les boîtes et les arbres.** Le creux du Hêtre-Roi était la boîte aux lettres du fond
  des bois ; Hedda y reconnaît les boîtes en fer-blanc du nord. Le contrat *Une lettre
  pour le creux de l'arbre* fait vivre ce creux dans le jeu.
- **Le cuivre et les lanternes.** Le cuivre de Vert-de-Gris part aux îles en feuilles et
  revient en lanternes. Rosalie reconnaît sur la lanterne de Solenn le poinçon de sa
  grand-mère, chaudronnière à Villechaudron : « on ne sait jamais qui on éclaire ».
- **La cloche de Sainte-Lueur.** La chapelle de l'île n'a jamais eu de cloche ; les
  enfants comptent les hublots. Rosalie et le vieux frère Anselme veulent en couler une
  à Sonnefeuille — et elle ne tiendra pas dans un seul avion. C'est la porte du fret
  lourd.

## Les traits

| Trait | Anglais | Effet |
|---|---|---|
| Nocturne | Night Owl | Risque de nuit ÷ 4 — plus à l'aise la nuit que le jour |
| Économe | Thrifty | Carburant −15 % |
| Tête brûlée | Daredevil | Vitesse +12 %, fiabilité −8 %, usure +20 % |
| Météo dans la peau | Weather Sense | Retard de brume et de vent de mer ÷ 2 |
| Mains d'or | Golden Hands | Usure −25 %, fiabilité +4 % |
| Longues routes | Long Haul | Portée +20 %, fatigue −15 % |
| Cœur de village | Home Heart | Fatigue +25 % loin de chez soi, chance +5 % |
| Porte-bonheur | Lucky Charm | Chance +15 % (plus d'opportunités, moins d'imprévus) |

La chance de la compagnie est celle de son pilote **le plus chanceux** (× 1,15 au plus),
pas le produit de tous : un porte-bonheur suffit, et le jeu garde ses imprévus jusqu'au
bout (règle du 14/10).

## Les cartes

Trois par jour, dans une main de cinq. Tirage déterministe (graine par joueur et par
jour) : rejouable, auditable, impossible à manipuler depuis le navigateur.

- **La ligne régulière** : le sac de Pont-de-Brume, toujours disponible, jamais tirée,
  25 F sans bonus. La main vide n'empêche jamais de faire voler quelqu'un (ajoutée le
  11/10 après la première partie de Régis : à 14 h, il n'avait plus rien à expédier).
  **La caisse vide non plus** (règle du 11/10 au soir, après une partie arrêtée à 3 F) :
  la poste avance le salaire et le carburant, rien n'est débité au départ, et le tarif
  moins l'avance est versé à l'arrivée — jamais moins que zéro. Avec Prosper et la Grive :
  25 − 14 = 11 F nets par aller-retour. C'est le plancher du jeu, pas sa fortune.
- **20 contrats** : une destination, un chargement, un nombre de sacs, une récompense,
  un délai souple (tenu → bonus ; dépassé → rien). Les lointains paient mieux ; chaque
  contrat couvre au moins le salaire et l'entretien d'un vol.
- **10 imprévus** — et **un imprévu en main bloque la piste** : rien ne décolle, ligne
  régulière comprise, tant qu'on n'a pas tranché, et on ne peut pas le « laisser
  passer » (règle du 11/10 : « comment je peux faire décoller son pilote si on a une
  vache sur la piste ? ») : brume tenace, vache sur la piste, moteur qui tousse, pilote
  enrhumé, vent de travers, un sac en trop, averse, le bac en grève, la citerne en
  retard, une lettre sans adresse. Chacun se résout par un choix — payer, attendre,
  risquer — et chaque choix a ses chiffres.
  **Tous les imprévus se passent à l'aérodrome, avant un départ** (règle du 14/10) :
  aucun ne parle d'un vol déjà en l'air ni d'une heure du jour, et **« attendre » ferme
  vraiment la piste** le nombre d'heures écrit sur le bouton ; la carte dit jusqu'à
  quelle heure. Avant, l'attente visait un vol en l'air, et s'il n'y en avait aucun, on
  repartait aussitôt — « Dormir sur place », puis un vol dans la minute.
- **6 opportunités** : un Martinet d'occasion, une Grive d'occasion, le Héron des
  Messageries, un pilote de passage, la fête des Tilleuls, la vieille carte de Bastien.
  (Jusqu'au 12/10, aucune carte ne vendait le Héron ni une seconde Grive : la grande
  piste ne servait à rien.)

## L'aérodrome

Quatre zones à restaurer (le café et l'atelier de peinture viendront peut-être) :

- **La piste** : pré fauché → piste roulée (900 F, le Martinet se pose) → grande piste
  (2 400 F, le Héron se pose).
- **Le hangar** : porte de travers (1 avion) → porte neuve et établi (700 F, 2 avions,
  entretien moins cher) → atelier (2 000 F, 3 avions). **On le voit grandir** : au
  premier niveau, de la rouille sur la tôle, la porte qui bâille et une planche qui
  manque ; au deuxième, un appentis contre le mur gauche, l'établi derrière la
  fenêtre ; au troisième, un atelier à toit en dents de scie sur la droite, dont la
  cheminée fume. La peinture du hangar repeint aussi les ajouts.
- **Le ponton** (v0.2) : la rive nue → ponton sur la rivière (1 500 F, un hydravion
  s'amarre) → double ponton et lanterne (2 800 F, deux hydravions : le second au
  ponton flottant du milieu de la rivière). L'hydravion ne compte pas dans le hangar,
  et le hangar ne compte pas pour lui.
- **La tour** (v0.3, promise dès la conception) : un poteau → la vigie (1 200 F : on
  monte voir le temps avant chaque départ, et la brume et le vent de mer retardent un
  quart moins souvent) → la tour et son feu (3 000 F : un feu tournant balaie la
  vallée la nuit, et les vols de nuit ont un tiers d'incidents en moins). Le feu
  clignote dans la scène au crépuscule et la nuit.

**Les avions sont sur le terrain.** Chaque avion au repos a sa place et son dessin :
la Grive en biplan, le Martinet en monoplan rouge, le Héron en trimoteur de tôle
ondulée, le Pic avec ses pneus ballons ; la Sterne au ponton, le Goéland avec sa
coque blanche. Un avion en vol laisse sa place vide.

Et douze décorations, sans effet sur la simulation sauf un léger moral : jardinières,
le banc, la manche à air rayée, l'enseigne, le drapeau de la vallée, la boîte aux
lettres au bout du chemin, la lanterne de piste, le pommier, les tables du café, la
peinture du hangar — et, depuis la v0.3, **le pigeonnier** (les pigeons voyageurs
portaient le courrier avant vous ; ils ont droit à une retraite) et **les ruches**
au pied du pommier.

## Les règles du vol (v0.1)

- **Expédier** demande une carte contrat en main, un avion libre qui porte assez de
  sacs, qui peut se poser sur la piste du village **et décoller de la vôtre** (le
  Martinet demande la piste roulée, le Héron la grande piste ; l'hydravion part de la
  rivière), un pilote libre et pas trop fatigué, et de quoi payer le départ (salaire du
  pilote + entretien de l'avion, moins avec « Économe », divisé par 1,25 avec l'établi
  et par 1,5 avec l'atelier) — sauf sur la ligne régulière, où la poste avance tout.
- **Durée** = distance ÷ vitesse (× « Tête brûlée »). L'aller livre ; le retour dure
  autant ; avion et pilote sont occupés jusqu'au retour.
- **Aléas**, tirés d'une graine par joueur et par vol, donc rejouables : un incident
  (probabilité 1 − fiabilité, aggravée par l'usure ; **× 2 la nuit aux lanternes**, ÷ 4
  pour un pilote Nocturne ; **× 0,75 à 20 de moral, × 1,25 à 0** — un pilote heureux
  casse moins ; **× 1,5 dans les sous-bois de la forêt**) allonge le vol de 30 % et use l'avion ; la brume de Moulin-Gris ajoute vingt minutes une fois sur deux (une sur
  quatre avec « Météo dans la peau »).
- **À l'arrivée** : la récompense, plus le bonus si le délai souple est tenu ; jamais
  de pénalité. Affinité +1 avec le pilote ; moral +1 si à l'heure, −1 si incident.
- **Fatigue** : elle se compte en **minutes de vol**, aller et retour compris, au
  trait du pilote près (« Cœur de village » × 1,25, « Longues routes » × 0,85). Un
  saut à Pont-de-Brume pèse dix minutes, un aller-retour de plateau une heure, une
  traversée de l'Archipel deux heures et demie. Le pilote se repose quand il a
  **huit heures de vol** dans les bras — une trentaine de sauts à Pont-de-Brume, sept
  allers-retours de plateau. **En l'air, rien ne s'efface ; au sol, une minute de
  repos efface deux minutes de vol** : une longue journée se rattrape dans
  l'après-midi, pas le lendemain. Le joueur voit dix crans (une heure de vol par
  cran) et le moment exact où son pilote reprend son service.
- **Cartes** : trois par jour de jeu (minuit UTC), dans la place qui reste d'une main
  de cinq. Ce qu'on n'a pas la place de prendre, quelqu'un d'autre l'a porté : ce
  n'est pas une perte. Une carte défaussée ne revient pas le jour même.
- **L'escale attend sa lettre** (14 octobre 2026) : parmi les contrats du tirage, ceux
  d'une escale qui n'a encore jamais reçu de courrier pèsent **trois fois plus**. Les
  contrats gardent ensemble le même poids, donc ni plus ni moins d'imprévus. Sans
  cette règle, la dernière escale d'une région ne dépendait que de la chance.

## L'album de cachets

Douze pages pour la vallée : Fondation, Premier vol, une par village, Vol de nuit,
À l'heure (dix délais tenus), Une histoire, Toute la vallée. Neuf pour la Côte : La
route de la Côte, une par escale, Sur l'eau, Toute la Côte. Huit pour l'Archipel : La
route des îles, une par île, Tout l'Archipel. Neuf pour la forêt : La route de la
forêt, une par escale, Dans la clairière, Toute la forêt. Trois pour le fret lourd :
Le premier convoi, La coulée, La cloche de Sainte-Lueur. Cinq pour l'année : une par
saison, et Une année. Une collection, pas un classement.

**Ce que vaut une page.** Chaque page vaut **un cachet** ; une première livraison
lointaine en vaut deux ou trois (chaque région le précise plus haut). Les cachets ne se
dépensent qu'à ouvrir une route, et une route demande deux choses : son prix en
cachets, et la page « toute la région » de la précédente. Une route fermée dit les
deux, chacune avec son état, et nomme les escales qui restent à livrer. Dans l'album,
chaque page porte sa valeur en coin (+1, +2, +3), et l'album affiche la somme : « 10
pages sur 46 · 13 cachets gagnés ».

## Ce qui viendra (prévu, pas encore écrit)

**Avions.** Il en manque deux pour couvrir les sept régions du document de conception :
un **planeur postal** léger pour les plateaux (décollage court, pas de carburant, à la
merci du vent) et un **long-courrier terrestre** pour le Grand Blanc (très grande
portée, grande piste obligatoire, chauffage de cabine). Un **autogire** reste en débat :
il se pose n'importe où, ce qui rendrait les niveaux de piste inutiles — le Pic en a
pris la part raisonnable.

**Pilotes.** Dix, cinq femmes et cinq hommes. Les deux suivants seront une femme et un
homme, pour que la parité tienne à chaque palier ; objectif v1.0 : vingt pilotes.

**Au-delà.** Les trois régions restantes : les Hauts-Plateaux d'Ocre (et le planeur),
le Désert de Verre, le Grand Blanc (et le long-courrier terrestre qu'Ilias attend).

## Ce qu'on commence avec

300 francs, 0 cachet, une Grive, Prosper. Et le chemin.
