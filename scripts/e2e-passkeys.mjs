#!/usr/bin/env node
/**
 * Parcours de bout en bout : passkeys et connexion par QR, dans un vrai Chromium
 * avec un authenticateur virtuel (CDP WebAuthn). Démarre le serveur sur un port
 * libre, base en mémoire, emails dans la console.
 *
 *   node scripts/e2e-passkeys.mjs [dossier-captures]
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 3999;
const ORIGIN = `http://localhost:${PORT}`;
const shots = process.argv[2] ?? null;
if (shots) mkdirSync(shots, { recursive: true });

function assert(cond, message) {
  if (!cond) throw new Error(`échec : ${message}`);
}

// ---- Serveur ----
const server = spawn(process.execPath, ['--no-warnings=ExperimentalWarning', 'packages/server/src/server.ts'], {
  env: { ...process.env, NODE_ENV: 'development', PORT: String(PORT), PUBLIC_ORIGIN: ORIGIN, DATABASE_PATH: ':memory:' },
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
  throw new Error('aucun lien dans les journaux du serveur');
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
try {
  // ---- Le téléphone : s'inscrit par lien magique, ajoute une passkey ----
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR' });
  const page = await phone.newPage();
  const cdp = await phone.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
  });

  await page.goto(`${ORIGIN}/`);
  await page.fill('#email', 'pilote@example.test');
  await page.fill('#nickname', 'Pilote');
  await page.check('#age');
  await page.check('#terms');
  await page.click('#signup button[type=submit]');
  await page.waitForSelector('#signup-message.ok');
  const token = await lastLink();
  await page.goto(`${ORIGIN}/verifier?jeton=${encodeURIComponent(token)}`);
  await page.click('#verify button[type=submit]');
  await page.waitForURL(`${ORIGIN}/aerodrome`);
  await page.waitForSelector('#fondation:not(.cache)'); // connecté, sans compagnie encore

  // Fonder, puis l'invitation « Revenir d'un geste » sur le premier écran.
  await page.waitForSelector('.choix-nom');
  await page.fill('#nom-perso', 'Messageries de la Croisette');
  await page.click('#fonder button[type=submit]');
  await page.waitForSelector('#aerodrome:not(.cache)');
  await page.waitForSelector('#fiche-passkey:not(.cache)');
  await page.click('[data-action=passkey-later]');
  assert(await page.$eval('#fiche-passkey', (e) => e.classList.contains('cache')), '« Plus tard » replie l\'invitation');
  await page.reload(); await page.waitForSelector('#aerodrome:not(.cache)'); await page.waitForTimeout(400);
  assert(await page.$eval('#fiche-passkey', (e) => e.classList.contains('cache')), 'elle reste repliée trois jours');
  await page.evaluate(() => localStorage.removeItem('altiplume.passkey.plus-tard'));
  await page.reload(); await page.waitForSelector('#fiche-passkey:not(.cache)');
  await page.click('[data-action=passkey-create]');
  await page.waitForSelector('#jeu-message.ok');
  assert(await page.$eval('#fiche-passkey', (e) => e.classList.contains('cache')), 'la clé créée, l\'invitation disparaît');
  await page.reload(); await page.waitForSelector('#aerodrome:not(.cache)'); await page.waitForTimeout(400);
  assert(await page.$eval('#fiche-passkey', (e) => e.classList.contains('cache')), 'et ne revient plus');
  const first = await cdp.send('WebAuthn.getCredentials', { authenticatorId });
  assert(first.credentials.length === 1, 'une clé créée depuis l\'aérodrome');

  // Un second appareil (autre authenticateur) : le premier refuserait, à juste titre, une deuxième clé pour le même compte.
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: { protocol: 'ctap2', transport: 'usb', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
  });
  await page.goto(`${ORIGIN}/compte`);
  assert((await page.textContent('#fiche-nickname')) === 'Pilote', 'compte ouvert');

  // Ajout d'une passkey.
  await page.waitForSelector('[data-action=passkey-add]:not(.cache)');
  await page.click('[data-action=passkey-add]');
  await page.waitForSelector('#passkeys-message.ok');
  await page.waitForSelector('#passkeys-list li:nth-child(2)');
  const creds = await cdp.send('WebAuthn.getCredentials', { authenticatorId });
  assert(creds.credentials.length === 1, 'le premier appareil garde sa clé');
  assert(creds.credentials[0].isResidentCredential, 'clé découvrable');
  const rpId = creds.credentials[0].rpId;
  assert(rpId === 'localhost', `rpId = ${rpId}`);
  if (shots) await page.screenshot({ path: join(shots, 'e2e-passkey-1-ajoutee.png'), fullPage: true });

  // Renommer.
  await page.fill('#passkeys-list input', 'Téléphone de Pilote');
  await page.click('#passkeys-list button[type=submit]');
  await page.waitForSelector('#passkeys-message.ok');

  // Changement de langue : le message et les dates suivent (le bogue repéré par Régis).
  await page.click('[data-action=toggle-lang]');
  assert((await page.textContent('#passkeys-message')) === 'Passkey renamed.', 'message re-traduit');
  assert(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(await page.textContent('#fiche-since')), 'date re-traduite');
  await page.click('[data-action=toggle-lang]');

  // Déconnexion puis connexion par passkey, sans email.
  await page.click('[data-action=logout]');
  await page.waitForURL(`${ORIGIN}/`);
  await page.goto(`${ORIGIN}/connexion`);
  await page.waitForSelector('[data-action=passkey-login]:not(.cache)');
  if (shots) await page.screenshot({ path: join(shots, 'e2e-passkey-2-connexion-mobile.png'), fullPage: true });
  await page.click('[data-action=passkey-login]');
  await page.waitForURL(`${ORIGIN}/aerodrome`);
  await page.goto(`${ORIGIN}/compte`);
  assert((await page.textContent('#fiche-nickname')) === 'Pilote', 'connecté par passkey');
  // Deux clés : celle qui vient de servir porte une date, l'autre « jamais utilisée ».
  const usages = await page.$$eval('#passkeys-list .aide', (els) => els.map((e) => e.textContent));
  assert(usages.some((u) => !/jamais/.test(u)), `dernier usage renseigné (${usages.join(' | ')})`);

  // ---- Le PC : anonyme, affiche un QR ; le téléphone approuve ----
  const pc = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'fr-FR' });
  const desk = await pc.newPage();
  await desk.goto(`${ORIGIN}/connexion`);
  const [startResponse] = await Promise.all([
    desk.waitForResponse((r) => r.url().endsWith('/v1/auth/device/start')),
    desk.click('[data-action=show-qr]'),
  ]);
  const start = await startResponse.json();
  await desk.waitForSelector('#qr:not(.cache)');
  const pcCode = (await desk.textContent('#qr-code')).replace(/\s/g, '');
  assert(pcCode === start.userCode, 'le code affiché est celui du serveur');
  assert(!start.approveUrl.includes(start.pollToken), 'le QR ne contient pas le jeton d\'interrogation');
  // Le QR est bien dessiné (le canevas n'est pas vide).
  const drawn = await desk.evaluate(() => {
    const c = document.getElementById('qr-canvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let dark = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 100) dark += 1;
    return dark / (d.length / 4);
  });
  assert(drawn > 0.2 && drawn < 0.8, `densité du QR ${drawn.toFixed(2)}`);
  if (shots) await desk.screenshot({ path: join(shots, 'e2e-qr-1-pc.png'), fullPage: true });

  // Le téléphone « lit » le QR : il ouvre l'URL qu'il contient.
  await page.goto(start.approveUrl);
  await page.waitForSelector('#approve-pending:not(.cache)');
  const phoneCode = (await page.textContent('#approve-code')).replace(/\s/g, '');
  assert(phoneCode === pcCode, 'même code des deux côtés');
  assert(!page.url().includes('code='), 'le code a quitté la barre d\'adresse');
  if (shots) await page.screenshot({ path: join(shots, 'e2e-qr-2-telephone.png'), fullPage: true });
  await page.click('[data-action=approve]');
  await page.waitForSelector('#approve-message.ok');

  await desk.waitForURL(`${ORIGIN}/aerodrome`, { timeout: 10_000 });
  await desk.goto(`${ORIGIN}/compte`);
  assert((await desk.textContent('#fiche-nickname')) === 'Pilote', 'le PC est connecté sans rien taper');
  if (shots) await desk.screenshot({ path: join(shots, 'e2e-qr-3-pc-connecte.png'), fullPage: true });

  // ---- Un QR refusé ne connecte pas ----
  const pc2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'fr-FR' });
  const desk2 = await pc2.newPage();
  await desk2.goto(`${ORIGIN}/connexion`);
  const [start2] = await Promise.all([
    desk2.waitForResponse((r) => r.url().endsWith('/v1/auth/device/start')),
    desk2.click('[data-action=show-qr]'),
  ]);
  const { approveUrl } = await start2.json();
  await page.goto(approveUrl);
  await page.waitForSelector('#approve-pending:not(.cache)');
  await page.click('[data-action=deny]');
  await page.waitForSelector('#approve-message:not(.ok):not(:empty)');
  await desk2.waitForFunction(() => document.getElementById('qr-status')?.textContent?.includes('Refusé'), null, { timeout: 10_000 });
  assert(desk2.url().endsWith('/connexion'), 'le PC refusé reste sur la page de connexion');

  // ---- Un téléphone non connecté est renvoyé vers la connexion, puis revient ----
  const stranger = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, locale: 'fr-FR' });
  const sp = await stranger.newPage();
  const [start3] = await Promise.all([
    desk2.waitForResponse((r) => r.url().endsWith('/v1/auth/device/start')),
    desk2.click('[data-action=show-qr]'),
  ]);
  await sp.goto((await start3.json()).approveUrl);
  await sp.waitForSelector('#approve-login:not(.cache)');

  // Supprimer la passkey : elle ne connecte plus.
  await page.goto(`${ORIGIN}/compte`);
  await page.waitForSelector('#passkeys-list li:nth-child(2)');
  await page.click('#passkeys-list li:nth-child(2) .danger');
  await page.waitForFunction(() => document.querySelectorAll('#passkeys-list li').length === 1);
  await page.click('#passkeys-list .danger');
  await page.waitForSelector('#passkeys-empty:not(.cache)');
  await page.click('[data-action=logout]');
  await page.waitForURL(`${ORIGIN}/`);
  await page.goto(`${ORIGIN}/connexion`);
  await page.click('[data-action=passkey-login]');
  await page.waitForSelector('#login-message:not(:empty)');
  assert(page.url().endsWith('/connexion'), 'une passkey supprimée ne connecte plus');

  process.stdout.write('e2e passkeys + QR : tout est passé.\n');
} finally {
  await browser.close();
  stop();
}
