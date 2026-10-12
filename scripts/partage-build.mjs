#!/usr/bin/env node
/**
 * Les cartes de partage : l'image qui s'affiche quand un lien Altiplume est collé
 * dans LinkedIn, WhatsApp, Signal, Mastodon ou iMessage. Une par langue.
 *
 * Elles sont tirées de la vraie scène du jeu — même dessin, mêmes pixels — au
 * crépuscule, l'aérodrome tout restauré, l'enseigne du hangar au nom d'Altiplume.
 * Le texte vit dans le ciel ; en haut, la bande à chevrons du courrier aérien ; à
 * droite, l'étiquette bleue « PAR AVION » de l'Union postale universelle — en
 * français dans toutes les langues, comme sur les vraies, avec la traduction
 * dessous pour la carte anglaise.
 *
 *   npm run build && node scripts/partage-build.mjs
 *
 * Écrit packages/client/public/partage/altiplume-{fr,en}.png (1200 × 630), à
 * relancer quand la scène change. Les images sont commitées : la construction de
 * l'image Docker n'a pas de navigateur, et n'en a pas besoin.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { chromium } from 'playwright';

const PORT = 3992;
const ORIGIN = `http://localhost:${PORT}`;
const OUT = 'packages/client/public/partage';
mkdirSync(OUT, { recursive: true });
const dbPath = join(mkdtempSync(join(tmpdir(), 'altiplume-partage-')), 'jeu.db');

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

const TEXTS = {
  fr: {
    tagline: 'Un petit aérodrome,<br>quelque part dans les nuages.',
    sub: 'Jeu web cozy · gratuit · sans mot de passe',
    label: ['PAR AVION'],
  },
  en: {
    tagline: 'A small aerodrome,<br>somewhere in the clouds.',
    sub: 'A cozy web game · free · no password',
    label: ['PAR AVION', 'BY AIR MAIL'],
  },
};

function card(lang, sceneDataUrl) {
  const t = TEXTS[lang];
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
@font-face { font-family: 'Pixelify Sans'; font-weight: 600; src: url('${ORIGIN}/fonts/pixelify-sans-latin-600-normal.woff2') format('woff2'); }
@font-face { font-family: 'Atkinson Hyperlegible'; font-weight: 700; src: url('${ORIGIN}/fonts/atkinson-hyperlegible-latin-700-normal.woff2') format('woff2'); }
@font-face { font-family: 'Atkinson Hyperlegible'; font-weight: 400; src: url('${ORIGIN}/fonts/atkinson-hyperlegible-latin-400-normal.woff2') format('woff2'); }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
body { position: relative; background: var(--ciel, #6b6788); }
.scene { position: absolute; left: 0; bottom: 0; width: 1200px; image-rendering: pixelated; display: block; clip-path: inset(3px 0 0 0); }
.chevrons { position: absolute; left: 0; top: 0; width: 1200px; height: 14px;
  background: repeating-linear-gradient(-45deg, #b23a2f 0 14px, #f6f1e7 14px 28px, #2f4f7a 28px 42px, #f6f1e7 42px 56px); }
.texte { position: absolute; left: 64px; top: 54px; width: 900px; color: #f6f1e7; }
.marque { display: flex; align-items: center; gap: 22px; font-family: 'Pixelify Sans'; font-weight: 600; font-size: 96px; line-height: 1;
  letter-spacing: 0.01em; text-shadow: 5px 5px 0 #2a2f33; }
.marque svg { width: 84px; height: 84px; filter: drop-shadow(5px 5px 0 #2a2f33); }
.px-k { fill: #f6f1e7; } .px-l { fill: #e6c67a; } .px-r { fill: #e9796c; }
.tagline { margin: 24px 0 0; font-family: 'Atkinson Hyperlegible'; font-weight: 700; font-size: 46px; line-height: 1.22; text-shadow: 3px 3px 0 #2a2f33; }
.sub { margin: 16px 0 0; font-family: 'Atkinson Hyperlegible'; font-weight: 400; font-size: 27px; color: #f0e3d0; text-shadow: 2px 2px 0 #2a2f33; }
.etiquette { position: absolute; right: 230px; top: 46px; transform: rotate(-5deg); background: #2f4f7a; color: #fff;
  padding: 14px 26px 12px; border: 4px solid #fff; outline: 4px solid #2f4f7a; box-shadow: 6px 6px 0 rgba(42, 47, 51, 0.55);
  font-family: 'Atkinson Hyperlegible'; font-weight: 700; text-align: center; letter-spacing: 0.08em; }
.etiquette .l1 { font-size: 34px; line-height: 1.05; }
.etiquette .l2 { font-size: 21px; line-height: 1.2; margin-top: 4px; letter-spacing: 0.06em; }
</style></head><body>
<img class="scene" id="scene" src="${sceneDataUrl}" alt="">
<div class="chevrons"></div>
<div class="texte">
  <div class="marque"><svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${PLUME}</svg><span>Altiplume</span></div>
  <p class="tagline">${t.tagline}</p>
  <p class="sub">${t.sub}</p>
</div>
<div class="etiquette"><div class="l1">${t.label[0]}</div>${t.label[1] ? `<div class="l2">${t.label[1]}</div>` : ''}</div>
<script>
  // Le ciel de la carte prolonge celui de la scène : on lit sa couleur dans l'image.
  const img = document.getElementById('scene');
  const paint = () => {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const [r, v, b] = g.getImageData(12, 12, 1, 1).data;
    document.body.style.setProperty('--ciel', 'rgb(' + r + ',' + v + ',' + b + ')');
    document.body.dataset.pret = '1';
  };
  if (img.complete) paint(); else img.addEventListener('load', paint);
</script>
</body></html>`;
}

let PLUME = '';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
try {
  // 1. Une compagnie entièrement restaurée, l'enseigne au nom d'Altiplume.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fr-FR', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${ORIGIN}/`);
  PLUME = await page.$eval('.marque svg', (s) => s.innerHTML);
  await page.fill('#email', 'partage@example.test');
  await page.fill('#nickname', 'Facteur');
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
  const db = new DatabaseSync(dbPath);
  db.exec("UPDATE companies SET name = 'Altiplume'");
  db.exec("UPDATE company_zones SET level = 3 WHERE zone IN ('runway', 'hangar')");
  db.exec("UPDATE company_zones SET level = 2 WHERE zone = 'ponton'");
  db.exec("INSERT OR IGNORE INTO company_decorations (company_id, decoration, placed_at) SELECT c.id, d.id, 0 FROM companies c, (SELECT 'd-fleurs' AS id UNION SELECT 'd-banc' UNION SELECT 'd-manche' UNION SELECT 'd-enseigne' UNION SELECT 'd-drapeau' UNION SELECT 'd-boite' UNION SELECT 'd-lanterne' UNION SELECT 'd-pommier' UNION SELECT 'd-cafe' UNION SELECT 'd-peinture') d");
  db.exec("INSERT INTO company_planes (id, company_id, model, wear, acquired_at) SELECT 'sterne-1', id, 'sterne', 0, 0 FROM companies");
  db.close();
  await page.reload();
  await page.waitForSelector('#aerodrome:not(.cache)');
  await page.evaluate(() => { document.getElementById('jeu').dataset.moment = 'crepuscule'; });
  // La scène à 1200 pixels de large exactement : le dessin est vectoriel, net à toute taille.
  const box = await page.locator('.scene svg').first().boundingBox();
  await page.setViewportSize({ width: 1280, height: 900 });
  const scale = 1200 / box.width;
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fr-FR', deviceScaleFactor: scale, storageState: await ctx.storageState() });
  const page2 = await ctx2.newPage();
  await page2.goto(`${ORIGIN}/aerodrome`);
  await page2.waitForSelector('#aerodrome:not(.cache)');
  await page2.evaluate(() => { document.getElementById('jeu').dataset.moment = 'crepuscule'; });
  await page2.waitForTimeout(300);
  const scene = await page2.locator('.scene svg').first().screenshot({ animations: 'disabled' });
  const sceneUrl = `data:image/png;base64,${scene.toString('base64')}`;

  // 2. Une carte par langue.
  const cardCtx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const cardPage = await cardCtx.newPage();
  for (const lang of ['fr', 'en']) {
    await cardPage.route(`${ORIGIN}/__carte`, (route) => route.fulfill({ contentType: 'text/html', body: card(lang, sceneUrl) }));
    await cardPage.goto(`${ORIGIN}/__carte`);
    await cardPage.waitForSelector('body[data-pret="1"]');
    await cardPage.evaluate(async () => {
      await Promise.all(['600 96px "Pixelify Sans"', '700 42px "Atkinson Hyperlegible"', '400 27px "Atkinson Hyperlegible"'].map((f) => document.fonts.load(f)));
      await document.fonts.ready;
    });
    const file = join(OUT, `altiplume-${lang}.png`);
    await cardPage.screenshot({ path: file, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    await cardPage.unroute(`${ORIGIN}/__carte`);
    process.stdout.write(`${file} — ${Math.round(statSync(file).size / 1024)} Ko\n`);
  }
} finally {
  await browser.close();
  stop();
}
