/**
 * Faut-il proposer un convoi ?
 *
 * Le second équipage ne doit apparaître que lorsqu'il sert à quelque chose : un
 * avion choisi, trop petit pour la charge, et de quoi former un second équipage
 * au hangar. Tant qu'aucun avion n'est choisi — parce qu'ils sont tous en vol,
 * par exemple — on ne sait rien de la charge : une flotte absente n'est pas une
 * flotte trop petite, et le jeu ne doit pas montrer au joueur une mécanique
 * qu'il n'a pas encore rencontrée.
 */
export type ConvoyState =
  /** Un seul avion suffit, ou aucun n'est choisi : pas de convoi à l'écran. */
  | 'none'
  /** Trop petit, mais un second équipage est libre : on demande lequel. */
  | 'ask'
  /** Trop petit, et rien pour l'accompagner : on l'explique, sans rien demander. */
  | 'impossible';

export function convoyState(opts: {
  /** Capacité de l'avion choisi, en sacs ; `null` si aucun avion n'est choisi. */
  capacity: number | null;
  /** Les sacs à porter. */
  bags: number;
  /** Avions au sol, libres tout de suite. */
  freePlanes: number;
  /** Pilotes au sol, reposés, libres tout de suite. */
  freePilots: number;
}): ConvoyState {
  if (opts.capacity === null) return 'none';
  if (opts.capacity >= opts.bags) return 'none';
  return opts.freePlanes >= 2 && opts.freePilots >= 2 ? 'ask' : 'impossible';
}
