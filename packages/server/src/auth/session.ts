import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AppContext } from '../context.ts';
import { findPlayerById, touchPlayer, type Player } from '../db/repos/players.ts';
import { createSession, resolveSession, revokeSession, SESSION_TTL_MS, TOUCH_INTERVAL_MS } from '../db/repos/sessions.ts';

/** Le nom du cookie de session hors production (http://localhost, tests). */
export const SESSION_COOKIE = 'altiplume_session';
/**
 * En production, le même cookie préfixé `__Host-`. Depuis le 16 octobre, un autre site
 * vit sous `*.altiplume.com` ; un sous-domaine peut déposer un cookie valable pour tout
 * le domaine, y compris un faux `altiplume_session` (déconnecter un joueur, ou le
 * connecter à un autre compte). Un navigateur refuse un cookie `__Host-` qui ne vient
 * pas du nom exact, en HTTPS, sans `Domain` et avec `Path=/` : le sous-domaine ne peut
 * plus en poser un. Le préfixe exige `Secure` : hors production (http), on garde l'ancien nom.
 */
export const SESSION_COOKIE_HOST = '__Host-altiplume_session';

export function sessionCookieName(ctx: AppContext): string {
  return ctx.config.env === 'production' ? SESSION_COOKIE_HOST : SESSION_COOKIE;
}

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
  reply.setCookie(sessionCookieName(ctx), token, cookieOptions(ctx));
}

export function endSession(ctx: AppContext, request: FastifyRequest, reply: FastifyReply): void {
  if (request.sessionToken) revokeSession(ctx.db, request.sessionToken);
  // Un cookie `__Host-` ne s'efface qu'avec les mêmes attributs que ceux qui l'ont posé (`Secure`, `Path=/`).
  const { path, httpOnly, sameSite, secure } = cookieOptions(ctx);
  reply.clearCookie(sessionCookieName(ctx), { path, httpOnly, sameSite, secure });
}

/** Résout la session à chaque requête ; ne bloque rien, pose seulement `request.player`. */
export function registerSessionHook(app: FastifyInstance, ctx: AppContext): void {
  app.decorateRequest('player', null);
  app.decorateRequest('sessionToken', null);
  const name = sessionCookieName(ctx);
  app.addHook('onRequest', async (request, reply) => {
    // L'ancien nom n'est plus lu en production : on l'efface au passage, une fois.
    if (name !== SESSION_COOKIE && request.cookies[SESSION_COOKIE] !== undefined) reply.clearCookie(SESSION_COOKIE, { path: '/' });
    const token = request.cookies[name];
    if (!token) return;
    const session = resolveSession(ctx.db, token, ctx.now());
    if (!session) return;
    const player = findPlayerById(ctx.db, session.playerId);
    if (!player) return;
    request.player = player;
    request.sessionToken = token;
    // La session vient d'être prolongée en base : le cookie aussi, sinon le navigateur
    // l'effaçait trente jours après la connexion, même pour qui vient chaque jour.
    if (ctx.now() - session.lastUsedAt > TOUCH_INTERVAL_MS) reply.setCookie(name, token, cookieOptions(ctx));
    if (ctx.now() - player.lastSeenAt > 3_600_000) touchPlayer(ctx.db, player.id, ctx.now());
  });
}

/** Garde pour les routes qui exigent un joueur. */
export async function requirePlayer(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.player) {
    await reply.code(401).send({ error: 'unauthenticated' });
  }
}
