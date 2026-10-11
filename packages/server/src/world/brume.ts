/**
 * Les Vallées de Brume — la région de départ.
 *
 * Une vallée douce et verte où le brouillard du matin met du temps à se lever.
 * L'aérodrome du joueur est au bout du chemin de la Croisette : une petite croix
 * de pierre, à la fourche où le chemin quitte le village, marque l'endroit depuis
 * toujours. Les pilotes la touchent du doigt avant de partir. Personne ne sait
 * plus pourquoi ; tout le monde le fait.
 */
import type { Destination, Region, Text } from './types.ts';

export const BRUME: Region = {
  id: 'brume',
  name: { fr: 'Vallées de Brume', en: 'Mistvale' },
  tagline: { fr: 'Là où le courrier apprend à voler.', en: 'Where the mail learns to fly.' },
  description: {
    fr: "Une vallée douce, des vergers, une rivière lente et un brouillard qui s'attarde jusqu'à dix heures. Six villages, un pont, un moulin, et des gens qui attendent leurs lettres.",
    en: 'A gentle valley, orchards, a slow river and a fog that lingers until ten. Six villages, a bridge, a mill, and people waiting for their letters.',
  },
  palette: { sky: '#cfd8dd', ground: '#7f9a6c', accent: '#6e8b7a' },
};

export const HOME: { name: Text; address: Text; description: Text } = {
  name: { fr: 'Aérodrome de la Croisette', en: 'Crosslet Field' },
  address: { fr: 'Chemin de la Croisette, Vallées de Brume', en: 'Crosslet Lane, Mistvale' },
  description: {
    fr: "Une piste en herbe au bout du chemin de la Croisette, un hangar dont la porte ferme mal, et la petite croix de pierre à la fourche du chemin, que les pilotes touchent avant de décoller. Vous en héritez tel quel.",
    en: 'A grass strip at the end of Crosslet Lane, a hangar whose door never quite shuts, and the little stone cross at the fork in the lane that pilots touch before take-off. It is yours now, as is.',
  },
};

/**
 * Six destinations, de la plus proche à la plus lointaine. Les distances sont en
 * lieues ; avec le biplan de départ (12 lieues/h), Pont-de-Brume est à 5 minutes
 * et la Combe-aux-Rosées à une demi-heure.
 */
export const DESTINATIONS: readonly Destination[] = [
  {
    id: 'pont-de-brume', region: 'brume',
    name: { fr: 'Pont-de-Brume', en: 'Mistbridge' },
    description: {
      fr: "La ville de marché, de l'autre côté de la rivière. On y porte les lettres de toute la vallée et on en rapporte le journal du matin, encore humide.",
      en: 'The market town across the river. The whole valley\'s letters go through here, and the morning paper comes back still damp.',
    },
    distance: 1, runway: 'medium', hazard: 'none', mail: ['letters', 'newspapers', 'parcels', 'urgent'], firstDeliveryStamps: 1,
  },
  {
    id: 'les-tilleuls', region: 'brume',
    name: { fr: 'Les Tilleuls', en: 'Lindenhollow' },
    description: {
      fr: "Un hameau dans les vergers. La piste est un pré ; les vaches ont la priorité. On y livre des semences et on en repart avec du miel.",
      en: 'A hamlet in the orchards. The strip is a meadow; the cows have right of way. You bring seeds and leave with honey.',
    },
    distance: 1.6, runway: 'short', hazard: 'none', mail: ['seeds', 'parcels', 'letters'], firstDeliveryStamps: 1,
  },
  {
    id: 'moulin-gris', region: 'brume',
    name: { fr: 'Moulin-Gris', en: 'Greymill' },
    description: {
      fr: "Le village du moulin, en aval, où la brume tient jusqu'à dix heures. Farine, tissu, et les lettres des meuniers, qui écrivent beaucoup.",
      en: 'The mill village downstream, where the fog holds until ten. Flour, cloth, and the millers\' letters — they write a great deal.',
    },
    distance: 2.2, runway: 'medium', hazard: 'fog', mail: ['letters', 'parcels', 'fragile'], firstDeliveryStamps: 1,
  },
  {
    id: 'haut-ferrand', region: 'brume',
    name: { fr: 'Haut-Ferrand', en: 'Ferncrest' },
    description: {
      fr: "Un village perché avec une forge. Piste courte sur la crête, vent de travers. On y monte des pièces de machine et on en redescend des outils.",
      en: 'A perched village with a forge. Short strip on the ridge, crosswind. Machine parts go up; tools come down.',
    },
    distance: 2.8, runway: 'short', hazard: 'ridge', mail: ['parts', 'parcels', 'letters', 'urgent'], firstDeliveryStamps: 2,
  },
  {
    id: 'lanterne-du-val', region: 'brume',
    name: { fr: 'Lanterne-du-Val', en: 'Lanternhollow' },
    description: {
      fr: "Un village au bord de l'eau, qui allume des lanternes le long de sa piste dès le soir. C'est là qu'arrive la poste du soir — et les lettres d'amour, dit-on.",
      en: 'A village by the water that lights lanterns along its strip at dusk. The evening post lands here — and the love letters, they say.',
    },
    distance: 3.6, runway: 'medium', hazard: 'night', mail: ['loveletters', 'letters', 'fragile'], firstDeliveryStamps: 2,
  },
  {
    id: 'combe-aux-rosees', region: 'brume',
    name: { fr: 'Combe-aux-Rosées', en: 'Dewcombe' },
    description: {
      fr: "Le bout de la vallée, là où la route des Hauts-Plateaux commence à grimper. Une longue piste, un dispensaire, des gens qui attendent des médicaments et des nouvelles.",
      en: 'The far end of the valley, where the road to the high plateaus begins to climb. A long strip, a clinic, and people waiting for medicine and news.',
    },
    distance: 6, runway: 'long', hazard: 'wind', mail: ['medicine', 'urgent', 'letters', 'parcels'], firstDeliveryStamps: 3,
  },
];
