import { describe, expect, it } from 'vitest';
import { carryCapacity, companyFleet, drawCards, incidentRisk, type Fleet } from '../src/game/sim.ts';
import { makeRng } from '../src/sim/rng.ts';
import { findDestination, findPilot, findPlane, WORLD } from '../src/world/index.ts';
import { sessionCookie, testApp } from './helpers.ts';

/**
 * Des règles que le jeu promettait sans les tenir (revue du 18 octobre 2026) : une
 * carte ne doit pas être tirée quand elle ne peut que dire « non », un imprévu ne
 * touche pas un avion en l'air, la nuit se juge au même moment pour le risque et
 * pour l'album, et l'allonge d'un pilote ne mène qu'un avion.
 */

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };
const ALL = ['brume', 'saline', 'archipel', 'cuivre'] as const;
const OFFRES = ['o-grive', 'o-martinet', 'o-heron', 'o-pic', 'o-sterne', 'o-goeland', 'o-pilote', 'o-pilote-iles', 'o-pilote-foret'];

/** Tout ce qui peut tomber : on tire autant de cartes qu'il en existe. */
const everything = (fleet: Fleet) => drawCards(makeRng(7), [], 1, WORLD.cards.length, [...ALL], [], 'automne', fleet);

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, cookie);
  const id = (t.ctx.db.prepare('SELECT id FROM companies').get() as { id: string }).id;
  return { ...t, cookie, id };
}

describe('en fin de partie, plus d\'offre qui ne peut dire que « non »', () => {
  it('hangar et ponton à leur dernier niveau et pleins, dix pilotes : aucune offre d\'avion ni de pilote', async () => {
    const t = await company();
    for (const zone of ['hangar', 'ponton', 'runway']) t.ctx.db.prepare('INSERT OR REPLACE INTO company_zones (company_id, zone, level) VALUES (?, ?, 3)').run(t.id, zone);
    for (const model of ['heron', 'pic', 'sterne', 'goeland']) t.ctx.db.prepare('INSERT INTO company_planes (id, company_id, model, wear, acquired_at) VALUES (?, ?, ?, 0, 0)').run(`p-${model}`, t.id, model);
    const hired = (t.ctx.db.prepare('SELECT pilot FROM company_pilots').all() as { pilot: string }[]).map((r) => r.pilot);
    for (const p of WORLD.pilots.filter((x) => !hired.includes(x.id))) t.ctx.db.prepare('INSERT INTO company_pilots (id, company_id, pilot, hired_at) VALUES (?, ?, ?, 0)').run(`pi-${p.id}`, t.id, p.id);
    const fleet = companyFleet(t.ctx.db, t.id);
    expect(fleet.noRoom).toEqual({ hangar: true, ponton: true });
    expect(fleet.allPilotsHired).toBe(true);
    const drawn = everything(fleet);
    for (const id of OFFRES) expect(drawn, id).not.toContain(id);
    await t.app.close();
  });

  it('tant qu\'une place peut encore se gagner, les offres restent tirées', async () => {
    const t = await company();
    const fleet = companyFleet(t.ctx.db, t.id);
    expect(fleet.noRoom).toEqual({ hangar: false, ponton: false });
    expect(fleet.allPilotsHired).toBe(false);
    const drawn = everything({ ...fleet, home: 'medium' });
    for (const id of ['o-grive', 'o-martinet', 'o-heron', 'o-pic', 'o-sterne', 'o-goeland', 'o-pilote']) expect(drawn, id).toContain(id);
    await t.app.close();
  });
});

describe('les imprévus de coque et de flotteurs', () => {
  const grive = findPlane('grive')!;
  it('ne tombent pas chez qui n\'a pas d\'hydravion', () => {
    const sans = everything({ planes: [grive], pilots: 1, reach: 1, home: 'short' });
    expect(sans).not.toContain('e-maree');
    expect(sans).not.toContain('e-grain');
    const avec = everything({ planes: [grive, findPlane('sterne')!], pilots: 2, reach: 1, home: 'short' });
    expect(avec).toContain('e-maree');
    expect(avec).toContain('e-grain');
  });
});

