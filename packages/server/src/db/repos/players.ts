import type { Database } from '../database.ts';
import { newId } from '../../auth/tokens.ts';
import { foldNickname } from '../../auth/validation.ts';

export interface Player {
  readonly id: string;
  readonly email: string;
  readonly nickname: string;
  readonly locale: string;
  readonly ageConfirmed: boolean;
  readonly termsVersion: string;
  readonly termsAcceptedAt: number;
  readonly createdAt: number;
  readonly lastSeenAt: number;
}

interface Row {
  id: string; email: string; nickname: string; locale: string; age_confirmed: number;
  terms_version: string; terms_accepted_at: number; created_at: number; last_seen_at: number;
}

function toPlayer(r: Row): Player {
  return {
    id: r.id, email: r.email, nickname: r.nickname, locale: r.locale,
    ageConfirmed: r.age_confirmed === 1, termsVersion: r.terms_version,
    termsAcceptedAt: r.terms_accepted_at, createdAt: r.created_at, lastSeenAt: r.last_seen_at,
  };
}

export interface NewPlayer {
  readonly email: string;
  readonly nickname: string;
  readonly locale: string;
  readonly termsVersion: string;
}

export function createPlayer(db: Database, input: NewPlayer, now: number): Player {
  const id = newId();
  db.prepare(`
    INSERT INTO players (id, email, nickname, nickname_key, locale, age_confirmed, terms_version,
                         terms_accepted_at, created_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `).run(id, input.email, input.nickname, foldNickname(input.nickname), input.locale, input.termsVersion, now, now, now);
  return findPlayerById(db, id) as Player;
}

export function findPlayerById(db: Database, id: string): Player | null {
  const row = db.prepare('SELECT * FROM players WHERE id = ?').get(id) as Row | undefined;
  return row ? toPlayer(row) : null;
}

export function findPlayerByEmail(db: Database, email: string): Player | null {
  const row = db.prepare('SELECT * FROM players WHERE email = ?').get(email) as Row | undefined;
  return row ? toPlayer(row) : null;
}

/**
 * Un pseudonyme est pris si sa forme repliée l'est : « Régis », « REGIS » et
 * « R3gis » sont le même nom aux yeux de tous, donc aux nôtres.
 */
export function nicknameTaken(db: Database, nickname: string, exceptPlayerId?: string): boolean {
  const row = db.prepare('SELECT id FROM players WHERE nickname_key = ?').get(foldNickname(nickname)) as { id: string } | undefined;
  return row !== undefined && row.id !== exceptPlayerId;
}

export function touchPlayer(db: Database, id: string, now: number): void {
  // Revenir efface les avertissements d'inactivité : on repart de zéro.
  db.prepare('UPDATE players SET last_seen_at = ?, inactivity_warned = 0 WHERE id = ?').run(now, id);
}

export function renamePlayer(db: Database, id: string, nickname: string): void {
  db.prepare('UPDATE players SET nickname = ?, nickname_key = ? WHERE id = ?').run(nickname, foldNickname(nickname), id);
}

export function setPlayerLocale(db: Database, id: string, locale: string): void {
  db.prepare('UPDATE players SET locale = ? WHERE id = ?').run(locale, id);
}

/** Suppression définitive. Les sessions suivent par cascade. */
export function deletePlayer(db: Database, id: string): boolean {
  const result = db.prepare('DELETE FROM players WHERE id = ?').run(id);
  return result.changes === 1;
}

export function countPlayers(db: Database): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM players').get() as { n: number }).n;
}
