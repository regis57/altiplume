/**
 * Aléatoire déterministe, calculé côté serveur.
 *
 * Le tirage des cartes du jour doit être reproductible : rejouable pour déboguer,
 * auditable en cas de litige, et impossible à influencer depuis le navigateur. On
 * dérive donc une graine d'un triplet stable (joueur, jour, usage) plutôt que de
 * tirer au hasard et de stocker le résultat.
 *
 * Ce n'est pas un générateur cryptographique et ne doit jamais servir à produire un
 * jeton, un secret ou un identifiant de session : pour cela, `node:crypto`.
 */
import { createHash } from 'node:crypto';

/** Fonction rendant un flottant dans [0, 1). */
export type Rng = () => number;

/**
 * Dérive une graine 32 bits d'un triplet stable.
 *
 * @param playerId Identifiant du joueur.
 * @param dayIndex Numéro du jour de jeu (voir `gameDayIndex`).
 * @param purpose Usage, pour que deux tirages du même jour ne soient pas corrélés.
 */
export function deriveSeed(playerId: string, dayIndex: number, purpose: string): number {
  const digest = createHash('sha256')
    .update(`${playerId}\u0000${dayIndex}\u0000${purpose}`)
    .digest();
  return digest.readUInt32BE(0);
}

/**
 * Générateur mulberry32 : court, rapide, de bonne qualité statistique pour un usage
 * de jeu, et surtout identique sur toutes les plateformes.
 */
export function makeRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entier dans [min, max], bornes incluses. */
export function randomInt(rng: Rng, min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError('min et max doivent être entiers');
  }
  if (max < min) throw new RangeError('max doit être supérieur ou égal à min');
  return min + Math.floor(rng() * (max - min + 1));
}

/** Un élément du tableau. Lève si le tableau est vide. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new RangeError('impossible de tirer dans un tableau vide');
  const item = items[randomInt(rng, 0, items.length - 1)];
  // noUncheckedIndexedAccess : l'index est borné, mais TypeScript l'ignore.
  return item as T;
}

/** Copie mélangée (Fisher-Yates). N'altère pas le tableau d'origine. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, 0, i);
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/** Tire `count` éléments distincts, ou tout le tableau s'il est plus court. */
export function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
  return shuffle(rng, items).slice(0, Math.max(0, count));
}
