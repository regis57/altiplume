/**
 * Passkeys (WebAuthn).
 *
 * Une passkey est une paire de clés créée par le téléphone (ou l'ordinateur) du
 * joueur : la clé privée ne quitte jamais l'appareil, nous ne gardons que la clé
 * publique. Se connecter, c'est signer un défi aléatoire — un « oui » par
 * empreinte, visage ou code de l'appareil. Rien à retenir, rien à voler sur le
 * serveur.
 *
 * Choix :
 * - l'authenticateur ne reçoit que le pseudonyme (jamais l'adresse email) ;
 * - les passkeys sont « découvrables » : la connexion ne demande pas l'email ;
 * - un défi vit cinq minutes et ne sert qu'une fois ; il est lié au joueur quand
 *   il s'agit d'ajouter une clé ;
 * - la vérification d'utilisateur est préférée, pas exigée : certains appareils
 *   ne la proposent pas, et le lien magique reste toujours disponible.
 */
import type { FastifyInstance } from 'fastify';
import {
  generateAuthenticationOptions, generateRegistrationOptions,
  verifyAuthenticationResponse, verifyRegistrationResponse,
  type AuthenticationResponseJSON, type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import type { AppContext } from '../context.ts';
import { audit } from '../db/repos/audit.ts';
import {
  createPasskey, deletePasskey, findPasskey, listPasskeys, renamePasskey,
  storeChallenge, takeChallenge, touchPasskey,
} from '../db/repos/passkeys.ts';
import { findPlayerById } from '../db/repos/players.ts';
import { requirePlayer, startSession } from './session.ts';

export const RP_NAME = 'Altiplume';
const MAX_PASSKEYS = 10;
const NAME_MAX = 40;

/** Nom par défaut d'une clé, d'après ce que l'authenticateur déclare de lui-même. */
function defaultName(backedUp: boolean, locale: string): string {
  if (locale === 'en') return backedUp ? 'Synced passkey' : 'Passkey on this device';
  return backedUp ? 'Passkey synchronisée' : 'Passkey de cet appareil';
}

function cleanName(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  return name.length > 0 ? name : fallback;
}

const challengeToken = { type: 'string', minLength: 40, maxLength: 64 } as const;
/** Une réponse WebAuthn est un objet JSON : on le laisse à la bibliothèque, mais borné. */
const webauthnResponse = { type: 'object' } as const;

const registerOptionsSchema = {
  body: { type: 'object', additionalProperties: false, properties: {} },
} as const;

const registerSchema = {
  body: {
    type: 'object',
    required: ['challengeToken', 'response'],
    additionalProperties: false,
    properties: { challengeToken, response: webauthnResponse, name: { type: 'string', maxLength: 80 } },
  },
} as const;

const loginOptionsSchema = registerOptionsSchema;

const loginSchema = {
  body: {
    type: 'object',
    required: ['challengeToken', 'response'],
    additionalProperties: false,
    properties: { challengeToken, response: webauthnResponse },
  },
} as const;

const renameSchema = {
  params: { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 16, maxLength: 1024 } } },
  body: { type: 'object', required: ['name'], additionalProperties: false, properties: { name: { type: 'string', maxLength: 80 } } },
} as const;

const idSchema = {
  params: { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 16, maxLength: 1024 } } },
} as const;

