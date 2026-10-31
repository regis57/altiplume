#!/usr/bin/env node
/**
 * Parcours de bout en bout de la Côte de Saline : la route fermée, puis ouverte
 * contre dix cachets ; le ponton ; la Sterne achetée et amarrée dans la scène ;
 * un amerrissage à l'Anse-aux-Goémons et ses pages d'album. Dans un vrai
 * Chromium, contre un vrai serveur ; l'état est forcé dans la base là où il
 * faudrait sinon six vols et des heures.
 *
 *   node scripts/e2e-saline.mjs [dossier-captures]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { chromium } from 'playwright';

const PORT = 3995;
const ORIGIN = `http://localhost:${PORT}`;
const shots = process.argv[2] ?? null;
if (shots) mkdirSync(shots, { recursive: true });
const dbPath = join(mkdtempSync(join(tmpdir(), 'altiplume-e2e-')), 'jeu.db');

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

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fr-FR' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw new Error(`erreur de page : ${e.message}`); });

  await page.goto(`${ORIGIN}/`);
  await page.fill('#email', 'saline@example.test');
  await page.fill('#nickname', 'Saunier');
  await page.check('#age'); await page.check('#terms');
  await page.click('#signup button[type=submit]');
  await page.waitForSelector('#signup-message.ok');
  await page.goto(`${ORIGIN}/verifier?jeton=${encodeURIComponent(await lastLink())}`);
  await page.click('#verify button[type=submit]');
  await page.waitForURL(`${ORIGIN}/aerodrome`);
  await page.waitForSelector('.choix-nom');
  await page.fill('#nom-perso', 'Les Ailes de Saline');
  await page.click('#fonder button[type=submit]');
  await page.waitForSelector('#aerodrome:not(.cache)');

  // La route est là, fermée : il manque la page « Toute la vallée ».
  const saline = page.locator('#routes .route', { hasText: 'Côte de Saline' });
  assert(await saline.count() === 1, 'la Côte de Saline est dans les routes');
  assert(await saline.locator('button').isDisabled(), 'le bouton est inactif sans la page');
  assert((await saline.textContent()).includes('Toute la vallée'), 'la page manquante est nommée');
  assert(await page.$eval('#scene-ponton', (e) => e.classList.contains('cache')), 'pas de ponton au départ');

  // Le cas du 14 octobre : dix cachets, cinq escales sur six, et une route grisée sans
  // qu'on sache pourquoi. Les deux conditions sont dites, chacune avec son état, et
  // l'escale qui manque est nommée.
  const db = new DatabaseSync(dbPath);
  for (const d of ['pont-de-brume', 'les-tilleuls', 'moulin-gris', 'haut-ferrand', 'combe-aux-rosees']) {
    db.prepare("INSERT OR IGNORE INTO company_stamps (company_id, stamp, earned_at) SELECT id, ?, founded_at FROM companies").run(`s-${d}`);
  }
  db.exec('UPDATE companies SET stamps = 10');
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  const conditions = saline.locator('.condition');
  assert(await conditions.count() === 2, 'deux conditions pour ouvrir la route');
  const page1 = conditions.nth(0), cachets1 = conditions.nth(1);
  assert(await page1.evaluate((e) => e.classList.contains('manque')), 'la page manque');
  const textePage = (await page1.textContent()).replace(/\s+/g, ' ');
  assert(textePage.includes('Toute la vallée') && textePage.includes('il reste à livrer : Lanterne-du-Val') && !textePage.includes('Pont-de-Brume'),
    `la page manquante et la seule escale qui reste sont nommées (${textePage})`);
  assert(textePage.includes('manque :'), 'l\'état est lu par les lecteurs d\'écran');
  assert(await cachets1.evaluate((e) => e.classList.contains('faite')), 'les cachets suffisent');
  assert((await cachets1.textContent()).includes('Prix : 10 cachets — vous en avez 10 en caisse'), 'le compte des cachets est dit');
  assert(await saline.locator('button').isDisabled(), 'le bouton reste inactif tant que la page manque');

  // Toute la vallée livrée, dix cachets en caisse : la route s'ouvre.
  db.exec("INSERT OR IGNORE INTO company_stamps (company_id, stamp, earned_at) SELECT id, 's-vallee', founded_at FROM companies");
  db.exec('UPDATE companies SET stamps = 10, francs = 20000');
  db.exec("DELETE FROM company_hand WHERE card LIKE 'e-%'");
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  if (shots) await page.screenshot({ path: join(shots, 'e2e-saline-1-route-fermee.png'), fullPage: true });
  await saline.locator('button', { hasText: 'Ouvrir la route' }).click();
  await page.waitForSelector('#jeu-message.ok');
  assert((await page.textContent('#jeu-message')).includes('La route est ouverte'), 'message d\'ouverture');
  assert((await saline.textContent()).includes('Route ouverte'), 'la route est marquée ouverte');
  assert((await page.textContent('#cachets')) === '1', 'dix cachets dépensés, la page de la route rendue');
  assert((await page.textContent('#album')).includes('La route de la Côte'), 'la page dans l\'album');
  assert((await page.textContent('#bord')).includes('Route ouverte : Côte de Saline'), 'le livre de bord');
  // Le cas du 15 octobre : la Côte ouverte, le cap vise la Forêt (sa page est déjà dans
  // l'album), pas l'Archipel, qui demande toute la Côte et une flotte qu'on n'a pas.
  const cap = (await page.textContent('#cap')).replace(/\s+/g, ' ');
  assert(cap.includes('Prochaine route : Forêt de Cuivre') && cap.includes("La page « Toute la vallée » est dans l'album"),
    `le cap vise la route la plus proche (${cap})`);

  // Le ponton, puis la Sterne.
  const ponton = page.locator('#zones li', { hasText: 'Le ponton' });
  await ponton.locator('button', { hasText: 'Restaurer' }).click();
  await page.waitForSelector('#jeu-message.ok');
  await page.waitForSelector('#scene-ponton:not(.cache)');
  db.exec("INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) SELECT id, 'o-sterne', founded_at FROM companies");
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  const offre = page.locator('#main .carte', { hasText: 'Une Sterne à Port-Sel' });
  assert((await offre.textContent()).includes('Pour le ponton : Sterne S-1'), "l'offre dit où va l'hydravion");
  // Le prix s'écrit comme en français : « 3 850 F » (espace fine insécable).
  await offre.locator('button', { hasText: 'Acheter · 3\u202f850 F' }).click();
  await page.waitForSelector('#jeu-message.ok');
  assert((await page.textContent('#jeu-message')) === 'Sterne S-1 est amarré au ponton.', `le message dit ce qui s'est passé (${await page.textContent('#jeu-message')})`);
  await page.waitForSelector('#place-eau-1[data-modele=sterne]');
  assert((await page.textContent('#avions')).includes('Sterne S-1'), 'la Sterne est au hangar (sur l\'eau)');
  if (shots) await page.screenshot({ path: join(shots, 'e2e-saline-2-sterne-au-ponton.png'), fullPage: true });

  // Amerrir à l'Anse-aux-Goémons : trois quarts d'heure.
  db.exec("INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) SELECT id, 'c-coquillages', founded_at FROM companies");
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  const coquillages = page.locator('#main .carte', { hasText: 'Les coquillages du matin' });
  await coquillages.locator('button', { hasText: 'Expédier' }).click();
  await coquillages.locator('select[name=plane]').selectOption({ label: 'Sterne S-1 · 3 sacs' });
  const estimate = await coquillages.locator('.expedition .aide').textContent();
  assert(/45 min/.test(estimate), `estimation « 45 min » (${estimate})`);
  await coquillages.locator('button', { hasText: 'Envoyer' }).click();
  await page.waitForSelector('#jeu-message.ok');
  await page.waitForSelector('#place-eau-1:not([data-modele])', { state: 'attached' });
  assert((await page.textContent('#vols .vol')).includes('Anse-aux-Goémons'), 'le vol vers l\'anse est affiché');

  // Une heure plus tard : les pages « Sur l'eau » et « Anse-aux-Goémons ».
  // Au moins la durée réelle du vol, qu'un incident allonge de 30 % : un décalage fixe
  // laissait parfois le vol en l'air, et le parcours échouait au hasard.
  db.exec('UPDATE flights SET departed_at = departed_at - MAX(60 * 60 * 1000, duration_ms + 60 * 1000)');
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  const news = await page.textContent('#nouvelles');
  assert(news.includes("Anse-aux-Goémons") && news.includes("Sur l'eau"), `nouvelles d'amerrissage (${news})`);
  if (shots) await page.screenshot({ path: join(shots, 'e2e-saline-3-amerrissage.png'), fullPage: true });

  // Le cas du 31 octobre : deux Grives au hangar à deux places, le pré fauché, la Forêt
  // ouverte. Pour Marais-Blanc, le cap désignait le Martinet (5 500 F en tout) ; il dit
  // maintenant le Pic et l'atelier, chaque prix et le total, avec les chiffres que le
  // navigateur reçoit du serveur — et ne propose plus de pilote qu'on ne choisit pas.
  db.exec("INSERT INTO company_planes (id, company_id, model, wear, acquired_at) SELECT 'grive-2', id, 'grive', 10, 0 FROM companies");
  db.exec("UPDATE company_zones SET level = 2 WHERE zone = 'hangar'");
  db.exec("INSERT OR IGNORE INTO company_regions (company_id, region, opened_at) SELECT id, 'cuivre', founded_at FROM companies");
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  const capPrix = (await page.textContent('#cap')).replace(/\s+/g, ' ');
  assert(capPrix.includes('Prochaine route : Archipel des Lanternes')
    && capPrix.includes("Marais-Blanc : hors de portée de la flotte. Il y faut un avion qui porte plus loin (Pic P-1, 3 150 F d'occasion) et une place de plus au hangar (2 000 F) — 5 150 F en tout."),
    `le cap dit le Pic, ses prix et le total (${capPrix})`);
  assert(!capPrix.includes('Martinet') && !capPrix.includes('Longues routes'), `ni Martinet ni pilote à choisir (${capPrix})`);

  // Et en anglais.
  // L'aérodrome se recharge de lui-même dans la nouvelle langue.
  await Promise.all([page.waitForEvent('load'), page.click('[data-action=toggle-lang]')]);
  await page.waitForSelector('#aerodrome:not(.cache)');
  assert((await page.textContent('#routes')).includes('Saltshore') && (await page.textContent('#routes')).includes('Route open'), 'routes en anglais');
  const capEn = (await page.textContent('#cap')).replace(/\s+/g, ' ');
  assert(capEn.includes("Whitefen: beyond the fleet's range. That takes a longer-range plane (Woodpecker W-1, 3,150 F second-hand) and another hangar bay (2,000 F) — 5,150 F all told."),
    `le cap en anglais, ses prix et le total (${capEn})`);
  db.close();
  process.stdout.write('e2e saline : tout est passé.\n');
} finally {
  await browser.close();
  stop();
}
