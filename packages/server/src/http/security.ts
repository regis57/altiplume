import type { FastifyInstance } from 'fastify';

/**
 * En-têtes de sécurité, sur chaque réponse.
 *
 * La CSP est stricte parce que le client s'y prête : aucun script ni style en
 * ligne, tout vient du même domaine. Pas de nonce nécessaire, donc pas de
 * rendu dynamique des pages.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

export function registerSecurityHeaders(app: FastifyInstance, production: boolean): void {
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    reply.header('Cross-Origin-Opener-Policy', 'same-origin');
    reply.header('Cross-Origin-Resource-Policy', 'same-origin');
    if (production) reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    return payload;
  });
}
