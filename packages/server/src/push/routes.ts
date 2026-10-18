/**
 * Notifications « ton courrier est arrivé ».
 *
 * Le navigateur s'abonne auprès de son service de push et nous confie l'adresse
 * et deux clés ; nous ne savons rien d'autre de l'appareil. Chaque joueur peut
 * avoir plusieurs abonnements (téléphone, PC), les retirer un par un, et tout
 * disparaît avec le compte.
 */
import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context.ts';
import type { Database } from '../db/database.ts';
import { audit } from '../db/repos/audit.ts';
import { newId } from '../auth/tokens.ts';
import { requirePlayer } from '../auth/session.ts';
import { findDestination, findPilot } from '../world/index.ts';
import { isLocale, type Locale } from '../auth/validation.ts';
import { isPushServiceEndpoint, type PushMessage, type PushSubscription } from './webpush.ts';

const MAX_SUBSCRIPTIONS = 5;

const subscribeSchema = {
  body: {
    type: 'object', required: ['endpoint', 'keys'], additionalProperties: false,
    properties: {
      endpoint: { type: 'string', minLength: 12, maxLength: 1024 },
      keys: {
        type: 'object', required: ['p256dh', 'auth'], additionalProperties: false,
        properties: { p256dh: { type: 'string', minLength: 80, maxLength: 100 }, auth: { type: 'string', minLength: 16, maxLength: 32 } },
      },
    },
  },
} as const;

const unsubscribeSchema = {
  body: { type: 'object', required: ['endpoint'], additionalProperties: false, properties: { endpoint: { type: 'string', minLength: 12, maxLength: 1024 } } },
} as const;

export function listSubscriptions(db: Database, playerId: string): (PushSubscription & { id: string })[] {
  return (db.prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE player_id = ?').all(playerId) as unknown as (PushSubscription & { id: string })[]);
}

export function registerPushRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** La clé publique, pour que le navigateur s'abonne. 404 si les notifications ne sont pas configurées. */
  app.get('/v1/push/key', async (_request, reply) => {
    if (!ctx.config.push) return reply.code(404).send({ error: 'push_unavailable' });
    return { publicKey: ctx.config.push.publicKey };
  });

  app.post('/v1/push/subscriptions', {
    schema: subscribeSchema, preHandler: requirePlayer,
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    if (!ctx.config.push) return reply.code(404).send({ error: 'push_unavailable' });
    const player = request.player!;
    const body = request.body as { endpoint: string; keys: { p256dh: string; auth: string } };
    if (!isPushServiceEndpoint(body.endpoint)) return reply.code(400).send({ error: 'invalid', fields: ['endpoint_invalid'] });
    const now = ctx.now();
    const existing = ctx.db.prepare('SELECT id, player_id FROM push_subscriptions WHERE endpoint = ?').get(body.endpoint) as { id: string; player_id: string } | undefined;
    if (existing) {
      // Le même navigateur, peut-être un autre compte : l'abonnement suit le compte connecté.
      ctx.db.prepare('UPDATE push_subscriptions SET player_id = ?, p256dh = ?, auth = ? WHERE id = ?').run(player.id, body.keys.p256dh, body.keys.auth, existing.id);
      return reply.code(200).send({ status: 'subscribed' });
    }
    const count = (ctx.db.prepare('SELECT count(*) AS n FROM push_subscriptions WHERE player_id = ?').get(player.id) as { n: number }).n;
    if (count >= MAX_SUBSCRIPTIONS) return reply.code(409).send({ error: 'push_limit' });
    ctx.db.prepare('INSERT INTO push_subscriptions (id, player_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(newId(), player.id, body.endpoint, body.keys.p256dh, body.keys.auth, now);
    audit(ctx.db, 'push.subscribed', player.id, {}, now);
    return reply.code(201).send({ status: 'subscribed' });
  });

  app.delete('/v1/push/subscriptions', { schema: unsubscribeSchema, preHandler: requirePlayer }, async (request, reply) => {
    const { endpoint } = request.body as { endpoint: string };
    const changes = Number(ctx.db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND player_id = ?').run(endpoint, request.player!.id).changes);
    if (changes === 0) return reply.code(404).send({ error: 'not_found' });
    audit(ctx.db, 'push.unsubscribed', request.player!.id, {}, ctx.now());
    return reply.code(204).send();
  });
}

// ---- L'arrivée du courrier ----

interface ArrivalRow {
  id: string; player_id: string; locale: string; pilot: string; destination: string; reward: number; bonus: number; deadline_at: number; arrives_at: number;
}

function arrivalMessage(row: ArrivalRow): PushMessage {
  const locale: Locale = isLocale(row.locale) ? row.locale : 'fr';
  const template = findPilot(row.pilot);
  const pilot = template?.name[locale] ?? row.pilot;
  const e = template?.gender === 'f' ? 'e' : '';
  const place = findDestination(row.destination)?.name[locale] ?? row.destination;
  const onTime = row.arrives_at <= row.deadline_at;
  const francs = row.reward + (onTime ? row.bonus : 0);
  return locale === 'en'
    ? { title: 'Your mail has arrived', body: `${pilot} has landed at ${place}. +${francs} F${onTime ? ' · deadline met' : ''}.`, url: '/aerodrome', tag: 'courrier' }
    : { title: 'Votre courrier est arrivé', body: `${pilot} s'est posé${e} à ${place}. +${francs} F${onTime ? ' · délai tenu' : ''}.`, url: '/aerodrome', tag: 'courrier' };
}

/**
 * Prévient les joueurs dont un vol vient de se poser. Appelé toutes les trente
 * secondes par le serveur ; sans abonnement, le vol est seulement marqué.
 * Idempotent : un vol ne prévient qu'une fois, quoi qu'il arrive à l'envoi.
 */
export async function notifyArrivals(ctx: AppContext, now: number = ctx.now()): Promise<number> {
  const rows = ctx.db.prepare(`
    SELECT f.id, c.player_id, p.locale, cp.pilot, f.destination, f.reward, f.bonus, f.deadline_at,
           f.departed_at + f.duration_ms AS arrives_at
    FROM flights f
    JOIN companies c ON c.id = f.company_id
    JOIN players p ON p.id = c.player_id
    LEFT JOIN company_pilots cp ON cp.id = f.pilot_id
    WHERE f.notified_at IS NULL AND f.departed_at + f.duration_ms <= ?
    ORDER BY arrives_at
    LIMIT 100
  `).all(now) as unknown as ArrivalRow[];
  let sent = 0;
  for (const row of rows) {
    ctx.db.prepare('UPDATE flights SET notified_at = ? WHERE id = ? AND notified_at IS NULL').run(now, row.id);
    if (!ctx.push) continue;
    // Un vol posé depuis plus d'une heure ne mérite plus une notification : on l'a vu depuis.
    if (now - row.arrives_at > 3_600_000) continue;
    const message = arrivalMessage(row);
    for (const sub of listSubscriptions(ctx.db, row.player_id)) {
      const outcome = await ctx.push.send(sub, message, now);
      if (outcome === 'gone') ctx.db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      else if (outcome === 'sent') {
        ctx.db.prepare('UPDATE push_subscriptions SET last_used_at = ? WHERE id = ?').run(now, sub.id);
        sent += 1;
      }
    }
    if (sent > 0) audit(ctx.db, 'push.sent', row.player_id, { flights: 1 }, now);
  }
  return sent;
}
