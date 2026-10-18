/**
 * Les traits des pilotes. Deux par pilote ; chacun change un chiffre de la
 * simulation, jamais seulement une phrase. Noms et descriptions sont invariables en
 * genre : un trait se porte aussi bien par une femme que par un homme (règle du 14/10).
 */
import type { Trait } from './types.ts';

export const TRAITS: readonly Trait[] = [
  {
    id: 'nightowl',
    name: { fr: 'Nocturne', en: 'Night Owl' },
    description: { fr: "Plus à l'aise la nuit que le jour. Les pistes aux lanternes ne lui font pas peur.", en: 'More at ease by night than by day. Lantern-lit strips hold no fear.' },
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
    description: { fr: "Sent venir la brume et le grain avant qu'ils soient là. Brouillard et vent de mer retardent ce pilote deux fois moins souvent.", en: 'Feels fog and squalls coming before they arrive. Fog and sea wind hold this pilot up half as often.' },
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
    description: { fr: "Préfère les vols courts et rentrer dîner. Se fatigue un quart plus vite hors des Vallées de Brume, mais attire les bonnes cartes : un peu plus de chance pour la compagnie.", en: 'Prefers short hops and being home for dinner. Tires a quarter faster once out of Mistvale, but draws the good cards: a little more luck for the company.' },
    // Loin de chez soi, c'est hors de la région de l'aérodrome (règle du 18/10 : avant,
    // la fatigue × 1,25 pesait sur tous les vols, même le saut à Pont-de-Brume).
    effects: { fatigueAway: 1.25, luck: 1.05 },
  },
  {
    id: 'luckycharm',
    name: { fr: 'Porte-bonheur', en: 'Lucky Charm' },
    description: { fr: "Les bonnes cartes suivent ce pilote. Un peu plus d'occasions, un peu moins d'imprévus.", en: 'Good cards follow this pilot around. A few more opportunities, a few fewer mishaps.' },
    effects: { luck: 1.15 },
  },
];
