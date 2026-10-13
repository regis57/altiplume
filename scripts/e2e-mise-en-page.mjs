#!/usr/bin/env node
/**
 * La mise en page de l'aérodrome, vérifiée dans un vrai navigateur.
 *
 * Le 13 octobre, sur PC, l'album de cachets demandait quatre écrans de défilement :
 * quarante-six pages en trois colonnes étroites, chaque rangée étirée à la hauteur
 * de la plus longue légende. Ce test garde ce qui a été réparé :
 *   - sur PC (1440×900), l'album entier tient dans un écran ;
 *   - ses pages ont toutes la même taille et remplissent leur case ;
 *   - l'album prend toute la largeur, hors des deux colonnes ;
 *   - sur téléphone (390×844), rien ne déborde sur le côté, et l'album garde trois
 *     timbres par rangée.
 *
 *   node scripts/e2e-mise-en-page.mjs [dossier-captures]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 3994;
const ORIGIN = `http://localhost:${PORT}`;
const shots = process.argv[2] ?? null;
if (shots) mkdirSync(shots, { recursive: true });
const dbPath = join(mkdtempSync(join(tmpdir(), 'altiplume-mise-en-page-')), 'jeu.db');

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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw new Error(`erreur de page : ${e.message}`); });

  await page.goto(`${ORIGIN}/`);
  await page.fill('#email', 'mise-en-page@example.test');
  await page.fill('#nickname', 'Mise en page');
  await page.check('#age'); await page.check('#terms');
  await page.click('#signup button[type=submit]');
  await page.waitForSelector('#signup-message.ok');
  await page.goto(`${ORIGIN}/verifier?jeton=${encodeURIComponent(await lastLink())}`);
  await page.click('#verify button[type=submit]');
  await page.waitForURL(`${ORIGIN}/aerodrome`);
  await page.waitForSelector('.choix-nom');
  await page.fill('#nom-perso', 'Compagnie de la Croisette');
  await page.click('#fonder button[type=submit]');
  await page.waitForSelector('#aerodrome:not(.cache)');

  const mesure = () => page.evaluate(() => {
    const album = document.querySelector('#album');
    const bloc = album.closest('section');
    const pages = [...album.children].map((li) => {
      const cs = getComputedStyle(li);
      return { h: Math.round(parseFloat(cs.height)), w: parseFloat(cs.width) };
    });
    return {
      vue: { w: innerWidth, h: innerHeight },
      largeurDoc: document.documentElement.scrollWidth,
      blocAlbum: Math.round(bloc.getBoundingClientRect().height),
      dansUneColonne: album.closest('.colonne') !== null,
      colonnes: getComputedStyle(album).gridTemplateColumns.split(' ').map(parseFloat),
      pages,
      compte: document.querySelector('#album-compte')?.textContent ?? '',
    };
  });

  // Sur PC.
  const pc = await mesure();
  assert(pc.pages.length >= 40, `l'album montre toutes ses pages (${pc.pages.length})`);
  assert(!pc.dansUneColonne, "l'album prend toute la largeur, hors des colonnes");
  assert(pc.blocAlbum <= pc.vue.h, `l'album tient dans un écran de PC (${pc.blocAlbum} px pour ${pc.vue.h})`);
  const hauteurs = new Set(pc.pages.map((p) => p.h));
  assert(hauteurs.size === 1, `toutes les pages ont la même hauteur (${[...hauteurs].join(', ')})`);
  const caseMin = Math.min(...pc.colonnes);
  assert(pc.pages.every((p) => p.w >= 0.95 * caseMin), `chaque page remplit sa case (${Math.min(...pc.pages.map((p) => p.w))} px pour ${caseMin})`);
  assert(/^1 page sur \d+ · 1 cachet gagné$/.test(pc.compte), `le compte des pages et des cachets gagnés est affiché, au singulier pour la fondation (${pc.compte})`);
  // Chaque page dit ce qu'elle vaut : Combe-aux-Rosées, au bout de la vallée, trois cachets.
  const combe = await page.locator('#album li', { hasText: 'Combe-aux-Rosées' }).locator('.valeur').textContent();
  assert(combe === '+3', `la page de Combe-aux-Rosées vaut trois cachets (${combe})`);
  assert(pc.largeurDoc <= pc.vue.w, 'rien ne déborde sur le côté, sur PC');
  if (shots) await page.screenshot({ path: `${shots}/pc.png`, fullPage: true });

  // Sur téléphone.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  const tel = await mesure();
  assert(tel.largeurDoc <= tel.vue.w, `rien ne déborde sur le côté, sur téléphone (${tel.largeurDoc} px pour ${tel.vue.w})`);
  assert(tel.colonnes.length >= 3, `trois timbres par rangée au moins, sur téléphone (${tel.colonnes.length})`);
  if (shots) await page.screenshot({ path: `${shots}/telephone.png`, fullPage: true });

  // Changer de langue en cours de partie : tout l'aérodrome suit, pas seulement les
  // libellés fixes (le 14/10, en français, le monde restait en anglais).
  const bascule = async () => {
    await Promise.all([page.waitForEvent('load'), page.click('[data-action=toggle-lang]')]);
    await page.waitForSelector('#aerodrome:not(.cache)');
    return (await page.textContent('#aerodrome')).replace(/\s+/g, ' ');
  };
  const anglais = await bascule();
  for (const fr of ['La ligne régulière', 'Restaurer', 'Pont-de-Brume', 'Vallées de Brume']) assert(!anglais.includes(fr), `en anglais, plus de « ${fr} »`);
  for (const en of ['The regular run', 'Restore', 'Mistbridge']) assert(anglais.includes(en), `en anglais, « ${en} »`);
  const francais = await bascule();
  for (const en of ['The regular run', 'Restore ·', 'Mistbridge', 'Mistvale']) assert(!francais.includes(en), `de retour en français, plus de « ${en} »`);
  for (const fr of ['La ligne régulière', 'Restaurer', 'Pont-de-Brume']) assert(francais.includes(fr), `de retour en français, « ${fr} »`);

  process.stdout.write(`e2e mise en page : album en ${pc.blocAlbum} px sur PC (${pc.colonnes.length} timbres par rangée), ${tel.colonnes.length} par rangée sur téléphone.\n`);
} finally {
  await browser.close();
  stop();
}
