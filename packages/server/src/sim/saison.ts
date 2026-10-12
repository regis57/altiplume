/**
 * Les saisons d'Altiplume suivent le calendrier : quand il neige chez vous, il
 * neige sur la Croisette. Le monde est inventé, l'année ne l'est pas.
 *
 * Les bornes sont fixes, en temps universel, pour que deux joueurs au même instant
 * vivent la même saison où qu'ils soient : printemps le 20 mars, été le 21 juin,
 * automne le 23 septembre, hiver le 21 décembre. (Les vraies dates bougent d'un
 * jour d'une année à l'autre ; un jeu n'a pas besoin d'un almanach.)
 */
export type Season = 'printemps' | 'ete' | 'automne' | 'hiver';

/** Dans l'ordre de l'année, à partir de l'hiver qui chevauche le 1er janvier. */
const STARTS: readonly { season: Season; month: number; day: number }[] = [
  { season: 'printemps', month: 2, day: 20 },
  { season: 'ete', month: 5, day: 21 },
  { season: 'automne', month: 8, day: 23 },
  { season: 'hiver', month: 11, day: 21 },
];

/** La saison à l'instant donné, avec son début et sa fin (exclue). */
export function seasonOf(now: number): { season: Season; startsAt: number; endsAt: number } {
  if (!Number.isFinite(now)) throw new RangeError('now doit être un nombre fini');
  const year = new Date(now).getUTCFullYear();
  // Les débuts de l'année d'avant, de celle-ci et de la suivante : la saison est le dernier début passé.
  const starts = [year - 1, year, year + 1].flatMap((y) => STARTS.map((s) => ({ season: s.season, at: Date.UTC(y, s.month, s.day) })));
  let i = starts.length - 1;
  while (starts[i]!.at > now) i -= 1;
  return { season: starts[i]!.season, startsAt: starts[i]!.at, endsAt: starts[i + 1]!.at };
}
