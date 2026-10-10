/**
 * Résolution des vols « sans tick ».
 *
 * Aucune tâche de fond ne fait avancer les vols : l'état se déduit entièrement des
 * horodatages au moment où on le lit. Un vol parti à T pour une durée D est arrivé
 * dès que maintenant >= T + D, que le joueur se soit connecté ou non, que le serveur
 * ait tourné ou non.
 *
 * C'est ce qui permet au jeu de tenir sur un NAS domestique : quand personne ne joue,
 * il ne consomme rien. Et c'est ce qui garantit qu'une absence ne coûte jamais rien
 * au joueur — une règle de conception, pas un effet de bord.
 *
 * Toutes les fonctions sont pures : `now` est un paramètre, jamais une lecture
 * d'horloge interne. C'est ce qui les rend testables sans faire semblant.
 */

export type FlightStatus = 'en_route' | 'arrived';

export interface Flight {
  /** Instant du décollage, en millisecondes depuis l'époque Unix. */
  readonly departedAt: number;
  /** Durée du vol en millisecondes. Doit être strictement positive. */
  readonly durationMs: number;
}

export interface FlightState {
  readonly status: FlightStatus;
  /** Avancement dans [0, 1]. Vaut exactement 1 à l'arrivée. */
  readonly progress: number;
  /** Instant d'arrivée prévu, en millisecondes depuis l'époque Unix. */
  readonly arrivesAt: number;
  /** Millisecondes restantes, 0 si le vol est arrivé. */
  readonly remainingMs: number;
}

export class InvalidFlightError extends Error {}

/**
 * Calcule l'état d'un vol à un instant donné.
 *
 * @param flight Le vol, tel qu'il est stocké en base.
 * @param now L'instant d'observation, en millisecondes depuis l'époque Unix.
 */
export function flightState(flight: Flight, now: number): FlightState {
  const { departedAt, durationMs } = flight;

  if (!Number.isFinite(departedAt)) {
    throw new InvalidFlightError('departedAt doit être un nombre fini');
  }
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new InvalidFlightError('durationMs doit être un nombre fini strictement positif');
  }
  if (!Number.isFinite(now)) {
    throw new InvalidFlightError('now doit être un nombre fini');
  }

  const arrivesAt = departedAt + durationMs;

  // Une horloge qui recule (ajustement NTP, serveur redémarré) ne doit pas produire
  // un avancement négatif : on borne des deux côtés.
  const elapsed = Math.min(Math.max(now - departedAt, 0), durationMs);
  const progress = elapsed / durationMs;
  const arrived = now >= arrivesAt;

  return {
    status: arrived ? 'arrived' : 'en_route',
    progress: arrived ? 1 : progress,
    arrivesAt,
    remainingMs: arrived ? 0 : arrivesAt - now,
  };
}

/** Vrai si le vol est arrivé à l'instant donné. */
export function hasArrived(flight: Flight, now: number): boolean {
  return flightState(flight, now).status === 'arrived';
}

/**
 * Instant du prochain changement d'état parmi plusieurs vols, ou `null` si tous
 * sont déjà arrivés. Sert à dire au client quand revenir, et à planifier une
 * notification — jamais à faire tourner une boucle côté serveur.
 */
export function nextArrival(flights: readonly Flight[], now: number): number | null {
  let soonest: number | null = null;
  for (const flight of flights) {
    const state = flightState(flight, now);
    if (state.status === 'arrived') continue;
    if (soonest === null || state.arrivesAt < soonest) soonest = state.arrivesAt;
  }
  return soonest;
}
