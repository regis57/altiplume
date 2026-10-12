import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import type { AppContext } from './context.ts';
import { registerSecurityHeaders } from './http/security.ts';
import { registerSessionHook } from './auth/session.ts';
import { registerAuthRoutes } from './auth/routes.ts';
import { registerPasskeyRoutes } from './auth/passkeys.ts';
import { registerDeviceRoutes } from './auth/device.ts';
import { registerAccountRoutes } from './account/routes.ts';
import { registerPushRoutes } from './push/routes.ts';
import { registerGameRoutes } from './game/routes.ts';
import { registerHealth } from './routes/health.ts';
import { registerWorldRoutes } from './routes/world.ts';
import { registerStatsRoutes } from './routes/stats.ts';
import { registerVersionRoutes } from './routes/version.ts';
import { registerContactRoutes } from './routes/contact.ts';

export interface BuildOptions {
  readonly logger?: boolean;
  /** Dossier du client compilé ; par défaut packages/client/dist. */
  readonly clientDir?: string;
}

const DEFAULT_CLIENT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../client/dist');

/**
 * Construit l'application sans l'écouter, pour que les tests puissent l'exercer
 * sans ouvrir de port ni dépendre d'un fichier de configuration.
 */
export async function buildApp(ctx: AppContext, options: BuildOptions = {}): Promise<FastifyInstance> {
  const production = ctx.config.env === 'production';
  const app = Fastify({
    logger: options.logger ?? false,
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
  await app.register(fastifyRateLimit, {
    global: true,
    max: 120,
    timeWindow: '1 minute',
    // On ne garde pas l'adresse : la clé est une empreinte courte, en mémoire seulement.
    keyGenerator: (request) => request.ip,
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

  const clientDir = options.clientDir ?? DEFAULT_CLIENT_DIR;
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
