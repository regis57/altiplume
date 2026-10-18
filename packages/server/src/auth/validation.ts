/**
 * Validation des entrées d'inscription.
 *
 * Tout ce qui vient du navigateur passe par ici avant de toucher la base. Les
 * messages d'erreur sont des codes stables, traduits côté client.
 */

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
 * Liste d'exclusion minimale. Elle n'a pas vocation à être exhaustive — aucune
 * liste ne l'est — mais à écarter l'évident. Comparaison sans accents ni casse,
 * chiffres usuels remplacés (3→e, 1→i, 0→o, 4→a, 5→s).
 *
 * Deux listes. Les mots sans ambiguïté sont cherchés partout, même collés
 * (« xXnaziXx »). Ceux qui se cachent dans des mots ordinaires ne comptent que
 * comme mots entiers : « viol » est dans « Violette », « rape » dans « Drapeau »,
 * « pute » dans « Computer », « porn » dans « Pornic ».
 */
const OFFENSIVE_ANYWHERE = [
  'nazi', 'hitler', 'nigger', 'negre', 'nègre', 'salope', 'connard', 'connasse',
  'encule', 'enculé', 'tapette', 'bougnoule', 'youpin', 'faggot', 'whore', 'pedo', 'pédo',
];
const OFFENSIVE_WORDS = [
  'pute', 'fdp', 'ntm', 'pd', 'retard', 'rape', 'viol', 'cunt', 'bitch', 'porn', 'sex',
];

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

export function validateNickname(raw: string): ValidationError | null {
  const nickname = raw.trim().replace(/\s+/g, ' ');
  if (nickname.length < NICKNAME_MIN) return 'nickname_too_short';
  if (nickname.length > NICKNAME_MAX) return 'nickname_too_long';
  if (!NICKNAME_RE.test(nickname)) return 'nickname_invalid_chars';
  const folded = foldNickname(nickname);
  if (RESERVED.has(nickname.toLowerCase()) || RESERVED.has(folded)) return 'nickname_reserved';
  for (const word of OFFENSIVE_ANYWHERE) {
    if (folded.includes(foldNickname(word))) return 'nickname_offensive';
  }
  // Mots entiers seulement : le pseudonyme entier, ou l'un de ses mots (séparés par
  // espace, tiret, apostrophe). Sinon « pd » bloquerait « Édouard », « viol » « Violaine ».
  const words = new Set([folded, ...nickname.split(/[ '-]+/).map(foldNickname)]);
  for (const word of OFFENSIVE_WORDS) {
    if (words.has(foldNickname(word))) return 'nickname_offensive';
  }
  return null;
}

export function cleanNickname(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
