import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';

describe('application', () => {
  it('répond à la sonde de vivacité', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/healthz' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    await app.close();
  });

  it('pose les en-têtes de sécurité sur chaque réponse', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/healthz' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    await app.close();
  });

  it('ne divulgue rien sur une route inconnue', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/etc/passwd' });
    expect(response.statusCode).toBe(404);
    expect(response.body).not.toContain('/home');
    await app.close();
  });
});
