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
