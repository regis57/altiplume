/**
 * Point d'entrée du client.
 *
 * L'interface de jeu sera construite en DOM, pas en canvas : seule la scène de
 * l'aérodrome utilisera un rendu pixel. C'est ce qui permet d'atteindre réellement
 * le niveau AA des WCAG — listes, boutons et cartes restent navigables au clavier
 * et lisibles par un lecteur d'écran.
 *
 * Pour l'instant, cette coquille vérifie seulement que la chaîne de compilation
 * tient debout.
 */
import { formatRemaining } from './time.ts';

export function mount(root: HTMLElement, locale: 'fr' | 'en' = 'fr'): void {
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent =
    locale === 'fr'
      ? `Prochain courrier dans ${formatRemaining(95 * 60_000, locale)}.`
      : `Next mail in ${formatRemaining(95 * 60_000, locale)}.`;
  root.append(status);
}
