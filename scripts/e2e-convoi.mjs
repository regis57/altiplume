#!/usr/bin/env node
/**
 * Parcours de bout en bout du fret lourd : une carte « deux avions », le
 * formulaire qui ouvre un convoi, le vol à deux équipages, et la nouvelle à
 * l'arrivée — accordée, et contractée (« des Tilleuls »). Dans un vrai Chromium,
 * contre un vrai serveur ; le temps avance en reculant l'horodatage du vol.
 *
 *   node scripts/e2e-convoi.mjs
 */
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { chromium } from 'playwright';

const PORT = 3986;
const ORIGIN = `http://localhost:${PORT}`;
const dbPath = join(mkdtempSync(join(tmpdir(), 'altiplume-convoi-')), 'jeu.db');
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
  try { if ((await fetch(`${ORIGIN}/healthz`)).ok) break; } catch { /* pas encore */ }
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

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
try {
  const page = await (await browser.newContext({ locale: 'fr-FR', viewport: { width: 420, height: 900 } })).newPage();
  page.on('pageerror', (e) => { throw new Error(`erreur de page : ${e.message}`); });
  await page.goto(`${ORIGIN}/`);
  await page.fill('#email', 'convoi@example.test');
  await page.fill('#nickname', 'Convoi');
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

  // Une flotte de deux Grives, deux pilotes, et le pressoir des Tilleuls en main.
  const db = new DatabaseSync(dbPath);
  db.exec('UPDATE companies SET francs = 5000');
  db.exec("UPDATE company_zones SET level = 2 WHERE zone = 'hangar'");
  db.exec("INSERT INTO company_planes (id, company_id, model, wear, acquired_at) SELECT 'grive-2', id, 'grive', 10, 0 FROM companies");
  db.exec("INSERT INTO company_pilots (id, company_id, pilot, hired_at) SELECT 'garance-1', id, 'garance', 0 FROM companies");
  db.exec('DELETE FROM company_hand');
  db.exec("INSERT INTO company_hand (company_id, card, drawn_at) SELECT id, 'c-pressoir', 0 FROM companies");
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');

  const carte = page.locator('#main .carte.lourd');
  assert((await carte.locator('.carte-genre').textContent()) === 'Fret lourd · deux avions', 'la carte annonce le fret lourd');
  await carte.locator('button', { hasText: 'Expédier' }).click();
  await page.waitForSelector('.expedition .convoi:not(.cache)');
  const estimate = await carte.locator('.expedition > .aide').textContent();
  assert(estimate.startsWith('Convoi'), `estimation de convoi (${estimate})`);
  assert((await carte.locator('.convoi select[name=wingPlane] option').count()) === 1, "l'escorte ne propose pas l'avion de tête");
  await carte.locator('button', { hasText: 'Envoyer' }).click();
  await page.waitForSelector('#vols .vol');
  const vol = await page.locator('#vols .vol .aide').first().textContent();
  assert(vol.startsWith('Convoi · ') && vol.includes(' et '), `un seul vol, deux équipages (${vol})`);
  assert((await page.locator('#vols .vol').count()) === 1, "l'ailier ne s'affiche pas en double");

  // Au moins la durée réelle du vol, qu'un incident allonge de 30 % : un décalage fixe
  // laissait parfois le vol en l'air, et le parcours échouait au hasard.
  db.exec('UPDATE flights SET departed_at = departed_at - MAX(30 * 60 * 1000, duration_ms + 60 * 1000)');
  db.close();
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  const news = await page.textContent('#nouvelles');
  assert(/sont rentrés des Tilleuls · \+180 F/.test(news), `nouvelle accordée et contractée (${news})`);
  assert(news.includes('Le premier convoi'), 'la page « Le premier convoi »');
  process.stdout.write('e2e convoi : tout est passé.\n');
} finally {
  await browser.close();
  stop();
}
