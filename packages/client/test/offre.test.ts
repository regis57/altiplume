import { describe, expect, it } from 'vitest';
import { awaitedPilot, canAfford, HAND_SIZE, planeOffer, secondPlaneHint, type OfferCompany, type OfferWorld } from '../src/offre.ts';

/** Les avions et les zones du monde, tels que le client les reçoit (noms en français). */
const world: OfferWorld = {
  planes: [
    { id: 'grive', runway: 'short' }, { id: 'martinet', runway: 'medium' }, { id: 'heron', runway: 'long' },
    { id: 'sterne', runway: 'water' }, { id: 'pic', runway: 'clearing' },
  ],
  cards: [
    { id: 'o-grive', offer: { type: 'plane' } }, { id: 'o-pilote', offer: { type: 'pilot' } }, { id: 'o-pilote-foret', offer: { type: 'pilot' } },
    { id: 'o-fete', offer: { type: 'fete' } }, { id: 'c-lettres-pont' }, { id: 'c-farine' }, { id: 'c-semences' }, { id: 'c-pressoir' },
  ],
  zones: [
    { id: 'runway', levels: [{ level: 1, name: 'Pré fauché', runway: 'short' }, { level: 2, name: 'Piste roulée', runway: 'medium' }, { level: 3, name: 'Grande piste', runway: 'long' }] },
    { id: 'hangar', levels: [{ level: 1, name: 'Porte de travers', planes: 1 }, { level: 2, name: 'Porte neuve, établi', planes: 2 }, { level: 3, name: 'Atelier', planes: 3 }] },
    { id: 'ponton', levels: [{ level: 1, name: 'La rive', seaplanes: 0 }, { level: 2, name: 'Ponton sur la rivière', seaplanes: 1 }] },
  ],
};

/** Le 16 octobre : 818 F, une Grive, tout au premier niveau. */
const alizee: OfferCompany = { francs: 818, planes: [{ model: 'grive' }], pilots: [{ pilot: 'prosper' }], hand: [{ card: 'o-heron' }], zones: {} };

describe("la carte d'un avion dit ce qu'il faut, avant le clic", () => {
  it('le Héron à 5 600 F : ni l\'argent, ni la place, ni la piste ; achat grisé', () => {
    expect(planeOffer(world, alizee, 'heron', 5600)).toEqual({
      seaplane: false, money: false, place: false, runway: false, runwayName: 'Grande piste', canBuy: false, pilot: 'nextDraw', pilotsMissing: 1,
    });
  });

  it("la piste avertit sans bloquer : l'argent et la place suffisent pour acheter", () => {
    const riche = { ...alizee, francs: 6000, zones: { hangar: 2 } };
    expect(planeOffer(world, riche, 'heron', 5600)).toMatchObject({ money: true, place: true, runway: false, canBuy: true });
  });

  it('la Grive d\'occasion : place au hangar à deux places, piste déjà bonne', () => {
    expect(planeOffer(world, { ...alizee, francs: 1500, zones: { hangar: 2 } }, 'grive', 1500))
      .toEqual({ seaplane: false, money: true, place: true, runway: true, runwayName: 'Pré fauché', canBuy: true, pilot: 'nextDraw', pilotsMissing: 1 });
  });

  it("l'hydravion compte les places au ponton, pas au hangar, et ne demande pas de piste", () => {
    expect(planeOffer(world, { ...alizee, francs: 5000 }, 'sterne', 3850)).toMatchObject({ seaplane: true, place: false, runwayName: null, canBuy: false });
    expect(planeOffer(world, { ...alizee, francs: 5000, zones: { ponton: 2 } }, 'sterne', 3850)).toMatchObject({ place: true, runway: true, canBuy: true });
  });
});

