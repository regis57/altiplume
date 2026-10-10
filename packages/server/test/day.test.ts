import { describe, expect, it } from 'vitest';
import { EPOCH_MS, gameDayIndex, msUntilNextGameDay, startOfGameDay } from '../src/sim/day.ts';

const DAY = 86_400_000;

describe('gameDayIndex', () => {
  it('commence à zéro à l\'époque du projet', () => {
    expect(gameDayIndex(EPOCH_MS)).toBe(0);
    expect(gameDayIndex(EPOCH_MS + DAY - 1)).toBe(0);
    expect(gameDayIndex(EPOCH_MS + DAY)).toBe(1);
  });

  it('ne dépend pas du fuseau : deux joueurs au même instant ont le même jour', () => {
    const instant = EPOCH_MS + 10 * DAY + 3 * 3_600_000;
    expect(gameDayIndex(instant)).toBe(gameDayIndex(instant));
    expect(gameDayIndex(instant)).toBe(10);
  });

  it('gère les instants antérieurs à l\'époque', () => {
    expect(gameDayIndex(EPOCH_MS - 1)).toBe(-1);
  });
});

describe('startOfGameDay et msUntilNextGameDay', () => {
  it('sont cohérents entre eux', () => {
    const now = EPOCH_MS + 5 * DAY + 1_000;
    expect(startOfGameDay(gameDayIndex(now))).toBe(EPOCH_MS + 5 * DAY);
    expect(msUntilNextGameDay(now)).toBe(DAY - 1_000);
  });
});
