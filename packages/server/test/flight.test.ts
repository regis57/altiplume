import { describe, expect, it } from 'vitest';
import {
  flightState,
  hasArrived,
  nextArrival,
  InvalidFlightError,
} from '../src/sim/flight.ts';

const T0 = Date.UTC(2026, 5, 1, 12, 0, 0);
const HOUR = 3_600_000;

describe('flightState', () => {
  it('rend un vol en route à mi-parcours', () => {
    const state = flightState({ departedAt: T0, durationMs: 2 * HOUR }, T0 + HOUR);
    expect(state.status).toBe('en_route');
    expect(state.progress).toBeCloseTo(0.5, 10);
    expect(state.remainingMs).toBe(HOUR);
    expect(state.arrivesAt).toBe(T0 + 2 * HOUR);
  });

  it('considère le vol arrivé à la milliseconde exacte', () => {
    const state = flightState({ departedAt: T0, durationMs: HOUR }, T0 + HOUR);
    expect(state.status).toBe('arrived');
    expect(state.progress).toBe(1);
    expect(state.remainingMs).toBe(0);
  });

  it('reste arrivé des années plus tard : une absence ne coûte rien', () => {
    const tenYears = 10 * 365 * 24 * HOUR;
    const state = flightState({ departedAt: T0, durationMs: HOUR }, T0 + tenYears);
    expect(state.status).toBe('arrived');
    expect(state.progress).toBe(1);
    expect(state.remainingMs).toBe(0);
  });

  it('ne produit pas de progression négative si l\'horloge recule', () => {
    const state = flightState({ departedAt: T0, durationMs: HOUR }, T0 - HOUR);
    expect(state.progress).toBe(0);
    expect(state.status).toBe('en_route');
  });

  it('refuse une durée nulle ou négative', () => {
    expect(() => flightState({ departedAt: T0, durationMs: 0 }, T0)).toThrow(InvalidFlightError);
    expect(() => flightState({ departedAt: T0, durationMs: -1 }, T0)).toThrow(InvalidFlightError);
  });

  it('refuse des valeurs non finies', () => {
    expect(() => flightState({ departedAt: Number.NaN, durationMs: HOUR }, T0))
      .toThrow(InvalidFlightError);
    expect(() => flightState({ departedAt: T0, durationMs: HOUR }, Number.POSITIVE_INFINITY))
      .toThrow(InvalidFlightError);
  });

  it('est pure : deux appels au même instant donnent le même résultat', () => {
    const flight = { departedAt: T0, durationMs: 3 * HOUR };
    expect(flightState(flight, T0 + HOUR)).toEqual(flightState(flight, T0 + HOUR));
  });
});

describe('hasArrived', () => {
  it('bascule au franchissement de l\'instant d\'arrivée', () => {
    const flight = { departedAt: T0, durationMs: HOUR };
    expect(hasArrived(flight, T0 + HOUR - 1)).toBe(false);
    expect(hasArrived(flight, T0 + HOUR)).toBe(true);
  });
});

describe('nextArrival', () => {
  it('rend le plus proche des vols encore en route', () => {
    const flights = [
      { departedAt: T0, durationMs: 5 * HOUR },
      { departedAt: T0, durationMs: 2 * HOUR },
      { departedAt: T0, durationMs: 9 * HOUR },
    ];
    expect(nextArrival(flights, T0)).toBe(T0 + 2 * HOUR);
  });

  it('ignore les vols déjà arrivés', () => {
    const flights = [
      { departedAt: T0, durationMs: HOUR },
      { departedAt: T0, durationMs: 4 * HOUR },
    ];
    expect(nextArrival(flights, T0 + 2 * HOUR)).toBe(T0 + 4 * HOUR);
  });

  it('rend null quand tout est arrivé', () => {
    expect(nextArrival([{ departedAt: T0, durationMs: HOUR }], T0 + 2 * HOUR)).toBeNull();
    expect(nextArrival([], T0)).toBeNull();
  });
});
