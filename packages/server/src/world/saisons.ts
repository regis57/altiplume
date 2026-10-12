/**
 * Les saisons, ce qu'elles disent et ce qu'elles changent.
 *
 * Quatre règles, une par saison, et aucune qui punisse l'absence : l'hiver
 * rallonge les vols mais le courrier y vaut plus cher ; l'été chasse la brume ;
 * l'automne la ramène ; le printemps remplit les sacs de semences. Le reste est
 * dans la scène : les vergers en fleur, les feuilles rousses, la neige sur le toit.
 */
import type { SeasonDef } from './types.ts';

export const SEASONS: readonly SeasonDef[] = [
  {
    id: 'printemps',
    name: { fr: 'Printemps', en: 'Spring' },
    tagline: { fr: 'Les vergers en fleur, et des semences dans tous les sacs.', en: 'Orchards in blossom, and seed in every bag.' },
    effects: { seedsWeight: 2 },
  },
  {
    id: 'ete',
    name: { fr: 'Été', en: 'Summer' },
    tagline: { fr: 'Les jours longs, le ciel clair : la brume et le vent de mer se font rares.', en: 'Long days, clear skies: fog and sea wind keep away.' },
    effects: { fogRisk: 0.5, seawindRisk: 0.5 },
  },
  {
    id: 'automne',
    name: { fr: 'Automne', en: 'Autumn' },
    tagline: { fr: 'La forêt devient rousse, la brume revient, le cidre est nouveau.', en: 'The wood turns copper, the fog comes back, the cider is new.' },
    effects: { fogRisk: 1.5 },
  },
  {
    id: 'hiver',
    name: { fr: 'Hiver', en: 'Winter' },
    tagline: { fr: 'La neige rallonge les vols, et le courrier vaut plus cher.', en: 'Snow makes flights longer, and the mail is worth more.' },
    effects: { duration: 1.15, reward: 1.2 },
  },
];
