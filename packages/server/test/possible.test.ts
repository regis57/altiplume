import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { canCarry, carryCapacity, drawCards, companyFleet } from '../src/game/sim.ts';
import { makeRng } from '../src/sim/rng.ts';
import { findCard, findDestination, findPlane, WORLD } from '../src/world/index.ts';
import type { ContractCard } from '../src/world/types.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };
const DAY = 86_400_000;

const grive = findPlane('grive')!;
const pic = findPlane('pic')!;
const heron = findPlane('heron')!;
/** Le premier jour : une Grive, un pilote. */
const start = { planes: [grive], pilots: 1, reach: 1 };

describe('ce que la flotte peut porter', () => {
  it('compte le plus gros avion, puis les deux plus gros ensemble', () => {
    const moulin = findDestination('moulin-gris')!;
    expect(carryCapacity([grive], moulin)).toEqual({ alone: 2, convoy: 2 });
    expect(carryCapacity([grive, grive], moulin)).toEqual({ alone: 2, convoy: 4 });
    // Le Pic ne se pose pas partout, mais Moulin-Gris a une vraie piste.
    expect(carryCapacity([grive, pic], moulin).convoy).toBe(grive.capacity + pic.capacity);
  });

  it("ne compte pas un avion qui ne peut ni s'y poser ni y aller", () => {
    const clairiere = findDestination('sonnefeuille')!; // clairière : seul le Pic
    expect(carryCapacity([grive, heron], clairiere)).toEqual({ alone: 0, convoy: 0 });
    expect(carryCapacity([pic], clairiere).alone).toBe(pic.capacity);
    const loin = findDestination('le-hetre-roi')!; // 12 lieues
    expect(carryCapacity([{ ...pic, range: 6 }], loin).alone).toBe(0);
    // « Longues routes » allonge la portée de son pilote.
    expect(carryCapacity([{ ...pic, range: 11 }], loin, 1.2).alone).toBe(pic.capacity);
  });
});

describe('un contrat qu’on peut vraiment faire', () => {
  const farine = findCard('c-farine') as ContractCard; // trois sacs, Moulin-Gris

  it("refuse les trois sacs à qui n'a qu'une Grive — c'est le défaut du 13/10", () => {
    expect(farine.bags).toBe(3);
    expect(canCarry(farine, start)).toBe(false);
  });

  it('les accepte dès qu’il y a deux avions et deux pilotes', () => {
    expect(canCarry(farine, { planes: [grive, grive], pilots: 2, reach: 1 })).toBe(true);
    // Deux avions, un seul pilote : personne pour mener le second.
    expect(canCarry(farine, { planes: [grive, grive], pilots: 1, reach: 1 })).toBe(false);
    // Un seul avion, mais assez grand : pas besoin de convoi. (Aucun avion du jeu
    // ne porte trois sacs sur la piste de Moulin-Gris ; celui-ci est de laboratoire.)
    expect(canCarry(farine, { planes: [{ ...grive, capacity: 3 }], pilots: 1, reach: 1 })).toBe(true);
    // Le Héron porte cinq sacs, mais il lui faut la grande piste : pas à Moulin-Gris.
    expect(canCarry(farine, { planes: [heron, heron], pilots: 2, reach: 1 })).toBe(false);
  });

  it('laisse passer tous les contrats ordinaires de la vallée', () => {
    const vallee = WORLD.cards.filter((c): c is ContractCard => c.kind === 'contract' && !c.standing && c.bags <= 2
      && findDestination(c.destination)?.region === 'brume');
    expect(vallee.length).toBeGreaterThan(5);
    for (const c of vallee) expect(canCarry(c, start), c.id).toBe(true);
  });
});

describe('le tirage ne propose rien d’impossible', () => {
  const draws = (fleet: Parameters<typeof canCarry>[1] | undefined) => {
    const all = new Set<string>();
    for (let seed = 0; seed < 1500; seed += 1) for (const id of drawCards(makeRng(seed), [], 1, 3, ['brume'], [], undefined, fleet)) all.add(id);
    return all;
  };

  it('garde le fret lourd pour plus tard, et le donne quand la flotte suit', () => {
    const seul = draws(start);
    expect(seul.has('c-farine')).toBe(false);
    expect([...seul].every((id) => { const c = findCard(id)!; return c.kind !== 'contract' || canCarry(c, start); })).toBe(true);
    const deux = draws({ planes: [grive, grive], pilots: 2, reach: 1 });
    expect(deux.has('c-farine')).toBe(true);
  });

  it('laisse encore de quoi jouer le premier jour', () => {
    const seul = draws(start);
    const contrats = [...seul].filter((id) => findCard(id)!.kind === 'contract');
    expect(contrats.length).toBeGreaterThanOrEqual(8);
  });

  it('sans flotte donnée, tire comme avant — les tests du monde comptent dessus', () => {
    expect(draws(undefined).has('c-farine')).toBe(true);
  });
});

describe('la main ne reste pas en travers', () => {
  it('rend au lendemain le contrat que la flotte ne peut pas porter, et le dit', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/auth/register', signup);
    const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    await t.json('POST', '/v1/company', { name: 'Les Ailes de la Croisette' }, cookie);
    const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json();
    const companyId = (t.ctx.db.prepare('SELECT id FROM companies').get() as { id: string }).id;
    expect(companyFleet(t.ctx.db, companyId).planes.map((p) => p.id)).toEqual(['grive']);
    // Une carte de fret lourd glissée en main, comme celles d'avant le correctif.
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    t.ctx.db.prepare('INSERT INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run('c-farine', t.ctx.now());
    expect((await state()).hand.map((h: { card: string }) => h.card)).toContain('c-farine');

    t.advance(DAY);
    const demain = await state();
    expect(demain.hand.map((h: { card: string }) => h.card)).not.toContain('c-farine');
    expect(demain.news).toContainEqual({ kind: 'cards.released', count: 1 });
    // Et la main s'est remplie de cartes faisables.
    const fleet = { planes: [grive], pilots: 1, reach: 1 };
    for (const h of demain.hand) {
      const c = findCard(h.card)!;
      if (c.kind === 'contract') expect(canCarry(c, fleet), h.card).toBe(true);
    }
    await t.app.close();
  });
});
