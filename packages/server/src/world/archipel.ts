/**
 * L'Archipel des Lanternes — la troisième région.
 *
 * Au large de la Côte, une chaîne d'îles basses où chaque village allume ses
 * lanternes à la tombée du jour, parce que la poste y arrive le soir : la
 * journée appartient aux bateaux, la nuit au courrier. On s'y pose sur l'eau,
 * partout. C'est la région des vols de nuit, celle où un pilote Nocturne vaut
 * son pesant de sel.
 *
 * La route s'ouvre quand toute la Côte a reçu votre courrier, contre quinze
 * cachets : la carte des passes, et une lanterne de cuivre pour votre piste.
 */
import type { Destination, Region } from './types.ts';

export const ARCHIPEL: Region = {
  id: 'archipel',
  name: { fr: 'Archipel des Lanternes', en: 'Lantern Isles' },
  tagline: { fr: 'Le jour aux bateaux, la nuit au courrier.', en: 'The day belongs to the boats, the night to the mail.' },
  description: {
    fr: "Six îles basses au large de la Côte, et une lanterne au bout de chaque ponton. La poste y arrive le soir ; on vise la lumière. Tout se pose sur l'eau, et presque tout se vole de nuit.",
    en: 'Six low islands off the Shore, and a lantern at the end of every jetty. The mail comes in the evening; you aim for the light. Everything lands on water, and almost everything flies at night.',
  },
  palette: { sky: '#1f2d4a', ground: '#2a3a46', accent: '#f0a848' },
  route: { requires: 's-cote', cost: 15 },
};

/**
 * Six escales, toutes sur l'eau, de 14 à 19 lieues. La Sterne y va avec un
 * pilote de Longues routes ; le Goéland, l'hydravion long-courrier, y va avec
 * tout le monde.
 */
export const ARCHIPEL_DESTINATIONS: readonly Destination[] = [
  {
    id: 'ile-aux-fanaux', region: 'archipel',
    name: { fr: 'Île-aux-Fanaux', en: 'Beacon Holm' },
    description: {
      fr: "La première île, celle qu'on voit depuis le phare de Brisant. Son ponton a douze lanternes, une par famille, et chacune a sa couleur.",
      en: 'The first island, the one you can see from Breaker Light. Its jetty has twelve lanterns, one per family, each its own colour.',
    },
    distance: 14, runway: 'water', hazard: 'night', mail: ['letters', 'parcels', 'loveletters'], firstDeliveryStamps: 3,
  },
  {
    id: 'grand-recif', region: 'archipel',
    name: { fr: 'Grand-Récif', en: 'Long Reef' },
    description: {
      fr: "Un village de pêcheurs posé sur un récif qui affleure à marée basse. On se pose dans le lagon, côté calme, et on repart avant que la mer descende.",
      en: 'A fishing village set on a reef that shows at low tide. You land in the lagoon on the calm side, and leave before the sea goes down.',
    },
    distance: 15, runway: 'water', hazard: 'seawind', mail: ['shellfish', 'letters', 'parts'], firstDeliveryStamps: 3,
  },
  {
    id: 'sainte-lueur', region: 'archipel',
    name: { fr: 'Sainte-Lueur', en: 'Glimmerkirk' },
    description: {
      fr: "L'île de la chapelle et de l'école. Les enfants attendent le courrier sur le ponton avec leurs lanternes, et comptent les hublots.",
      en: 'The island of the chapel and the school. The children wait for the mail on the jetty with their lanterns, counting the portholes.',
    },
    distance: 16, runway: 'water', hazard: 'night', mail: ['letters', 'newspapers', 'parcels', 'medicine', 'fragile'], firstDeliveryStamps: 3,
  },
  {
    id: 'le-rocher-noir', region: 'archipel',
    name: { fr: 'Le Rocher-Noir', en: 'Blackstack' },
    description: {
      fr: "Un rocher, une tour de guet, trois guetteurs et un chien. Ils signalent les tempêtes à toute la chaîne. On leur porte des pièces, du tabac et des journaux vieux d'une semaine.",
      en: 'A rock, a watchtower, three watchers and a dog. They signal storms to the whole chain. You bring them parts, tobacco and week-old newspapers.',
    },
    distance: 17, runway: 'water', hazard: 'seawind', mail: ['parts', 'newspapers', 'letters', 'urgent'], firstDeliveryStamps: 3,
  },
  {
    id: 'anse-des-lanternes', region: 'archipel',
    name: { fr: 'Anse-des-Lanternes', en: 'Lanterncove' },
    description: {
      fr: "La grande île, le bourg, la fabrique de lanternes qui éclaire tout l'archipel et jusqu'à Lanterne-du-Val. La poste du soir y a son bureau, ouvert jusqu'à minuit.",
      en: 'The big island, the town, the lantern works that lights the whole archipelago and Lanternhollow besides. The evening post has its office here, open till midnight.',
    },
    distance: 18, runway: 'water', hazard: 'night', mail: ['letters', 'parcels', 'fragile', 'urgent'], firstDeliveryStamps: 3,
  },
  {
    id: 'ile-du-bout', region: 'archipel',
    name: { fr: "Île-du-Bout", en: 'Lastholm' },
    description: {
      fr: "La dernière île. Après, il n'y a plus que la mer et, dit-on, le Grand Blanc. Une seule lanterne, mais on la voit de loin.",
      en: 'The last island. Beyond it there is only the sea and, they say, the Great White. A single lantern, but you can see it from far off.',
    },
    distance: 19, runway: 'water', hazard: 'night', mail: ['letters', 'loveletters', 'fragile'], firstDeliveryStamps: 3,
  },
];
