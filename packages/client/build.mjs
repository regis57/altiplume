#!/usr/bin/env node
/**
 * Construit le client : un bundle JS, la feuille de style, les pages HTML, les
 * polices. Tout est servi depuis notre domaine ; aucune ressource externe.
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const watch = process.argv.includes('--watch');

// Ce qui est construit, exactement. La version vient du dépôt (package.json), le
// commit et la date de la chaîne de publication, qui les passe en arguments de
// construction de l'image. En local, personne ne prétend être une version publiée :
// c'est « dev ».
const version = process.env.APP_VERSION || JSON.parse(readFileSync(join(root, '..', '..', 'package.json'), 'utf8')).version;
const revision = process.env.APP_REVISION || 'dev';
const builtAt = process.env.APP_BUILT_AT || new Date().toISOString();

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'fonts'), { recursive: true });

// Styles, images, icône.
cpSync(join(root, 'public'), dist, { recursive: true });

// Polices : seules les graisses utilisées, sous-ensemble latin.
const fonts = [
  ['@fontsource/atkinson-hyperlegible/files', /atkinson-hyperlegible-latin-(400|700)-normal\.woff2$/],
  ['@fontsource/pixelify-sans/files', /pixelify-sans-latin-(400|600)-normal\.woff2$/],
];
for (const [pkg, pattern] of fonts) {
  const dir = join(root, '..', '..', 'node_modules', pkg);
  for (const file of readdirSync(dir)) {
    if (pattern.test(file)) cpSync(join(dir, file), join(dist, 'fonts', file));
  }
}

const common = { bundle: true, target: ['es2022'], minify: !watch, sourcemap: watch ? 'inline' : false, legalComments: 'none' };
await build({ ...common, entryPoints: [join(root, 'src/main.ts')], format: 'esm', outfile: join(dist, 'app.js') });
// Le script de thème est classique (pas un module) : il doit s'exécuter avant le rendu.
await build({ ...common, entryPoints: [join(root, 'src/theme.ts')], format: 'iife', outfile: join(dist, 'theme.js') });
// Le service worker garde un nom fixe : le navigateur le redemande à chaque visite (no-cache côté serveur).
await build({ ...common, entryPoints: [join(root, 'src/sw.ts')], format: 'iife', outfile: join(dist, 'sw.js') });


// Empreinte dans le nom : chaque version a un nom neuf, le cache ne peut pas se
// tromper. Le serveur sert ces fichiers en « immutable » et le HTML sans cache.
function fingerprint(file) {
  const hash = createHash('sha256').update(readFileSync(join(dist, file))).digest('hex').slice(0, 8);
  const named = file.replace(/\.(js|css)$/, `.${hash}.$1`);
  renameSync(join(dist, file), join(dist, named));
  return `/${named}`;
}
const appJs = fingerprint('app.js');
const themeJs = fingerprint('theme.js');
const stylesCss = fingerprint('styles.css');

// Pages : un gabarit commun, et pour chaque page un fichier qui ne contient que
// son en-tête (titre français, titre anglais) et son contenu. Pas de duplication
// d'en-tête ni de pied de page.
//
// Chaque page sort en deux exemplaires : `page.html` (en-tête français) et
// `page.en.html` (en-tête anglais). Le contenu est le même — la langue de lecture
// se choisit dans le navigateur. Ce qui change, c'est ce que voient les robots qui
// ne lisent pas de JavaScript : ceux de LinkedIn, WhatsApp, Signal, Mastodon ou
// iMessage, qui fabriquent l'aperçu d'un lien partagé. `/aide?lang=en` leur sert
// l'exemplaire anglais, avec sa carte anglaise.
const origin = (process.env.PUBLIC_ORIGIN || 'https://altiplume.com').replace(/\/$/, '');
const SITE = {
  fr: {
    description: "Un petit aérodrome postal des années 1930, dans un monde inventé. Jeu web cozy, gratuit, sans mot de passe.",
    ogLocale: 'fr_FR', ogLocaleAlt: 'en_GB',
    image: '/partage/altiplume-fr.png',
    imageAlt: "Un aérodrome en herbe au crépuscule, un hangar vert, un biplan sur la piste. « Altiplume — un petit aérodrome, quelque part dans les nuages. »",
  },
  en: {
    description: 'A little 1930s airmail aerodrome in an invented world. A cozy web game — free, no password.',
    ogLocale: 'en_GB', ogLocaleAlt: 'fr_FR',
    image: '/partage/altiplume-en.png',
    imageAlt: 'A grass airfield at dusk, a green hangar, a biplane on the runway. "Altiplume — a small aerodrome, somewhere in the clouds."',
  },
};
const escapeAttr = (v) => v.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const layout = readFileSync(join(root, 'src/layout.html'), 'utf8');
const pagesDir = join(root, 'src/pages');
for (const file of readdirSync(pagesDir)) {
  if (!file.endsWith('.html')) continue;
  const source = readFileSync(join(pagesDir, file), 'utf8');
  const sep = source.indexOf('\n---\n');
  const meta = Object.fromEntries(source.slice(0, sep).split('\n').map((line) => {
    const i = line.indexOf(':');
    return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  }));
  if (!meta.title || !meta['title-en']) throw new Error(`${file} : il faut « title: » et « title-en: »`);
  const content = source.slice(sep + 5);
  const page = file.replace(/\.html$/, '');
  const path = page === 'index' ? '/' : `/${page}`;
  for (const lang of ['fr', 'en']) {
    const site = SITE[lang];
    const title = lang === 'fr' ? meta.title : meta['title-en'];
    const url = `${origin}${path}${lang === 'en' ? '?lang=en' : ''}`;
    const html = layout
      .replaceAll('{{lang}}', lang)
      .replaceAll('{{title}}', escapeAttr(title))
      .replaceAll('{{titleFr}}', escapeAttr(meta.title))
      .replaceAll('{{titleEn}}', escapeAttr(meta['title-en']))
      .replaceAll('{{description}}', escapeAttr(site.description))
      .replaceAll('{{url}}', url)
      .replaceAll('{{urlFr}}', `${origin}${path}`)
      .replaceAll('{{urlEn}}', `${origin}${path}?lang=en`)
      .replaceAll('{{ogLocale}}', site.ogLocale)
      .replaceAll('{{ogLocaleAlt}}', site.ogLocaleAlt)
      .replaceAll('{{ogImage}}', `${origin}${site.image}`)
      .replaceAll('{{ogImageAlt}}', escapeAttr(site.imageAlt))
      .replaceAll('{{page}}', page)
      .replaceAll('{{app}}', appJs)
      .replaceAll('{{theme}}', themeJs)
      .replaceAll('{{styles}}', stylesCss)
      .replace('{{content}}', content)
      // Après le contenu : une page peut citer la version elle aussi.
      .replaceAll('{{version}}', version)
      .replaceAll('{{revision}}', revision)
      .replaceAll('{{builtAt}}', builtAt)
      .replaceAll('{{builtOn}}', builtAt.slice(0, 10));
    writeFileSync(join(dist, lang === 'fr' ? file : `${page}.en.html`), html);
  }
}

console.error(`client construit dans ${dist} — v${version} (${revision}, ${builtAt.slice(0, 10)})`);
