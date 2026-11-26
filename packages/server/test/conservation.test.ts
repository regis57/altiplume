import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const lire = (chemin: string) => readFileSync(new URL(`../../../${chemin}`, import.meta.url), 'utf8');

/**
 * La page de confidentialité promettait « 7 jours » pour les journaux techniques ;
 * le réglage, lui, les garde par taille (3 fichiers de 10 Mo par conteneur) et ils
 * s'effacent à chaque mise à jour. Le 18/10, l'auteur a choisi : le texte suit le réglage.
 */
describe('la durée des journaux techniques', () => {
  const compose = lire('docker-compose.yml');
  const page = lire('packages/client/src/pages/confidentialite.html');
  const registre = lire('docs/legal/registre-traitements.md');

  it('chaque conteneur garde 3 fichiers de 10 Mo, soit les 30 Mo que disent les textes', () => {
    const options = [...compose.matchAll(/options: \{ max-size: "(\d+)m", max-file: "(\d+)" \}/g)];
    expect(options.length).toBe((compose.match(/logging:/g) ?? []).length);
    for (const [, taille, fichiers] of options) expect(Number(taille) * Number(fichiers)).toBe(30);
    expect(page).toContain('30 Mo de lignes');
    expect(page).toContain('30 MB of lines');
    expect(registre).toContain('3 fichiers de 10 Mo');
  });

  it('les textes ne promettent plus une durée que le réglage ne tient pas', () => {
    expect(page).not.toMatch(/adresses IP : 7 jours/);
    expect(page).not.toMatch(/IP addresses: 7 days/);
    expect(registre).not.toMatch(/\| 7 jours \(rotation/);
  });

  it('les conteneurs sont recréés à chaque mise à jour, ce qui efface leurs journaux', () => {
    const redeploy = lire('scripts/nas-redeploy.sh');
    expect(redeploy).toMatch(/\$COMPOSE down/);
    expect(redeploy).toMatch(/up -d --force-recreate/);
    expect(page).toContain('effacés à chaque mise à jour du jeu');
    expect(page).toContain('wiped every time the game is updated');
  });
});

/**
 * CONTRIBUTING.md disait « sept parcours » quand `npm run e2e` en jouait huit
 * (le parcours de l'éditeur, ajouté le 7 novembre, n'y était pas).
 */
describe('le nombre de parcours de bout en bout', () => {
  const NOMBRES = ['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];
  const lance = /node scripts\/e2e-[a-z-]+\.mjs/g;
  const total = (lire('package.json').match(/"e2e": "([^"]*)"/)?.[1] ?? '').match(lance)?.length ?? 0;
  const enCi = (lire('.github/workflows/ci.yml').match(lance) ?? []).length;
  const contributing = lire('CONTRIBUTING.md');

  it('CONTRIBUTING.md dit combien `npm run e2e` en joue, et combien tournent en CI', () => {
    expect(total).toBeGreaterThan(0);
    expect(contributing).toContain(`joue les ${NOMBRES[total - 1]} parcours`);
    expect(contributing).toContain(`les ${NOMBRES[enCi - 1]} de la CI, et ${NOMBRES[total - enCi - 1]}\nqui ne tournent`);
  });
});

/**
 * Le manifeste citait axe-core 4.14.0 quand le dépôt mesurait avec la 4.14.1
 * (mise à jour du 26 novembre). La version écrite est celle de package.json.
 */
describe("la version d'axe-core citée dans le manifeste", () => {
  const version = (JSON.parse(lire('package.json')) as { devDependencies: Record<string, string> }).devDependencies['axe-core'];
  const citees = [...lire('docs/SECURITE.md').matchAll(/axe-core(?:\]\([^)]*\))? (\d+\.\d+\.\d+)/g)].map((m) => m[1]);

  it('docs/SECURITE.md nomme la version installée, partout où il en nomme une', () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(citees.length).toBeGreaterThan(0);
    for (const citee of citees) expect(citee).toBe(version);
  });
});
