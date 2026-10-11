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
avant de décoller — pas par superstition, dit Marthe, mais « pour dire au chemin
qu'on revient ».

L'aérodrome du joueur s'appelle **l'Aérodrome de la Croisette** (*Crosslet Field*),
adresse : *Chemin de la Croisette, Vallées de Brume* (*Crosslet Lane, Mistvale*).
On en hérite tel quel : une piste de deux cents pas, un hangar dont la porte ferme
mal, une Grive dans le hangar, et Marthe, qui était déjà là.

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
la vallée », qui permet d'ouvrir la route de la Côte de Saline.

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
coucher du soleil vaut « Vol de nuit ».

Deux imprévus propres à la Côte (un grain au large, la marée qui a tout changé) et
deux opportunités (une Sterne des douanes réformée à Port-Sel, la carte marine du
gardien) ne se tirent qu'une fois la route ouverte.

## Les avions

| Modèle | Anglais | Type | Portée | Sacs | Vitesse | Fiabilité | Piste | Prix |
|---|---|---|---|---|---|---|---|---|
| **Grive G-2** | Thrush G-2 | biplan courrier | 8 | 2 | 12 l/h | 94 % | courte | 1 800 F (déjà dans le hangar) |
| **Martinet M-1** | Swift M-1 | monoplan rapide | 10 | 1 | 24 l/h | 86 % | moyenne | 3 200 F |
| **Héron H-3** | Heron H-3 | trimoteur | 16 | 5 | 15 l/h | 92 % | longue | 6 500 F |

| **Sterne S-1** | Tern S-1 | hydravion | 14 | 3 | 14 l/h | 90 % | **eau** | 5 400 F (4 400 F en occasion, à Port-Sel) |

Quatre oiseaux, quatre caractères : la Grive pardonne tout, le Martinet file et
casse, le Héron porte et exige une grande piste, la Sterne se pose sur l'eau — et
seulement sur l'eau. Elle ne dort pas au hangar : il lui faut un **ponton**. Le
long-courrier viendra avec le Grand Blanc.

## Les pilotes

Quatre pilotes, deux femmes, deux hommes, quatre régions d'origine. Chacun a deux
traits (qui changent des chiffres de la simulation, pas seulement une phrase) et une
histoire en trois scènes qui s'ouvrent à 3, 7 et 12 vols faits ensemble.

| Pilote | Âge | Origine | Traits | Histoire |
|---|---|---|---|---|
| **Marthe Vaudrin** (*Martha*) | 44 | Vallées de Brume | Météo dans la peau · Cœur de village | *Le premier jour de brume* — la croix du chemin, la brume qui lève au quart, la marque au crayon dans le hangar de Bastien |
| **Ilias Ferrant** | 27 | Hauts-Plateaux d'Ocre | Tête brûlée · Économe | *Le col et la lettre* — la moitié de la paie pour l'auberge du col, plein gaz, le Grand Blanc un jour |
| **Ysé Loranne** | 31 | Archipel des Lanternes | Nocturne · Porte-bonheur | *Les lanternes du Val* — une lanterne sur six, le bateau-poste, la lanterne de cuivre au bout de la piste |
| **Aurèle Combray** (*Aurel*) | 58 | Côte de Saline | Mains d'or · Longues routes | *Le moteur qui tousse* — du fil de fer, la photo dans la casquette, l'atelier qu'il ne vendra pas |

Marthe est là dès le premier jour. Les trois autres passent au café et se recrutent
avec une carte « pilote de passage ». **Bastien**, l'ancien propriétaire, est mort
avant le début du jeu ; il n'apparaît que dans ce que les autres en disent.

### Les traits

| Trait | Anglais | Effet |
|---|---|---|
| Nocturne | Night Owl | Risque de nuit ÷ 4 |
| Économe | Thrifty | Carburant −15 % |
| Tête brûlée | Daredevil | Vitesse +12 %, fiabilité −8 %, usure +20 % |
| Météo dans la peau | Weather Sense | Retard de brume ÷ 2 |
| Mains d'or | Golden Hands | Usure −25 %, fiabilité +4 % |
| Longues routes | Long Haul | Portée +20 %, fatigue −15 % |
| Cœur de village | Home Heart | Fatigue +25 % loin de chez soi, chance +5 % |
| Porte-bonheur | Lucky Charm | Chance +15 % (plus d'opportunités, moins d'imprévus) |

