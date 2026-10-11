import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { CONTENT_SECURITY_POLICY, registerSecurityHeaders } from '../src/http/security.ts';

/** Un serveur nu, juste les en-têtes, en mode production ou non. */
async function bare(production: boolean) {
  const app = Fastify({ trustProxy: true });
  registerSecurityHeaders(app, production);
  app.get('/healthz', async () => ({ ok: true }));
  app.get('/aerodrome', async () => 'page');
  await app.ready();
  return app;
}

describe('le durcissement — interlude sécurité du 11 octobre', () => {
  it('refuse tout par défaut et exige des Trusted Types pour les scripts', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("worker-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("require-trusted-types-for 'script'");
    expect(CONTENT_SECURITY_POLICY).toContain('trusted-types altiplume');
    expect(CONTENT_SECURITY_POLICY).not.toContain('unsafe');
  });

  it('isole le document des autres origines (COOP, COEP, CORP)', async () => {
    const app = await bare(false);
    const r = await app.inject({ method: 'GET', url: '/aerodrome' });
    expect(r.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(r.headers['cross-origin-embedder-policy']).toBe('require-corp');
    expect(r.headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(r.headers['strict-transport-security']).toBeUndefined(); // pas en développement
    await app.close();
  });

  it('en production, renvoie le HTTP en clair vers HTTPS sans HSTS, et laisse passer le contrôle de santé', async () => {
    const app = await bare(true);
    const clear = await app.inject({ method: 'GET', url: '/aerodrome?x=1', headers: { host: 'altiplume.com', 'x-forwarded-proto': 'http' } });
    expect(clear.statusCode).toBe(301);
    expect(clear.headers['location']).toBe('https://altiplume.com/aerodrome?x=1');
    expect(clear.headers['strict-transport-security']).toBeUndefined();
    const secure = await app.inject({ method: 'GET', url: '/aerodrome', headers: { host: 'altiplume.com', 'x-forwarded-proto': 'https' } });
    expect(secure.statusCode).toBe(200);
    expect(secure.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains; preload');
    // Sans en-tête (appel direct dans le conteneur) : pas de boucle, et HSTS posé comme avant.
    const direct = await app.inject({ method: 'GET', url: '/aerodrome' });
    expect(direct.statusCode).toBe(200);
    const health = await app.inject({ method: 'GET', url: '/healthz', headers: { 'x-forwarded-proto': 'http' } });
    expect(health.statusCode).toBe(200);
    await app.close();
  });
});
