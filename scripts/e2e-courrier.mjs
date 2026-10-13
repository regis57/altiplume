#!/usr/bin/env node
/**
 * Parcours de bout en bout du courrier : fonder la compagnie, expédier un
 * contrat, voir le vol avancer, encaisser à l'arrivée. Dans un vrai Chromium,
 * contre un vrai serveur. Le temps est avancé en reculant l'horodatage du vol
 * dans la base (le serveur n'a pas d'horloge truquée, et c'est très bien).
 *
 *   node scripts/e2e-courrier.mjs [dossier-captures]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { chromium } from 'playwright';

const PORT = 3996;
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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw new Error(`erreur de page : ${e.message}`); });

  // Inscription et fondation.
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
  assert((await page.textContent('#t-compagnie')) === 'Les Ailes de la Croisette', 'compagnie fondée');
  // L'étiquette de version, en haut à droite de chaque page : le stade et ce qui tourne.
  const etiquette = (await page.textContent('.etiquette')).replace(/\s+/g, ' ').trim();
  assert(/^essai v\d+\.\d+\.\d+$/.test(etiquette), `étiquette de version (${etiquette})`);
  assert((await page.getAttribute('.etiquette', 'href')) === '/version', 'elle mène à la page « essai »');
  assert((await page.textContent('#francs')) === '300', '300 francs au départ');
  const drawn = await page.$$eval('#main .carte:not(.reguliere)', (c) => c.length);
  assert(drawn === 3, `trois cartes du jour (${drawn})`);
  assert((await page.textContent('#nouvelles')).includes('Cartes du jour'), 'les nouvelles annoncent le tirage');

  // On s'assure d'avoir un contrat précis en main : le journal pour Pont-de-Brume.
  const db = new DatabaseSync(dbPath);
  db.exec("INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) SELECT id, 'c-journal', founded_at FROM companies");
  // Un imprévu tiré bloquerait la piste : on le tranche d'office pour ce parcours.
  db.exec("DELETE FROM company_hand WHERE card LIKE 'e-%'");
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  if (shots) await page.screenshot({ path: join(shots, 'e2e-courrier-1-main.png'), fullPage: true });

  // Expédier.
  const journal = page.locator('#main .carte', { hasText: 'Le journal du matin' });
  await journal.locator('button', { hasText: 'Expédier' }).click();
  await journal.locator('.expedition');
  const estimate = await journal.locator('.expedition .aide').textContent();
  assert(/5 min/.test(estimate), `estimation « 5 min » (${estimate})`);
  if (shots) await page.screenshot({ path: join(shots, 'e2e-courrier-2-expedier.png'), fullPage: true });
  await journal.locator('button', { hasText: 'Envoyer' }).click();
  await page.waitForSelector('#jeu-message.ok');
  await page.waitForSelector('#vols .vol');
  assert((await page.textContent('#francs')) === '286', 'coût débité : 300 − 14');
  const vol = await page.textContent('#vols .vol');
  assert(vol.includes('Pont-de-Brume') && vol.includes('Prosper') && vol.includes('En route'), `vol affiché (${vol})`);
  assert(await page.$eval('#place-a', (e) => !e.dataset.modele), 'la Grive a quitté sa place au parking de la scène');
  assert((await page.textContent('#bord')).includes('Départ pour Pont-de-Brume'), 'livre de bord : départ');

  // La Grive est en l'air : la ligne régulière ne doit proposer ni avion d'escorte
  // ni départ. Défaut du 12/10 : sans avion choisi, le formulaire croyait la charge
  // trop lourde et montrait le convoi à qui n'a qu'un seul avion.
  const reguliere = page.locator('#main .carte.reguliere');
  await reguliere.locator('button', { hasText: 'Expédier' }).click();
  await reguliere.locator('.expedition');
  assert(await reguliere.locator('.expedition .convoi').evaluate((e) => e.classList.contains('cache')), 'convoi caché quand on n\'a qu\'un avion');
  assert(await reguliere.locator('.expedition button[type=submit]').evaluate((e) => e.disabled), 'bouton « Envoyer » fermé : aucun avion au sol');
  const sansAvion = await reguliere.locator('.expedition .aide').textContent();
  assert(/Aucun avion au sol/.test(sansAvion), `message « aucun avion au sol » (${sansAvion})`);
  await reguliere.locator('button', { hasText: 'Annuler' }).click();
  if (shots) await page.screenshot({ path: join(shots, 'e2e-courrier-3-en-vol.png'), fullPage: true });

  // Six minutes plus tard (dans la base) : arrivée, encaissement, cachets.
  db.exec('UPDATE flights SET departed_at = departed_at - 6 * 60 * 1000');
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  const news = await page.textContent('#nouvelles');
  assert(news.includes('Prosper Chickenman est rentré de Pont-de-Brume') && news.includes('+41 F') && news.includes('délai tenu'), `nouvelles d'arrivée (${news})`);
  assert(news.includes('Premier vol') && news.includes('Pont-de-Brume'), 'deux nouvelles pages dans l\'album');
  assert((await page.textContent('#francs')) === '327', 'encaissé : 286 + 33 + 8');
  assert((await page.textContent('#vols .vol')).includes('Sur le retour'), 'avion sur le retour');
  const gagnees = await page.$$eval('#album .page.gagnee', (p) => p.length);
  // Fondation, Premier vol, Pont-de-Brume, et la première livraison de la saison en cours.
  assert(gagnees === 4, `quatre pages gagnées (${gagnees})`);
  if (shots) await page.screenshot({ path: join(shots, 'e2e-courrier-4-arrivee.png'), fullPage: true });

  // Un imprévu se tranche.
  db.exec("INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) SELECT id, 'e-bougie', founded_at FROM companies");
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  const bougie = page.locator('#main .carte', { hasText: 'Moteur qui tousse' });
  await bougie.locator('button', { hasText: 'Changer la bougie' }).click();
  await page.waitForSelector('#jeu-message.ok');
  assert((await page.textContent('#jeu-message')).includes('ronronne'), 'le dénouement s\'affiche');
  assert((await page.textContent('#francs')) === '315', '12 F de bougie');

  // Trusted Types : la politique « altiplume » existe (on ne peut pas la recréer), une chaîne brute
  // est refusée dans un puits d'injection, et les textes à balises sont bien rendus par la politique.
  const tt = await page.evaluate(async () => {
    const out = { supported: typeof trustedTypes !== 'undefined', duplicate: null, rawRejected: null, html: document.querySelector('[data-i18n-html]')?.innerHTML ?? '' };
    if (!out.supported) return out;
    try { trustedTypes.createPolicy('altiplume', { createHTML: (s) => s }); out.duplicate = false; } catch { out.duplicate = true; }
    try { await navigator.serviceWorker.register('/sw.js'); out.rawRejected = false; } catch (e) { out.rawRejected = e instanceof TypeError; }
    return out;
  });
  assert(tt.supported, 'Chromium connaît les Trusted Types');
  assert(tt.duplicate === true, 'la politique altiplume est déjà créée par le client');
  assert(tt.rawRejected === true, 'une adresse brute de service worker est refusée');
  assert(tt.html.includes('<strong>'), `les textes à balises passent par la politique (${tt.html.slice(0, 40)})`);

  // Un écran qui ne ment pas : la page croit la Grive au hangar, un vol est pourtant
  // parti (réponse perdue en chemin, autre appareil…). Le refus du serveur doit
  // remettre la page d'aplomb : le vol s'affiche, avec sa jauge.
  db.exec('UPDATE flights SET departed_at = departed_at - 11 * 60 * 1000');
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  assert(await page.$eval('#vols-vide', (e) => !e.classList.contains('cache')), 'au départ, personne en l\'air');
  const ligne = page.locator('#main .carte.reguliere');
  await ligne.locator('button', { hasText: 'Expédier' }).click();
  await ligne.locator('.expedition');
  // Un vol part sans que la page le sache.
  const parti = await page.evaluate(async () => {
    const plane = document.querySelector('.expedition select[name=plane]').value;
    const pilot = document.querySelector('.expedition select[name=pilot]').value;
    const r = await fetch('/v1/company/flights', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ card: 'c-ligne-reguliere', plane, pilot }),
    });
    return r.status;
  });
  assert(parti === 201, `le vol fantôme est bien parti (${parti})`);
  assert(await page.$eval('#vols-vide', (e) => !e.classList.contains('cache')), 'la page ne le sait pas encore');
  await ligne.locator('button', { hasText: 'Envoyer' }).click();
  await page.waitForSelector('#vols .vol');
  const dit = await page.textContent('#jeu-message');
  assert(/en vol/.test(dit), `le refus est dit (${dit})`);
  assert(await page.$eval('#vols-vide', (e) => e.classList.contains('cache')), 'la page s\'est remise d\'aplomb');
  assert(await page.$('#vols .vol .jauge'), 'la jauge du vol est revenue');

  // Et le tout en anglais.
  // L'aérodrome se recharge de lui-même dans la nouvelle langue.
  await Promise.all([page.waitForEvent('load'), page.click('[data-action=toggle-lang]')]);
  await page.waitForSelector('#aerodrome:not(.cache)');
  assert((await page.textContent('#bord')).includes('Arrived at Mistbridge'), 'livre de bord en anglais');
  db.close();
  process.stdout.write('e2e courrier : tout est passé.\n');
} finally {
  await browser.close();
  stop();
}
