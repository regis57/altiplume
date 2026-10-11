import type { Database } from '../database.ts';
import { newId } from '../../auth/tokens.ts';
import { transaction } from '../database.ts';
import { WORLD } from '../../world/index.ts';

export interface Company {
  readonly id: string;
  readonly playerId: string;
  readonly name: string;
  readonly francs: number;
  readonly stamps: number;
  readonly foundedAt: number;
}

export interface CompanyPlane { readonly id: string; readonly model: string; readonly wear: number; readonly acquiredAt: number }
export interface CompanyPilot {
  readonly id: string; readonly pilot: string; readonly affinity: number; readonly morale: number; readonly fatigue: number;
  readonly scenesSeen: number; readonly hiredAt: number; readonly fatigueAt: number;
}
export interface CompanyStamp { readonly stamp: string; readonly earnedAt: number }
export interface CompanyDecoration { readonly decoration: string; readonly placedAt: number }

export interface CompanyState {
  readonly company: Company;
  readonly planes: readonly CompanyPlane[];
  readonly pilots: readonly CompanyPilot[];
  readonly zones: Readonly<Record<string, number>>;
  readonly decorations: readonly CompanyDecoration[];
  readonly stamps: readonly CompanyStamp[];
}

interface CompanyRow { id: string; player_id: string; name: string; francs: number; stamps: number; founded_at: number }

function toCompany(r: CompanyRow): Company {
  return { id: r.id, playerId: r.player_id, name: r.name, francs: r.francs, stamps: r.stamps, foundedAt: r.founded_at };
}

export function findCompanyByPlayer(db: Database, playerId: string): Company | null {
  const row = db.prepare('SELECT * FROM companies WHERE player_id = ?').get(playerId) as CompanyRow | undefined;
  return row ? toCompany(row) : null;
}

/**
 * Fonde la compagnie : le nom, l'état de départ du monde (francs, premier avion,
 * première pilote, zones au niveau 1), et le premier cachet de l'album.
 */
export function foundCompany(db: Database, playerId: string, name: string, now: number): Company {
  return transaction(db, () => {
    const id = newId();
    db.prepare('INSERT INTO companies (id, player_id, name, francs, stamps, founded_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, playerId, name, WORLD.start.francs, WORLD.start.stamps, now);
    for (const model of WORLD.start.planes) {
      db.prepare('INSERT INTO company_planes (id, company_id, model, wear, acquired_at) VALUES (?, ?, ?, 0, ?)').run(newId(), id, model, now);
    }
    for (const pilot of WORLD.start.pilots) {
      db.prepare('INSERT INTO company_pilots (id, company_id, pilot, hired_at) VALUES (?, ?, ?, ?)').run(newId(), id, pilot, now);
    }
    for (const zone of WORLD.zones) {
      db.prepare('INSERT INTO company_zones (company_id, zone, level) VALUES (?, ?, 1)').run(id, zone.id);
    }
    awardStamp(db, id, 's-fondation', now);
    return findCompanyByPlayer(db, playerId)!;
  });
}

/** Colle un cachet dans l'album, une seule fois. Rend vrai s'il est nouveau. */
export function awardStamp(db: Database, companyId: string, stamp: string, now: number): boolean {
  const r = db.prepare('INSERT OR IGNORE INTO company_stamps (company_id, stamp, earned_at) VALUES (?, ?, ?)').run(companyId, stamp, now);
  if (Number(r.changes) === 1) {
    db.prepare('UPDATE companies SET stamps = stamps + 1 WHERE id = ?').run(companyId);
    return true;
  }
  return false;
}

export function loadCompanyState(db: Database, company: Company): CompanyState {
  const planes = (db.prepare('SELECT id, model, wear, acquired_at FROM company_planes WHERE company_id = ? ORDER BY acquired_at, rowid').all(company.id) as
    { id: string; model: string; wear: number; acquired_at: number }[]).map((r) => ({ id: r.id, model: r.model, wear: r.wear, acquiredAt: r.acquired_at }));
  const pilots = (db.prepare('SELECT * FROM company_pilots WHERE company_id = ? ORDER BY hired_at, rowid').all(company.id) as
    { id: string; pilot: string; affinity: number; morale: number; fatigue: number; fatigue_at: number; scenes_seen: number; hired_at: number }[])
    .map((r) => ({ id: r.id, pilot: r.pilot, affinity: r.affinity, morale: r.morale, fatigue: r.fatigue, fatigueAt: r.fatigue_at, scenesSeen: r.scenes_seen, hiredAt: r.hired_at }));
  const zones: Record<string, number> = {};
  for (const r of db.prepare('SELECT zone, level FROM company_zones WHERE company_id = ?').all(company.id) as { zone: string; level: number }[]) zones[r.zone] = r.level;
  const decorations = (db.prepare('SELECT decoration, placed_at FROM company_decorations WHERE company_id = ? ORDER BY placed_at, rowid').all(company.id) as
    { decoration: string; placed_at: number }[]).map((r) => ({ decoration: r.decoration, placedAt: r.placed_at }));
  const stamps = (db.prepare('SELECT stamp, earned_at FROM company_stamps WHERE company_id = ? ORDER BY earned_at, rowid').all(company.id) as
    { stamp: string; earned_at: number }[]).map((r) => ({ stamp: r.stamp, earnedAt: r.earned_at }));
  return { company, planes, pilots, zones, decorations, stamps };
}

export function renameCompany(db: Database, companyId: string, name: string): void {
  db.prepare('UPDATE companies SET name = ? WHERE id = ?').run(name, companyId);
}

export function countCompanies(db: Database): number {
  return Number((db.prepare('SELECT COUNT(*) AS n FROM companies').get() as { n: number }).n);
}
