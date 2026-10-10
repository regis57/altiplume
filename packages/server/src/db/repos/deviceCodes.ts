import { randomInt } from 'node:crypto';
import type { Database } from '../database.ts';
import { fingerprint, newToken } from '../../auth/tokens.ts';

/**
 * Connexion d'un appareil par un autre (« flux QR »).
 *
 * Le PC demande un code d'appareil et affiche un QR qui le contient, plus un code
 * à six chiffres. Le téléphone, déjà connecté, lit le QR, affiche le même code à
 * six chiffres, et la personne confirme qu'ils correspondent. C'est ce que le
 * standard appelle « device authorization » ; les six chiffres protègent contre un
 * QR affiché par quelqu'un d'autre.
 */
export const DEVICE_CODE_TTL_MS = 90_000;

export type DeviceStatus = 'pending' | 'approved' | 'denied' | 'consumed';

export interface DeviceStart {
  /** Dans le QR. Secret vis-à-vis de tout le monde sauf le téléphone qui le lit. */
  readonly deviceCode: string;
  /** Gardé par le PC pour interroger. Jamais dans le QR. */
  readonly pollToken: string;
  readonly userCode: string;
  readonly expiresAt: number;
}

export function startDeviceFlow(db: Database, now: number): DeviceStart {
  const deviceCode = newToken();
  const pollToken = newToken();
  const userCode = String(randomInt(0, 1_000_000)).padStart(6, '0');
  db.prepare(`
    INSERT INTO device_codes (id, user_code, poll_key, status, created_at, expires_at)
    VALUES (?, ?, ?, 'pending', ?, ?)
  `).run(fingerprint(deviceCode), userCode, fingerprint(pollToken), now, now + DEVICE_CODE_TTL_MS);
  return { deviceCode, pollToken, userCode, expiresAt: now + DEVICE_CODE_TTL_MS };
}

interface Row { id: string; user_code: string; status: DeviceStatus; player_id: string | null; expires_at: number }

/** Ce que le téléphone voit avant d'approuver. */
export function peekDeviceCode(db: Database, deviceCode: string, now: number): { userCode: string; status: DeviceStatus } | null {
  if (typeof deviceCode !== 'string' || deviceCode.length < 40 || deviceCode.length > 64) return null;
  const row = db.prepare('SELECT * FROM device_codes WHERE id = ?').get(fingerprint(deviceCode)) as Row | undefined;
  if (!row || row.expires_at <= now) return null;
  return { userCode: row.user_code, status: row.status };
}

/** Approbation ou refus par un joueur connecté. Une seule fois. */
export function decideDeviceCode(db: Database, deviceCode: string, playerId: string, approve: boolean, now: number): boolean {
  if (typeof deviceCode !== 'string' || deviceCode.length < 40 || deviceCode.length > 64) return false;
  const result = db.prepare(`
    UPDATE device_codes SET status = ?, player_id = ?
    WHERE id = ? AND status = 'pending' AND expires_at > ?
  `).run(approve ? 'approved' : 'denied', approve ? playerId : null, fingerprint(deviceCode), now);
  return Number(result.changes) === 1;
}

export type PollResult =
  | { status: 'pending' | 'denied' | 'expired' }
  | { status: 'approved'; playerId: string };

/** Interrogation par le PC. Une approbation n'est livrée qu'une fois, puis consommée. */
export function pollDeviceCode(db: Database, pollToken: string, now: number): PollResult {
  if (typeof pollToken !== 'string' || pollToken.length < 40 || pollToken.length > 64) return { status: 'expired' };
  const key = fingerprint(pollToken);
  const row = db.prepare('SELECT * FROM device_codes WHERE poll_key = ?').get(key) as Row | undefined;
  if (!row || row.expires_at <= now) return { status: 'expired' };
  if (row.status === 'approved' && row.player_id) {
    const updated = db.prepare("UPDATE device_codes SET status = 'consumed' WHERE poll_key = ? AND status = 'approved'").run(key);
    if (Number(updated.changes) === 1) return { status: 'approved', playerId: row.player_id };
    return { status: 'expired' };
  }
  if (row.status === 'denied') return { status: 'denied' };
  if (row.status === 'consumed') return { status: 'expired' };
  return { status: 'pending' };
}

export function purgeExpiredDeviceCodes(db: Database, now: number): number {
  return Number(db.prepare('DELETE FROM device_codes WHERE expires_at <= ?').run(now - 600_000).changes);
}
