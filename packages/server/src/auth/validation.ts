/**
 * Validation des entrées d'inscription.
 *
 * Tout ce qui vient du navigateur passe par ici avant de toucher la base. Les
 * messages d'erreur sont des codes stables, traduits côté client.
 */

import { EXCEPTIONS, MOTS, RACINES } from './pseudonymes-interdits.ts';

export type ValidationError =
  | 'email_invalid'
  | 'nickname_too_short'
  | 'nickname_too_long'
  | 'nickname_invalid_chars'
  | 'nickname_reserved'
  | 'nickname_offensive'
  | 'locale_unsupported'
  | 'age_not_confirmed'
  | 'terms_not_accepted';

export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 20;

/** Version courante des CGU ; à incrémenter à chaque changement substantiel. */
export const TERMS_VERSION = '2026-10-11';

/**
 * Normalise une adresse : minuscules, espaces retirés. On ne « corrige » rien
 * d'autre : une adresse est un identifiant, pas un texte.
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Validation volontairement simple : un @, quelque chose de chaque côté, un point après. */
export function isValidEmail(email: string): boolean {
  if (email.length < 6 || email.length > 254) return false;
  if (/\s/.test(email)) return false;
  const at = email.indexOf('@');
  if (at < 1 || at !== email.lastIndexOf('@')) return false;
  const domain = email.slice(at + 1);
  return domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.');
}

/** Lettres (toutes écritures), chiffres, espace simple, tiret, apostrophe. */
const NICKNAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} '-]*[\p{L}\p{N}]$/u;

/** Noms qui prêteraient à confusion avec le jeu ou son équipe. */
const RESERVED = new Set([
  'altiplume', 'admin', 'administrateur', 'administrator', 'moderateur', 'moderator',
  'modérateur', 'support', 'systeme', 'système', 'system', 'root', 'staff', 'equipe',
  'équipe', 'team', 'officiel', 'official',
]);

/**
 * Les pseudonymes refusés vivent dans pseudonymes-interdits.ts, en trois familles :
 * les racines cherchées partout, les mots refusés seulement entiers, et les
 * exceptions (Nazir, Benazir, salopette…). Repliées une fois ici, comme le pseudonyme.
 */
const OFFENSIVE_ANYWHERE = RACINES.map(foldNickname);
const OFFENSIVE_WORDS = new Set(MOTS.map(foldNickname));
const OFFENSIVE_EXCEPTIONS = new Set(EXCEPTIONS.map(foldNickname));

/**
 * Forme repliée, pour l'unicité et les listes : sans accents ni casse, chiffres-lettres
 * remplacés, ponctuation et espaces retirés. Les lettres de toutes les écritures
 * restent : « Олег » et « Мария » sont deux noms, pas deux chaînes vides.
 */
export function foldNickname(nickname: string): string {
  return nickname
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/3/g, 'e').replace(/1/g, 'i').replace(/0/g, 'o').replace(/4/g, 'a').replace(/5/g, 's')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/** Sans accents, casse ni ponctuation, mais les chiffres restent des chiffres (« 88 »). */
function plainFold(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function validateNickname(raw: string): ValidationError | null {
  const nickname = raw.trim().replace(/\s+/g, ' ');
  if (nickname.length < NICKNAME_MIN) return 'nickname_too_short';
  if (nickname.length > NICKNAME_MAX) return 'nickname_too_long';
  if (!NICKNAME_RE.test(nickname)) return 'nickname_invalid_chars';
  const folded = foldNickname(nickname);
  if (RESERVED.has(nickname.toLowerCase()) || RESERVED.has(folded)) return 'nickname_reserved';
  // Les mots du pseudonyme, séparés par espace, tiret, apostrophe.
  const pieces = nickname.split(/[ '-]+/).filter(Boolean);
  const parts = pieces.map(foldNickname);
  // Les racines, partout dans chaque mot — même collées (« xXnaziXx ») —, une fois
  // retirés les mots entiers qui sont des exceptions : « Nazir » passe, « Nazir Nazi »
  // non. Un mot ne se recolle à son voisin que si les deux sont des bribes de trois
  // lettres au plus : « Na Zi » et « Hit Ler » sont refusés, mais « Ana Zimmer » et
  // « Anna Zinn » sont des noms, pas « nazi » écartelé. Les racines longues (sept
  // lettres et plus : « White Power », « Sieg Heil ») se cherchent aussi dans le
  // pseudonyme recollé : à cette longueur, deux noms ne les forment pas par hasard.
  const kept = parts.filter((p) => !OFFENSIVE_EXCEPTIONS.has(p));
  const joined = kept.join('');
  if (OFFENSIVE_ANYWHERE.some((root) => root.length >= 7 && joined.includes(root))) return 'nickname_offensive';
  const searched = [...kept];
  for (let i = 0; i < kept.length; i += 1) {
    let run = '';
    for (let j = i; j < kept.length && kept[j]!.length <= 3; j += 1) {
      run += kept[j];
      if (j > i) searched.push(run);
    }
  }
  if (OFFENSIVE_ANYWHERE.some((root) => searched.some((w) => w.includes(root)))) return 'nickname_offensive';
  // Mots entiers seulement : le pseudonyme entier, ou l'un de ses mots. Sinon « pd »
  // bloquerait « Édouard », « viol » « Violaine ». Les chiffres ne valent des lettres
  // que dans un mot qui a des lettres : « V1ol » est « viol », « S5 » est « ss », mais
  // « Agent 55 » n'est pas « Agent SS ».
  const candidates = [nickname, ...pieces].flatMap((p) => /\p{L}/u.test(p) ? [foldNickname(p), plainFold(p)] : [plainFold(p)]);
  if (candidates.some((p) => OFFENSIVE_WORDS.has(p))) return 'nickname_offensive';
  return null;
}

export function cleanNickname(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