## Les cartes

Trois par jour, dans une main de cinq. Tirage déterministe (graine par joueur et par
jour) : rejouable, auditable, impossible à manipuler depuis le navigateur.

- **La ligne régulière** : le sac de Pont-de-Brume, toujours disponible, jamais tirée,
  18 F sans bonus. La main vide n'empêche jamais de faire voler quelqu'un (ajoutée le
  11/10 après la première partie de Régis : à 14 h, il n'avait plus rien à expédier).
  **La caisse vide non plus** (règle du 11/10 au soir, après une partie arrêtée à 3 F) :
  la poste avance le salaire et le carburant, rien n'est débité au départ, et le tarif
  moins l'avance est versé à l'arrivée — jamais moins que zéro. Avec Marthe et la Grive :
  18 − 14 = 4 F nets par aller-retour. C'est le plancher du jeu, pas sa fortune.
- **20 contrats** : une destination, un chargement, un nombre de sacs, une récompense,
  un délai souple (tenu → bonus ; dépassé → rien). Les lointains paient mieux ; chaque
  contrat couvre au moins le salaire et l'entretien d'un vol.
- **10 imprévus** — et **un imprévu en main bloque la piste** : rien ne décolle, ligne
  régulière comprise, tant qu'on n'a pas tranché, et on ne peut pas le « laisser
  passer » (règle du 11/10 : « comment je peux faire décoller Marthe si j'ai une
  vache sur la piste ? ») : brume tenace, vache sur la piste, moteur qui tousse, pilote
  enrhumé, vent de crête, un sac en trop, averse, le bac en grève, la nuit qui tombe
  tôt, une lettre sans adresse. Chacun se résout par un choix — payer, attendre,
  risquer — et chaque choix a ses chiffres.
- **4 opportunités** : un Martinet d'occasion, un pilote de passage, la fête des
  Tilleuls, la vieille carte de Bastien.

## L'aérodrome

Trois zones à restaurer (la tour, le café et l'atelier viendront) :

- **La piste** : pré fauché → piste roulée (900 F, le Martinet se pose) → grande piste
  (2 400 F, le Héron se pose).
- **Le hangar** : porte de travers (1 avion) → porte neuve et établi (700 F, 2 avions,
  entretien moins cher) → atelier (2 000 F, 3 avions).
- **Le ponton** (v0.2) : la rive nue → ponton sur la rivière (1 500 F, une Sterne
  s'amarre). L'hydravion ne compte pas dans le hangar, et le hangar ne compte pas
  pour lui.

Et dix décorations, sans effet sur la simulation sauf un léger moral : jardinières,
le banc, la manche à air rayée, l'enseigne, le drapeau de la vallée, la boîte aux
lettres au bout du chemin, la lanterne de piste, le pommier, les tables du café, la
peinture du hangar.

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
  casse moins) allonge le vol de 30 % et use l'avion ; la brume de Moulin-Gris ajoute vingt minutes une fois sur deux (une sur
  quatre avec « Météo dans la peau »).
- **À l'arrivée** : la récompense, plus le bonus si le délai souple est tenu ; jamais
  de pénalité. Affinité +1 avec le pilote ; moral +1 si à l'heure, −1 si incident.
- **Fatigue** : +1 par vol (+2 au-delà de trois lieues, × « Cœur de village »), −1
  toutes les trois heures. À 8, le pilote se repose.
- **Cartes** : trois par jour de jeu (minuit UTC), dans la place qui reste d'une main
  de cinq. Ce qu'on n'a pas la place de prendre, quelqu'un d'autre l'a porté : ce
  n'est pas une perte. Une carte défaussée ne revient pas le jour même.

## L'album de cachets

Douze pages pour la vallée : Fondation, Premier vol, une par village, Vol de nuit,
À l'heure (dix délais tenus), Une histoire, Toute la vallée. Neuf pour la Côte : La
route de la Côte, une par escale, Sur l'eau, Toute la Côte. Une collection, pas un
classement.

## Ce qu'on commence avec

300 francs, 0 cachet, une Grive, Marthe. Et le chemin.
