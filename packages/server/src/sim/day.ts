/**
 * Découpage du temps en « jours de jeu ».
 *
 * Un jour de jeu dure 24 heures réelles et commence à l'époque du projet. On
 * raisonne en numéro de jour plutôt qu'en date pour que le tirage des cartes ne
 * dépende ni du fuseau du joueur ni de celui du serveur : deux joueurs au même
 * instant sont le même jour, où qu'ils soient.
 */

/** Époque du projet : 1er janvier 2026, 00:00 UTC. */
export const EPOCH_MS = Date.UTC(2026, 0, 1);

const DAY_MS = 86_400_000;

/** Numéro du jour de jeu à l'instant donné. Peut être négatif avant l'époque. */
export function gameDayIndex(now: number, epochMs: number = EPOCH_MS): number {
  if (!Number.isFinite(now)) throw new RangeError('now doit être un nombre fini');
  return Math.floor((now - epochMs) / DAY_MS);
}

/** Instant du début du jour de jeu donné. */
export function startOfGameDay(dayIndex: number, epochMs: number = EPOCH_MS): number {
  return epochMs + dayIndex * DAY_MS;
}

/** Millisecondes restantes avant le prochain jour de jeu. */
export function msUntilNextGameDay(now: number, epochMs: number = EPOCH_MS): number {
  return startOfGameDay(gameDayIndex(now, epochMs) + 1, epochMs) - now;
}
