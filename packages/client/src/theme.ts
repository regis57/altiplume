/**
 * Applique le thème choisi AVANT le premier rendu. Ce fichier est chargé en tête
 * de page, de façon bloquante, et doit rester minuscule : sans lui, une personne
 * qui a choisi la nuit verrait un éclair de jour à chaque page.
 *
 * Sans choix enregistré, c'est le réglage du système qui décide (CSS).
 */
(() => {
  let theme: string | null = null;
  try { theme = localStorage.getItem('altiplume.theme'); } catch { /* stockage indisponible */ }
  if (theme === 'dark' || theme === 'light') document.documentElement.dataset['theme'] = theme;
})();
