import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DISALLOWED, PUBLIC_PAGES } from '../src/routes/referencement.ts';

/**
 * Le plan du site et les en-têtes des pages doivent dire la même chose : une page
 * listée dans le plan existe et s'indexe ; une page interdite aux robots porte
 * « noindex ». On lit les sources des pages (pas besoin de les construire).
 */
const pagesDir = join(import.meta.dirname, '../../client/src/pages');
const head = (page: string) => readFileSync(join(pagesDir, `${page}.html`), 'utf8').split('\n---\n')[0]!;

describe('le plan du site et les pages disent la même chose', () => {
  it('chaque page publique existe, est indexable et a sa description dans les deux langues', () => {
    for (const { path } of PUBLIC_PAGES) {
      const page = path === '/' ? 'index' : path.slice(1);
      expect(existsSync(join(pagesDir, `${page}.html`)), page).toBe(true);
      expect(head(page), page).not.toContain('noindex');
      if (page !== 'index') {
        expect(head(page), page).toMatch(/^description: .{40,}/m);
        expect(head(page), page).toMatch(/^description-en: .{40,}/m);
      }
    }
  });

  it('chaque page interdite aux robots porte noindex, et réciproquement', () => {
    const pages = readdirSync(pagesDir).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));
    for (const page of pages) {
      const path = page === 'index' ? '/' : `/${page}`;
      const listed = PUBLIC_PAGES.some((p) => p.path === path);
      const forbidden = DISALLOWED.includes(path);
      expect(listed !== forbidden, `${page} : listée ou interdite, pas les deux ni aucun`).toBe(true);
      expect(head(page).includes('noindex'), `${page} noindex`).toBe(forbidden);
    }
  });
});
