import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyServerOptions } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { createHash, randomBytes } from 'node:crypto';
import type { AppContext } from './context.ts';
import { registerSecurityHeaders } from './http/security.ts';
import { englishPages, rewriteLanguage } from './http/langue.ts';
import { registerSessionHook } from './auth/session.ts';
import { registerAuthRoutes } from './auth/routes.ts';
import { addressBlock } from './auth/budget.ts';
import { registerPasskeyRoutes } from './auth/passkeys.ts';
import { registerDeviceRoutes } from './auth/device.ts';
import { registerAccountRoutes } from './account/routes.ts';
import { registerPushRoutes } from './push/routes.ts';
import { registerGameRoutes } from './game/routes.ts';
import { registerHealth } from './routes/health.ts';
import { registerWorldRoutes } from './routes/world.ts';
import { registerStatsRoutes } from './routes/stats.ts';
import { APP_BUILT_AT, registerVersionRoutes } from './routes/version.ts';
import { registerReferencementRoutes } from './routes/referencement.ts';
import { registerContactRoutes } from './routes/contact.ts';

export interface BuildOptions {
  readonly logger?: boolean;
  /** Pour les tests : où écrire le journal (sinon la sortie standard). */
  readonly logStream?: { write(line: string): void };
  /** Dossier du client compilé ; par défaut packages/client/dist. */
  readonly clientDir?: string;
}

/**
 * L'adresse du visiteur. Derrière le tunnel, seul l'en-tête `cf-connecting-ip` est
 * sûr : Cloudflare le réécrit toujours, alors qu'il garde un `X-Forwarded-For` écrit
 * par le visiteur lui-même, et c'est l'adresse la plus à gauche que Fastify retient.
 */
export function clientAddress(request: FastifyRequest, production: boolean): string {
  const cf = request.headers['cf-connecting-ip'];
  if (production && typeof cf === 'string' && cf.length > 0) return cf;
  return request.ip;
}

const DEFAULT_CLIENT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../client/dist');

/**
 * Construit l'application sans l'écouter, pour que les tests puissent l'exercer
 * sans ouvrir de port ni dépendre d'un fichier de configuration.
 */
