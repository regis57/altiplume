/**
 * Connexion d'un appareil par un autre — le QR sur l'écran du PC, lu par le
 * téléphone déjà connecté.
 *
 * Trois secrets, trois rôles :
 * - le code d'appareil, dans le QR, ne sert qu'au téléphone pour désigner la demande ;
 * - le jeton d'interrogation, gardé par le PC, ne sert qu'à récupérer l'issue ;
 * - le code à six chiffres, affiché des deux côtés, sert à la personne pour
 *   vérifier qu'elle approuve bien SON écran et pas un QR glissé par un tiers.
 *
 * Le code d'appareil voyage dans le fragment de l'URL (#code=…) : il n'atteint
 * jamais le serveur par l'URL, donc jamais un journal.
 */
import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context.ts';
import { audit } from '../db/repos/audit.ts';
import { decideDeviceCode, peekDeviceCode, pollDeviceCode, startDeviceFlow } from '../db/repos/deviceCodes.ts';
import { requirePlayer, startSession } from './session.ts';

const token = { type: 'string', minLength: 40, maxLength: 64 } as const;

const emptySchema = { body: { type: 'object', additionalProperties: false, properties: {} } } as const;
const pollSchema = {
  body: { type: 'object', required: ['pollToken'], additionalProperties: false, properties: { pollToken: token } },
} as const;
const peekSchema = {
  body: { type: 'object', required: ['deviceCode'], additionalProperties: false, properties: { deviceCode: token } },
} as const;
const approveSchema = {
  body: {
    type: 'object', required: ['deviceCode', 'approve'], additionalProperties: false,
    properties: { deviceCode: token, approve: { type: 'boolean' } },
  },
} as const;

export function registerDeviceRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** Le PC demande un code. */
  app.post('/v1/auth/device/start', {
    schema: emptySchema,
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (_request, reply) => {
    const start = startDeviceFlow(ctx.db, ctx.now());
    return reply.code(201).send({
      deviceCode: start.deviceCode,
      pollToken: start.pollToken,
      userCode: start.userCode,
      expiresAt: start.expiresAt,
      approveUrl: `${ctx.config.publicOrigin}/approuver#code=${start.deviceCode}`,
    });
  });

  /** Le PC interroge. Toutes les deux secondes au plus, côté client. */
  app.post('/v1/auth/device/poll', {
    schema: pollSchema,
    config: { rateLimit: { max: 90, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { pollToken } = request.body as { pollToken: string };
    const now = ctx.now();
    const result = pollDeviceCode(ctx.db, pollToken, now);
    if (result.status === 'approved') {
      startSession(ctx, reply, result.playerId);
      audit(ctx.db, 'player.login', result.playerId, { method: 'device' }, now);
      return reply.code(200).send({ status: 'approved' });
    }
    return reply.code(200).send({ status: result.status });
  });

  /** Le téléphone, connecté, lit le QR et veut afficher le code à six chiffres. */
  app.post('/v1/auth/device/peek', {
    schema: peekSchema, preHandler: requirePlayer,
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const { deviceCode } = request.body as { deviceCode: string };
    const peek = peekDeviceCode(ctx.db, deviceCode, ctx.now());
    if (!peek) return reply.code(404).send({ error: 'device_unknown' });
    if (peek.status !== 'pending') return reply.code(409).send({ error: 'device_decided' });
    return reply.code(200).send({ userCode: peek.userCode });
  });

  /** Le téléphone approuve ou refuse. */
  app.post('/v1/auth/device/approve', {
    schema: approveSchema, preHandler: requirePlayer,
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const { deviceCode, approve } = request.body as { deviceCode: string; approve: boolean };
    const player = request.player!;
    const now = ctx.now();
    if (!decideDeviceCode(ctx.db, deviceCode, player.id, approve, now)) {
      return reply.code(404).send({ error: 'device_unknown' });
    }
    audit(ctx.db, approve ? 'device.approved' : 'device.denied', player.id, {}, now);
    return reply.code(204).send();
  });
}