describe("la carte d'un avion dit qu'il lui faudra un pilote, et d'où il viendra", () => {
  // Le 31 octobre : deux Grives au hangar, un seul pilote, et rien ne le disait.
  const grive = { ...alizee, francs: 1500, zones: { hangar: 2 }, hand: [{ card: 'o-grive' }] };

  it("autant de pilotes que d'avions : il faudra un pilote, qui se présentera au prochain tirage", () => {
    expect(planeOffer(world, grive, 'grive', 1500).pilot).toBe('nextDraw');
  });

  it("une carte d'embauche déjà en main : elle suffit, il n'y a plus qu'à embaucher", () => {
    expect(planeOffer(world, { ...grive, hand: [{ card: 'o-grive' }, { card: 'o-pilote-foret' }] }, 'grive', 1500).pilot).toBe('inHand');
  });

  it("un pilote de plus que d'avions : rien à dire", () => {
    expect(planeOffer(world, { ...grive, pilots: [{ pilot: 'prosper' }, { pilot: 'garance' }] }, 'grive', 1500).pilot).toBeNull();
  });

  it("la main pleine, l'achat libère la place de la carte : le pilote vient au prochain tirage", () => {
    const pleine = { ...grive, hand: [{ card: 'o-grive' }, { card: 'c-lettres-pont' }, { card: 'c-farine' }, { card: 'c-semences' }, { card: 'o-fete' }] };
    expect(pleine.hand).toHaveLength(HAND_SIZE);
    expect(planeOffer(world, pleine, 'grive', 1500).pilot).toBe('nextDraw');
  });

  it("deux Grives, un pilote, et un troisième avion à vendre : il en manquera deux, un par tirage", () => {
    const deux = { ...grive, francs: 6000, planes: [{ model: 'grive' }, { model: 'grive' }], zones: { hangar: 3 } };
    expect(planeOffer(world, deux, 'grive', 1500)).toMatchObject({ canBuy: true, pilot: 'nextDraw', pilotsMissing: 2 });
    expect(planeOffer(world, grive, 'grive', 1500).pilotsMissing).toBe(1);
    expect(planeOffer(world, { ...grive, pilots: [{ pilot: 'prosper' }, { pilot: 'garance' }] }, 'grive', 1500).pilotsMissing).toBe(0);
  });
});

describe('le cap propose le deuxième avion, et dit le pilote qu\'il faudra pour le mener', () => {
  it('un avion, un pilote : le pilote se présentera au tirage qui suit l\'achat', () => {
    expect(secondPlaneHint(world, alizee)).toBe('afterPurchase');
  });

  it("un avion, une carte d'embauche en main : il n'y a plus qu'à embaucher", () => {
    expect(secondPlaneHint(world, { ...alizee, hand: [{ card: 'c-farine' }, { card: 'o-pilote-foret' }] })).toBe('inHand');
  });

  it('un avion, deux pilotes : son pilote est déjà là', () => {
    expect(secondPlaneHint(world, { ...alizee, pilots: [{ pilot: 'prosper' }, { pilot: 'garance' }], hand: [{ card: 'o-pilote' }] })).toBe('crew');
  });

  it('deux avions : le cap ne propose plus le deuxième', () => {
    expect(secondPlaneHint(world, { ...alizee, planes: [{ model: 'grive' }, { model: 'grive' }] })).toBeNull();
  });
});

describe("le cap : un avion de plus que de pilotes attend le sien", () => {
  const deuxGrives: OfferCompany = { francs: 289, planes: [{ model: 'grive' }, { model: 'grive' }], pilots: [{ pilot: 'prosper' }], hand: [], zones: { hangar: 2 } };

  it('un pilote se présentera au prochain tirage, si la main a une place', () => {
    expect(awaitedPilot(world, deuxGrives)).toBe('nextDraw');
    expect(awaitedPilot(world, { ...deuxGrives, hand: [{ card: 'c-farine' }, { card: 'c-semences' }, { card: 'c-pressoir' }, { card: 'o-fete' }] })).toBe('nextDraw');
  });

  it("la main pleine : au premier tirage qui y trouvera une place", () => {
    const pleine = [{ card: 'c-lettres-pont' }, { card: 'c-farine' }, { card: 'c-semences' }, { card: 'c-pressoir' }, { card: 'o-fete' }];
    expect(awaitedPilot(world, { ...deuxGrives, hand: pleine })).toBe('handFull');
  });

  it("la carte d'embauche en main : il n'y a plus qu'à embaucher", () => {
    expect(awaitedPilot(world, { ...deuxGrives, hand: [{ card: 'o-pilote' }] })).toBe('inHand');
  });

  it("deux avions, deux pilotes : personne n'attend", () => {
    expect(awaitedPilot(world, { ...deuxGrives, pilots: [{ pilot: 'prosper' }, { pilot: 'garance' }] })).toBeNull();
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
