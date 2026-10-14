/**
 * L'heure du joueur. La nuit du jeu (vol de nuit aux lanternes, page « Vol de nuit »)
 * tombe quand elle tombe chez lui, pas à une heure UTC unique : la scène suivait déjà
 * l'horloge du navigateur, les règles la suivent aussi (décision du 14/10).
 */

/** Le fuseau par défaut, pour un compte qui ne l'a pas encore dit. */
export const DEFAULT_TIMEZONE = 'Europe/Paris';

/** Un fuseau IANA que le moteur connaît (« Europe/Paris », « America/Montreal »…). */
export function isTimezone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz.length === 0 || tz.length > 64 || !/^[A-Za-z_+\-/0-9]+$/.test(tz)) return false;
  try { new Intl.DateTimeFormat('en-GB', { timeZone: tz }); return true; } catch { return false; }
}

/** L'heure locale (0 à 23) à l'instant donné, dans le fuseau donné. */
export function localHour(ms: number, tz: string): number {
  const zone = isTimezone(tz) ? tz : DEFAULT_TIMEZONE;
  const h = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: zone }).format(new Date(ms));
  return Number(h) % 24;
}

/** La nuit, comme la scène la peint : de 21 h à 6 h, à l'heure du joueur. */
export function isNight(ms: number, tz: string): boolean {
  const h = localHour(ms, tz);
  return h >= 21 || h < 6;
}
