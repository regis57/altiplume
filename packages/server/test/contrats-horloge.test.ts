import { describe, expect, it } from 'vitest';
import { CONTRACTS } from '../src/world/cards.ts';

/**
 * Un contrat se tire à n'importe quelle heure du jour : son texte ne peut pas
 * promettre une heure d'horloge, seulement une durée (le 14/10, « avant midi »
 * sur un pli tiré le soir). Le délai affiché est celui de la carte.
 */
describe('les contrats', () => {
  it("ne citent pas l'heure d'une pendule", () => {
    for (const c of CONTRACTS) {
      expect(c.text.fr, c.id).not.toMatch(/\b(avant|pour|à) midi\b/i);
      expect(c.text.en, c.id).not.toMatch(/\b(before|by|at) noon\b/i);
    }
  });

  it('ne parlent de printemps que quand ils sont de saison', () => {
    for (const c of CONTRACTS.filter((x) => !x.season)) {
      expect(c.title.fr, c.id).not.toMatch(/printemps/i);
      expect(c.title.en, c.id).not.toMatch(/\bspring\b/i);
    }
  });
});
