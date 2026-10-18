import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import type * as I18nModule from '../src/i18n.ts';

// Un joueur à Montréal : la fin de saison se lisait un jour trop tôt à l'ouest de l'UTC.
process.env['TZ'] = 'America/Montreal';

// i18n.ts lit la langue au chargement : un navigateur minimal suffit.
let i18n: typeof I18nModule;
beforeAll(async () => {
  const g = globalThis as Record<string, unknown>;
  g['location'] = { search: '', href: 'https://altiplume.test/' };
  g['localStorage'] = { getItem: () => 'fr', setItem: () => undefined };
  i18n = await import('../src/i18n.ts');
});

describe('les nombres et les pluriels suivent la langue', () => {
  it('« 12 500 » en français, « 12,500 » en anglais', () => {
    i18n.setLocale('fr');
    expect(i18n.formatNumber(12500)).toBe('12 500');
    i18n.setLocale('en');
    expect(i18n.formatNumber(12500)).toBe('12,500');
  });

  it('« 1 cachet », « 1 page » ; et en anglais « 0 stamps », pas « 0 stamp »', () => {
    const say = (n: number, one: string, other: string) => i18n.t(i18n.plural(n, one, other)).replace('{n}', String(n));
    i18n.setLocale('fr');
    expect(say(1, 'goal.earnStampsOne', 'goal.earnStamps')).toMatch(/^Gagner encore 1 cachet \(/);
    expect(say(0, 'game.albumStampsEarnedOne', 'game.albumStampsEarned')).toBe('0 cachet gagné');
    expect(say(1, 'goal.albumOne', 'goal.album')).not.toContain('1 pages');
    expect(say(2, 'goal.album', 'goal.album')).toContain('2 pages');
    i18n.setLocale('en');
    expect(say(1, 'goal.earnStampsOne', 'goal.earnStamps')).toMatch(/^Earn 1 more stamp \(/);
    expect(say(0, 'game.albumStampsEarnedOne', 'game.albumStampsEarned')).toBe('0 stamps earned');
    expect(say(1, 'game.albumStampsEarnedOne', 'game.albumStampsEarned')).toBe('1 stamp earned');
    expect(say(1, 'goal.albumOne', 'goal.album')).not.toContain('1 pages');
  });
});

describe('la fin de saison se lit en temps universel', () => {
  it("à Montréal, l'automne 2026 va jusqu'au 20 décembre, pas au 19", () => {
    // La bascule : 21 décembre, 00:00 UTC ; l'écran dit la veille.
    const endsAt = Date.UTC(2026, 11, 21);
    i18n.setLocale('fr');
    expect(i18n.formatDate(endsAt - 86_400_000, 'long', true)).toBe('20 décembre 2026');
    i18n.setLocale('en');
    expect(i18n.formatDate(endsAt - 86_400_000, 'long', true)).toBe('20 December 2026');
  });
});

describe('les textes disent ce que le jeu fait', () => {
  it('les cartes arrivent au tirage de minuit UTC, pas « demain »', () => {
    i18n.setLocale('fr');
    expect(i18n.t('game.handEmpty')).not.toContain('demain');
    expect(i18n.t('game.handEmpty')).toContain('minuit');
    i18n.setLocale('en');
    expect(i18n.t('game.handEmpty')).not.toContain('tomorrow');
    expect(i18n.t('game.handEmpty')).toContain('midnight UTC');
  });

  it("l'heure du prochain tirage se dit à l'heure du joueur, avec minuit UTC en repère", () => {
    // Montréal : minuit UTC tombe la veille au soir, à 20 h l'été, à 19 h l'hiver.
    i18n.setLocale('fr');
    expect(i18n.t('game.handEmpty')).toMatch(/au prochain tirage, à (19|20) h \(minuit en temps universel\) — /);
    expect(i18n.t('game.routeOpened')).toMatch(/au prochain tirage, à (19|20) h \(minuit en temps universel\)\.$/);
    expect(i18n.t('game.routeOpened')).not.toMatch(/demain/i);
    i18n.setLocale('en');
    expect(i18n.t('game.handEmpty')).toMatch(/the next draw, at (7|8) pm \(midnight UTC\) — /);
    expect(i18n.t('game.routeOpened')).toMatch(/the next draw, at (7|8) pm \(midnight UTC\)\.$/);
    expect(i18n.t('game.routeOpened')).not.toMatch(/tomorrow/i);
  });

  it("le gabarit n'a plus de texte français figé dans l'interface anglaise", () => {
    const layout = readFileSync(new URL('../src/layout.html', import.meta.url), 'utf8');
    // Chaque nom lu (aria-label) se traduit, sauf les boutons que le script réécrit lui-même.
    const labels = [...layout.matchAll(/<[^>]*\saria-label="[^"]*"[^>]*>/g)].map((m) => m[0])
      .filter((tag) => !/data-action="toggle-(lang|theme)"/.test(tag));
    for (const tag of labels) expect(tag, tag).toMatch(/data-i18n-aria="[^"]+"/);
    // Chaque lien du pied de page a sa clé.
    const footer = /<footer[\s\S]*?<\/footer>/.exec(layout)![0];
    const links = [...footer.matchAll(/<a\s[^>]*>/g)].map((m) => m[0]);
    for (const tag of links) expect(tag, tag).toMatch(/data-i18n="[^"]+"/);
    // Et chaque clé existe dans les deux langues, écrite dans chacune.
    const keys = [...layout.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)].map((m) => m[1]!);
    for (const key of keys) {
      i18n.setLocale('fr'); const fr = i18n.t(key);
      i18n.setLocale('en'); const en = i18n.t(key);
      expect(fr, key).not.toBe(key);
      expect(en, key).not.toBe(key);
    }
    i18n.setLocale('en');
    expect(i18n.t('footer.source')).toBe('Source code (AGPL-3.0)');
    expect(i18n.t('nav.home')).toBe('Altiplume, home');
  });
});
