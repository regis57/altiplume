/**
 * L'aérodrome : ce qu'on restaure (et qui change le jeu), ce qu'on décore (et qui
 * ne change que le moral — c'est le Stardew en nous). Plus l'album de cachets :
 * les « premières » qui valent une page.
 */
import type { Decoration, Stamp, Zone } from './types.ts';

export const ZONES: readonly Zone[] = [
  {
    id: 'runway',
    name: { fr: 'La piste', en: 'The runway' },
    levels: [
      { level: 1, cost: 0, runway: 'short', name: { fr: 'Pré fauché', en: 'Mown meadow' }, description: { fr: "Deux cents pas d'herbe, un peu de boue au bout. Le biplan s'en contente.", en: 'Two hundred paces of grass, a little mud at the end. The biplane makes do.' } },
      { level: 2, cost: 900, runway: 'medium', name: { fr: 'Piste roulée', en: 'Rolled strip' }, description: { fr: "Roulée, drainée, balisée de pierres blanches. Le Martinet peut se poser.", en: 'Rolled, drained, marked with white stones. The Swift can land.' } },
      { level: 3, cost: 2400, runway: 'long', name: { fr: 'Grande piste', en: 'Long runway' }, description: { fr: "Allongée jusqu'au ruisseau, avec une manche à air neuve. Place au Héron.", en: 'Extended to the brook, with a new windsock. Room for the Heron.' } },
    ],
  },
  {
    id: 'hangar',
    name: { fr: 'Le hangar', en: 'The hangar' },
    levels: [
      { level: 1, cost: 0, planes: 1, maintenance: 1, name: { fr: 'Porte de travers', en: 'Crooked door' }, description: { fr: "Un seul avion y tient, et la porte ferme mal. On répare avec ce qu'on a.", en: 'One plane fits, and the door never shuts. Repairs with whatever is to hand.' } },
      { level: 2, cost: 700, planes: 2, maintenance: 1.25, name: { fr: 'Porte neuve, établi', en: 'New door, workbench' }, description: { fr: "Deux avions au sec, un établi, de vrais outils. L'entretien coûte moins.", en: 'Two planes in the dry, a bench, real tools. Upkeep costs less.' } },
      { level: 3, cost: 2000, planes: 3, maintenance: 1.5, name: { fr: 'Atelier', en: 'Workshop' }, description: { fr: "Trois avions, un treuil, et un coin où quelqu'un a dessiné la place de chaque outil au crayon.", en: 'Three planes, a hoist, and a corner where someone has pencilled the place of every tool.' } },
    ],
  },
  {
    id: 'ponton',
    name: { fr: 'Le ponton', en: 'The pontoon' },
    levels: [
      { level: 1, cost: 0, seaplanes: 0, name: { fr: 'La rive', en: 'The bank' }, description: { fr: "La rivière passe au bout de la piste, lente et assez large. Rien n'y est amarré. Pas encore.", en: 'The river runs past the end of the strip, slow and wide enough. Nothing is moored there. Not yet.' } },
      { level: 2, cost: 1500, seaplanes: 1, name: { fr: 'Ponton sur la rivière', en: 'River pontoon' }, description: { fr: "Des planches sur pilotis, deux bollards, une échelle. Un hydravion peut s'y amarrer — et partir pour la Côte.", en: 'Planks on piles, two bollards, a ladder. A seaplane can moor here — and leave for the Shore.' } },
      { level: 3, cost: 2800, seaplanes: 2, name: { fr: 'Double ponton et lanterne', en: 'Double pontoon and lantern' }, description: { fr: "Un second ponton en face du premier, et une lanterne de cuivre au bout, pour rentrer de nuit. Deux hydravions à quai.", en: 'A second pontoon facing the first, and a copper lantern at the end, for coming home at night. Two seaplanes moored.' } },
    ],
  },
];

