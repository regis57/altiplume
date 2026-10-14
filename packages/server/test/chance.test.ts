import { describe, expect, it } from 'vitest';
import { companyLuck } from '../src/game/sim.ts';
import { openDatabase } from '../src/db/database.ts';

/** La chance de la compagnie est celle du plus chanceux, pas le produit de tous. */
describe('la chance de la compagnie', () => {
  it('est celle du pilote le plus chanceux', () => {
    const db = openDatabase({ path: ':memory:' });
    db.exec('PRAGMA foreign_keys = OFF');
    const hire = (pilot: string) => db.prepare("INSERT INTO company_pilots (id, company_id, pilot, hired_at) VALUES (?, 'c', ?, 0)").run(`${pilot}-id`, pilot);
    expect(companyLuck(db, 'c')).toBe(1);
    hire('prosper'); // Cœur de village : × 1,05
    expect(companyLuck(db, 'c')).toBeCloseTo(1.05);
    hire('yse'); hire('teodor'); hire('garance'); hire('rosalie'); // deux Porte-bonheur, trois Cœur de village
    expect(companyLuck(db, 'c')).toBeCloseTo(1.15);
  });
});
