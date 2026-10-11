/**
 * La Côte de Saline — la deuxième région.
 *
 * Au bout de la vallée, la route descend vers la mer : des marais salants
 * découpés en bassins, un port qui sent le goudron, un phare sur ses brisants et
 * deux îles qu'on n'atteint qu'en se posant sur l'eau. Le vent de mer est franc
 * et change d'avis ; les pistes sont courtes parce que la terre est chère.
 *
 * La route s'ouvre quand toute la vallée a reçu votre courrier, contre dix
 * cachets : c'est le prix d'une carte marine et d'un bail sur un bout de quai.
 */
import type { Destination, Region } from './types.ts';

export const SALINE: Region = {
  id: 'saline',
  name: { fr: 'Côte de Saline', en: 'Saltshore' },
  tagline: { fr: 'Là où la route finit et où le courrier continue.', en: 'Where the road ends and the mail carries on.' },
  description: {
    fr: "Des marais salants blancs comme de la craie, un port, un phare, deux îles. Le vent vient de la mer et ne prévient pas. Trois des six escales sont des plans d'eau : il faudra un hydravion.",
    en: 'Salt pans white as chalk, a harbour, a lighthouse, two islands. The wind comes off the sea and gives no warning. Three of the six stops are open water: you will need a seaplane.',
  },
  palette: { sky: '#e6edf0', ground: '#d8d1b6', accent: '#4fb3b0' },
  route: { requires: 's-vallee', cost: 10 },
};

/**
 * Six escales, de la plus proche à la plus lointaine. Les distances continuent
 * celles de la vallée : la Combe-aux-Rosées est à 6 lieues, Port-Sel à 7,5.
 * Deux se font avec les avions de la vallée, une demande le Martinet, trois
 * demandent la Sterne.
 */
export const SALINE_DESTINATIONS: readonly Destination[] = [
  {
    id: 'port-sel', region: 'saline',
    name: { fr: 'Port-Sel', en: 'Saltharbour' },
    description: {
      fr: "Le port de la Côte : des quais de pierre, des barques retournées, la capitainerie qui fait aussi bureau de poste. Tout ce qui part vers les îles passe par ici.",
      en: 'The Shore\'s harbour: stone quays, upturned boats, a harbourmaster\'s office that doubles as the post office. Everything bound for the islands comes through here.',
    },
    distance: 7.5, runway: 'medium', hazard: 'seawind', mail: ['letters', 'parcels', 'salt', 'urgent'], firstDeliveryStamps: 2,
  },
  {
    id: 'les-oeillets', region: 'saline',
    name: { fr: 'Les Œillets', en: 'Panbrook' },
    description: {
      fr: "Les bassins des salines, qu'on appelle des œillets, et le village des sauniers au milieu. La piste est une digue. On y apporte des semences de jardin et on en repart avec du sel gris.",
      en: 'The salt-pan basins and the salters\' village in the middle of them. The strip is a dyke. You bring garden seeds and leave with grey salt.',
    },
    distance: 7.9, runway: 'short', hazard: 'none', mail: ['salt', 'seeds', 'letters'], firstDeliveryStamps: 2,
  },
  {
    id: 'marais-blanc', region: 'saline',
    name: { fr: 'Marais-Blanc', en: 'Whitefen' },
    description: {
      fr: "Un bourg sur pilotis au bord des marais, avec un dispensaire et une brume de sel qui traîne le matin. La piste est roulée sur la seule terre ferme.",
      en: 'A town on stilts at the edge of the fens, with a clinic and a salt haze that lingers in the morning. The strip is rolled on the only firm ground.',
    },
    distance: 9.6, runway: 'medium', hazard: 'fog', mail: ['medicine', 'letters', 'salt', 'parcels'], firstDeliveryStamps: 2,
  },
  {
    id: 'anse-aux-goemons', region: 'saline',
    name: { fr: 'Anse-aux-Goémons', en: 'Wrackcove' },
    description: {
      fr: "Une anse abritée où l'on ramasse le goémon et les coquillages. Pas de piste : on se pose sur l'eau, entre les bouées, et une barque vient chercher le sac.",
      en: 'A sheltered cove where they gather wrack and shellfish. No strip: you land on the water between the buoys, and a rowing boat comes for the bag.',
    },
    distance: 10.5, runway: 'water', hazard: 'seawind', mail: ['shellfish', 'letters', 'fragile'], firstDeliveryStamps: 3,
  },
  {
    id: 'phare-de-brisant', region: 'saline',
    name: { fr: 'Phare de Brisant', en: 'Breaker Light' },
    description: {
      fr: "Le phare sur ses rochers, et les deux gardiens qui s'y relaient. Le courrier se pose dans la passe, côté abrité, et la nuit on vise la lumière.",
      en: 'The lighthouse on its rocks, and the two keepers who take turns. The mail lands in the channel on the lee side; at night you aim for the light.',
    },
    distance: 11.5, runway: 'water', hazard: 'night', mail: ['letters', 'parts', 'urgent'], firstDeliveryStamps: 3,
  },
  {
    id: 'ile-sainte-ambre', region: 'saline',
    name: { fr: 'Île Sainte-Ambre', en: 'Amber Holm' },
    description: {
      fr: "L'île au large, avec son village de pêcheurs et sa chapelle. On y attend les lettres plus qu'ailleurs, parce qu'elles mettent plus longtemps.",
      en: 'The island offshore, with its fishing village and its chapel. Letters are waited for more here than anywhere, because they take longer.',
    },
    distance: 13, runway: 'water', hazard: 'seawind', mail: ['loveletters', 'letters', 'fragile', 'shellfish'], firstDeliveryStamps: 3,
  },
];
