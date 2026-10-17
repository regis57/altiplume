#!/usr/bin/env node
/**
 * L'accessibilité, mesurée dans un vrai navigateur.
 *
 * La conception promet le niveau AA de WCAG 2.2 (§ 9) ; jusqu'ici, le manifeste de
 * sécurité disait « non effectué (mesure) ». Ce parcours fait la mesure que les
 * outils savent faire : axe-core (le moteur d'axe DevTools) passe sur chaque page,
 * en français et en anglais, sur PC (1440×900) et sur téléphone (390×844), en thème
 * clair et en thème sombre, et le test échoue à la moindre infraction aux règles
 * WCAG 2.0, 2.1 et 2.2 de niveau A et AA — contrastes, étiquettes, structure des
 * titres, noms des commandes, langue déclarée, cibles tactiles…
 *
 * Les pages publiques sont celles du plan du site ; les pages privées sont visitées
 * avec un compte créé pour l'occasion : la vérification du lien, l'aérodrome d'une
 * compagnie fondée, le compte. Ce qu'un outil ne mesure pas — la lecture réelle au
 * lecteur d'écran, le jeu au clavier seul par une personne concernée — reste à faire
 * avec des personnes, et le manifeste le dit.
 *
 *   node scripts/e2e-accessibilite.mjs [dossier-rapport]
 *
 * Le dossier reçoit, s'il est donné, un `rapport.json` avec le détail de chaque page.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 3997;
const ORIGIN = `http://localhost:${PORT}`;
const rapport = process.argv[2] ?? null;
if (rapport) mkdirSync(rapport, { recursive: true });
const dbPath = join(mkdtempSync(join(tmpdir(), 'altiplume-accessibilite-')), 'jeu.db');

/** Le moteur, lu dans le paquet installé : rien n'est téléchargé pendant le test. */
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

/** Les règles retenues : WCAG 2.0, 2.1 et 2.2, niveaux A et AA — ce que la conception promet. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Les écrans mesurés. */
const ECRANS = [
  { nom: 'PC', viewport: { width: 1440, height: 900 } },
  { nom: 'téléphone', viewport: { width: 390, height: 844 } },
];

/** Les deux thèmes : celui que le système demande, le jeu le suit. */
const THEMES = ['light', 'dark'];

/** Les pages publiques, celles du plan du site, dans le même ordre. */
const PUBLIQUES = ['/', '/aide', '/contact', '/confidentialite', '/cgu', '/mentions-legales', '/connexion'];

/** Un pseudonyme par compte créé — quatre femmes, quatre hommes. */
const PSEUDOS = {
  'PC/light/fr': 'Aline', 'PC/light/en': 'Bastien', 'PC/dark/fr': 'Claire', 'PC/dark/en': 'Denis',
  'téléphone/light/fr': 'Élise', 'téléphone/light/en': 'Fabien', 'téléphone/dark/fr': 'Gaëlle', 'téléphone/dark/en': 'Hugo',
};

function assert(cond, message) { if (!cond) throw new Error(`échec : ${message}`); }

