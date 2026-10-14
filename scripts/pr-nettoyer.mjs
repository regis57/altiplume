#!/usr/bin/env node
/**
 * Nettoie les descriptions de PR : retire la signature d'outil collée en bas.
 *
 *   node scripts/pr-nettoyer.mjs --pr 103 [--appliquer]
 *   node scripts/pr-nettoyer.mjs --toutes [--appliquer]
 *
 * Sans `--appliquer`, rien n'est écrit : le script liste seulement ce qui changerait.
 * Il lit `GITHUB_TOKEN`, `GITHUB_REPOSITORY` et `GITHUB_API_URL` dans l'environnement
 * (fournis par le workflow `description-pr`) et ne modifie qu'une chose : le champ `body` d'une PR.
 */
import { appendFileSync } from 'node:fs';
import { retirerPiedDePage } from './pr-pied-de-page.mjs';

const args = process.argv.slice(2);
const appliquer = args.includes('--appliquer');
const toutes = args.includes('--toutes');
const iPr = args.indexOf('--pr');
const numero = iPr >= 0 ? Number(args[iPr + 1]) : null;

const jeton = process.env.GITHUB_TOKEN;
const depot = process.env.GITHUB_REPOSITORY;
if (!jeton || !/^[\w.-]+\/[\w.-]+$/.test(depot ?? '')) {
  console.error('GITHUB_TOKEN et GITHUB_REPOSITORY (proprietaire/depot) sont requis.');
  process.exit(2);
}
if (toutes === (numero !== null) || (numero !== null && !Number.isInteger(numero))) {
  console.error('Usage : --pr <numero> | --toutes   [--appliquer]');
  process.exit(2);
}

const API = `${process.env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${depot}`;
async function appel(url, init = {}) {
  const r = await fetch(url, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${jeton}`,
      'x-github-api-version': '2022-11-28',
      'user-agent': 'altiplume-description-pr',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  if (!r.ok) throw new Error(`${init.method ?? 'GET'} ${url} → ${r.status}`);
  return r.json();
}

async function* toutesLesPr() {
  for (let page = 1; ; page++) {
    const lot = await appel(`${API}/pulls?state=all&per_page=100&page=${page}`);
    yield* lot;
    if (lot.length < 100) return;
  }
}

const lignesResume = [];
let changees = 0;
let examinees = 0;

async function traiter(pr) {
  examinees++;
  const avant = pr.body ?? '';
  const apres = retirerPiedDePage(avant);
  if (apres === avant) return;
  changees++;
  lignesResume.push(`- #${pr.number} ${appliquer ? 'nettoyée' : 'à nettoyer'}`);
  process.stdout.write(`#${pr.number} : ${appliquer ? 'description réécrite' : 'serait réécrite'}\n`);
  if (appliquer) await appel(`${API}/pulls/${pr.number}`, { method: 'PATCH', body: JSON.stringify({ body: apres }) });
}

if (toutes) for await (const pr of toutesLesPr()) await traiter(pr);
else await traiter(await appel(`${API}/pulls/${numero}`));

const bilan = `${examinees} PR examinée(s), ${changees} ${appliquer ? 'nettoyée(s)' : 'à nettoyer (simulation : rien n\'a été écrit)'}.`;
process.stdout.write(`${bilan}\n`);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Descriptions de PR\n\n${bilan}\n\n${lignesResume.join('\n')}\n`);
}
