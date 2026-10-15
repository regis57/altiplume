import { describe, expect, it } from 'vitest';
import { drawCards, planeWithinReach, type Fleet } from '../src/game/sim.ts';
import { makeRng } from '../src/sim/rng.ts';
import { findPlane, WORLD } from '../src/world/index.ts';

/** Tout ce qui peut tomber : on tire autant de cartes qu'il en existe. */
function everything(fleet: Fleet): string[] {
  return drawCards(makeRng(7), [], 1, WORLD.cards.length, ['brume', 'saline', 'archipel', 'cuivre'], [], undefined, fleet);
}

const grive = findPlane('grive')!;

describe("un avion à vendre arrive à son heure", () => {
  it("le Héron ne vient pas sur un pré fauché (le 16 octobre, il tombait dès le premier jour)", () => {
    const drawn = everything({ planes: [grive], pilots: 1, reach: 1, home: 'short' });
    expect(drawn).not.toContain('o-heron');
    // Le Martinet (piste roulée, un cran de plus) et la Grive restent proposés.
    expect(drawn).toContain('o-martinet');
    expect(drawn).toContain('o-grive');
  });

  it('il vient une fois la piste roulée construite', () => {
    expect(everything({ planes: [grive], pilots: 1, reach: 1, home: 'medium' })).toContain('o-heron');
  });

  it("les hydravions et le Pic ne dépendent pas de la piste (la rivière, les clairières)", () => {
    const drawn = everything({ planes: [grive], pilots: 1, reach: 1, home: 'short' });
    for (const id of ['o-sterne', 'o-goeland', 'o-pic']) expect(drawn).toContain(id);
  });

  it("au plus un cran d'écart, pour chaque modèle et chaque piste", () => {
    expect(planeWithinReach(findPlane('heron')!, 'short')).toBe(false);
    expect(planeWithinReach(findPlane('heron')!, 'medium')).toBe(true);
    expect(planeWithinReach(findPlane('martinet')!, 'short')).toBe(true);
    expect(planeWithinReach(findPlane('sterne')!, 'short')).toBe(true);
    expect(planeWithinReach(findPlane('pic')!, 'short')).toBe(true);
  });

  it('sans piste connue (anciens appels), rien ne change', () => {
    expect(everything({ planes: [grive], pilots: 1, reach: 1 })).toContain('o-heron');
  });
});