const server = spawn(process.execPath, ['--no-warnings=ExperimentalWarning', 'packages/server/src/server.ts'], {
  // Le serveur lit l'adresse transmise par un mandataire, comme derrière le tunnel :
  // chaque compte simulé a la sienne, et le budget de requêtes par adresse (120 par
  // minute sur l'API) est celui d'un vrai joueur, pas celui de huit à la suite.
  env: { ...process.env, NODE_ENV: 'development', PORT: String(PORT), PUBLIC_ORIGIN: ORIGIN, DATABASE_PATH: dbPath, TRUST_PROXY: '1' },
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

/**
 * Passe axe sur la page telle qu'elle est affichée. Le moteur est injecté par le
 * débogueur du navigateur, pas par la page : la politique de sécurité du contenu
 * (`script-src 'self'`, Trusted Types) reste celle de la production.
 */
async function mesurer(page) {
  // On mesure la page posée : une animation en cours (le cachet qui se tamponne, par
  // exemple) fausserait la lecture des couleurs. Les animations sans fin de la scène
  // (nuages, fumée, flocons) ne touchent pas au texte ; on ne les attend pas.
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter((a) => a.effect?.getTiming().iterations !== Infinity)
    .map((a) => a.finished.catch(() => null))));
  await page.evaluate(axeSource);
  return page.evaluate(async (tags) => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations', 'passes', 'incomplete'] });
    const resume = (liste) => liste.map((x) => ({ regle: x.id, impact: x.impact ?? null, aide: x.help, noeuds: x.nodes.map((n) => n.target.join(' ')) }));
    return { violations: resume(r.violations), passes: r.passes.length, incomplets: resume(r.incomplete) };
  }, TAGS);
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
const resultats = [];
try {
  for (const ecran of ECRANS) for (const theme of THEMES) {
    for (const lang of ['fr', 'en']) {
      // Un contexte neuf par langue, par écran et par thème : rien ne traîne d'une
      // mesure à l'autre (ni la langue retenue, ni la session).
      const ctx = await browser.newContext({
        viewport: ecran.viewport, colorScheme: theme, locale: lang === 'fr' ? 'fr-FR' : 'en-GB',
        extraHTTPHeaders: { 'x-forwarded-for': `10.20.0.${resultats.length + 1}` },
      });
      const page = await ctx.newPage();
      page.on('pageerror', (e) => { throw new Error(`erreur de page : ${e.message}`); });
      const visiter = async (path, attendre) => {
        const url = new URL(path, ORIGIN);
        url.searchParams.set('lang', lang);
        await page.goto(url.toString());
        if (attendre) await page.waitForSelector(attendre);
        const langue = await page.evaluate(() => document.documentElement.lang);
        assert(langue === lang, `${path} se déclare en « ${lang} » (lu : « ${langue} »)`);
        const mesure = await mesurer(page);
        resultats.push({ ecran: ecran.nom, theme, lang, page: path.replace(/\?.*$/, ''), ...mesure });
      };

      for (const path of PUBLIQUES) await visiter(path);

      // Un compte par langue, par écran et par thème, pour voir les pages qu'on ne voit
      // que connecté. Les pseudonymes sont tous différents : le jeu refuse un doublon.
      const compte = PSEUDOS[`${ecran.nom}/${theme}/${lang}`];
      await page.goto(`${ORIGIN}/?lang=${lang}`);
      await page.fill('#email', `${compte.normalize('NFD').replace(/[^a-z]/gi, '').toLowerCase()}@example.test`);
      await page.fill('#nickname', compte);
      await page.check('#age'); await page.check('#terms');
      await page.click('#signup button[type=submit]');
      await page.waitForFunction(() => [...document.querySelectorAll('#signup-message, #email-erreur, #nickname-erreur')].some((e) => e.textContent.trim() !== ''));
      const inscription = await page.evaluate(() => ({
        ok: document.querySelector('#signup-message').classList.contains('ok'),
        texte: [...document.querySelectorAll('#signup-message, #email-erreur, #nickname-erreur')].map((e) => e.textContent.trim()).filter(Boolean).join(' / '),
      }));
      assert(inscription.ok, `l'inscription de ${compte} est acceptée (${inscription.texte})`);
      // La page d'inscription, une fois le lien envoyé : son message compte aussi.
      resultats.push({ ecran: ecran.nom, theme, lang, page: '/ (lien envoyé)', ...(await mesurer(page)) });
      const jeton = await lastLink();
      await visiter(`/verifier?jeton=${encodeURIComponent(jeton)}`, '#verify button[type=submit]');
      await page.click('#verify button[type=submit]');
      await page.waitForURL(`${ORIGIN}/aerodrome`);
      await page.waitForSelector('.choix-nom');
      resultats.push({ ecran: ecran.nom, theme, lang, page: '/aerodrome (fondation)', ...(await mesurer(page)) });
      await page.fill('#nom-perso', `${lang === 'fr' ? 'Compagnie' : 'Company'} ${compte}`);
      await page.click('#fonder button[type=submit]');
      await page.waitForSelector('#aerodrome:not(.cache)');
      resultats.push({ ecran: ecran.nom, theme, lang, page: '/aerodrome', ...(await mesurer(page)) });
      await visiter('/compte', '#fiche-email');
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  stop();
}

if (rapport) writeFileSync(join(rapport, 'rapport.json'), JSON.stringify(resultats, null, 2));

const violations = resultats.filter((r) => r.violations.length);
for (const r of violations) {
  for (const v of r.violations) {
    process.stderr.write(`${r.ecran}, ${r.theme === 'dark' ? 'sombre' : 'clair'}, ${r.lang}, ${r.page} : ${v.regle} (${v.impact ?? 'sans gravité'}) — ${v.aide}\n  ${v.noeuds.join('\n  ')}\n`);
  }
}
const incomplets = resultats.reduce((n, r) => n + r.incomplets.length, 0);
const passes = resultats.reduce((n, r) => n + r.passes, 0);
const pages = new Set(resultats.map((r) => r.page)).size;
assert(violations.length === 0, `${violations.reduce((n, r) => n + r.violations.length, 0)} infraction(s) WCAG sur ${violations.length} mesure(s)`);
process.stdout.write(`e2e accessibilité : ${resultats.length} mesures (${pages} pages × 2 langues × ${ECRANS.length} écrans × ${THEMES.length} thèmes), 0 infraction WCAG 2.2 AA, ${passes} règles satisfaites, ${incomplets} points à vérifier à la main.\n`);
