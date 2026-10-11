/**
 * Générateur de noms de compagnie.
 *
 * Deux banques de mots NATIVES (fr, en), jamais de traduction automatique : un nom
 * français traduit sonne traduit. Chaque langue a ses propres motifs, ses propres
 * suffixes commerciaux et son propre registre d'époque.
 *
 * Le tirage est déterministe à partir d'une graine : les trois suggestions qu'un
 * joueur voit à la fondation sont rejouables.
 */
import type { Locale } from '../auth/validation.ts';
import { makeRng, pick, type Rng } from '../sim/rng.ts';

interface Bank {
  readonly words: Readonly<Record<string, readonly string[]>>;
  readonly patterns: readonly string[];
  readonly fallback: string;
}

const BANKS: Readonly<Record<Locale, Bank>> = {
  fr: {
    words: {
      adj: ['Dorée', 'Pâle', 'Haute', 'Vive', 'Lointaine', 'Sereine', 'Première', 'Vagabonde', 'Fidèle', 'Claire'],
      nom_f: ['Brume', 'Nuée', 'Aurore', 'Escale', 'Plume', 'Alizée', 'Lanterne', 'Rosée', 'Voile', 'Dérive'],
      nom_m: ['Zéphyr', 'Cachet', 'Laiton', 'Levant', 'Sillage', 'Fanal', 'Comptoir', 'Pli', 'Courant', 'Matin'],
      lieu: ['Brume', 'Saline', 'Ocre', 'Cuivre', 'Lanternes', 'Grand Blanc', 'Verre', 'Trois Vents', 'la Croisette'],
    },
    patterns: [
      '{nom_f} {adj} & Cie', '{nom_m} & Cie', 'Compagnie des {lieu}', 'Comptoir du {nom_m}', 'Messageries {nom_f}',
      'Lignes de {lieu}', '{nom_f} & Fils', 'Poste Aérienne {nom_f}', 'Les Ailes de {lieu}',
    ],
    fallback: 'Altiplume & Cie',
  },
  en: {
    words: {
      adj: ['Gilded', 'Pale', 'High', 'Far', 'Steady', 'First', 'Quiet', 'Wandering', 'Bright', 'Northern'],
      noun: ['Haze', 'Feather', 'Lantern', 'Beacon', 'Drift', 'Zephyr', 'Postmark', 'Brass', 'Morning', 'Wake'],
      place: ['Mistvale', 'Saltshore', 'Ochre Reach', 'Copperwood', 'Lantern Isles', 'Great White', 'Glass Flats', 'Three Winds', 'Crosslet'],
    },
    patterns: [
      '{adj} {noun} & Co.', '{noun}line Mail Co.', '{noun} Trading Co.', 'The {noun} Line', '{noun} & Sons',
      '{place} Airmail', '{adj} {noun} Airways', '{place} Post Company', 'Wings of {place}',
    ],
    fallback: 'Altiplume & Co.',
  },
};

/** Marques et noms réels à ne jamais produire ni accepter. À étoffer. */
const DENYLIST = [
  'cumulus', 'nimbus', 'aeropostale', 'air france', 'lufthansa', 'swissair', 'pan am', 'panam', 'sabena',
  'imperial airways', 'deutsche post', 'la poste', 'royal mail', 'fedex', 'dhl', 'ups', 'cathay', 'qantas',
  'iberia', 'alitalia', 'aeroflot', 'klm', 'british airways', 'easyjet', 'ryanair', 'boeing', 'airbus',
];

/** Minuscule sans accent ni ponctuation, pour la comparaison. */
export function foldName(s: string): string {
  return s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function isDeniedName(name: string): boolean {
  const f = ` ${foldName(name)} `;
  return DENYLIST.some((bad) => f.includes(` ${bad} `) || f.includes(bad.replace(/ /g, '')));
}

function fill(pattern: string, rng: Rng, bank: Bank): string {
  return pattern.replace(/\{(\w+)\}/g, (_m, key: string) => pick(rng, bank.words[key] ?? ['']));
}

/** Un nom plausible dans la langue demandée. */
export function generateName(locale: Locale, rng: Rng): string {
  const bank = BANKS[locale];
  for (let i = 0; i < 50; i += 1) {
    const name = fill(pick(rng, bank.patterns), rng, bank);
    if (!isDeniedName(name)) return name;
  }
  return bank.fallback;
}

/** `count` suggestions distinctes, reproductibles pour une même graine. */
export function suggestNames(locale: Locale, seed: number, count = 3): string[] {
  const rng = makeRng(seed);
  const out: string[] = [];
  let guard = 0;
  while (out.length < count && guard < 200) {
    guard += 1;
    const name = generateName(locale, rng);
    if (!out.includes(name)) out.push(name);
  }
  return out;
}

export const COMPANY_NAME_MIN = 3;
export const COMPANY_NAME_MAX = 40;

/** Nettoie un nom choisi par le joueur. Rend null s'il est inacceptable. */
export function cleanCompanyName(raw: string): string | null {
  const name = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (name.length < COMPANY_NAME_MIN || name.length > COMPANY_NAME_MAX) return null;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} '’&.-]*$/u.test(name)) return null;
  if (isDeniedName(name)) return null;
  return name;
}
