import type { Database } from '../database.ts';
import { fingerprint, newToken } from '../../auth/tokens.ts';

/** Un lien magique vit dix minutes. Assez pour ouvrir sa boîte, pas assez pour traîner. */
export const MAGIC_LINK_TTL_MS = 10 * 60_000;

export type Purpose = 'signup' | 'login';

export interface SignupPayload {
  readonly nickname: string;
  readonly locale: string;
  readonly termsVersion: string;
}

export interface MagicLink {
  readonly id: string;
  readonly email: string;
  readonly purpose: Purpose;
  readonly payload: SignupPayload | null;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly usedAt: number | null;
}

interface Row {
  id: string; email: string; purpose: Purpose; payload: string | null;
  created_at: number; expires_at: number; used_at: number | null;
}

function toLink(r: Row): MagicLink {
  return {
    id: r.id, email: r.email, purpose: r.purpose,
    payload: r.payload ? (JSON.parse(r.payload) as SignupPayload) : null,
    createdAt: r.created_at, expiresAt: r.expires_at, usedAt: r.used_at,
  };
}

/** Crée un lien et rend son jeton en clair, à envoyer par email puis à oublier. */
export function createMagicLink(
  db: Database, email: string, purpose: Purpose, payload: SignupPayload | null, now: number,
): string {
  // Un seul lien actif par adresse et par usage : le nouveau remplace l'ancien, qui
  // est marqué consommé plutôt que supprimé — il compte encore pour la limite d'envoi.
  db.prepare('UPDATE magic_links SET used_at = ? WHERE email = ? AND purpose = ? AND used_at IS NULL')
    .run(now, email, purpose);
  const token = newToken();
  db.prepare(`
    INSERT INTO magic_links (id, email, purpose, payload, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(fingerprint(token), email, purpose, payload ? JSON.stringify(payload) : null,
    now, now + MAGIC_LINK_TTL_MS);
  return token;
}

export type ConsumeResult =
  | { ok: true; link: MagicLink }
  | { ok: false; reason: 'unknown' | 'expired' | 'used' };

/**
 * Consomme un lien : valide une seule fois, puis marqué utilisé. L'opération est
 * atomique — deux clics simultanés ne donnent qu'une session.
 */
export function consumeMagicLink(db: Database, token: string, now: number): ConsumeResult {
  if (typeof token !== 'string' || token.length < 40 || token.length > 64) return { ok: false, reason: 'unknown' };
  const id = fingerprint(token);
  const row = db.prepare('SELECT * FROM magic_links WHERE id = ?').get(id) as Row | undefined;
  if (!row) return { ok: false, reason: 'unknown' };
  if (row.used_at !== null) return { ok: false, reason: 'used' };
  if (row.expires_at <= now) return { ok: false, reason: 'expired' };
  const updated = db.prepare('UPDATE magic_links SET used_at = ? WHERE id = ? AND used_at IS NULL').run(now, id);
  if (Number(updated.changes) !== 1) return { ok: false, reason: 'used' };
  return { ok: true, link: toLink({ ...row, used_at: now }) };
}

/** Nombre de liens créés pour une adresse dans la fenêtre : anti-abus. */
export function countRecentLinks(db: Database, email: string, sinceMs: number): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM magic_links WHERE email = ? AND created_at >= ?')
    .get(email, sinceMs) as { n: number }).n;
}

export function purgeExpiredLinks(db: Database, now: number): number {
  return Number(db.prepare('DELETE FROM magic_links WHERE expires_at <= ? OR used_at IS NOT NULL').run(now - 3_600_000).changes);
}
