import { describe, expect, it } from 'vitest';
import { drawCards, WAITING_WEIGHT } from '../src/game/sim.ts';
import { makeRng } from '../src/sim/rng.ts';
import { findCard, findPlane, regionDestinations } from '../src/world/index.ts';

/**
 * L'escale attend sa lettre : une escale qui n'a jamais reçu de courrier voit ses
 * contrats sortir plus souvent, sans rien changer à la part des imprévus et des
 * occasions. Le cas réel du 13 octobre : cinq escales des Vallées livrées sur six,
 * il ne manque que Lanterne-du-Val.
 */
const GRIVE = findPlane('grive')!;
const FLEET = { planes: [GRIVE], pilots: 1, reach: 1 };
const VALLEE = regionDestinations('brume').map((d) => `s-${d.id}`);
const SANS_LANTERNE = VALLEE.filter((s) => s !== 's-lanterne-du-val');
const TIRAGES = 6000;

function compter(album: readonly string[]) {
  const n = { lanterne: 0, contrats: 0, autres: 0, jours: 0 };
  for (let seed = 0; seed < TIRAGES; seed += 1) {
    const cartes = drawCards(makeRng(seed), [], 1, 3, ['brume'], ['s-fondation', ...album], 'automne', FLEET).map((id) => findCard(id)!);
    if (cartes.some((c) => c.kind === 'contract' && c.destination === 'lanterne-du-val')) n.jours += 1;
    for (const c of cartes) {
      if (c.kind === 'contract') { n.contrats += 1; if (c.destination === 'lanterne-du-val') n.lanterne += 1; } else n.autres += 1;
    }
  }
  return n;
}

describe("l'escale attend sa lettre", () => {
  it('vaut trois', () => {
    expect(WAITING_WEIGHT).toBe(3);
  });

  it("la dernière escale de la vallée sort bien plus souvent quand elle est la seule à attendre", () => {
    const sansAttente = compter(VALLEE);        // tout est livré : personne n'attend
    const attente = compter(SANS_LANTERNE);     // Lanterne-du-Val attend sa lettre
    const partAvant = sansAttente.lanterne / sansAttente.contrats;
    const partApres = attente.lanterne / attente.contrats;
    expect(partApres / partAvant).toBeGreaterThan(2);
    // Le cas réel : un tirage sur quatre la proposait ; c'est maintenant bien plus d'un sur trois.
    expect(attente.jours / TIRAGES).toBeGreaterThan(0.35);
    expect(sansAttente.jours / TIRAGES).toBeLessThan(0.3);
  });

  it("ne change ni la part des imprévus et des occasions, ni le nombre de cartes", () => {
    const sansAttente = compter(VALLEE);
    const attente = compter(SANS_LANTERNE);
    const total = 3 * TIRAGES;
    expect(sansAttente.contrats + sansAttente.autres).toBe(total);
    expect(attente.contrats + attente.autres).toBe(total);
    // Même part d'imprévus et d'occasions, au bruit du hasard près.
    expect(Math.abs(attente.autres - sansAttente.autres) / total).toBeLessThan(0.02);
  });

  it("le premier jour, quand toutes les escales attendent, le tirage est exactement celui d'avant", () => {
    for (let seed = 0; seed < 300; seed += 1) {
      const sansAlbum = drawCards(makeRng(seed), [], 1, 3, ['brume'], [], 'automne', FLEET);
      const fondation = drawCards(makeRng(seed), [], 1, 3, ['brume'], ['s-fondation'], 'automne', FLEET);
      expect(fondation).toEqual(sansAlbum);
    }
  });

  it("ne réveille pas une escale d'une région fermée", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const cartes = drawCards(makeRng(seed), [], 1, 3, ['brume'], SANS_LANTERNE, 'automne', FLEET).map((id) => findCard(id)!);
      for (const c of cartes) if (c.kind === 'contract') expect(regionDestinations('brume').map((d) => d.id)).toContain(c.destination);
    }
  });
});
