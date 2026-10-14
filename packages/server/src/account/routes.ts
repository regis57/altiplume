import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context.ts';
import { transaction } from '../db/database.ts';
import { audit } from '../db/repos/audit.ts';
import { deletePlayer, nicknameTaken, renamePlayer, setPlayerLocale, setPlayerTimezone } from '../db/repos/players.ts';
import { isTimezone } from '../sim/heure.ts';
import { endSession, requirePlayer } from '../auth/session.ts';
import { findCompanyByPlayer, loadCompanyState } from '../db/repos/companies.ts';
import { cleanNickname, isLocale, validateNickname } from '../auth/validation.ts';

const patchSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: { nickname: { type: 'string', maxLength: 64 }, locale: { type: 'string', maxLength: 5 }, timezone: { type: 'string', maxLength: 64 } },
  },
} as const;

const deleteSchema = {
  body: {
    type: 'object',
    required: ['confirmNickname'],
    additionalProperties: false,
    properties: { confirmNickname: { type: 'string', maxLength: 64 } },
  },
} as const;

/**
 * Routes de compte. Toutes exigent une session. Elles couvrent les droits du RGPD
 * sans formulaire ni délai : voir ses données, les corriger, les emporter, les
 * effacer.
 */
export function registerAccountRoutes(app: FastifyInstance, ctx: AppContext): void {
  app.get('/v1/account', { preHandler: requirePlayer }, async (request) => {
    const p = request.player!;
    return { id: p.id, email: p.email, nickname: p.nickname, locale: p.locale, timezone: p.timezone, createdAt: p.createdAt, termsVersion: p.termsVersion };
  });

  app.patch('/v1/account', { schema: patchSchema, preHandler: requirePlayer }, async (request, reply) => {
    const p = request.player!;
    const body = request.body as { nickname?: string; locale?: string; timezone?: string };
    const now = ctx.now();

    if (body.timezone !== undefined) {
      // Le fuseau du navigateur, pour que la nuit du jeu soit celle du joueur.
      if (!isTimezone(body.timezone)) return reply.code(400).send({ error: 'invalid', fields: ['timezone_unsupported'] });
      setPlayerTimezone(ctx.db, p.id, body.timezone);
    }
    if (body.locale !== undefined) {
      if (!isLocale(body.locale)) return reply.code(400).send({ error: 'invalid', fields: ['locale_unsupported'] });
      setPlayerLocale(ctx.db, p.id, body.locale);
    }
    if (body.nickname !== undefined) {
      const nickname = cleanNickname(body.nickname);
      const error = validateNickname(nickname);
      if (error) return reply.code(400).send({ error: 'invalid', fields: [error] });
      if (nicknameTaken(ctx.db, nickname, p.id)) return reply.code(409).send({ error: 'invalid', fields: ['nickname_taken'] });
      renamePlayer(ctx.db, p.id, nickname);
      audit(ctx.db, 'player.renamed', p.id, {}, now);
    }
    return reply.code(204).send();
  });

  /**
   * Portabilité : tout ce que la base sait du joueur, en JSON lisible. Les
   * événements d'audit qui le concernent sont inclus ; les empreintes de session,
   * qui ne sont pas des données sur lui mais sur ses navigateurs, sont résumées.
   */
  app.get('/v1/account/export', { preHandler: requirePlayer }, async (request, reply) => {
    const p = request.player!;
    const now = ctx.now();
    const sessions = ctx.db.prepare('SELECT created_at, last_used_at, expires_at FROM sessions WHERE player_id = ?').all(p.id);
    const events = ctx.db.prepare('SELECT at, event, meta FROM audit WHERE player_id = ? ORDER BY at').all(p.id);
    const passkeys = ctx.db.prepare('SELECT name, device_type, backed_up, created_at, last_used_at FROM passkeys WHERE player_id = ? ORDER BY created_at').all(p.id);
    const notifications = ctx.db.prepare('SELECT endpoint, created_at, last_used_at FROM push_subscriptions WHERE player_id = ? ORDER BY created_at').all(p.id);
    audit(ctx.db, 'player.exported', p.id, {}, now);
    const payload = {
      exportedAt: new Date(now).toISOString(),
      player: {
        id: p.id, email: p.email, nickname: p.nickname, locale: p.locale,
        ageConfirmed: p.ageConfirmed, termsVersion: p.termsVersion,
        termsAcceptedAt: new Date(p.termsAcceptedAt).toISOString(),
        createdAt: new Date(p.createdAt).toISOString(), lastSeenAt: new Date(p.lastSeenAt).toISOString(),
      },
      sessions,
      passkeys, // noms et dates seulement : la clé publique n'est pas une donnée sur la personne
      notifications, // adresses d'abonnement aux notifications, sans les clés
      events,
      game: (() => { const c = findCompanyByPlayer(ctx.db, p.id); return c ? loadCompanyState(ctx.db, c) : null; })(),
    };
    return reply
      .header('content-disposition', 'attachment; filename="altiplume-mes-donnees.json"')
      .send(payload);
  });

  /**
   * Effacement. Immédiat et définitif : le joueur, ses sessions, ses liens. Les
   * événements d'audit restent, orphelins, sans rien qui permette de le retrouver.
   * On exige de retaper son pseudonyme : un bouton seul est trop facile à cliquer.
   */
  app.delete('/v1/account', { schema: deleteSchema, preHandler: requirePlayer }, async (request, reply) => {
    const p = request.player!;
    const { confirmNickname } = request.body as { confirmNickname: string };
    if (cleanNickname(confirmNickname) !== p.nickname) {
      return reply.code(400).send({ error: 'invalid', fields: ['confirmation_mismatch'] });
    }
    const now = ctx.now();
    transaction(ctx.db, () => {
      ctx.db.prepare('DELETE FROM magic_links WHERE email = ?').run(p.email);
      deletePlayer(ctx.db, p.id);
      audit(ctx.db, 'player.deleted', p.id, {}, now);
    });
    endSession(ctx, request, reply);
    return reply.code(204).send();
  });
}
