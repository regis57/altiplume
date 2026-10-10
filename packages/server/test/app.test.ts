import { describe, expect, it } from 'vitest';
import { testApp } from './helpers.ts';

describe('application', () => {
  it('répond à la sonde de vivacité', async () => {
    const t = await testApp();
    const response = await t.app.inject({ method: 'GET', url: '/healthz' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    await t.app.close();
  });

  it('pose les en-têtes de sécurité sur chaque réponse', async () => {
    const t = await testApp();
    const response = await t.app.inject({ method: 'GET', url: '/healthz' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    await t.app.close();
  });

  it('ne divulgue rien sur une route inconnue', async () => {
    const t = await testApp();
    const response = await t.app.inject({ method: 'GET', url: '/etc/passwd' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'not_found' });
    expect(response.body).not.toContain('/home');
    await t.app.close();
  });

  it('ne divulgue rien sur une erreur de validation', async () => {
    const t = await testApp();
    const response = await t.json('POST', '/v1/auth/login', { email: 12345 });
    expect(response.statusCode).toBe(400);
    expect(response.body).not.toMatch(/must be|instancePath|schemaPath/);
    await t.app.close();
  });
});
