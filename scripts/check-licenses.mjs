#!/usr/bin/env node
/**
 * Vérifie que toute dépendance installée porte une licence autorisée.
 *
 * Le projet est sous AGPL-3.0 et ses ressources sont sous droits réservés : une
 * dépendance copyleft forte ou à licence ambiguë contaminerait la distribution ou
 * rendrait la situation juridique illisible. Mieux vaut échouer ici qu'au tribunal.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Licences acceptées pour une dépendance DE PRODUCTION, c'est-à-dire du code qui
 * part réellement dans l'image Docker et s'exécute face aux joueurs.
 */
const ALLOWED = new Set([
  '0BSD', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'BlueOak-1.0.0',
  'CC0-1.0', 'CC-BY-4.0', 'ISC', 'MIT', 'MIT-0', 'OFL-1.1', 'Python-2.0',
  'Unlicense', 'WTFPL', 'Zlib',
]);

/**
 * Tolérances supplémentaires pour une dépendance DE DÉVELOPPEMENT uniquement.
 *
 * La MPL-2.0 est un copyleft par fichier : il se déclenche à la distribution du
 * fichier concerné. Un outil de compilation ou de test n'est jamais distribué avec
 * le jeu, donc l'obligation ne naît pas. La même licence reste refusée en
 * production, où elle partirait dans l'image.
 */
const ALLOWED_DEV_ONLY = new Set([...ALLOWED, 'MPL-2.0', 'EPL-2.0', 'CDDL-1.0']);

/** Licences explicitement refusées, pour un message d'erreur utile. */
const REASONS = {
  'GPL': 'copyleft fort, incompatible avec la distribution des ressources',
  'LGPL': 'copyleft faible, complique la distribution',
  'AGPL': 'copyleft réseau d\'un tiers : à n\'introduire qu\'en connaissance de cause',
  'SSPL': 'non reconnue comme open source',
  'BUSL': 'licence source-available, usage restreint',
  'Elastic': 'licence source-available, usage restreint',
};

/** Découpe une expression SPDX en ses termes atomiques. */
function terms(expr) {
  return expr
    .replace(/[()]/g, ' ')
    .split(/\s+(?:OR|AND)\s+/i)
    .map((t) => t.trim().replace(/\+$/, ''))
    .filter(Boolean);
}

/** Une expression passe si AU MOINS un terme d'une alternative est autorisé. */
function isAllowed(expr, allowed) {
  if (!expr) return false;
  if (/\bOR\b/i.test(expr)) return terms(expr).some((t) => allowed.has(t));
  return terms(expr).every((t) => allowed.has(t));
}

/**
 * Chemins des paquets présents dans l'arbre de PRODUCTION.
 *
 * Si npm échoue, on ne suppose pas : on traite tout comme de la production, ce qui
 * est le choix strict. Un vérificateur de licences qui s'assouplit en cas d'erreur
 * ne sert à rien.
 */
function productionPackageDirs() {
  try {
    const out = execFileSync('npm', ['ls', '--omit=dev', '--all', '--parseable'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 32 * 1024 * 1024,
    });
    const dirs = new Set();
    for (const line of out.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.includes('node_modules')) dirs.add(resolve(trimmed));
    }
    return dirs;
  } catch {
    console.error('Avertissement : arbre de production illisible, contrôle strict appliqué partout.');
    return null;
  }
}

function readLicense(pkgDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
    if (pkg.private === true) return null;
    if (typeof pkg.license === 'string') return pkg.license;
    if (pkg.license?.type) return pkg.license.type;
    if (Array.isArray(pkg.licenses)) {
      return pkg.licenses.map((l) => l.type ?? l).join(' OR ');
    }
    return undefined;
  } catch {
    return null;
  }
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (name === '.bin') continue;
    if (name.startsWith('@')) {
      yield* walk(full);
      continue;
    }
    try {
      if (!statSync(full).isDirectory()) continue;
    } catch {
      continue;
    }
    yield full;
    const nested = join(full, 'node_modules');
    try {
      if (statSync(nested).isDirectory()) yield* walk(nested);
    } catch { /* pas de dépendances imbriquées */ }
  }
}

const productionDirs = productionPackageDirs();
const offenders = [];
let checked = 0;
let devOnly = 0;

for (const dir of walk('node_modules')) {
  const license = readLicense(dir);
  if (license === null) continue;
  checked += 1;

  const isProduction = productionDirs === null || productionDirs.has(resolve(dir));
  if (!isProduction) devOnly += 1;
  const allowed = isProduction ? ALLOWED : ALLOWED_DEV_ONLY;

  if (!isAllowed(license, allowed)) {
    const name = dir.replace(/^.*node_modules[/\\]/, '');
    const hint = Object.entries(REASONS).find(([k]) => (license ?? '').includes(k));
    offenders.push({
      name,
      license: license ?? '(absente)',
      scope: isProduction ? 'production' : 'développement',
      why: hint?.[1],
    });
  }
}

if (offenders.length > 0) {
  console.error(`\nLicences non autorisées (${offenders.length} sur ${checked} paquets) :\n`);
  for (const o of offenders) {
    console.error(
      `  [${o.scope}] ${o.name}  —  ${o.license}${o.why ? `  (${o.why})` : ''}`,
    );
  }
  console.error(
    '\nLicences acceptées : ' + [...ALLOWED].sort().join(', ') +
    '\nPour en ajouter une, modifiez scripts/check-licenses.mjs et expliquez pourquoi' +
    ' dans la pull request.\n',
  );
  process.exit(1);
}

console.error(
  `Licences : ${checked} paquets vérifiés (${checked - devOnly} en production,` +
  ` ${devOnly} en développement), aucun problème.`,
);
