import Fastify, { type FastifyInstance } from 'fastify';
import { registerHealth } from './routes/health.ts';

export interface BuildOptions {
  readonly logger?: boolean;
}

/**
 * Construit l'application sans l'écouter, pour que les tests puissent l'exercer
 * sans ouvrir de port.
 */
export function buildApp(options: BuildOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? false,
    // On ne fait jamais confiance aux en-têtes de proxy par défaut : le tunnel
    // Cloudflare sera déclaré explicitement en production.
    trustProxy: false,
    bodyLimit: 64 * 1024,
  });

  // En-têtes de sécurité appliqués à toute réponse. La CSP sera resserrée avec
  // des nonces quand le client servira des scripts.
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    reply.header('Cross-Origin-Opener-Policy', 'same-origin');
    return payload;
  });

  registerHealth(app);

  return app;
}
