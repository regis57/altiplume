import { describe, expect, it } from 'vitest';
import { OPPORTUNITIES } from '../src/world/cards.ts';
import { WORLD } from '../src/world/index.ts';

/**
 * Le pilote qui arrive est toujours le suivant de la liste : une carte
 * d'embauche ne peut donc pas dire d'où il vient ni où il se présente (le 14/10,
 * « quelqu'un sur le ponton avec une lanterne » pouvait faire arriver Ilias,
 * venu des plateaux).
 */
describe("les cartes d'embauche", () => {
  const cartes = OPPORTUNITIES.filter((c) => c.offer.type === 'pilot');

  it('existent dans plusieurs régions', () => {
    expect(cartes.length).toBeGreaterThanOrEqual(3);
  });

  it("ne nomment ni village, ni ponton, ni lisière", () => {
    for (const c of cartes) {
      for (const lang of ['fr', 'en'] as const) {
        const text = `${c.title[lang]} ${c.text[lang]}`;
        for (const d of WORLD.destinations) expect(text, `${c.id} cite ${d.name[lang]}`).not.toContain(d.name[lang]);
        expect(text, c.id).not.toMatch(/ponton|lisière|jetty|forest edge|Crosslet|Croisette/i);
      }
    }
  });
});
