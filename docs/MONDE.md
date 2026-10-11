# Le monde d'Altiplume — bible de la v0.1

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
et Lanterne-du-Val, 3 pour la Combe). Les six villages livrés ouvrent la route des
Hauts-Plateaux d'Ocre (v0.2).

## Les avions

| Modèle | Anglais | Type | Portée | Sacs | Vitesse | Fiabilité | Piste | Prix |
|---|---|---|---|---|---|---|---|---|
| **Grive G-2** | Thrush G-2 | biplan courrier | 8 | 2 | 12 l/h | 94 % | courte | 1 800 F (déjà dans le hangar) |
| **Martinet M-1** | Swift M-1 | monoplan rapide | 10 | 1 | 24 l/h | 86 % | moyenne | 3 200 F |
| **Héron H-3** | Heron H-3 | trimoteur | 16 | 5 | 15 l/h | 92 % | longue | 6 500 F |

Trois oiseaux, trois caractères : la Grive pardonne tout, le Martinet file et casse,
le Héron porte et exige une grande piste. L'hydravion et le long-courrier viendront
avec la Côte de Saline et le Grand Blanc.

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
- **20 contrats** : une destination, un chargement, un nombre de sacs, une récompense,
  un délai souple (tenu → bonus ; dépassé → rien). Les lointains paient mieux ; chaque
  contrat couvre au moins le salaire et l'entretien d'un vol.
- **10 imprévus** : brume tenace, vache sur la piste, moteur qui tousse, pilote
  enrhumé, vent de crête, un sac en trop, averse, le bac en grève, la nuit qui tombe
  tôt, une lettre sans adresse. Chacun se résout par un choix — payer, attendre,
  risquer — et chaque choix a ses chiffres.
- **4 opportunités** : un Martinet d'occasion, un pilote de passage, la fête des
  Tilleuls, la vieille carte de Bastien.

## L'aérodrome

Deux zones à restaurer dans la v0.1 (la tour, le café et l'atelier viendront) :

- **La piste** : pré fauché → piste roulée (900 F, le Martinet se pose) → grande piste
  (2 400 F, le Héron se pose).
- **Le hangar** : porte de travers (1 avion) → porte neuve et établi (700 F, 2 avions,
  entretien moins cher) → atelier (2 000 F, 3 avions).

Et dix décorations, sans effet sur la simulation sauf un léger moral : jardinières,
le banc, la manche à air rayée, l'enseigne, le drapeau de la vallée, la boîte aux
lettres au bout du chemin, la lanterne de piste, le pommier, les tables du café, la
peinture du hangar.

## Les règles du vol (v0.1)

- **Expédier** demande une carte contrat en main, un avion libre qui porte assez de
  sacs et peut se poser sur la piste du village, un pilote libre et pas trop fatigué,
  et de quoi payer le départ (salaire du pilote + entretien de l'avion, moins avec
  « Économe »).
- **Durée** = distance ÷ vitesse (× « Tête brûlée »). L'aller livre ; le retour dure
  autant ; avion et pilote sont occupés jusqu'au retour.
- **Aléas**, tirés d'une graine par joueur et par vol, donc rejouables : un incident
  (probabilité 1 − fiabilité, aggravée par l'usure) allonge le vol de 30 % et use
  l'avion ; la brume de Moulin-Gris ajoute vingt minutes une fois sur deux (une sur
  quatre avec « Météo dans la peau »).
- **À l'arrivée** : la récompense, plus le bonus si le délai souple est tenu ; jamais
  de pénalité. Affinité +1 avec le pilote ; moral +1 si à l'heure, −1 si incident.
- **Fatigue** : +1 par vol (+2 au-delà de trois lieues, × « Cœur de village »), −1
  toutes les trois heures. À 8, le pilote se repose.
- **Cartes** : trois par jour de jeu (minuit UTC), dans la place qui reste d'une main
  de cinq. Ce qu'on n'a pas la place de prendre, quelqu'un d'autre l'a porté : ce
  n'est pas une perte. Une carte défaussée ne revient pas le jour même.

## L'album de cachets

Douze pages dans la v0.1 : Fondation, Premier vol, une par village, Vol de nuit,
À l'heure (dix délais tenus), Une histoire, Toute la vallée. Une collection, pas un
classement.

## Ce qu'on commence avec

300 francs, 0 cachet, une Grive, Marthe. Et le chemin.
