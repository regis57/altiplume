import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import { openDatabase } from '../src/db/database.ts';
import { ConsoleMailer } from '../src/mail/mailer.ts';

async function app() {
  const dir = mkdtempSync(join(tmpdir(), 'altiplume-limite-'));
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>x</title>');
  writeFileSync(join(dir, 'app.0123abcd.js'), 'export {};');
  return buildApp({
    db: openDatabase({ path: ':memory:' }),
    config: loadConfig({ NODE_ENV: 'production', PORT: '3000', PUBLIC_ORIGIN: 'https://altiplume.test', MAIL_API_KEY: 'x' }),
    mailer: new ConsoleMailer(() => undefined), push: null, now: () => Date.now(),
  }, { clientDir: dir });
}

describe('la limite anti-abus', () => {
  it("laisse charger des pages sans entamer le budget de l'API, qui reste à 120 par minute", async () => {
    const a = await app();
    // Une famille derrière la même box : 300 requêtes de pages et de scripts en une minute.
    for (let i = 0; i < 300; i += 1) {
      const r = await a.inject({ method: 'GET', url: i % 2 ? '/' : '/app.0123abcd.js' });
      expect(r.statusCode, `page ${i}`).toBe(200);
    }
    // L'API a encore tout son budget…
    for (let i = 0; i < 120; i += 1) expect((await a.inject({ method: 'GET', url: '/v1/version' })).statusCode, `api ${i}`).toBe(200);
    // … et pas un de plus.
    const over = await a.inject({ method: 'GET', url: '/v1/version' });
    expect(over.statusCode).toBe(429);
    expect(over.headers['retry-after']).toBeDefined();
    // Les pages, elles, se chargent encore.
    expect((await a.inject({ method: 'GET', url: '/' })).statusCode).toBe(200);
    await a.close();
  });

  it('garde une limite aux pages aussi, plus large', async () => {
    const a = await app();
    for (let i = 0; i < 600; i += 1) expect((await a.inject({ method: 'GET', url: '/' })).statusCode).toBe(200);
    expect((await a.inject({ method: 'GET', url: '/' })).statusCode).toBe(429);
    await a.close();
  });
});
