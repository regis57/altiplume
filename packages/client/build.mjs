#!/usr/bin/env node
/**
 * Construit le client : un bundle JS, la feuille de style, les pages HTML, les
 * polices. Tout est servi depuis notre domaine ; aucune ressource externe.
 */
import { build } from 'esbuild';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const watch = process.argv.includes('--watch');

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'fonts'), { recursive: true });

// Styles, images, icône.
cpSync(join(root, 'public'), dist, { recursive: true });

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
    .replace('{{content}}', content);
  writeFileSync(join(dist, file), html);
}

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

await build({
  entryPoints: [join(root, 'src/main.ts')],
  bundle: true,
  format: 'esm',
  target: ['es2022'],
  outfile: join(dist, 'app.js'),
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  legalComments: 'none',
});

console.error(`client construit dans ${dist}`);
