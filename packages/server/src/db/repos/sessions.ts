import type { Database } from '../database.ts';
import { fingerprint, newToken } from '../../auth/tokens.ts';

/** Durée de vie d'une session, glissante : chaque usage la prolonge. */
export const SESSION_TTL_MS = 30 * 24 * 3_600_000;
/** On ne réécrit la date d'usage qu'au-delà de cet intervalle, pour ménager la base. */
export const TOUCH_INTERVAL_MS = 10 * 60_000;

export interface Session {
  readonly id: string;
  readonly playerId: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly lastUsedAt: number;
}

interface Row { id: string; player_id: string; created_at: number; expires_at: number; last_used_at: number }

/** Crée une session et rend le jeton EN CLAIR — à mettre dans le cookie, puis à oublier. */
export function createSession(db: Database, playerId: string, now: number): { token: string; session: Session } {
  const token = newToken();
  const id = fingerprint(token);
  db.prepare(`
    INSERT INTO sessions (id, player_id, created_at, expires_at, last_used_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, playerId, now, now + SESSION_TTL_MS, now);
  return {
    token,
    session: { id, playerId, createdAt: now, expiresAt: now + SESSION_TTL_MS, lastUsedAt: now },
  };
}

/** Résout un jeton de cookie. Prolonge la session si elle est valide. */
export function resolveSession(db: Database, token: string, now: number): Session | null {
  if (typeof token !== 'string' || token.length < 40 || token.length > 64) return null;
  const id = fingerprint(token);
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Row | undefined;
  if (!row) return null;
  if (row.expires_at <= now) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    return null;
  }
  if (now - row.last_used_at > TOUCH_INTERVAL_MS) {
    db.prepare('UPDATE sessions SET last_used_at = ?, expires_at = ? WHERE id = ?')
      .run(now, now + SESSION_TTL_MS, id);
  }
  return { id, playerId: row.player_id, createdAt: row.created_at, expiresAt: row.expires_at, lastUsedAt: row.last_used_at };
}

export function revokeSession(db: Database, token: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(fingerprint(token));
}

export function revokeAllSessions(db: Database, playerId: string): number {
  return Number(db.prepare('DELETE FROM sessions WHERE player_id = ?').run(playerId).changes);
}

export function purgeExpiredSessions(db: Database, now: number): number {
  return Number(db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now).changes);
}
