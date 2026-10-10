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
