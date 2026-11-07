/**
 * Un contrôle externe peut être arrêté par Cloudflare avant d'atteindre le jeu : la
 * réponse est alors une page de Cloudflare (HTTP 403, en-tête `cf-mitigated`), avec ses
 * propres en-têtes, pas ceux du serveur. Le 7 novembre 2026, le contrôle du lundi a
 * ainsi échoué en disant « redéployer la dernière version », alors que la version était
 * à jour : c'était le « Bot Fight Mode » de Cloudflare qui défiait les machines de GitHub.
 *
 * Cette fonction reconnaît ce cas, pour que le rapport dise la vraie cause. Elle ne
 * le laisse jamais passer pour un succès : le contrôle reste rouge, c'est seulement
 * l'indication qui change.
 *
 * @param {number} status code HTTP reçu
 * @param {{ get(name: string): string | null }} headers en-têtes reçus
 * @returns {string | null} ce que Cloudflare a fait, ou `null` si la réponse vient du jeu
 */
export function defiCloudflare(status, headers) {
  const mitigated = headers.get('cf-mitigated');
  if (mitigated) return `défi de Cloudflare (HTTP ${status}, cf-mitigated : ${mitigated})`;
  // Un 403 passé par Cloudflare sans cet en-tête : le jeu, lui, ne répond jamais 403 à la page d'accueil.
  if (status === 403 && /cloudflare/i.test(headers.get('server') ?? '')) return 'blocage de Cloudflare (HTTP 403)';
  return null;
}

/** Ce qu'il faut faire quand Cloudflare, et pas le jeu, a répondu. */
export const ACTION_DEFI = 'Cloudflare a arrêté le contrôle, pas le jeu : Sécurité → Événements, repérer le service (par exemple « Bot Fight Mode ») et la règle';
