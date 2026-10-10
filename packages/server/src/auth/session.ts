import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AppContext } from '../context.ts';
import { findPlayerById, touchPlayer, type Player } from '../db/repos/players.ts';
import { createSession, resolveSession, revokeSession, SESSION_TTL_MS } from '../db/repos/sessions.ts';

export const SESSION_COOKIE = 'altiplume_session';

declare module 'fastify' {
  interface FastifyRequest {
    /** Joueur authentifié, ou null. Posé par le hook `onRequest`. */
    player: Player | null;
    sessionToken: string | null;
  }
}

function cookieOptions(ctx: AppContext) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: ctx.config.env === 'production',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

/** Pose le cookie de session sur la réponse. */
export function startSession(ctx: AppContext, reply: FastifyReply, playerId: string): void {
  const { token } = createSession(ctx.db, playerId, ctx.now());
  reply.setCookie(SESSION_COOKIE, token, cookieOptions(ctx));
}

export function endSession(ctx: AppContext, request: FastifyRequest, reply: FastifyReply): void {
  if (request.sessionToken) revokeSession(ctx.db, request.sessionToken);
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
}

/** Résout la session à chaque requête ; ne bloque rien, pose seulement `request.player`. */
export function registerSessionHook(app: FastifyInstance, ctx: AppContext): void {
  app.decorateRequest('player', null);
  app.decorateRequest('sessionToken', null);
  app.addHook('onRequest', async (request) => {
    const token = request.cookies[SESSION_COOKIE];
    if (!token) return;
    const session = resolveSession(ctx.db, token, ctx.now());
    if (!session) return;
    const player = findPlayerById(ctx.db, session.playerId);
    if (!player) return;
    request.player = player;
    request.sessionToken = token;
    if (ctx.now() - player.lastSeenAt > 3_600_000) touchPlayer(ctx.db, player.id, ctx.now());
  });
}

/** Garde pour les routes qui exigent un joueur. */
export async function requirePlayer(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.player) {
    await reply.code(401).send({ error: 'unauthenticated' });
  }
}
