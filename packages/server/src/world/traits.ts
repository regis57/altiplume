/**
 * Les traits des pilotes. Deux par pilote ; chacun change un chiffre de la
 * simulation, jamais seulement une phrase. Les noms sont invariables en genre.
 */
import type { Trait } from './types.ts';

export const TRAITS: readonly Trait[] = [
  {
    id: 'nightowl',
    name: { fr: 'Nocturne', en: 'Night Owl' },
    description: { fr: "Vole de nuit comme de jour. Les pistes aux lanternes ne lui font pas peur.", en: 'Flies by night as well as by day. Lantern-lit strips hold no fear.' },
    effects: { nightRisk: 0.25 },
  },
  {
    id: 'thrifty',
    name: { fr: 'Économe', en: 'Thrifty' },
    description: { fr: "Tire le meilleur de chaque litre. Les vols coûtent moins cher.", en: 'Gets the most out of every litre. Flights cost less.' },
    effects: { fuel: 0.85 },
  },
  {
    id: 'daredevil',
    name: { fr: 'Tête brûlée', en: 'Daredevil' },
    description: { fr: "Pousse le moteur. Arrive plus tôt, use plus vite, et parfois casse.", en: 'Pushes the engine. Arrives sooner, wears things faster, sometimes breaks them.' },
    effects: { speed: 1.12, reliability: 0.92, wear: 1.2 },
  },
  {
    id: 'weathersense',
    name: { fr: 'Météo dans la peau', en: 'Weather Sense' },
    description: { fr: "Sent la brume venir avant qu'elle soit là. Le brouillard la retarde deux fois moins.", en: 'Feels the fog before it arrives. Fog delays her half as much.' },
    effects: { fogRisk: 0.5 },
  },
  {
    id: 'goldenhands',
    name: { fr: "Mains d'or", en: 'Golden Hands' },
    description: { fr: "Répare en vol avec du fil de fer. L'avion revient moins usé.", en: 'Fixes things in flight with wire. The plane comes back less worn.' },
    effects: { wear: 0.75, reliability: 1.04 },
  },
  {
    id: 'longhaul',
    name: { fr: 'Longues routes', en: 'Long Haul' },
    description: { fr: "Sait ménager la machine et l'homme sur les grandes étapes. Portée augmentée.", en: 'Knows how to pace plane and pilot over the long legs. Extended range.' },
    effects: { range: 1.2, fatigue: 0.85 },
  },
  {
    id: 'homeheart',
    name: { fr: 'Cœur de village', en: 'Home Heart' },
    description: { fr: "Préfère les vols courts et rentrer dîner. Fatigue vite loin de chez soi, mais remonte le moral de tout le monde.", en: 'Prefers short hops and being home for dinner. Tires quickly far from home, but lifts everyone\'s spirits.' },
    effects: { fatigue: 1.25, luck: 1.05 },
  },
  {
    id: 'luckycharm',
    name: { fr: 'Porte-bonheur', en: 'Lucky Charm' },
    description: { fr: "Les bonnes cartes la suivent. Un peu plus d'opportunités, un peu moins d'imprévus.", en: 'Good cards follow her around. A few more opportunities, a few fewer mishaps.' },
    effects: { luck: 1.15 },
  },
];