export async function buildApp(ctx: AppContext, options: BuildOptions = {}): Promise<FastifyInstance> {
  const production = ctx.config.env === 'production';
  const clientDir = options.clientDir ?? DEFAULT_CLIENT_DIR;
  const pagesEn = englishPages(clientDir);
  // Le journal ne note jamais l'adresse complète d'une requête : le lien de
  // connexion porte son jeton dans `?jeton=`, et il ne doit pas s'y retrouver.
  const logger: FastifyServerOptions['logger'] = options.logger
    ? { ...(options.logStream ? { stream: options.logStream } : {}), serializers: { req: (req) => ({ method: req.method, url: (req.url ?? '').split('?')[0] ?? '', remoteAddress: clientAddress(req, production) }) } }
    : false;
  const app = Fastify({
    logger,
    // `/aide?lang=en` → l'exemplaire anglais de la page, pour les aperçus de liens partagés.
    rewriteUrl: (req) => rewriteLanguage(req.url ?? '/', req.method, pagesEn),
    trustProxy: ctx.config.trustProxy,
    bodyLimit: 16 * 1024,
    // Pas d'identifiant de requête dans les en-têtes de réponse : rien à corréler.
    disableRequestLogging: !production,
    // Par défaut Fastify RETIRE les champs inattendus et convertit les types. Pour une
    // API d'authentification, on veut le contraire : un corps inattendu est refusé.
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false, useDefaults: false, allErrors: false } },
  });

  registerSecurityHeaders(app, production);

  await app.register(fastifyCookie);
  // Deux compteurs par personne, pas un : l'API reste stricte (120 par minute) ; les
  // pages et leurs fichiers ont de la marge (600), parce qu'un chargement de page,
  // c'est une dizaine de requêtes, et qu'une famille derrière la même box partage
  // une adresse. Avec un seul compteur, quelques pages suffisaient à épuiser le
  // budget de l'API — et un script de page refusé laissait un bouton invisible.
  //
  // On ne garde pas l'adresse : la clé est une empreinte courte, salée au démarrage
  // du serveur, en mémoire seulement. Elle ne survit pas à un redémarrage, et ne se
  // remonte pas jusqu'à l'adresse. En IPv6, la clé est le bloc /64 de l'abonné, pas
  // l'adresse : il en a des milliards à sa disposition.
  const salt = randomBytes(16);
  const isApi = (url: string) => url.startsWith('/v1/');
  const who = (ip: string) => createHash('sha256').update(salt).update(addressBlock(ip)).digest('base64url').slice(0, 16);
  await app.register(fastifyRateLimit, {
    global: true,
    max: (request) => (isApi(request.url) ? 120 : 600),
    timeWindow: '1 minute',
    keyGenerator: (request) => `${isApi(request.url) ? 'api' : 'page'}:${who(clientAddress(request, production))}`,
    addHeadersOnExceeding: { 'x-ratelimit-limit': false, 'x-ratelimit-remaining': false, 'x-ratelimit-reset': false },
    addHeaders: { 'x-ratelimit-limit': false, 'x-ratelimit-remaining': false, 'x-ratelimit-reset': true, 'retry-after': true },
  });

  // Les routes qui modifient l'état n'acceptent que du JSON : avec SameSite=Lax,
  // un formulaire tiers ne peut pas en envoyer, ce qui ferme la porte au CSRF.
  app.addHook('preValidation', async (request, reply) => {
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) return;
    const type = request.headers['content-type'] ?? '';
    if (!type.startsWith('application/json')) {
      await reply.code(415).send({ error: 'json_required' });
    }
  });

  registerSessionHook(app, ctx);
  registerHealth(app);
  registerVersionRoutes(app);
  registerReferencementRoutes(app, ctx.config.publicOrigin, APP_BUILT_AT);
  registerWorldRoutes(app);
  registerStatsRoutes(app, ctx);
  registerContactRoutes(app, ctx);
  registerAuthRoutes(app, ctx);
  registerPasskeyRoutes(app, ctx);
  registerDeviceRoutes(app, ctx);
  registerAccountRoutes(app, ctx);
  registerPushRoutes(app, ctx);
  registerGameRoutes(app, ctx);

  // Réponses d'erreur uniformes et muettes : jamais de trace, jamais de chemin.
  app.setErrorHandler((error: unknown, _request, reply) => {
    const e = error as { statusCode?: unknown; validation?: unknown };
    const status = typeof e.statusCode === 'number' ? e.statusCode : 500;
    if (status >= 500) app.log.error(error);
    const code = status === 400 ? 'invalid' : status === 429 ? 'too_many_requests' : status >= 500 ? 'server_error' : 'error';
    return reply.code(status).send({ error: code, ...(status === 400 && e.validation ? { fields: ['schema'] } : {}) });
  });
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: 'not_found' }));

  if (existsSync(clientDir)) {
    await app.register(fastifyStatic, {
      root: clientDir,
      extensions: ['html'],
      index: ['index.html'],
      cacheControl: true,
      maxAge: production ? '1h' : 0,
      immutable: false,
      setHeaders: (reply, path) => {
        // Les bundles portent une empreinte dans leur nom : cache long, immuable.
        // Le HTML, lui, doit être revalidé à chaque visite : c'est lui qui désigne
        // la version courante des bundles. Sinon un navigateur garde une page neuve
        // avec un script d'il y a une heure — vu en production le 11/10/2026.
        if (/\.[a-f0-9]{8}\.(js|css)$/.test(path)) reply.header('cache-control', 'public, max-age=31536000, immutable');
        else if (path.endsWith('.html') || path.endsWith('/sw.js') || path.endsWith('/manifest.webmanifest')) reply.header('cache-control', 'no-cache');
      },
    });
  }

  return app;
}
