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
];

export const DECORATIONS: readonly Decoration[] = [
  { id: 'd-fleurs', cost: 20, morale: 1, name: { fr: 'Jardinières', en: 'Flower boxes' }, description: { fr: "Des géraniums sous les fenêtres du hangar. Marthe dit que ça ne sert à rien. Elle les arrose.", en: 'Geraniums under the hangar windows. Martha says they are pointless. She waters them.' } },
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
  { id: 's-vallee', name: { fr: 'Toute la vallée', en: 'The whole valley' }, description: { fr: "Les six villages des Vallées de Brume ont reçu votre courrier. La route des Hauts-Plateaux attend.", en: 'All six villages of Mistvale have had your mail. The plateau road awaits.' } },
];
