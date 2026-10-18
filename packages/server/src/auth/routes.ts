import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context.ts';
import { transaction } from '../db/database.ts';
import { audit } from '../db/repos/audit.ts';
import { consumeMagicLink, countRecentLinks, createMagicLink } from '../db/repos/magicLinks.ts';
import { createPlayer, findPlayerByEmail, nicknameTaken } from '../db/repos/players.ts';
import { magicLinkMessage } from '../mail/mailer.ts';
import { endSession, startSession } from './session.ts';
import {
  cleanNickname, isLocale, isValidEmail, normalizeEmail, TERMS_VERSION, validateNickname,
  type Locale,
} from './validation.ts';

/** Au plus trois liens par adresse par quart d'heure, quel que soit l'expéditeur. */
const LINKS_PER_WINDOW = 3;
const LINK_WINDOW_MS = 15 * 60_000;

const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'nickname', 'locale', 'ageConfirmed', 'acceptTerms'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', maxLength: 254 },
      nickname: { type: 'string', maxLength: 64 },
      locale: { type: 'string', maxLength: 5 },
      ageConfirmed: { type: 'boolean' },
      acceptTerms: { type: 'boolean' },
    },
  },
} as const;

const loginSchema = {
  body: {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: { email: { type: 'string', maxLength: 254 }, locale: { type: 'string', maxLength: 5 } },
  },
} as const;

const verifySchema = {
  body: {
    type: 'object',
    required: ['token'],
    additionalProperties: false,
    properties: { token: { type: 'string', minLength: 40, maxLength: 64 } },
  },
} as const;

export function registerAuthRoutes(app: FastifyInstance, ctx: AppContext): void {
  const verifyUrl = (token: string) => `${ctx.config.publicOrigin}/verifier?jeton=${encodeURIComponent(token)}`;

  /**
   * Prépare le lien et confie le courrier à l'envoi, sans l'attendre : la réponse
   * part aussi vite, et pareille, que l'adresse soit inscrite ou non. Attendre
   * l'envoi trahissait les adresses inscrites par le délai, et par une erreur 500
   * quand le service de courrier refusait.
   */
  function sendLink(email: string, purpose: 'signup' | 'login', locale: Locale, payload: { nickname: string; locale: string; termsVersion: string } | null): void {
    const now = ctx.now();
    if (countRecentLinks(ctx.db, email, now - LINK_WINDOW_MS) >= LINKS_PER_WINDOW) {
      audit(ctx.db, 'magic_link.rejected', null, { reason: 'too_many' }, now);
      return;
    }
    const token = createMagicLink(ctx.db, email, purpose, payload, now);
    ctx.mailer.send(magicLinkMessage(email, verifyUrl(token), purpose, locale)).then(
      () => audit(ctx.db, 'magic_link.sent', null, { purpose }, now),
      () => {
        audit(ctx.db, 'magic_link.failed', null, { purpose }, now);
        app.log.warn({ purpose }, 'magic_link.failed');
      },
    ).catch(() => undefined);
  }

  /**
   * Inscription. La réponse est la même que l'adresse soit nouvelle ou déjà connue —
   * dans ce second cas on envoie un lien de connexion — pour ne pas révéler qui est
   * inscrit. Seul le pseudonyme déjà pris est signalé : il est public de toute façon,
   * et il est regardé AVANT l'adresse, pour que la réponse ne dépende que de lui.
   */
  app.post('/v1/auth/register', {
    schema: registerSchema,
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const body = request.body as { email: string; nickname: string; locale: string; ageConfirmed: boolean; acceptTerms: boolean };
    const email = normalizeEmail(body.email);
    const nickname = cleanNickname(body.nickname);
    const errors: string[] = [];

    if (!isValidEmail(email)) errors.push('email_invalid');
    const nickError = validateNickname(nickname);
    if (nickError) errors.push(nickError);
    if (!isLocale(body.locale)) errors.push('locale_unsupported');
    if (body.ageConfirmed !== true) errors.push('age_not_confirmed');
    if (body.acceptTerms !== true) errors.push('terms_not_accepted');
    if (errors.length > 0) return reply.code(400).send({ error: 'invalid', fields: errors });

    const locale = body.locale as Locale;
    if (nicknameTaken(ctx.db, nickname)) {
      return reply.code(409).send({ error: 'invalid', fields: ['nickname_taken'] });
    }
    const existing = findPlayerByEmail(ctx.db, email);
    if (existing) {
      sendLink(email, 'login', locale, null);
      return reply.code(202).send({ status: 'link_sent' });
    }
    sendLink(email, 'signup', locale, { nickname, locale, termsVersion: TERMS_VERSION });
    return reply.code(202).send({ status: 'link_sent' });
  });

  /** Connexion : toujours 202, que l'adresse existe ou non. */
  app.post('/v1/auth/login', {
    schema: loginSchema,
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const body = request.body as { email: string; locale?: string };
    const email = normalizeEmail(body.email);
    const locale: Locale = isLocale(body.locale) ? body.locale : 'fr';
    if (isValidEmail(email)) {
      const player = findPlayerByEmail(ctx.db, email);
      if (player) sendLink(email, 'login', (isLocale(player.locale) ? player.locale : locale), null);
    }
    return reply.code(202).send({ status: 'link_sent' });
  });

  /**
   * Vérification d'un lien. C'est un POST, pas un GET : les antivirus et les
   * messageries pré-visitent les liens des emails, et un GET consommerait le lien
   * avant que le joueur l'ouvre. La page /verifier porte un bouton qui envoie ce POST.
   */
  app.post('/v1/auth/verify', {
    schema: verifySchema,
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const { token } = request.body as { token: string };
    const now = ctx.now();
    const result = consumeMagicLink(ctx.db, token, now);
    if (!result.ok) {
      audit(ctx.db, 'magic_link.rejected', null, { reason: result.reason }, now);
      return reply.code(400).send({ error: 'link_' + result.reason });
    }
    const { link } = result;

    if (link.purpose === 'signup') {
      const payload = link.payload;
      if (!payload) return reply.code(400).send({ error: 'link_unknown' });
      // Entre l'envoi et le clic, quelqu'un a pu prendre ce pseudonyme : on revérifie.
      if (findPlayerByEmail(ctx.db, link.email)) return reply.code(409).send({ error: 'already_registered' });
      if (nicknameTaken(ctx.db, payload.nickname)) return reply.code(409).send({ error: 'nickname_taken' });
      const player = transaction(ctx.db, () => {
        const p = createPlayer(ctx.db, { email: link.email, nickname: payload.nickname, locale: payload.locale, termsVersion: payload.termsVersion }, now);
        audit(ctx.db, 'player.registered', p.id, { locale: p.locale }, now);
        return p;
      });
      startSession(ctx, reply, player.id);
      return reply.code(201).send({ status: 'registered', nickname: player.nickname });
    }

    const player = findPlayerByEmail(ctx.db, link.email);
    if (!player) return reply.code(400).send({ error: 'link_unknown' });
    startSession(ctx, reply, player.id);
    audit(ctx.db, 'player.login', player.id, {}, now);
    return reply.code(200).send({ status: 'signed_in', nickname: player.nickname });
  });

  app.post('/v1/auth/logout', async (request, reply) => {
    if (request.player) audit(ctx.db, 'player.logout', request.player.id, {}, ctx.now());
    endSession(ctx, request, reply);
    return reply.code(204).send();
  });
}
