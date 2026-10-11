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
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
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

describe('fichiers du client', () => {
  it('sert le HTML sans cache et les bundles empreintés en immuable', async () => {
    const { mkdtempSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const dir = mkdtempSync(join(tmpdir(), 'altiplume-client-'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html><title>x</title>');
    writeFileSync(join(dir, 'app.0123abcd.js'), 'export {};');
    writeFileSync(join(dir, 'icone.svg'), '<svg/>');
    const { buildApp } = await import('../src/app.ts');
    const { loadConfig } = await import('../src/config.ts');
    const { openDatabase } = await import('../src/db/database.ts');
    const { ConsoleMailer } = await import('../src/mail/mailer.ts');
    const app = await buildApp({
      db: openDatabase({ path: ':memory:' }),
      config: loadConfig({ NODE_ENV: 'production', PORT: '3000', PUBLIC_ORIGIN: 'https://altiplume.test', MAIL_API_KEY: 'x' }),
      mailer: new ConsoleMailer(() => undefined), push: null, now: () => Date.now(),
    }, { clientDir: dir });
    const html = await app.inject({ method: 'GET', url: '/' });
    expect(html.statusCode).toBe(200);
    expect(html.headers['cache-control']).toBe('no-cache');
    const js = await app.inject({ method: 'GET', url: '/app.0123abcd.js' });
    expect(js.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    const svg = await app.inject({ method: 'GET', url: '/icone.svg' });
    expect(svg.headers['cache-control']).toBe('public, max-age=3600');
    await app.close();
  });
});
