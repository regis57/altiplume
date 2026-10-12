import { describe, expect, it } from 'vitest';
import { convoyState } from '../src/convoi.ts';

/** Une flotte confortable : deux avions au sol, deux pilotes frais. */
const fleet = { freePlanes: 2, freePilots: 2 };
/** Le premier jour : un avion, un pilote. */
const alone = { freePlanes: 1, freePilots: 1 };

describe("le convoi ne s'invite pas", () => {
  it("ne montre rien tant qu'aucun avion n'est choisi — ils sont tous en vol", () => {
    // Le défaut du 12/10 : sans avion choisi, la capacité valait zéro, donc « trop
    // lourd », et le joueur voyait un avion d'escorte avant d'avoir deux avions.
    expect(convoyState({ capacity: null, bags: 1, ...alone })).toBe('none');
    expect(convoyState({ capacity: null, bags: 6, ...fleet })).toBe('none');
  });

  it('ne montre rien quand un seul avion suffit', () => {
    expect(convoyState({ capacity: 1, bags: 1, ...fleet })).toBe('none');
    expect(convoyState({ capacity: 3, bags: 2, ...fleet })).toBe('none');
  });

  it("le demande quand la charge déborde et qu'un second équipage est libre", () => {
    expect(convoyState({ capacity: 2, bags: 3, ...fleet })).toBe('ask');
  });

  it("l'explique, sans rien demander, quand il n'y a personne pour accompagner", () => {
    expect(convoyState({ capacity: 2, bags: 3, ...alone })).toBe('impossible');
    // Deux avions, mais un seul pilote au sol : pas de convoi possible non plus.
    expect(convoyState({ capacity: 2, bags: 3, freePlanes: 2, freePilots: 1 })).toBe('impossible');
    expect(convoyState({ capacity: 2, bags: 3, freePlanes: 1, freePilots: 2 })).toBe('impossible');
  });
});
