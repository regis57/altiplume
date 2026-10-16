import { describe, expect, it } from 'vitest';
import { DISALLOWED, PUBLIC_PAGES, robotsTxt, sitemapXml } from '../src/routes/referencement.ts';
import { testApp } from './helpers.ts';

describe('ce que les moteurs de recherche peuvent lire', () => {
  it('robots.txt interdit le jeu, le compte, les liens de connexion et l\'API, et désigne le plan du site', async () => {
    const t = await testApp();
    const r = await t.app.inject({ method: 'GET', url: '/robots.txt' });
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toContain('text/plain');
    for (const p of ['/v1/', '/aerodrome', '/compte', '/verifier', '/approuver', '/lien-envoye', '/connexion']) expect(r.body).toContain(`Disallow: ${p}`);
    expect(r.body).toContain('Sitemap: http://localhost:3000/sitemap.xml');
    // Les pages publiques ne sont jamais interdites.
    for (const page of PUBLIC_PAGES) expect(r.body).not.toContain(`Disallow: ${page.path}\n`);
    await t.app.close();
  });

  it('sitemap.xml liste chaque page publique en deux langues, reliées par hreflang', async () => {
    const t = await testApp();
    const r = await t.app.inject({ method: 'GET', url: '/sitemap.xml' });
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toContain('application/xml');
    expect(r.body).toContain('<loc>http://localhost:3000/</loc>');
    expect(r.body).toContain('<loc>http://localhost:3000/aide?lang=en</loc>');
    expect(r.body).toContain('hreflang="x-default" href="http://localhost:3000/aide"');
    expect((r.body.match(/<url>/g) ?? []).length).toBe(PUBLIC_PAGES.length * 2);
    // Aucune page interdite n'y figure.
    for (const p of DISALLOWED) expect(r.body).not.toContain(`<loc>http://localhost:3000${p}`);
    expect(r.body).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    await t.app.close();
  });

  it("l'origine publique est reprise telle quelle, et les caractères XML échappés", () => {
    expect(robotsTxt('https://altiplume.test')).toContain('Sitemap: https://altiplume.test/sitemap.xml');
    const xml = sitemapXml('https://altiplume.test', '2026-10-16');
    expect(xml).toContain('<loc>https://altiplume.test/aide?lang=en</loc>');
    expect(xml).not.toContain('&lang');
    expect(xml).toContain('<lastmod>2026-10-16</lastmod>');
  });
});
