import type { FastifyInstance } from 'fastify';

/**
 * Ce que les moteurs de recherche ont le droit de lire, et la liste de ce qui vaut
 * d'être lu.
 *
 * Le jeu ne vit pas dans les moteurs de recherche : il se joue connecté, et ses
 * pages de jeu ne disent rien à qui n'a pas de compte. Les pages **publiques** —
 * l'accueil, l'aide, le contact, les textes juridiques — sont les seules à
 * référencer ; chacune existe en deux langues sur la même adresse (`?lang=en`
 * pour l'anglais), et le plan du site le dit avec `hreflang`, pour qu'un moteur
 * ne les prenne pas pour un doublon.
 *
 * Les pages **privées** (l'aérodrome, le compte) et **transactionnelles** (la
 * vérification d'un lien, l'approbation d'un appareil, « lien envoyé ») portent
 * `noindex` dans leur en-tête HTML (voir `packages/client/src/pages`) et sont
 * interdites ici : un moteur n'a rien à y voir, et un lien de connexion indexé
 * serait un lien de connexion périmé affiché au monde.
 *
 * L'API (`/v1/`) et les sondes sont interdites aussi : ce sont des données, pas des
 * pages. Rien de secret dans tout cela — la liste est la même que celle du menu.
 */

/** Les pages publiques, par ordre d'importance : chemin, et priorité pour le plan du site. */
export const PUBLIC_PAGES: readonly { readonly path: string; readonly priority: string; readonly changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/aide', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'yearly' },
  { path: '/confidentialite', priority: '0.4', changefreq: 'monthly' },
  { path: '/cgu', priority: '0.3', changefreq: 'monthly' },
  { path: '/mentions-legales', priority: '0.3', changefreq: 'yearly' },
];

/** Les chemins qu'un robot ne doit pas parcourir. */
export const DISALLOWED: readonly string[] = ['/v1/', '/healthz', '/aerodrome', '/compte', '/connexion', '/verifier', '/approuver', '/lien-envoye', '/version'];

export function robotsTxt(origin: string): string {
  return [
    'User-agent: *',
    ...DISALLOWED.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

const escapeXml = (v: string) => v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** Le plan du site : chaque page publique, en français et en anglais, reliées par `hreflang`. */
export function sitemapXml(origin: string, lastmod: string): string {
  const entries = PUBLIC_PAGES.flatMap((page) => {
    const fr = `${origin}${page.path}`;
    const en = `${origin}${page.path}?lang=en`;
    const links = [
      `    <xhtml:link rel="alternate" hreflang="fr" href="${escapeXml(fr)}"/>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(fr)}"/>`,
    ].join('\n');
    return [fr, en].map((loc) => [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${page.changefreq}</changefreq>`,
      `    <priority>${page.priority}</priority>`,
      links,
      '  </url>',
    ].join('\n'));
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

export function registerReferencementRoutes(app: FastifyInstance, origin: string, builtAt: string | null): void {
  // La date de dernière modification : celle de la construction de l'image, au jour
  // près. Les pages ne changent qu'avec une nouvelle image ; c'est donc exact.
  const lastmod = (builtAt ?? new Date().toISOString()).slice(0, 10);
  app.get('/robots.txt', async (_request, reply) => {
    reply.header('content-type', 'text/plain; charset=utf-8');
    reply.header('cache-control', 'public, max-age=86400');
    return robotsTxt(origin);
  });
  app.get('/sitemap.xml', async (_request, reply) => {
    reply.header('content-type', 'application/xml; charset=utf-8');
    reply.header('cache-control', 'public, max-age=86400');
    return sitemapXml(origin, lastmod);
  });
}
