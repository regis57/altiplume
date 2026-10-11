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
// son titre et son contenu. Pas de duplication d'en-tête ni de pied de page.
const layout = readFileSync(join(root, 'src/layout.html'), 'utf8');
const pagesDir = join(root, 'src/pages');
for (const file of readdirSync(pagesDir)) {
  if (!file.endsWith('.html')) continue;
  const source = readFileSync(join(pagesDir, file), 'utf8');
  const sep = source.indexOf('\n---\n');
  const title = source.slice(0, sep).replace(/^title:\s*/, '').trim();
  const content = source.slice(sep + 5);
  const page = file.replace(/\.html$/, '');
  const html = layout
    .replaceAll('{{title}}', title)
    .replaceAll('{{page}}', page)
    .replaceAll('{{app}}', appJs)
    .replaceAll('{{theme}}', themeJs)
    .replaceAll('{{styles}}', stylesCss)
    .replace('{{content}}', content);
  writeFileSync(join(dist, file), html);
}

console.error(`client construit dans ${dist}`);
