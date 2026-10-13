#!/usr/bin/env node
/**
 * « Zéro traqueur », vérifié à chaque PR.
 *
 * Même question que Blacklight (The Markup), posée en continu : dans un vrai
 * Chromium, contre un vrai serveur, la page — et tout ce qu'elle charge — parle-t-elle
 * à quelqu'un d'autre que l'aérodrome ? On parcourt les pages publiques (en
 * français et en anglais), on s'inscrit, on ouvre l'aérodrome et le compte, et on
 * note chaque requête émise, y compris par les workers et les WebSocket.
 *
 * Échoue si :
 *   - une seule requête part vers un autre domaine ;
 *   - le navigateur signale une violation de la politique de sécurité du contenu
 *     (CSP) : c'est une page qui a essayé de charger quelque chose d'extérieur ;
 *   - un cookie est posé par un autre domaine que l'aérodrome.
 *
 *   node scripts/e2e-tiers.mjs
 */
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 3995;
const ORIGIN = `http://localhost:${PORT}`;
const dbPath = join(mkdtempSync(join(tmpdir(), 'altiplume-tiers-')), 'jeu.db');

function assert(cond, message) { if (!cond) throw new Error(`échec : ${message}`); }

const server = spawn(process.execPath, ['--no-warnings=ExperimentalWarning', 'packages/server/src/server.ts'], {
  env: { ...process.env, NODE_ENV: 'development', PORT: String(PORT), PUBLIC_ORIGIN: ORIGIN, DATABASE_PATH: dbPath },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', (d) => { logs += d; });
server.stderr.on('data', (d) => { logs += d; });
const stop = () => { if (!server.killed) server.kill('SIGTERM'); };
process.on('exit', stop);
for (let i = 0; i < 50; i += 1) {
  try { const r = await fetch(`${ORIGIN}/healthz`); if (r.ok) break; } catch { /* pas encore */ }
  await new Promise((r) => setTimeout(r, 200));
}
async function lastLink() {
  for (let i = 0; i < 20; i += 1) {
    const all = [...logs.matchAll(/jeton=([A-Za-z0-9_%-]+)/g)];
    if (all.length) return decodeURIComponent(all.at(-1)[1]);
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('aucun lien dans les journaux');
}

// Chrome du runner GitHub, ou le Chromium de l'environnement de développement.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' });
  const requetes = [];
  const violations = [];
  // Au niveau du contexte : on voit aussi ce que demandent les workers.
  ctx.on('request', (r) => requetes.push(r.url()));
  await ctx.exposeBinding('signalerViolation', (_source, detail) => { violations.push(detail); });
  await ctx.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      window.signalerViolation(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw new Error(`erreur de page : ${e.message}`); });
  page.on('websocket', (ws) => requetes.push(ws.url()));

  const publiques = ['/', '/aide', '/cgu', '/confidentialite', '/mentions-legales', '/contact', '/connexion'];
  for (const chemin of publiques) {
    await page.goto(`${ORIGIN}${chemin}`, { waitUntil: 'networkidle' });
    await page.goto(`${ORIGIN}${chemin}${chemin.includes('?') ? '&' : '?'}lang=en`, { waitUntil: 'networkidle' });
  }

  // Inscription, vérification, fondation : ce que fait un joueur.
  await page.goto(`${ORIGIN}/`);
  await page.fill('#email', 'pilote@example.test');
  await page.fill('#nickname', 'Pilote');
  await page.check('#age'); await page.check('#terms');
  await page.click('#signup button[type=submit]');
  await page.waitForSelector('#signup-message.ok');
  await page.goto(`${ORIGIN}/verifier?jeton=${encodeURIComponent(await lastLink())}`);
  await page.click('#verify button[type=submit]');
  await page.waitForURL(`${ORIGIN}/aerodrome`);
  await page.waitForSelector('.choix-nom');
  await page.fill('#nom-perso', 'Les Ailes de la Croisette');
  await page.click('#fonder button[type=submit]');
  await page.waitForSelector('#aerodrome:not(.cache)');
  await page.waitForLoadState('networkidle');
  await page.goto(`${ORIGIN}/compte`, { waitUntil: 'networkidle' });

  // Le verdict.
  const exterieures = requetes.filter((u) => {
    if (/^(data|blob|about):/.test(u)) return false;
    return new URL(u).origin.replace(/^ws/, 'http') !== ORIGIN;
  });
  assert(requetes.length > 20, `le parcours a bien chargé des pages (${requetes.length} requêtes)`);
  assert(exterieures.length === 0, `aucune requête vers un autre domaine (vues : ${[...new Set(exterieures)].join(', ')})`);
  assert(violations.length === 0, `aucune violation de la CSP (${violations.join(' ; ')})`);
  const cookies = await ctx.cookies();
  const etrangers = cookies.filter((c) => c.domain.replace(/^\./, '') !== 'localhost');
  assert(etrangers.length === 0, `aucun cookie d'un autre domaine (${etrangers.map((c) => c.domain).join(', ')})`);
  process.stdout.write(`e2e tiers : ${requetes.length} requêtes, toutes vers l'aérodrome ; ${cookies.length} cookie(s), tous à nous.\n`);
} finally {
  await browser.close();
  stop();
}
