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

const DAY_MS = 86_400_000;

/**
 * Le prochain tirage : le serveur tire les cartes à chaque minuit en temps universel
 * (packages/server/src/sim/day.ts, jours de 24 h depuis le 1er janvier 2026 à 0 h UTC).
 * À minuit pile, le tirage vient d'avoir lieu : le prochain est le lendemain.
 */
export function nextDrawAt(now: number): number {
  return Math.floor(now / DAY_MS) * DAY_MS + DAY_MS;
}

/**
 * L'heure du prochain tirage, à l'heure du joueur, avec minuit UTC en repère :
 * « à 2 h (minuit en temps universel) », « at 1 am (midnight UTC) ». Là où minuit UTC
 * tombe à minuit (Londres l'hiver, Lisbonne, Reykjavik), le repère suffit.
 *
 * C'est un affichage, pas une valeur de jeu : le tirage reste celui du serveur.
 * `timeZone` absent : le fuseau du navigateur.
 */
export function nextDrawText(now: number, locale: Locale, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    hour: 'numeric', minute: '2-digit', ...(locale === 'fr' ? { hourCycle: 'h23' } as const : { hour12: true }), ...(timeZone ? { timeZone } : {}),
  }).formatToParts(nextDrawAt(now));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const hour = Number(part('hour'));
  const minute = part('minute');
  const evening = part('dayPeriod').toLowerCase().startsWith('p');
  if (locale === 'fr') {
    if (hour === 0 && minute === '00') return 'à minuit en temps universel (UTC)';
    const at = hour === 12 && minute === '00' ? 'à midi' : `à ${hour} h${minute === '00' ? '' : ` ${minute}`}`;
    return `${at} (minuit en temps universel)`;
  }
  if (hour === 12 && minute === '00' && !evening) return 'at midnight UTC';
  const at = hour === 12 && minute === '00' ? 'at noon' : `at ${hour}${minute === '00' ? '' : `:${minute}`} ${evening ? 'pm' : 'am'}`;
  return `${at} (midnight UTC)`;
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
