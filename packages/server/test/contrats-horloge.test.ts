import { describe, expect, it } from 'vitest';
import { CONTRACTS, EVENTS } from '../src/world/cards.ts';
import { ZONES } from '../src/world/aerodrome.ts';

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
      // Ni le soir, ni la nuit : le 18/10, cinq contrats promettaient encore « avant la nuit ».
      expect(c.text.fr, c.id).not.toMatch(/avant la nuit|la nuit qui tombe|marée du soir|avant le soir/i);
      expect(c.text.en, c.id).not.toMatch(/before (nightfall|dark|night)|night falling|evening tide/i);
    }
  });

  it('un imprévu ne raconte pas une attente que le jeu ne fait pas', () => {
    for (const e of EVENTS) {
      for (const ch of e.choices.filter((x) => !x.effects.waitHours)) {
        expect(ch.outcome.fr, `${e.id}:${ch.id}`).not.toMatch(/\b(une|deux|trois) heures?\b/i);
        expect(ch.outcome.en, `${e.id}:${ch.id}`).not.toMatch(/\b(an|one|two|three) hours?\b/i);
      }
    }
  });

  it('la tour et son feu disent le chiffre du jeu (30 %, « près d\'un tiers »)', () => {
    const feu = ZONES.find((z) => z.id === 'tour')!.levels.find((l) => l.level === 3)!;
    expect(feu.night).toBe(0.7);
    expect(feu.description.fr).toMatch(/près d'un tiers/);
    expect(feu.description.en).toMatch(/almost a third/);
  });

  it('ne parlent de printemps que quand ils sont de saison', () => {
    for (const c of CONTRACTS.filter((x) => !x.season)) {
      expect(c.title.fr, c.id).not.toMatch(/printemps/i);
      expect(c.title.en, c.id).not.toMatch(/\bspring\b/i);
    }
  });
});
