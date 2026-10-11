import type { Database } from '../database.ts';

/**
 * Journal d'audit. Enregistre des événements, jamais de données personnelles :
 * ni email, ni adresse IP, ni agent utilisateur. `meta` est un petit objet JSON
 * de codes et de compteurs.
 */
export type AuditEvent =
  | 'player.registered'
  | 'player.login'
  | 'player.logout'
  | 'player.renamed'
  | 'player.exported'
  | 'player.deleted'
  | 'magic_link.sent'
  | 'magic_link.rejected'
  | 'passkey.added'
  | 'passkey.removed'
  | 'passkey.rejected'
  | 'device.approved'
  | 'device.denied'
  | 'push.subscribed'
  | 'push.unsubscribed'
  | 'push.sent'
  | 'company.founded'
  | 'company.renamed'
  | 'flight.dispatched'
  | 'card.played'
  | 'company.built'
  | 'route.opened'
  | 'contact.sent'
  | 'contact.rejected';

export function audit(
  db: Database, event: AuditEvent, playerId: string | null, meta: Record<string, string | number | boolean> = {}, now: number = Date.now(),
): void {
  db.prepare('INSERT INTO audit (at, event, player_id, meta) VALUES (?, ?, ?, ?)')
    .run(now, event, playerId, JSON.stringify(meta));
}

export function purgeOldAudit(db: Database, now: number, keepMs: number = 90 * 24 * 3_600_000): number {
  return Number(db.prepare('DELETE FROM audit WHERE at < ?').run(now - keepMs).changes);
}
