import type { FastifyInstance } from 'fastify';

/**
 * En-têtes de sécurité, sur chaque réponse.
 *
 * La CSP est stricte parce que le client s'y prête : aucun script ni style en
 * ligne, tout vient du même domaine. Pas de nonce nécessaire, donc pas de
 * rendu dynamique des pages.
 *
 * Durcissement du 11 octobre (interlude sécurité, après Observatory B+ et
 * l'évaluateur CSP de Google) :
 *  - `default-src 'none'` : tout ce qui n'est pas listé est refusé, y compris
 *    les iframes, les médias et les plugins ; chaque famille est nommée.
 *  - `worker-src 'self'` : le service worker des notifications, explicitement.
 *  - Trusted Types : le navigateur refuse toute chaîne brute dans les puits
 *    d'injection (innerHTML, register du service worker…) qui ne passe pas par
 *    la politique « altiplume » du client — l'injection DOM devient inopérante
 *    même si une faille XSS existait.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "require-trusted-types-for 'script'",
  'trusted-types altiplume',
  'upgrade-insecure-requests',
].join('; ');

export function registerSecurityHeaders(app: FastifyInstance, production: boolean): void {
  /**
   * HTTP → HTTPS. Derrière le tunnel, Cloudflare dit sur quel protocole la
   * personne est arrivée. On ne redirige que si c'est explicitement « http » :
   * si l'en-tête manquait, on ne tournerait pas en rond. Le contrôle de santé
   * (appelé en clair dans le conteneur par la tâche de redéploiement) est exempt.
   */
  app.addHook('onRequest', async (request, reply) => {
    if (!production || request.url === '/healthz') return;
    if (request.headers['x-forwarded-proto'] === 'http') {
      return reply.code(301).redirect(`https://${request.hostname}${request.url}`);
    }
  });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    reply.header('Cross-Origin-Opener-Policy', 'same-origin');
    reply.header('Cross-Origin-Resource-Policy', 'same-origin');
    reply.header('Cross-Origin-Embedder-Policy', 'require-corp');
    // HSTS ne vaut qu'en HTTPS ; une réponse en clair ne doit pas le porter.
    if (production && request.headers['x-forwarded-proto'] !== 'http') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    return payload;
  });
}
