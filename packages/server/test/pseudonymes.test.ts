import { describe, expect, it } from 'vitest';
import { foldNickname, validateNickname } from '../src/auth/validation.ts';
import { EXCEPTIONS, MOTS, RACINES } from '../src/auth/pseudonymes-interdits.ts';

/**
 * Le filtre de pseudonymes : il refuse l'évident, même déguisé, et laisse passer les
 * vrais prénoms. Le 18/10, « Nazir » (prénom arabe courant) était refusé parce qu'il
 * contient « nazi » ; « Jorge Negrete » parce qu'il contient « negre ».
 */
describe('les pseudonymes', () => {
  it('laisse passer de vrais prénoms, de plusieurs origines, autant de femmes que d’hommes', () => {
    const femmes = ['Nazira', 'Naziha', 'Benazir', 'Violette', 'Viola', 'Pénélope', 'Monique', 'Ishita', 'Cassandra', 'Fanny'];
    const hommes = ['Nazir', 'Nazim', 'Nazih', 'Nazım', 'Vassili', 'Pedro', 'Nigel', 'Titouan', 'Kunal', 'Jorge Negrete'];
    expect(femmes).toHaveLength(hommes.length);
    for (const n of [...femmes, ...hommes]) expect(validateNickname(n), n).toBeNull();
  });

  it('laisse passer les lieux et les mots où une racine se cache', () => {
    for (const n of [
      'Essex', 'Pornic', 'Bitche', 'Scunthorpe', 'Penistone', 'Drapeau', 'Computer', 'Salopette', 'Torpedo',
      'Ashkenazi', 'Nazionale', 'Empédocle', 'Therapist', 'Snigger', 'Baragouin', 'Agent 55', 'Paul88', 'Rossignol',
      // Deux mots qui, recollés, contiendraient une racine : des noms, pas un mot écartelé.
      'Ana Zimmer', 'Anna Zinn', 'Jana Zika', 'Dona Zita', 'Mina Zirek', 'Ina Zielinski',
    ]) expect(validateNickname(n), n).toBeNull();
  });

  it('refuse la haine, même collée, écartelée ou déguisée en chiffres', () => {
    for (const n of [
      'xXnaziXx', 'N4zi', 'Na Zi', 'N A Z I', 'Hit Ler', 'Nazir Nazi', 'Neonazi', 'Hitler2', 'H1tler', 'Sieg Heil', '1488', 'Paul 88',
      'Jean SS', 'S5 Garde', 'Waffen-SS', 'KKK', 'White Power', 'Nigg3r', 'Bougnoule', 'Youpin', 'Sale Juif', 'Nègre',
      'N3gre', 'Faggot', 'Tapette', 'Gouine', 'Le PD',
    ]) expect(validateNickname(n), n).toBe('nickname_offensive');
  });

  it('refuse les insultes, les vulgarités sexuelles, le viol et la pédocriminalité', () => {
    for (const n of [
      'Salope', 'Sal0pe', 'Connasse', 'Fils de pute', 'Jean-Pute', 'Bitch', 'Slut', 'Le Porn', 'Sexy Lady', 'xXfuckXx',
      'Pussy', 'Viol', 'V1ol', 'Violeur', 'Rapist', 'Pedo', 'P3do', 'xXpedoXx', 'Pédophile', 'Lolicon',
    ]) expect(validateNickname(n), n).toBe('nickname_offensive');
  });

  it('les trois familles sont repliées, sans doublon, et aucune exception ne contient un mot refusé', () => {
    for (const list of [RACINES, MOTS, EXCEPTIONS]) {
      const folded = list.map(foldNickname);
      expect(new Set(folded).size, folded.join(' ')).toBe(folded.length);
      for (const w of folded) expect(w.length, w).toBeGreaterThan(1);
    }
    // Chaque exception sauve bien un mot qui, sans elle, serait refusé.
    for (const e of EXCEPTIONS) {
      expect(RACINES.some((r) => foldNickname(e).includes(foldNickname(r))), e).toBe(true);
      expect(validateNickname(e), e).toBeNull();
    }
  });
});
