import { describe, expect, it } from 'vitest';
import { formatRemaining, waitsOf } from '../src/time.ts';

describe('waitsOf : les jalons qui ne sont pas des vols', () => {
  it("la fin du repos d'un pilote au sol et la réouverture de la piste", () => {
    const c = {
      now: 1_000,
      pilots: [
        { busyUntil: null, restedAt: 61_000 },
        // En vol : son retour est déjà un jalon du vol.
        { busyUntil: 90_000, restedAt: 120_000 },
        { busyUntil: null, restedAt: null },
      ],
      runwayClosedUntil: 3_601_000,
    };
    expect(waitsOf(c)).toEqual([61_000, 3_601_000]);
  });

  it('rien de passé : une heure déjà franchie ne relance pas sans fin', () => {
    expect(waitsOf({ now: 5_000, pilots: [{ busyUntil: null, restedAt: 5_000 }], runwayClosedUntil: 4_000 })).toEqual([]);
  });
});

describe('formatRemaining', () => {
  it('affiche les minutes seules sous une heure', () => {
    expect(formatRemaining(25 * 60_000)).toBe('25 min');
  });

  it('affiche les heures seules quand les minutes sont nulles', () => {
    expect(formatRemaining(2 * 3_600_000)).toBe('2 h');
  });

  it('combine heures et minutes', () => {
    expect(formatRemaining(95 * 60_000)).toBe('1 h 35 min');
  });

  it('arrondit vers le haut : on ne promet jamais plus tôt que la réalité', () => {
    expect(formatRemaining(61_000)).toBe('2 min');
  });

  it('dit « arrivé » à zéro ou en dessous', () => {
    expect(formatRemaining(0)).toBe('arrivé');
    expect(formatRemaining(-5)).toBe('arrivé');
    expect(formatRemaining(Number.NaN)).toBe('arrivé');
  });

  it('respecte la langue demandée', () => {
    expect(formatRemaining(0, 'en')).toBe('arrived');
    expect(formatRemaining(95 * 60_000, 'en')).toBe('1 h 35 min');
  });
});
