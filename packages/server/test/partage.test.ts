import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import { openDatabase } from '../src/db/database.ts';
import { ConsoleMailer } from '../src/mail/mailer.ts';
import { rewriteLanguage } from '../src/http/langue.ts';

const PAGES = new Set(['index', 'aide']);

describe('la langue d\'un lien partagé — la réécriture', () => {
  it("sert l'exemplaire anglais d'une page, et seulement d'une page", () => {
    expect(rewriteLanguage('/?lang=en', 'GET', PAGES)).toBe('/index.en.html?lang=en');
    expect(rewriteLanguage('/aide?lang=en', 'GET', PAGES)).toBe('/aide.en.html?lang=en');
    expect(rewriteLanguage('/aide?x=1&lang=en', 'HEAD', PAGES)).toBe('/aide.en.html?x=1&lang=en');
    // Le français est la langue par défaut : rien à réécrire.
    expect(rewriteLanguage('/aide', 'GET', PAGES)).toBe('/aide');
    expect(rewriteLanguage('/aide?lang=fr', 'GET', PAGES)).toBe('/aide?lang=fr');
    // Ni une API, ni un fichier, ni une écriture, ni une page qui n'a pas d'exemplaire anglais.
    expect(rewriteLanguage('/v1/company?lang=en', 'GET', PAGES)).toBe('/v1/company?lang=en');
    expect(rewriteLanguage('/styles.css?lang=en', 'GET', PAGES)).toBe('/styles.css?lang=en');
    expect(rewriteLanguage('/aide?lang=en', 'POST', PAGES)).toBe('/aide?lang=en');
    expect(rewriteLanguage('/inconnue?lang=en', 'GET', PAGES)).toBe('/inconnue?lang=en');
    // Pas de remontée de dossier, pas de surprise.
    expect(rewriteLanguage('/../etc/passwd?lang=en', 'GET', PAGES)).toBe('/../etc/passwd?lang=en');
    expect(rewriteLanguage('/aide?lang=english', 'GET', PAGES)).toBe('/aide?lang=english');
  });
});

describe('la langue d\'un lien partagé — le serveur', () => {
  async function app() {
    const dir = mkdtempSync(join(tmpdir(), 'altiplume-partage-'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html><html lang="fr"><meta property="og:image" content="/partage/altiplume-fr.png">');
    writeFileSync(join(dir, 'index.en.html'), '<!doctype html><html lang="en"><meta property="og:image" content="/partage/altiplume-en.png">');
    writeFileSync(join(dir, 'aide.html'), '<!doctype html><html lang="fr">');
    writeFileSync(join(dir, 'aide.en.html'), '<!doctype html><html lang="en">');
    writeFileSync(join(dir, 'icone.svg'), '<svg/>');
    mkdirSync(join(dir, 'partage'));
    writeFileSync(join(dir, 'partage', 'altiplume-fr.png'), 'png');
    writeFileSync(join(dir, 'partage', 'altiplume-en.png'), 'png');
    return buildApp({
      db: openDatabase({ path: ':memory:' }),
      config: loadConfig({ NODE_ENV: 'production', PORT: '3000', PUBLIC_ORIGIN: 'https://altiplume.test', MAIL_API_KEY: 'x' }),
      mailer: new ConsoleMailer(() => undefined), push: null, now: () => Date.now(),
    }, { clientDir: dir });
  }

  it("montre aux robots de partage la carte de la langue du lien", async () => {
    const a = await app();
    const fr = await a.inject({ method: 'GET', url: '/' });
    expect(fr.body).toContain('lang="fr"');
    expect(fr.body).toContain('altiplume-fr.png');
    const en = await a.inject({ method: 'GET', url: '/?lang=en' });
    expect(en.statusCode).toBe(200);
    expect(en.body).toContain('lang="en"');
    expect(en.body).toContain('altiplume-en.png');
    expect(en.headers['cache-control']).toBe('no-cache');
    expect((await a.inject({ method: 'GET', url: '/aide?lang=en' })).body).toContain('lang="en"');
    expect((await a.inject({ method: 'GET', url: '/aide' })).body).toContain('lang="fr"');
    await a.close();
  });

  it('laisse les cartes s\'afficher ailleurs, et rien d\'autre', async () => {
    const a = await app();
    for (const lang of ['fr', 'en']) {
      const r = await a.inject({ method: 'GET', url: `/partage/altiplume-${lang}.png` });
      expect(r.statusCode).toBe(200);
      expect(r.headers['cross-origin-resource-policy']).toBe('cross-origin');
    }
    for (const url of ['/', '/?lang=en', '/icone.svg', '/partage/altiplume-fr.png?x=1', '/v1/version']) {
      expect((await a.inject({ method: 'GET', url })).headers['cross-origin-resource-policy'], url).toBe('same-origin');
    }
    await a.close();
  });

  it("redirige vers HTTPS l'adresse demandée, pas l'adresse réécrite", async () => {
    const a = await app();
    const r = await a.inject({ method: 'GET', url: '/aide?lang=en', headers: { 'x-forwarded-proto': 'http', host: 'altiplume.test' } });
    expect(r.statusCode).toBe(301);
    expect(r.headers.location).toBe('https://altiplume.test/aide?lang=en');
    await a.close();
  });
});