export const DECORATIONS: readonly Decoration[] = [
  { id: 'd-fleurs', cost: 20, morale: 1, name: { fr: 'Jardinières', en: 'Flower boxes' }, description: { fr: "Des géraniums sous les fenêtres du hangar. Prosper dit que ça ne sert à rien. Il les arrose.", en: 'Geraniums under the hangar windows. Prosper says they are pointless. He waters them.' } },
  { id: 'd-banc', cost: 30, morale: 1, name: { fr: 'Le banc', en: 'The bench' }, description: { fr: "Un banc face à la piste, pour regarder rentrer les avions.", en: 'A bench facing the strip, to watch the planes come home.' } },
  { id: 'd-manche', cost: 25, morale: 1, name: { fr: 'Manche à air rayée', en: 'Striped windsock' }, description: { fr: "Rouge et blanche, comme sur la Côte. On la voit depuis le village.", en: 'Red and white, like on the Shore. You can see it from the village.' } },
  { id: 'd-enseigne', cost: 60, morale: 2, name: { fr: "L'enseigne", en: 'The sign' }, description: { fr: "Le nom de la compagnie peint sur une planche, au-dessus de la porte du hangar. Ça y est, ça existe.", en: 'The company name painted on a board above the hangar door. There — it exists.' } },
  { id: 'd-drapeau', cost: 35, morale: 1, name: { fr: 'Le drapeau de la vallée', en: 'The valley flag' }, description: { fr: "Vert et gris-bleu, une plume au milieu. Il claque les jours de vent de crête.", en: 'Green and grey-blue, a feather in the middle. It snaps on ridge-wind days.' } },
  { id: 'd-boite', cost: 15, morale: 1, name: { fr: 'Boîte aux lettres', en: 'Letter box' }, description: { fr: "Au bout du chemin de la Croisette, pour ceux qui n'osent pas entrer.", en: 'At the end of Crosslet Lane, for those who don\'t dare come in.' } },
  { id: 'd-lanterne', cost: 40, morale: 2, name: { fr: 'Lanterne de piste', en: 'Strip lantern' }, description: { fr: "Une lanterne de cuivre au bout de la piste, côté chemin. Pour ceux qui rentrent tard.", en: 'A copper lantern at the end of the strip, lane side. For those who come home late.' } },
  { id: 'd-pommier', cost: 45, morale: 1, name: { fr: 'Le pommier', en: 'The apple tree' }, description: { fr: "Un pommier des Tilleuls, planté près du banc. Il donnera dans trois ans. On a le temps.", en: 'A Lindenhollow apple tree planted by the bench. It will fruit in three years. There is time.' } },
  { id: 'd-cafe', cost: 80, morale: 3, name: { fr: 'Tables du café', en: 'Café tables' }, description: { fr: "Deux tables et des chaises dépareillées devant le comptoir. C'est là que les histoires se racontent.", en: 'Two tables and mismatched chairs in front of the counter. This is where the stories get told.' } },
  { id: 'd-peinture', cost: 120, morale: 3, name: { fr: 'Peinture du hangar', en: 'Hangar paint' }, description: { fr: "Vert de gris, avec la porte en rouge cachet. On le voit depuis Pont-de-Brume, paraît-il.", en: 'Verdigris, with the door in postmark red. They say you can see it from Mistbridge.' } },
];

/**
 * L'album de cachets : chaque « première » y colle une page. Pas de classement,
 * pas de série à ne pas rompre — seulement des choses qu'on a faites une fois,
 * et qu'on peut regarder.
 */
