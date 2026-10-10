import { describe, expect, it } from 'vitest';
import { deriveSeed, makeRng, pick, randomInt, sample, shuffle } from '../src/sim/rng.ts';

describe('deriveSeed', () => {
  it('est stable pour un même triplet', () => {
    expect(deriveSeed('joueur-1', 42, 'cartes')).toBe(deriveSeed('joueur-1', 42, 'cartes'));
  });

  it('sépare les joueurs, les jours et les usages', () => {
    const base = deriveSeed('joueur-1', 42, 'cartes');
    expect(deriveSeed('joueur-2', 42, 'cartes')).not.toBe(base);
    expect(deriveSeed('joueur-1', 43, 'cartes')).not.toBe(base);
    expect(deriveSeed('joueur-1', 42, 'meteo')).not.toBe(base);
  });

  it('ne confond pas deux triplets dont la concaténation serait identique', () => {
    expect(deriveSeed('a', 1, 'bc')).not.toBe(deriveSeed('a1b', 0, 'c'));
  });
});

describe('makeRng', () => {
  it('rejoue exactement la même suite pour une même graine', () => {
    const a = makeRng(12345);
    const b = makeRng(12345);
    const seqA = Array.from({ length: 50 }, () => a());
    const seqB = Array.from({ length: 50 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('reste dans [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 5000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('couvre raisonnablement l\'intervalle', () => {
    const rng = makeRng(99);
    const buckets = new Array<number>(10).fill(0);
    for (let i = 0; i < 10_000; i += 1) {
      const index = Math.floor(rng() * 10);
      buckets[index] = (buckets[index] ?? 0) + 1;
    }
    for (const count of buckets) expect(count).toBeGreaterThan(700);
  });
});

describe('randomInt', () => {
  it('respecte les bornes incluses', () => {
    const rng = makeRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i += 1) {
      const value = randomInt(rng, 1, 6);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      seen.add(value);
    }
    expect(seen.size).toBe(6);
  });

  it('refuse un intervalle inversé ou non entier', () => {
    const rng = makeRng(1);
    expect(() => randomInt(rng, 5, 2)).toThrow(RangeError);
    expect(() => randomInt(rng, 0.5, 2)).toThrow(RangeError);
  });
});

describe('pick, shuffle, sample', () => {
  const cards = ['a', 'b', 'c', 'd', 'e'] as const;

  it('pick refuse un tableau vide', () => {
    expect(() => pick(makeRng(1), [])).toThrow(RangeError);
  });

  it('shuffle conserve les éléments sans altérer la source', () => {
    const source = [...cards];
    const mixed = shuffle(makeRng(4), source);
    expect(mixed).toHaveLength(source.length);
    expect([...mixed].sort()).toEqual([...source].sort());
    expect(source).toEqual([...cards]);
  });

  it('sample tire des éléments distincts', () => {
    const drawn = sample(makeRng(8), cards, 3);
    expect(drawn).toHaveLength(3);
    expect(new Set(drawn).size).toBe(3);
  });

  it('sample ne dépasse pas la taille du paquet', () => {
    expect(sample(makeRng(8), cards, 99)).toHaveLength(cards.length);
    expect(sample(makeRng(8), cards, -1)).toHaveLength(0);
  });

  it('le tirage du jour est reproductible pour un joueur', () => {
    const seed = deriveSeed('joueur-1', 100, 'cartes');
    expect(sample(makeRng(seed), cards, 3)).toEqual(sample(makeRng(seed), cards, 3));
  });
});
