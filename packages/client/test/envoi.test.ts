import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ablePlanes, crewEstimate, crewProblem, isResting, pickPlane, type EnvoiCompany, type EnvoiWorld } from '../src/envoi.ts';
import { convoyState } from '../src/convoi.ts';

/** Le vrai monde (copie vérifiée par `packages/server/test/world.test.ts`). */
const world = JSON.parse(readFileSync(new URL('./monde-du-cap.json', import.meta.url), 'utf8')) as EnvoiWorld & { destinations: { id: string; distance: number; runway: string }[] };
const stop = (id: string) => world.destinations.find((d) => d.id === id)!;

const plane = (id: string, model: string, busyUntil: number | null = null) => ({ id, model, busyUntil });
const pilot = (id: string, tpl: string, restedAt: number | null = null) => ({ id, pilot: tpl, busyUntil: null, restedAt });

describe("l'estimation avant l'envoi dit ce que le serveur fera", () => {
  // Le scénario de la revue : l'atelier (entretien ÷ 1,5), la grande piste, un Héron.
  const atelier: EnvoiCompany = {
    planes: [plane('p1', 'heron')],
    pilots: [pilot('a', 'ilias'), pilot('b', 'prosper')],
    zones: { hangar: 3, runway: 3 }, season: { id: 'automne' },
  };

  it('Ilias (Tête brûlée et Économe) : 16 F et ≈ 21 min 26 s, pas 18 F et 24 min', () => {
    const e = crewEstimate(world, atelier, 'p1', 'a', stop('combe-aux-rosees'))!;
    // checkCrew : round(7 + 16 × 0,85 ÷ 1,5) ; 6 / (15 × 1,12) heures.
    expect(e.cost).toBe(16);
    expect(e.durationMs).toBe(Math.round((6 / (15 * 1.12)) * 3_600_000));
  });

  it('Prosper, sans trait de vitesse ni de carburant : le calcul de base', () => {
    const e = crewEstimate(world, atelier, 'p1', 'b', stop('combe-aux-rosees'))!;
    // round(8 + 16 ÷ 1,5) ; 6 / 15 heures.
    expect(e.cost).toBe(19);
    expect(e.durationMs).toBe(24 * 60_000);
  });

  it("l'hiver rallonge, comme sur le serveur (arrondi après le facteur de saison)", () => {
    const e = crewEstimate(world, { ...atelier, season: { id: 'hiver' } }, 'p1', 'a', stop('combe-aux-rosees'))!;
    expect(e.durationMs).toBe(Math.round(Math.round((6 / (15 * 1.12)) * 3_600_000) * 1.15));
  });
});

describe("le formulaire choisit un avion qui peut s'y poser", () => {
  // Grive et Sterne, ponton ouvert ; « Lettres pour l'île » : 3 sacs, sur l'eau.
  const grand: EnvoiCompany = {
    planes: [plane('g', 'grive'), plane('s', 'sterne')],
    pilots: [pilot('a', 'prosper')],
    zones: { ponton: 2 }, season: { id: 'automne' },
  };
  const ile = stop('ile-sainte-ambre');

  it("présélectionne la Sterne, pas la Grive qui ne se pose pas sur l'eau", () => {
    expect(crewProblem(world, grand, 'g', 1, ile)).toBe('needs_seaplane');
    expect(crewProblem(world, grand, 's', 1, ile)).toBeNull();
    expect(pickPlane(world, grand, ile, 1)).toBe('s');
  });

  it("la Sterne porte les 3 sacs seule : ni convoi, ni « trop lourd »", () => {
    const capacity = crewEstimate(world, grand, 's', 'a', ile)!.capacity;
    expect(convoyState({ capacity, bags: 3, freePlanes: ablePlanes(world, grand, ile, 1), freePilots: 1 })).toBe('none');
    // La Grive ne compte pas pour un convoi vers l'eau.
    expect(ablePlanes(world, grand, ile, 1)).toBe(1);
  });

  it('dit les refus du serveur dans son ordre : se poser, la portée, décoller de chez soi', () => {
    const c: EnvoiCompany = { planes: [plane('m', 'martinet'), plane('g', 'grive'), plane('p', 'pic')], pilots: [], zones: {}, season: { id: 'automne' } };
    // Marais-Blanc : 9,6, piste moyenne. La Grive (8) n'y porte pas ; le Martinet ne décolle pas d'un pré.
    expect(crewProblem(world, c, 'g', 1, stop('marais-blanc'))).toBe('out_of_range');
    expect(crewProblem(world, c, 'g', 1.2, stop('marais-blanc'))).toBeNull();
    expect(crewProblem(world, c, 'm', 1, stop('marais-blanc'))).toBe('home_runway_too_short');
    expect(crewProblem(world, { ...c, zones: { runway: 2 } }, 'm', 1, stop('marais-blanc'))).toBeNull();
    // Combe-aux-Rosées : grande piste ; pas d'eau pour un avion à roues.
    expect(crewProblem(world, c, 'g', 1, stop('combe-aux-rosees'))).toBeNull();
    expect(crewProblem(world, { ...c, planes: [plane('s', 'sterne')] }, 's', 1, stop('combe-aux-rosees'))).toBe('needs_water');
    // À défaut d'avion qui convienne, le premier libre : le formulaire dira pourquoi.
    expect(pickPlane(world, { ...c, planes: [plane('g', 'grive', 5), plane('m', 'martinet')] }, stop('marais-blanc'), 1)).toBe('m');
  });
});

describe('le repos du pilote se compte à l\'horloge du serveur', () => {
  it("un pilote est de nouveau libre à l'heure dite, pas au rendu suivant", () => {
    expect(isResting({ restedAt: 1_000 }, 999)).toBe(true);
    expect(isResting({ restedAt: 1_000 }, 1_000)).toBe(false);
    expect(isResting({ restedAt: null }, 0)).toBe(false);
  });
});
