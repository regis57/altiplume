import { describe, expect, it } from 'vitest';
import { canAfford, planeOffer, type OfferCompany, type OfferWorld } from '../src/offre.ts';

/** Les avions et les zones du monde, tels que le client les reçoit (noms en français). */
const world: OfferWorld = {
  planes: [
    { id: 'grive', runway: 'short' }, { id: 'martinet', runway: 'medium' }, { id: 'heron', runway: 'long' },
    { id: 'sterne', runway: 'water' }, { id: 'pic', runway: 'clearing' },
  ],
  zones: [
    { id: 'runway', levels: [{ level: 1, name: 'Pré fauché', runway: 'short' }, { level: 2, name: 'Piste roulée', runway: 'medium' }, { level: 3, name: 'Grande piste', runway: 'long' }] },
    { id: 'hangar', levels: [{ level: 1, name: 'Porte de travers', planes: 1 }, { level: 2, name: 'Porte neuve, établi', planes: 2 }, { level: 3, name: 'Atelier', planes: 3 }] },
    { id: 'ponton', levels: [{ level: 1, name: 'La rive', seaplanes: 0 }, { level: 2, name: 'Ponton sur la rivière', seaplanes: 1 }] },
  ],
};

/** Le 16 octobre : 818 F, une Grive, tout au premier niveau. */
const alizee: OfferCompany = { francs: 818, planes: [{ model: 'grive' }], zones: {} };

describe("la carte d'un avion dit ce qu'il faut, avant le clic", () => {
  it('le Héron à 5 600 F : ni l\'argent, ni la place, ni la piste ; achat grisé', () => {
    expect(planeOffer(world, alizee, 'heron', 5600)).toEqual({
      seaplane: false, money: false, place: false, runway: false, runwayName: 'Grande piste', canBuy: false,
    });
  });

  it("la piste avertit sans bloquer : l'argent et la place suffisent pour acheter", () => {
    const riche = { ...alizee, francs: 6000, zones: { hangar: 2 } };
    expect(planeOffer(world, riche, 'heron', 5600)).toMatchObject({ money: true, place: true, runway: false, canBuy: true });
  });

  it('la Grive d\'occasion : place au hangar à deux places, piste déjà bonne', () => {
    expect(planeOffer(world, { ...alizee, francs: 1500, zones: { hangar: 2 } }, 'grive', 1500))
      .toEqual({ seaplane: false, money: true, place: true, runway: true, runwayName: 'Pré fauché', canBuy: true });
  });

  it("l'hydravion compte les places au ponton, pas au hangar, et ne demande pas de piste", () => {
    expect(planeOffer(world, { ...alizee, francs: 5000 }, 'sterne', 3850)).toMatchObject({ seaplane: true, place: false, runwayName: null, canBuy: false });
    expect(planeOffer(world, { ...alizee, francs: 5000, zones: { ponton: 2 } }, 'sterne', 3850)).toMatchObject({ place: true, runway: true, canBuy: true });
  });
});

describe('la fête et les imprévus payants : grisés sans les francs, comme le serveur', () => {
  it("« Y aller · 15 F » avec 9 F en caisse : non ; avec 15 F : oui", () => {
    expect(canAfford(9, -15)).toBe(false);
    expect(canAfford(15, -15)).toBe(true);
  });

  it("« Changer la bougie (12 F) » avec 9 F : non ; un choix gratuit ou un gain : toujours", () => {
    expect(canAfford(9, -12)).toBe(false);
    expect(canAfford(0, undefined)).toBe(true);
    expect(canAfford(0, 20)).toBe(true);
  });
});
