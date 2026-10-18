/**
 * Formatage des durées côté client.
 *
 * Le client n'a pas le droit de décider si un vol est arrivé — c'est le serveur qui
 * tranche. Il se contente de rendre lisible la durée restante que le serveur lui a
 * donnée, dans la langue du joueur.
 */

export type Locale = 'fr' | 'en';

const UNITS: Record<Locale, { hour: string; minute: string; arrived: string }> = {
  fr: { hour: 'h', minute: 'min', arrived: 'arrivé' },
  en: { hour: 'h', minute: 'min', arrived: 'arrived' },
};

/**
 * Rend une durée restante sous forme courte et lisible.
 *
 * @param remainingMs Millisecondes restantes, telles que fournies par le serveur.
 * @param locale Langue d'affichage.
 */
export function formatRemaining(remainingMs: number, locale: Locale = 'fr'): string {
  const unit = UNITS[locale];
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return unit.arrived;

  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} ${unit.minute}`;
  if (minutes === 0) return `${hours} ${unit.hour}`;
  return `${hours} ${unit.hour} ${minutes} ${unit.minute}`;
}

/**
 * Les heures où l'écran doit redemander l'état, en plus des vols : la fin du repos d'un
 * pilote au sol, la réouverture de la piste après un imprévu. Sans elles, l'option du
 * pilote et le bouton « Expédier » restaient grisés jusqu'au filet de deux minutes
 * (ou jusqu'au retour sur l'onglet), alors que le serveur acceptait déjà.
 */
export function waitsOf(c: {
  readonly now: number;
  readonly pilots: readonly { readonly busyUntil: number | null; readonly restedAt: number | null }[];
  readonly runwayClosedUntil: number | null;
}): number[] {
  const rests = c.pilots.filter((p) => p.busyUntil === null && p.restedAt !== null && p.restedAt > c.now).map((p) => p.restedAt as number);
  return c.runwayClosedUntil !== null && c.runwayClosedUntil > c.now ? [...rests, c.runwayClosedUntil] : rests;
}