describe('un imprévu use un avion au sol, jamais un avion en l\'air', () => {
  it('« Décoller quand même » use l\'avion qui reste, pas celui qui vole', async () => {
    const t = await company();
    const grive = t.ctx.db.prepare('SELECT id FROM company_planes').get() as { id: string };
    t.ctx.db.prepare("INSERT INTO company_planes (id, company_id, model, wear, acquired_at) VALUES ('sol', ?, 'pic', 40, 0)").run(t.id);
    // La Grive (usure 0, la moins usée) est en l'air.
    const pilot = t.ctx.db.prepare('SELECT id FROM company_pilots').get() as { id: string };
    const now = t.ctx.now();
    t.ctx.db.prepare(`INSERT INTO flights (id, company_id, card, plane_id, pilot_id, destination, departed_at, duration_ms, deadline_at, reward, bonus, incident, convoy)
      VALUES ('vol', ?, 'c-journal', ?, ?, 'pont-de-brume', ?, 3600000, ?, 10, 0, 0, NULL)`).run(t.id, grive.id, pilot.id, now, now + 3 * 3_600_000);
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    t.ctx.db.prepare("INSERT INTO company_hand (company_id, card, drawn_at) VALUES (?, 'e-vent', ?)").run(t.id, now);
    const r = await t.json('POST', '/v1/company/cards/e-vent/play', { choice: 'go' }, t.cookie);
    expect(r.statusCode).toBe(200);
    const wear = Object.fromEntries((t.ctx.db.prepare('SELECT id, wear FROM company_planes').all() as { id: string; wear: number }[]).map((p) => [p.id, p.wear]));
    expect(wear[grive.id]).toBe(0);
    expect(wear['sol']).toBe(50);
    await t.app.close();
  });
});

describe('la nuit aux lanternes se juge à l\'atterrissage', () => {
  it('un départ à 20 h 30 pour une heure de vol court le risque de nuit, comme il gagne la page « Vol de nuit »', () => {
    const base = {
      model: findPlane('grive')!, template: findPilot('prosper')!, plane: { id: 'p', model: 'grive', wear: 0 },
      pilot: { id: 'x', pilot: 'prosper', affinity: 0, morale: 10, fatigue: 0, fatigue_at: 0, scenes_seen: 0 },
      destination: findDestination('lanterne-du-val')!, timezone: 'Europe/Paris',
    };
    const depart = Date.UTC(2026, 9, 12, 18, 30); // 20 h 30 à Paris
    const nuit = Date.UTC(2026, 9, 12, 20); // 22 h à Paris
    const jour = Date.UTC(2026, 9, 12, 10);
    expect(incidentRisk({ ...base, durationMs: 3_600_000 }, depart)).toBeCloseTo(incidentRisk(base, nuit), 10);
    expect(incidentRisk({ ...base, durationMs: 3_600_000 }, depart)).toBeGreaterThan(incidentRisk(base, jour));
  });
});

describe('l\'allonge d\'un pilote ne mène qu\'un avion', () => {
  it('deux Sternes vers Sainte-Lueur, un seul pilote Longues routes : un seul avion y va', () => {
    const sterne = findPlane('sterne')!;
    const lueur = findDestination('sainte-lueur')!;
    expect(lueur.distance).toBeGreaterThan(sterne.range); // il faut l'allonge
    expect(carryCapacity([sterne, sterne], lueur, 1.2, 1)).toEqual({ alone: sterne.capacity, convoy: sterne.capacity });
    expect(carryCapacity([sterne, sterne], lueur, 1.2, 2)).toEqual({ alone: sterne.capacity, convoy: 2 * sterne.capacity });
    expect(carryCapacity([sterne, sterne], lueur, 1.2, 0)).toEqual({ alone: 0, convoy: 0 });
  });
});
