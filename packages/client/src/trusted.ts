/**
 * Trusted Types : la politique « altiplume », la seule que la CSP autorise.
 *
 * Le navigateur refuse toute chaîne brute dans un puits d'injection (innerHTML,
 * enregistrement du service worker…) ; il n'accepte que ce qui est passé par
 * ici. Les deux usages du jeu sont connus et bornés : les textes traduits du
 * dictionnaire embarqué (jamais du réseau), et l'adresse du service worker.
 * Tout le reste du client parle au DOM par textContent et createElement.
 *
 * Un navigateur sans Trusted Types ignore la directive ; on rend alors la chaîne
 * telle quelle, comme avant.
 */
interface Policy { createHTML(s: string): unknown; createScriptURL(s: string): unknown }
interface Factory { createPolicy(name: string, rules: { createHTML(s: string): string; createScriptURL(s: string): string }): Policy }

let policy: Policy | null = null;
const factory = (globalThis as { trustedTypes?: Factory }).trustedTypes;
if (factory) {
  try {
    policy = factory.createPolicy('altiplume', { createHTML: (s) => s, createScriptURL: (s) => s });
  } catch {
    policy = null; // déjà créée (double chargement) : les appels suivants échoueraient de toute façon
  }
}

/** Un fragment HTML du dictionnaire, prêt pour innerHTML. */
export function trustedHtml(markup: string): string {
  return (policy ? policy.createHTML(markup) : markup) as string;
}

/** L'adresse d'un script ou d'un worker du même domaine, prête pour register(). */
export function trustedScriptUrl(url: string): string {
  return (policy ? policy.createScriptURL(url) : url) as string;
}