export function registerPasskeyRoutes(app: FastifyInstance, ctx: AppContext): void {
  const origin = ctx.config.publicOrigin;
  const rpID = new URL(origin).hostname;

  // ---- Ajouter une passkey (joueur connecté) ----

  app.post('/v1/passkeys/options', {
    schema: registerOptionsSchema, preHandler: requirePlayer,
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const player = request.player!;
    const existing = listPasskeys(ctx.db, player.id);
    if (existing.length >= MAX_PASSKEYS) return reply.code(409).send({ error: 'passkey_limit' });
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userID: new TextEncoder().encode(player.id),
      userName: player.nickname,
      userDisplayName: player.nickname,
      attestationType: 'none',
      excludeCredentials: existing.map((k) => ({ id: k.id, transports: k.transports })),
      authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
    });
    const token = storeChallenge(ctx.db, options.challenge, 'register', player.id, ctx.now());
    return reply.code(200).send({ options, challengeToken: token });
  });

  app.post('/v1/passkeys/register', {
    schema: registerSchema, preHandler: requirePlayer,
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const player = request.player!;
    const body = request.body as { challengeToken: string; response: RegistrationResponseJSON; name?: string };
    const now = ctx.now();
    const challenge = takeChallenge(ctx.db, body.challengeToken, 'register', now);
    if (!challenge || challenge.playerId !== player.id) return reply.code(400).send({ error: 'challenge_unknown' });

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body.response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
      });
    } catch {
      return reply.code(400).send({ error: 'passkey_rejected' });
    }
    if (!verification.verified) return reply.code(400).send({ error: 'passkey_rejected' });
    const info = verification.registrationInfo;
    if (findPasskey(ctx.db, info.credential.id)) return reply.code(409).send({ error: 'passkey_exists' });
    // Le plafond se revérifie ici : plusieurs défis demandés d'avance le contournaient.
    if (listPasskeys(ctx.db, player.id).length >= MAX_PASSKEYS) return reply.code(409).send({ error: 'passkey_limit' });

    const name = cleanName(body.name, defaultName(info.credentialBackedUp, player.locale));
    createPasskey(ctx.db, {
      id: info.credential.id,
      playerId: player.id,
      publicKey: info.credential.publicKey,
      counter: info.credential.counter,
      transports: info.credential.transports ?? [],
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
      name,
    }, now);
    audit(ctx.db, 'passkey.added', player.id, { backedUp: info.credentialBackedUp }, now);
    return reply.code(201).send({ id: info.credential.id, name, backedUp: info.credentialBackedUp, createdAt: now });
  });

  // ---- Se connecter avec une passkey (anonyme) ----

  app.post('/v1/auth/passkey/options', {
    schema: loginOptionsSchema,
    config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
  }, async (_request, reply) => {
    const options = await generateAuthenticationOptions({ rpID, userVerification: 'preferred' });
    const token = storeChallenge(ctx.db, options.challenge, 'authenticate', null, ctx.now());
    return reply.code(200).send({ options, challengeToken: token });
  });

  app.post('/v1/auth/passkey/verify', {
    schema: loginSchema,
    config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const body = request.body as { challengeToken: string; response: AuthenticationResponseJSON };
    const now = ctx.now();
    const challenge = takeChallenge(ctx.db, body.challengeToken, 'authenticate', now);
    if (!challenge) return reply.code(400).send({ error: 'challenge_unknown' });

    const credentialId = typeof body.response.id === 'string' ? body.response.id : '';
    const passkey = credentialId ? findPasskey(ctx.db, credentialId) : null;
    if (!passkey) {
      audit(ctx.db, 'passkey.rejected', null, { reason: 'unknown' }, now);
      return reply.code(400).send({ error: 'passkey_unknown' });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body.response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: { id: passkey.id, publicKey: passkey.publicKey, counter: passkey.counter, transports: passkey.transports },
        requireUserVerification: false,
      });
    } catch {
      audit(ctx.db, 'passkey.rejected', passkey.playerId, { reason: 'invalid' }, now);
      return reply.code(400).send({ error: 'passkey_rejected' });
    }
    if (!verification.verified) {
      audit(ctx.db, 'passkey.rejected', passkey.playerId, { reason: 'invalid' }, now);
      return reply.code(400).send({ error: 'passkey_rejected' });
    }

    const player = findPlayerById(ctx.db, passkey.playerId);
    if (!player) return reply.code(400).send({ error: 'passkey_unknown' });
    // Le compteur monte à chaque signature ; un compteur qui recule trahirait une
    // clé clonée. La bibliothèque le vérifie, on garde la nouvelle valeur.
    touchPasskey(ctx.db, passkey.id, verification.authenticationInfo.newCounter, now);
    startSession(ctx, reply, player.id);
    audit(ctx.db, 'player.login', player.id, { method: 'passkey' }, now);
    return reply.code(200).send({ status: 'signed_in', nickname: player.nickname });
  });

  // ---- Gérer ses passkeys (joueur connecté) ----

  app.get('/v1/passkeys', { preHandler: requirePlayer }, async (request) => {
    return listPasskeys(ctx.db, request.player!.id).map((k) => ({
      id: k.id, name: k.name, backedUp: k.backedUp, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt,
    }));
  });

  app.patch('/v1/passkeys/:id', { schema: renameSchema, preHandler: requirePlayer }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name } = request.body as { name: string };
    const clean = cleanName(name, '');
    if (!clean) return reply.code(400).send({ error: 'invalid', fields: ['name_empty'] });
    if (!renamePasskey(ctx.db, id, request.player!.id, clean)) return reply.code(404).send({ error: 'not_found' });
    return reply.code(204).send();
  });

  app.delete('/v1/passkeys/:id', { schema: idSchema, preHandler: requirePlayer }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!deletePasskey(ctx.db, id, request.player!.id)) return reply.code(404).send({ error: 'not_found' });
    audit(ctx.db, 'passkey.removed', request.player!.id, {}, ctx.now());
    return reply.code(204).send();
  });
}
