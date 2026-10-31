import { describe, expect, it } from 'vitest';
import { heureDeParis, simuler } from './simulation.mjs';

// L'outil de la Conception (§ 4.5) joue les vraies règles du serveur. Ce test fige un
// résultat court : s'il casse, c'est qu'une règle de l'économie a changé (ou l'outil) —
// et que les chiffres de la Conception sont à re-mesurer avec lui, dans la même PR.
// Il ne voit que la première semaine : une règle qui joue plus tard (prix du Pic, atelier,
// Archipel, hiver) ne le fait pas casser, et se re-mesure sans lui.
describe('la simulation de l\'économie', () => {
  const court = { profil: 'une-heure', scenario: 'neuf', joueurs: 3, jours: 7 };

  it('rend le même résultat à chaque lancement, et rattrape le tirage comme le serveur', () => {
    const a = simuler(court);
    expect(simuler(court)).toEqual(a);
    expect(a.controle.tiragesRejouesDifferents).toBe(0);
    expect(a.avertissement).toMatch(/plafond/);
  });

  it('fige trois joueurs neufs sur sept jours, une heure par jour (règles du 31 octobre 2026)', () => {
    const r = simuler(court);
    expect(r.parJour).toEqual({
      contratsTires: 1.71, recettesDesVols: 189.9, fraisDesContrats: 20, imprevusFrancs: 0.7, gainNetDesVols: 170,
      imprevus: 1, attentesChoisies: 0.05, visitesSansDepart: 0, cartesPerduesMainPleine: 0,
    });
    expect(r.contratsParRegionEtAvion).toEqual({
      'brume / Grive': { parJour: 1.43, netMoyen: 88, allerRetourMin: 32, netParHeure: 164 },
      'saline / Grive': { parJour: 0.14, netMoyen: 193, allerRetourMin: 88, netParHeure: 132 },
    });
    // La ligne régulière : 25 F moins l'avance (14 F, 13 F avec l'établi du hangar).
    expect(r.ligneReguliere).toEqual({ parJour: 1.43, netMoyen: 12 });
    expect(r.patrimoineMedian).toEqual({ jour7: 1552 });
  });

  it('une autre graine, d\'autres joueurs', () => {
    expect(simuler({ ...court, graine: 'autre' }).parJour).not.toEqual(simuler(court).parJour);
  });

  it('deux Grives et un pilote : le hangar attend son pilote, il vient au premier tirage', () => {
    const r = simuler({ profil: 'realiste', scenario: 'deux-grives-un-pilote', joueurs: 2, jours: 3 });
    expect(r.jalons.deuxEquipages).toEqual({ atteint: '2/2', p10: 0, mediane: 0, p90: 0 });
    expect(r.joursAvecAvionSansPilote).toBe(0);
  });

  it('refuse un profil, un scénario ou une politique inconnus', () => {
    expect(() => simuler({ profil: 'trois-heures' })).toThrow(/profil inconnu/);
    expect(() => simuler({ scenario: 'riche' })).toThrow(/scénario inconnu/);
    expect(() => simuler({ politique: 'prudent' })).toThrow(/politique inconnue/);
  });

  it('une flotte figée garde ses routes : la Sterne n\'y ouvre pas l\'Archipel', () => {
    // Avec cette graine, l'outil d'avant (qui ouvrait les routes d'une flotte figée) faisait voler
    // la Sterne vers l'Archipel dans les huit jours : le tableau des flottes mêlait alors deux routes.
    const r = simuler({ profil: 'une-heure', scenario: 'grive-pic-sterne', joueurs: 1, jours: 8, graine: 'figee-15' });
    const routes = Object.keys(r.contratsParRegionEtAvion);
    expect(routes).toContain('saline / Sterne');
    expect(routes.filter((k) => k.startsWith('archipel'))).toEqual([]);
  });

  it('refuse un nombre ou une date qui n\'en sont pas, au lieu de rendre un résultat vide', () => {
    expect(() => simuler({ joueurs: 'abc' })).toThrow(/joueurs : un nombre entier/);
    expect(() => simuler({ jours: 0 })).toThrow(/jours : un nombre entier/);
    expect(() => simuler({ joueurs: 2.5 })).toThrow(/joueurs : un nombre entier/);
    expect(() => simuler({ debut: '2026-02-30' })).toThrow(/date AAAA-MM-JJ/);
  });

  it('place les passages à l\'heure de Paris, heure d\'été comprise', () => {
    const utc = (jour, heure) => new Date(heureDeParis(Date.parse(`${jour}T00:00:00Z`), heure)).toISOString().slice(11, 16);
    expect(utc('2026-11-02', 18)).toBe('17:00'); // l'heure d'hiver : UTC + 1
    expect(utc('2026-07-15', 18)).toBe('16:00'); // l'heure d'été : UTC + 2
    expect(utc('2026-03-29', 8)).toBe('06:00'); // le matin du passage à l'heure d'été
    expect(utc('2026-10-25', 8)).toBe('07:00'); // le matin du retour à l'heure d'hiver
  });
});
