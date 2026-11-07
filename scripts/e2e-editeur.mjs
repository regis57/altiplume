#!/usr/bin/env node
/**
 * Parcours de bout en bout du compteur de l'éditeur : dans un vrai Chromium, contre
 * un vrai serveur, la personne dont l'adresse est dans OWNER_EMAIL voit sur « Mon
 * compte » le nombre exact d'inscrits ; une autre personne ne voit rien, et la
 * route lui répond « introuvable ».
 *
 *   node scripts/e2e-editeur.mjs [dossier-captures]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 3993;
const ORIGIN = `http://localhost:${PORT}`;
const OWNER = 'editeur@example.test';
const shots = process.argv[2] ?? null;
if (shots) mkdirSync(shots, { recursive: true });
const dbPath = join(mkdtempSync(join(tmpdir(), 'altiplume-e2e-')), 'jeu.db');

function assert(cond, message) { if (!cond) throw new Error(`échec : ${message}`); }

const server = spawn(process.execPath, ['--no-warnings=ExperimentalWarning', 'packages/server/src/server.ts'], {
  env: { ...process.env, NODE_ENV: 'development', PORT: String(PORT), PUBLIC_ORIGIN: ORIGIN, DATABASE_PATH: dbPath, OWNER_EMAIL: OWNER },
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
/** Inscrit une personne dans un contexte neuf et ouvre « Mon compte ». */
async function ouvrirCompte(email, pseudo) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw new Error(`erreur de page : ${e.message}`); });
  await page.goto(`${ORIGIN}/`);
  await page.fill('#email', email);
  await page.fill('#nickname', pseudo);
  await page.check('#age'); await page.check('#terms');
  await page.click('#signup button[type=submit]');
  await page.waitForSelector('#signup-message.ok');
  await page.goto(`${ORIGIN}/verifier?jeton=${encodeURIComponent(await lastLink())}`);
  await page.click('#verify button[type=submit]');
  await page.waitForURL(`${ORIGIN}/aerodrome`);
  await page.goto(`${ORIGIN}/compte`);
  await page.waitForSelector('#fiche-nickname:not(:text("—"))');
  return page;
}

try {
  const autre = await ouvrirCompte('alice@example.test', 'Alice');
  const autreRequetes = [];
  autre.on('request', (r) => autreRequetes.push(r.url()));
  await autre.reload();
  await autre.waitForSelector('#fiche-nickname:not(:text("—"))');
  const proprietaire = await ouvrirCompte(OWNER, 'Editeur');

  // L'éditeur voit la section, avec les vrais nombres : deux comptes, aucune compagnie.
  await proprietaire.waitForSelector('#proprietaire:not(.cache)');
  assert((await proprietaire.textContent('#owner-players')) === '2', 'deux comptes inscrits');
  assert((await proprietaire.textContent('#owner-companies')) === '0', 'aucune compagnie');
  assert((await proprietaire.textContent('#owner-week')) === '2', 'deux inscrits sur 7 jours');
  assert((await proprietaire.textContent('#owner-month')) === '2', 'deux inscrits sur 30 jours');
  assert(!(await proprietaire.textContent('#proprietaire')).includes('example.test'), 'aucune adresse dans la section');
  if (shots) await proprietaire.screenshot({ path: join(shots, 'compte-editeur.png'), fullPage: true });

  // Une autre personne : section cachée, et la route répond « introuvable ». La page ne
  // la demande même pas : elle ne fait aucune requête de plus qu'avant.
  assert(await autre.locator('#proprietaire.cache').count() === 1, 'section cachée pour une autre personne');
  assert(!autreRequetes.some((u) => u.includes('/v1/owner/')), 'la page de Mon compte ne demande rien à la route réservée');
  const status = await autre.evaluate(async () => (await fetch('/v1/owner/counts')).status);
  assert(status === 404, `la route répond 404 à une autre personne (reçu ${status})`);

  process.stdout.write('e2e éditeur : le compteur ne se voit que de l’éditeur, avec les nombres exacts.\n');
} finally {
  await browser.close();
  stop();
}
