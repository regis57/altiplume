import { describe, expect, it } from 'vitest';
import { formatRemaining } from '../src/time.ts';

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
