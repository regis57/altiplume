import type { Database } from '../database.ts';
import { fingerprint, newToken } from '../../auth/tokens.ts';

export interface Passkey {
  readonly id: string;
  readonly playerId: string;
  readonly publicKey: Uint8Array<ArrayBuffer>;
  readonly counter: number;
  readonly transports: string[];
  readonly deviceType: 'singleDevice' | 'multiDevice';
  readonly backedUp: boolean;
  readonly name: string;
  readonly createdAt: number;
  readonly lastUsedAt: number | null;
}

interface Row {
  id: string; player_id: string; public_key: Uint8Array; counter: number; transports: string | null;
  device_type: 'singleDevice' | 'multiDevice'; backed_up: number; name: string; created_at: number; last_used_at: number | null;
}

function toPasskey(r: Row): Passkey {
  return {
    id: r.id, playerId: r.player_id, publicKey: new Uint8Array(r.public_key) as Uint8Array<ArrayBuffer>, counter: r.counter,
    transports: r.transports ? (JSON.parse(r.transports) as string[]) : [],
    deviceType: r.device_type, backedUp: r.backed_up === 1, name: r.name,
    createdAt: r.created_at, lastUsedAt: r.last_used_at,
  };
}

export interface NewPasskey {
  readonly id: string;
  readonly playerId: string;
  readonly publicKey: Uint8Array;
  readonly counter: number;
  readonly transports: string[];
  readonly deviceType: 'singleDevice' | 'multiDevice';
  readonly backedUp: boolean;
  readonly name: string;
}

export function createPasskey(db: Database, input: NewPasskey, now: number): void {
  db.prepare(`
    INSERT INTO passkeys (id, player_id, public_key, counter, transports, device_type, backed_up, name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(input.id, input.playerId, input.publicKey, input.counter, JSON.stringify(input.transports),
    input.deviceType, input.backedUp ? 1 : 0, input.name, now);
}

export function findPasskey(db: Database, id: string): Passkey | null {
  const row = db.prepare('SELECT * FROM passkeys WHERE id = ?').get(id) as Row | undefined;
  return row ? toPasskey(row) : null;
}

export function listPasskeys(db: Database, playerId: string): Passkey[] {
  return (db.prepare('SELECT * FROM passkeys WHERE player_id = ? ORDER BY created_at').all(playerId) as unknown as Row[]).map(toPasskey);
}

export function touchPasskey(db: Database, id: string, counter: number, now: number): void {
  db.prepare('UPDATE passkeys SET counter = ?, last_used_at = ? WHERE id = ?').run(counter, now, id);
}

export function renamePasskey(db: Database, id: string, playerId: string, name: string): boolean {
  return Number(db.prepare('UPDATE passkeys SET name = ? WHERE id = ? AND player_id = ?').run(name, id, playerId).changes) === 1;
}

export function deletePasskey(db: Database, id: string, playerId: string): boolean {
  return Number(db.prepare('DELETE FROM passkeys WHERE id = ? AND player_id = ?').run(id, playerId).changes) === 1;
}

// ---- Défis ----

export const CHALLENGE_TTL_MS = 5 * 60_000;

export interface Challenge {
  readonly challenge: string;
  readonly purpose: 'register' | 'authenticate';
  readonly playerId: string | null;
}

/** Enregistre un défi et rend le jeton (à poser en cookie) qui permettra de le retrouver. */
export function storeChallenge(db: Database, challenge: string, purpose: Challenge['purpose'], playerId: string | null, now: number): string {
  const token = newToken();
  db.prepare(`
    INSERT INTO webauthn_challenges (id, challenge, purpose, player_id, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(fingerprint(token), challenge, purpose, playerId, now, now + CHALLENGE_TTL_MS);
  return token;
}

/** Consomme un défi : valide une seule fois, supprimé aussitôt. */
export function takeChallenge(db: Database, token: string, purpose: Challenge['purpose'], now: number): Challenge | null {
  if (typeof token !== 'string' || token.length < 40 || token.length > 64) return null;
  const id = fingerprint(token);
  const row = db.prepare('SELECT * FROM webauthn_challenges WHERE id = ?').get(id) as
    { challenge: string; purpose: Challenge['purpose']; player_id: string | null; expires_at: number } | undefined;
  db.prepare('DELETE FROM webauthn_challenges WHERE id = ?').run(id);
  if (!row || row.purpose !== purpose || row.expires_at <= now) return null;
  return { challenge: row.challenge, purpose: row.purpose, playerId: row.player_id };
}

export function purgeExpiredChallenges(db: Database, now: number): number {
  return Number(db.prepare('DELETE FROM webauthn_challenges WHERE expires_at <= ?').run(now).changes);
}
