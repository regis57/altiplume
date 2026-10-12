#!/usr/bin/env node
/**
 * Aperçus de la scène : une compagnie avec tout posé et tout restauré, à
 * l'aube, le jour, au crépuscule et la nuit — et la version nue du premier
 * jour, puis les quatre saisons. Treize images dans le dossier demandé, pour
 * juger les pixels avant de pousser.
 *
 *   node scripts/scene-preview.mjs dossier-de-sortie
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { chromium } from 'playwright';

const PORT = 3993;
const ORIGIN = `http://localhost:${PORT}`;
const out = process.argv[2] ?? 'scene-apercus';
mkdirSync(out, { recursive: true });
const dbPath = join(mkdtempSync(join(tmpdir(), 'altiplume-scene-')), 'jeu.db');

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

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fr-FR', deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${ORIGIN}/`);
  await page.fill('#email', 'scene@example.test');
  await page.fill('#nickname', 'Peintre');
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

  const shoot = async (name) => {
    for (const moment of ['aube', 'jour', 'crepuscule', 'nuit']) {
      await page.evaluate((m) => { document.getElementById('jeu').dataset.moment = m; }, moment);
      await page.locator('.scene').screenshot({ path: join(out, `${name}-${moment}.png`) });
    }
  };
  await shoot('premier-jour');

  // Tout posé, tout restauré, la Sterne au ponton.
  const db = new DatabaseSync(dbPath);
  db.exec("UPDATE company_zones SET level = 3 WHERE zone IN ('runway', 'hangar')");
  db.exec("UPDATE company_zones SET level = 2 WHERE zone = 'ponton'");
  db.exec("INSERT OR IGNORE INTO company_decorations (company_id, decoration, placed_at) SELECT c.id, d.id, 0 FROM companies c, (SELECT 'd-fleurs' AS id UNION SELECT 'd-banc' UNION SELECT 'd-manche' UNION SELECT 'd-enseigne' UNION SELECT 'd-drapeau' UNION SELECT 'd-boite' UNION SELECT 'd-lanterne' UNION SELECT 'd-pommier' UNION SELECT 'd-cafe' UNION SELECT 'd-peinture') d");
  db.exec("INSERT INTO company_planes (id, company_id, model, wear, acquired_at) SELECT 'sterne-1', id, 'sterne', 0, 0 FROM companies");
  db.close();
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  await shoot('tout-pose');
  // Les quatre saisons, de jour — et l'hiver de nuit, pour la neige bleue.
  for (const saison of ['printemps', 'ete', 'automne', 'hiver']) {
    await page.evaluate((x) => { const j = document.getElementById('jeu'); j.dataset.saison = x; j.dataset.moment = 'jour'; }, saison);
    await page.locator('.scene').screenshot({ path: join(out, `saison-${saison}.png`), animations: 'disabled' });
  }
  await page.evaluate(() => { document.getElementById('jeu').dataset.moment = 'nuit'; });
  await page.locator('.scene').screenshot({ path: join(out, 'saison-hiver-nuit.png'), animations: 'disabled' });
  process.stdout.write(`aperçus écrits dans ${out}\n`);
} finally {
  await browser.close();
  stop();
}
