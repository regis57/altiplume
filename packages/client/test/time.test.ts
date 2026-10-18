import { describe, expect, it } from 'vitest';
import { formatRemaining, nextDrawAt, nextDrawText, waitsOf } from '../src/time.ts';

describe("le prochain tirage, à l'heure du joueur", () => {
  const H = 3_600_000;

  it('tombe au prochain minuit UTC ; à minuit pile, le tirage vient de passer', () => {
    expect(nextDrawAt(Date.UTC(2026, 9, 18, 15, 42))).toBe(Date.UTC(2026, 9, 19));
    expect(nextDrawAt(Date.UTC(2026, 9, 19) - 1)).toBe(Date.UTC(2026, 9, 19));
    expect(nextDrawAt(Date.UTC(2026, 9, 19))).toBe(Date.UTC(2026, 9, 20));
    expect(nextDrawAt(Date.UTC(2026, 11, 31, 23))).toBe(Date.UTC(2027, 0, 1));
  });

  it('Paris : 2 h en été, 1 h en hiver', () => {
    const ete = Date.UTC(2026, 6, 15, 10);
    expect(nextDrawText(ete, 'fr', 'Europe/Paris')).toBe('à 2 h (minuit en temps universel)');
    expect(nextDrawText(ete, 'en', 'Europe/Paris')).toBe('at 2 am (midnight UTC)');
    const hiver = Date.UTC(2027, 0, 15, 10);
    expect(nextDrawText(hiver, 'fr', 'Europe/Paris')).toBe('à 1 h (minuit en temps universel)');
    expect(nextDrawText(hiver, 'en', 'Europe/Paris')).toBe('at 1 am (midnight UTC)');
  });

  it("Paris, la nuit du changement d'heure (25 octobre 2026) : 2 h encore, puis 1 h", () => {
    expect(nextDrawText(Date.UTC(2026, 9, 24, 23), 'fr', 'Europe/Paris')).toBe('à 2 h (minuit en temps universel)');
    expect(nextDrawText(Date.UTC(2026, 9, 25) + H, 'fr', 'Europe/Paris')).toBe('à 1 h (minuit en temps universel)');
  });

  it('Montréal : le soir même, 20 h (19 h en hiver)', () => {
    expect(nextDrawText(Date.UTC(2026, 9, 18, 12), 'fr', 'America/Montreal')).toBe('à 20 h (minuit en temps universel)');
    expect(nextDrawText(Date.UTC(2026, 9, 18, 12), 'en', 'America/Montreal')).toBe('at 8 pm (midnight UTC)');
    expect(nextDrawText(Date.UTC(2027, 0, 18, 12), 'fr', 'America/Montreal')).toBe('à 19 h (minuit en temps universel)');
    expect(nextDrawText(Date.UTC(2027, 0, 18, 12), 'en', 'America/Montreal')).toBe('at 7 pm (midnight UTC)');
  });

  it('Tokyo : 9 h du matin', () => {
    expect(nextDrawText(Date.UTC(2026, 9, 18, 12), 'fr', 'Asia/Tokyo')).toBe('à 9 h (minuit en temps universel)');
    expect(nextDrawText(Date.UTC(2026, 9, 18, 12), 'en', 'Asia/Tokyo')).toBe('at 9 am (midnight UTC)');
  });

  it('en temps universel, minuit suffit', () => {
    expect(nextDrawText(Date.UTC(2026, 9, 18, 12), 'fr', 'UTC')).toBe('à minuit en temps universel (UTC)');
    expect(nextDrawText(Date.UTC(2026, 9, 18, 12), 'en', 'UTC')).toBe('at midnight UTC');
    // Londres l'hiver aussi ; l'été, 1 h.
    expect(nextDrawText(Date.UTC(2027, 0, 18, 12), 'en', 'Europe/London')).toBe('at midnight UTC');
    expect(nextDrawText(Date.UTC(2026, 6, 18, 12), 'en', 'Europe/London')).toBe('at 1 am (midnight UTC)');
  });

  it('les fuseaux à la demi-heure, et midi', () => {
    expect(nextDrawText(Date.UTC(2026, 9, 18, 12), 'fr', 'Asia/Kolkata')).toBe('à 5 h 30 (minuit en temps universel)');
    expect(nextDrawText(Date.UTC(2026, 9, 18, 12), 'en', 'Asia/Kolkata')).toBe('at 5:30 am (midnight UTC)');
    expect(nextDrawText(Date.UTC(2026, 6, 18, 12), 'fr', 'Pacific/Auckland')).toBe('à midi (minuit en temps universel)');
    expect(nextDrawText(Date.UTC(2026, 6, 18, 12), 'en', 'Pacific/Auckland')).toBe('at noon (midnight UTC)');
  });
});

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