export const STAMPS: readonly Stamp[] = [
  { id: 's-fondation', name: { fr: 'Fondation', en: 'Founding' }, description: { fr: "Le jour où la compagnie a eu un nom.", en: 'The day the company got a name.' } },
  { id: 's-premier-vol', name: { fr: 'Premier vol', en: 'First flight' }, description: { fr: "Le premier sac parti de la Croisette.", en: 'The first bag out of Crosslet Field.' } },
  { id: 's-pont-de-brume', name: { fr: 'Pont-de-Brume', en: 'Mistbridge' }, description: { fr: "Première livraison à la ville de marché.", en: 'First delivery to the market town.' } },
  { id: 's-les-tilleuls', name: { fr: 'Les Tilleuls', en: 'Lindenhollow' }, description: { fr: "Première livraison au hameau des vergers.", en: 'First delivery to the orchard hamlet.' } },
  { id: 's-moulin-gris', name: { fr: 'Moulin-Gris', en: 'Greymill' }, description: { fr: "Première livraison sous la brume.", en: 'First delivery under the fog.' } },
  { id: 's-haut-ferrand', name: { fr: 'Haut-Ferrand', en: 'Ferncrest' }, description: { fr: "Première livraison sur la crête.", en: 'First delivery on the ridge.' } },
  { id: 's-lanterne-du-val', name: { fr: 'Lanterne-du-Val', en: 'Lanternhollow' }, description: { fr: "Première livraison aux lanternes.", en: 'First delivery to the lanterns.' } },
  { id: 's-combe-aux-rosees', name: { fr: 'Combe-aux-Rosées', en: 'Dewcombe' }, description: { fr: "Première livraison au bout de la vallée.", en: 'First delivery to the end of the valley.' } },
  { id: 's-nuit', name: { fr: 'Vol de nuit', en: 'Night flight' }, description: { fr: "Un atterrissage aux lanternes, après le coucher du soleil.", en: 'A landing by lantern light, after sunset.' } },
  { id: 's-delai', name: { fr: 'À l\'heure', en: 'On time' }, description: { fr: "Dix délais souples tenus. On commence à compter sur vous.", en: 'Ten soft deadlines met. People are starting to count on you.' } },
  { id: 's-histoire', name: { fr: 'Une histoire', en: 'A story' }, description: { fr: "Un pilote vous a raconté sa première histoire.", en: 'A pilot told you their first story.' } },
  { id: 's-vallee', name: { fr: 'Toute la vallée', en: 'The whole valley' }, description: { fr: "Les six villages des Vallées de Brume ont reçu votre courrier. La route de la Côte attend.", en: 'All six villages of Mistvale have had your mail. The road to the Shore awaits.' } },
  // La Côte de Saline
  { id: 's-route-saline', name: { fr: 'La route de la Côte', en: 'The Shore road' }, description: { fr: "Une carte marine, un bail sur un bout de quai : la Côte de Saline est ouverte.", en: 'A sea chart, a lease on a bit of quay: Saltshore is open.' } },
  { id: 's-port-sel', name: { fr: 'Port-Sel', en: 'Saltharbour' }, description: { fr: "Première livraison au port.", en: 'First delivery to the harbour.' } },
  { id: 's-les-oeillets', name: { fr: 'Les Œillets', en: 'Panbrook' }, description: { fr: "Première livraison sur la digue des salines.", en: 'First delivery on the salt-pan dyke.' } },
  { id: 's-marais-blanc', name: { fr: 'Marais-Blanc', en: 'Whitefen' }, description: { fr: "Première livraison au bourg sur pilotis.", en: 'First delivery to the town on stilts.' } },
  { id: 's-anse-aux-goemons', name: { fr: 'Anse-aux-Goémons', en: 'Wrackcove' }, description: { fr: "Première livraison entre les bouées.", en: 'First delivery between the buoys.' } },
  { id: 's-phare-de-brisant', name: { fr: 'Phare de Brisant', en: 'Breaker Light' }, description: { fr: "Première livraison aux gardiens du phare.", en: 'First delivery to the lighthouse keepers.' } },
  { id: 's-ile-sainte-ambre', name: { fr: 'Île Sainte-Ambre', en: 'Amber Holm' }, description: { fr: "Première livraison à l'île du large.", en: 'First delivery to the island offshore.' } },
  { id: 's-hydravion', name: { fr: 'Sur l\'eau', en: 'On the water' }, description: { fr: "Le premier amerrissage de la compagnie.", en: 'The company\'s first landing on water.' } },
  { id: 's-cote', name: { fr: 'Toute la Côte', en: 'The whole Shore' }, description: { fr: "Les six escales de la Côte de Saline ont reçu votre courrier. Au large, des lanternes.", en: 'All six stops on Saltshore have had your mail. Out at sea, lanterns.' } },
  // L'Archipel des Lanternes
  { id: 's-route-archipel', name: { fr: 'La route des îles', en: 'The island road' }, description: { fr: "La carte des passes, une lanterne de cuivre : l'Archipel des Lanternes est ouvert.", en: 'The chart of the channels, a copper lantern: the Lantern Isles are open.' } },
  { id: 's-ile-aux-fanaux', name: { fr: 'Île-aux-Fanaux', en: 'Beacon Holm' }, description: { fr: "Première livraison aux douze lanternes.", en: 'First delivery to the twelve lanterns.' } },
  { id: 's-grand-recif', name: { fr: 'Grand-Récif', en: 'Long Reef' }, description: { fr: "Première livraison dans le lagon.", en: 'First delivery in the lagoon.' } },
  { id: 's-sainte-lueur', name: { fr: 'Sainte-Lueur', en: 'Glimmerkirk' }, description: { fr: "Première livraison aux enfants du ponton.", en: 'First delivery to the children on the jetty.' } },
  { id: 's-le-rocher-noir', name: { fr: 'Le Rocher-Noir', en: 'Blackstack' }, description: { fr: "Première livraison aux guetteurs.", en: 'First delivery to the watchers.' } },
  { id: 's-anse-des-lanternes', name: { fr: 'Anse-des-Lanternes', en: 'Lanterncove' }, description: { fr: "Première livraison à la fabrique de lanternes.", en: 'First delivery to the lantern works.' } },
  { id: 's-ile-du-bout', name: { fr: "Île-du-Bout", en: 'Lastholm' }, description: { fr: "Première livraison à la dernière île.", en: 'First delivery to the last island.' } },
  { id: 's-archipel', name: { fr: "Tout l'Archipel", en: 'The whole Isles' }, description: { fr: "Les six îles ont reçu votre courrier. Après, il n'y a plus que la mer — et le Grand Blanc.", en: 'All six islands have had your mail. Beyond, only the sea — and the Great White.' } },
  // La Forêt de Cuivre
  { id: 's-route-cuivre', name: { fr: 'La route de la forêt', en: 'The forest road' }, description: { fr: "Un droit de passage signé par les gardes, une place sur le champ de foire de Villechaudron : la Forêt de Cuivre est ouverte.", en: 'A right of way signed by the foresters, a berth on the Kettleby fairground: Copperwood is open.' } },
  { id: 's-les-charbonnieres', name: { fr: 'Les Charbonnières', en: 'Charwood' }, description: { fr: "Première livraison dans la fumée des meules.", en: 'First delivery through the kiln smoke.' } },
  { id: 's-villechaudron', name: { fr: 'Villechaudron', en: 'Kettleby' }, description: { fr: "Première livraison aux cent marteaux.", en: 'First delivery to the hundred hammers.' } },
  { id: 's-les-scieries', name: { fr: 'Les Scieries', en: 'Millhurst' }, description: { fr: "Première livraison sur le parc à grumes.", en: 'First delivery on the log yard.' } },
  { id: 's-sonnefeuille', name: { fr: 'Sonnefeuille', en: 'Ringleaf' }, description: { fr: "Première livraison dans le verger des moines, au son des cloches.", en: "First delivery to the monks' orchard, to the sound of bells." } },
  { id: 's-vert-de-gris', name: { fr: 'Vert-de-Gris', en: 'Verdigris' }, description: { fr: "Première livraison à la mine verte.", en: 'First delivery to the green mine.' } },
  { id: 's-le-hetre-roi', name: { fr: 'Le Hêtre-Roi', en: 'Kingbeech' }, description: { fr: "Première livraison au cœur de la forêt.", en: 'First delivery to the heart of the forest.' } },
  { id: 's-clairiere', name: { fr: 'Dans la clairière', en: 'Into the clearing' }, description: { fr: "Le premier atterrissage de la compagnie entre les arbres.", en: "The company's first landing among the trees." } },
  // Les saisons : une page pour la première livraison de chacune, et une pour l'année entière
  { id: 's-printemps', name: { fr: 'Premier printemps', en: 'First spring' }, description: { fr: "Une livraison au-dessus des vergers en fleur.", en: 'A delivery over the orchards in blossom.' } },
  { id: 's-ete', name: { fr: 'Premier été', en: 'First summer' }, description: { fr: "Une livraison sous un ciel sans brume.", en: 'A delivery under a sky without fog.' } },
  { id: 's-automne', name: { fr: 'Premier automne', en: 'First autumn' }, description: { fr: "Une livraison dans les feuilles rousses.", en: 'A delivery through the copper leaves.' } },
  { id: 's-hiver', name: { fr: 'Premier hiver', en: 'First winter' }, description: { fr: "Une livraison dans la neige, les mains dans les poches.", en: 'A delivery through the snow, hands in pockets.' } },
  { id: 's-annee', name: { fr: 'Une année', en: 'A year' }, description: { fr: "Quatre saisons sur la piste de la Croisette. Le chemin vous connaît.", en: 'Four seasons on the Crosslet strip. The lane knows you now.' } },
  // Le fret lourd
  { id: 's-convoi', name: { fr: 'Le premier convoi', en: 'The first convoy' }, description: { fr: "Deux avions partis ensemble pour un seul courrier, et rentrés ensemble.", en: 'Two planes out together for a single load, and home together.' } },
  { id: 's-fonderie', name: { fr: 'La coulée', en: 'The pour' }, description: { fr: "Le bronze est arrivé à Sonnefeuille. Frère Anselme a rallumé le four.", en: 'The bronze has reached Ringleaf. Brother Anselm has lit the furnace again.' } },
  { id: 's-cloche', name: { fr: 'La cloche de Sainte-Lueur', en: 'The Glimmerkirk bell' }, description: { fr: "Elle sonne au-dessus de l'eau quand le courrier arrive. Les enfants ne comptent plus les hublots.", en: "It rings out over the water when the mail comes in. The children don't count portholes any more." } },
  { id: 's-foret', name: { fr: 'Toute la forêt', en: 'The whole wood' }, description: { fr: "Les six clairières ont reçu votre courrier. Sous les hêtres, on connaît maintenant le bruit de votre moteur.", en: 'All six clearings have had your mail. Under the beeches, they know the sound of your engine now.' } },
];
