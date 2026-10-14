import { describe, expect, it } from 'vitest';
import { TRAITS } from '../src/world/traits.ts';

/**
 * Un trait se porte par une femme comme par un homme : sa description ne doit
 * donc parler ni d'elle ni de lui (le 14/10, « Le brouillard la retarde » sur
 * Prosper et Gaspard, « Good cards follow her » sur Teodor).
 */
describe('les traits', () => {
  it('se décrivent sans pronom genré', () => {
    for (const trait of TRAITS) {
      expect(trait.description.fr, trait.id).not.toMatch(/\b(elle|il|la suivent|la retarde)\b/i);
      expect(trait.description.en, trait.id).not.toMatch(/\b(she|he|her|his|him)\b/i);
    }
  });
});
