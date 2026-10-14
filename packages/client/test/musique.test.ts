import { describe, expect, it } from 'vitest';
import { BARS, freq, loopSeconds, SCORES } from '../src/music.ts';

/** Quatre partitions, une par saison, toutes jouables : seize mesures pleines, des notes connues. */
describe('les musiques de saison', () => {
  it('sont quatre, une par saison', () => {
    expect(Object.keys(SCORES).sort()).toEqual(['automne', 'ete', 'hiver', 'printemps']);
  });

  it('font chacune seize mesures, accords et mélodie', () => {
    for (const [id, score] of Object.entries(SCORES)) {
      expect(score.chords.length, `${id} : accords`).toBe(BARS);
      const beats = score.lead.reduce((sum, [, d]) => sum + d, 0);
      expect(beats, `${id} : mélodie`).toBe(BARS * score.beats);
      for (const [bass, chord] of score.chords) for (const n of [bass, ...chord]) expect(() => freq(n), `${id} : ${n}`).not.toThrow();
      for (const [n] of score.lead) if (n) expect(() => freq(n), `${id} : ${n}`).not.toThrow();
    }
  });

  it('se distinguent par le tempo ou la mesure', () => {
    const signatures = new Set(Object.values(SCORES).map((s) => `${s.bpm}/${s.beats}`));
    expect(signatures.size).toBe(4);
    expect(loopSeconds(SCORES.printemps)).toBeCloseTo(30, 0);
  });

  it('nomme les notes comme la partition', () => {
    expect(freq('A4')).toBe(440);
    expect(freq('A5')).toBe(880);
    expect(freq('Fs5')).toBeCloseTo(739.99, 1);
    expect(() => freq('H2')).toThrow();
  });
});
