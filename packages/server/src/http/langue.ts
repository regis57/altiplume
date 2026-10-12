/**
 * La langue d'un lien partagé.
 *
 * Le client se lit dans les deux langues sur la même adresse : c'est le navigateur
 * qui choisit. Mais les robots qui fabriquent l'aperçu d'un lien — LinkedIn,
 * WhatsApp, Signal, Mastodon, iMessage — ne lisent pas de JavaScript : ils voient
 * l'en-tête tel que le serveur l'envoie. Pour qu'un lien anglais montre une carte
 * anglaise, `/aide?lang=en` est servi depuis l'exemplaire `aide.en.html`, que la
 * construction du client produit à côté de `aide.html`. Le contenu est identique ;
 * seuls l'en-tête et la carte changent.
 *
 * La réécriture est étroite : GET ou HEAD, un chemin de page (lettres et tirets,
 * rien d'autre), `lang=en` exactement, et un exemplaire anglais qui existe. Tout le
 * reste passe tel quel — une API, un fichier, une page inconnue.
 */
import { readdirSync } from 'node:fs';

/** Les pages qui ont un exemplaire anglais, lues une fois au démarrage. */
export function englishPages(clientDir: string): Set<string> {
  try {
    return new Set(readdirSync(clientDir).filter((f) => f.endsWith('.en.html')).map((f) => f.slice(0, -'.en.html'.length)));
  } catch {
    return new Set();
  }
}

export function rewriteLanguage(url: string, method: string | undefined, pages: ReadonlySet<string>): string {
  if (method !== 'GET' && method !== 'HEAD') return url;
  const q = url.indexOf('?');
  if (q < 0) return url;
  const path = url.slice(0, q);
  if (!/^\/[a-z-]{0,40}$/.test(path)) return url;
  if (new URLSearchParams(url.slice(q + 1)).get('lang') !== 'en') return url;
  const page = path === '/' ? 'index' : path.slice(1);
  if (!pages.has(page)) return url;
  return `/${page}.en.html${url.slice(q)}`;
}
