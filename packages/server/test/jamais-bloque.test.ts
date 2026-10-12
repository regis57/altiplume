import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { WORLD } from '../src/world/index.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };
const HOUR = 3_600_000;

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, cookie);
  t.ctx.db.prepare('DELETE FROM company_hand').run();
  const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json();
  const give = (card: string) => t.ctx.db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
  const setFrancs = (n: number) => t.ctx.db.prepare('UPDATE companies SET francs = ?').run(n);
  return { ...t, cookie, state, give, setFrancs };
}

describe('le jeu ne bloque jamais une compagnie', () => {
  it('fait partir la ligne régulière la caisse vide, et paie le tarif moins l\'avance à l\'arrivée', async () => {
    const t = await company();
    t.setFrancs(3); // vu en production le 11/10 : trois francs, plus rien ne décollait
    const s0 = await t.state();
    const r = await t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie);
    expect(r.statusCode).toBe(201);
    expect(r.json().francs).toBe(3); // rien n'est débité au départ
    t.advance(HOUR);
    // Tarif 25 F, salaire de Prosper et entretien de la Grive 14 F : 11 F nets.
    expect((await t.state()).francs).toBe(3 + 25 - 14);
    await t.app.close();
  });

  it('part même à zéro franc, et ne fait jamais perdre d\'argent', async () => {
    const t = await company();
    t.setFrancs(0);
    const s0 = await t.state();
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie)).statusCode).toBe(201);
    t.advance(HOUR);
    expect((await t.state()).francs).toBeGreaterThanOrEqual(0);
    await t.app.close();
  });

  it('garde la règle pour les contrats : ceux-là, il faut pouvoir avancer les frais soi-même', async () => {
    const t = await company();
    t.setFrancs(3);
    t.give('c-journal');
    const s0 = await t.state();
    const r = await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie);
    expect(r.json().error).toBe('not_enough_francs');
    await t.app.close();
  });

  it('offre à chaque imprévu un choix qui ne coûte rien : un imprévu ne peut pas bloquer une caisse vide', async () => {
    for (const c of WORLD.cards) {
      if (c.kind !== 'event') continue;
      expect(c.choices.some((ch) => (ch.effects.francs ?? 0) >= 0), c.id).toBe(true);
    }
    const t = await company();
    t.setFrancs(0);
    t.give('e-bougie'); // « changer la bougie » coûte 12 F ; « risquer » ne coûte rien
    const s0 = await t.state();
    expect((await t.json('POST', '/v1/company/cards/e-bougie/play', { choice: 'fix' }, t.cookie)).json().error).toBe('not_enough_francs');
    expect((await t.json('POST', '/v1/company/cards/e-bougie/play', { choice: 'risk' }, t.cookie)).statusCode).toBe(200);
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie)).statusCode).toBe(201);
    await t.app.close();
  });

  it('remonte de zéro à de quoi prendre un contrat, rien qu\'avec la ligne régulière', async () => {
    const t = await company();
    t.setFrancs(0);
    let s = await t.state();
    for (let i = 0; i < 4; i += 1) {
      t.ctx.db.prepare('UPDATE company_pilots SET fatigue = 0').run();
      expect((await t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: s.planes[0].id, pilot: s.pilots[0].id }, t.cookie)).statusCode).toBe(201);
      t.advance(HOUR);
      s = await t.state();
    }
    expect(s.francs).toBe(44); // quatre allers-retours, 11 F chacun
    expect(s.francs).toBeGreaterThanOrEqual(14); // de quoi avancer les frais d'un contrat avec Prosper et la Grive
    await t.app.close();
  });

  it("laisse enchaîner la ligne régulière une trentaine de fois avant le repos, et repartir dans l'heure", async () => {
    // Le 12/10 : huit sauts à Pont-de-Brume et Prosper était cloué pour vingt-quatre
    // heures. La fatigue compte maintenant des minutes de vol : un aller-retour de dix
    // minutes ne pèse presque rien, et le repos va deux fois plus vite que le vol.
    const t = await company();
    t.setFrancs(0);
    let flights = 0;
    for (;;) {
      const s = await t.state();
      const r = await t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: s.planes[0].id, pilot: s.pilots[0].id }, t.cookie);
      if (r.statusCode === 400 && r.json().error === 'pilot_tired') break;
      expect(r.statusCode, `vol ${flights}`).toBe(201);
      flights += 1;
      expect(flights, 'un pilote finit tout de même par se fatiguer').toBeLessThan(80);
      t.advance(r.json().flights[0].busyUntil - t.ctx.now()); // pile le retour : pas une minute de repos
    }
    process.stdout.write(`VOLS=${flights} francs=${(await t.state()).francs}
`);
    expect(flights).toBeGreaterThanOrEqual(25); // mesuré : 36 allers-retours et 396 F (moins si les aléas de vol allongent la journée)
    const tired = await t.state();
    expect(tired.francs).toBeGreaterThanOrEqual(25 * 11);
    // Il ne dort pas jusqu'au lendemain : une heure au sol et il reprend son service.
    t.advance(HOUR);
    const rested = await t.state();
    expect(rested.pilots[0].restedAt).toBeNull();
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: rested.planes[0].id, pilot: rested.pilots[0].id }, t.cookie)).statusCode).toBe(201);
    await t.app.close();
  });
});

describe('les cachets des premières livraisons lointaines', () => {
  it('donne 1 cachet pour un village proche, 2 pour Haut-Ferrand, 3 pour la Combe', async () => {
    const t = await company();
    t.setFrancs(1000);
    const fly = async (card: string) => {
      t.ctx.db.prepare('UPDATE company_pilots SET fatigue = 0').run();
      t.give(card);
      const s = await t.state();
      expect((await t.json('POST', '/v1/company/flights', { card, plane: s.planes[0].id, pilot: s.pilots[0].id }, t.cookie)).statusCode).toBe(201);
      t.advance(2 * HOUR);
      return (await t.state()).stamps as number;
    };
    const depart = (await t.state()).stamps as number; // la page « Fondation »
    const apresPont = await fly('c-journal');        // Premier vol + Pont-de-Brume + Premier automne : 1 + 1 + 1
    expect(apresPont - depart).toBe(3);
    const apresFerrand = await fly('c-pieces');      // Haut-Ferrand : 2
    expect(apresFerrand - apresPont).toBe(2);
    const apresCombe = await fly('c-medicaments');   // Combe-aux-Rosées : 3
    expect(apresCombe - apresFerrand).toBe(3);
    // Une deuxième livraison au même village ne redonne rien.
    expect(await fly('c-urgent-combe')).toBe(apresCombe);
    await t.app.close();
  });
});

describe('la migration 8 rend les cachets dus', () => {
  it('ajoute à chaque compagnie les cachets que ses premières livraisons lointaines auraient dû valoir', async () => {
    const { MIGRATIONS } = await import('../src/db/migrations.ts');
    const t = await company();
    const id = (t.ctx.db.prepare('SELECT id FROM companies').get() as { id: string }).id;
    // Comme avant le correctif : trois pages collées, un cachet chacune.
    for (const s of ['s-pont-de-brume', 's-haut-ferrand', 's-combe-aux-rosees']) {
      t.ctx.db.prepare('INSERT OR IGNORE INTO company_stamps (company_id, stamp, earned_at) VALUES (?, ?, 0)').run(id, s);
    }
    t.ctx.db.prepare('UPDATE companies SET stamps = 4').run(); // fondation + trois villages
    const v8 = MIGRATIONS.find((m) => m.version === 8)!;
    t.ctx.db.exec(v8.sql);
    // Pont-de-Brume : rien de plus ; Haut-Ferrand : +1 ; la Combe : +2.
    expect((t.ctx.db.prepare('SELECT stamps FROM companies').get() as { stamps: number }).stamps).toBe(7);
    await t.app.close();
  });
});

describe('ce que l\'aérodrome promet, il le fait', () => {
  it('demande la piste roulée pour faire décoller le Martinet de chez soi', async () => {
    const t = await company();
    t.setFrancs(10_000);
    t.ctx.db.prepare("UPDATE company_zones SET level = 2 WHERE zone = 'hangar'").run();
    t.give('o-martinet');
    expect((await t.json('POST', '/v1/company/cards/o-martinet/play', {}, t.cookie)).statusCode).toBe(200);
    const s = await t.state();
    const martinet = s.planes.find((p: { model: string }) => p.model === 'martinet').id;
    t.give('c-journal');
    let r = await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: martinet, pilot: s.pilots[0].id }, t.cookie);
    expect(r.json().error).toBe('home_runway_too_short');
    expect((await t.json('POST', '/v1/company/zones/runway/upgrade', {}, t.cookie)).statusCode).toBe(200);
    r = await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: martinet, pilot: s.pilots[0].id }, t.cookie);
    expect(r.statusCode).toBe(201);
    await t.app.close();
  });

  it('fait baisser l\'entretien quand le hangar est équipé', async () => {
    const t = await company();
    t.setFrancs(10_000);
    const cost = async () => {
      t.give('c-journal');
      const s = await t.state();
      const before = s.francs as number;
      const r = await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: s.planes[0].id, pilot: s.pilots[0].id }, t.cookie);
      expect(r.statusCode).toBe(201);
      t.advance(2 * HOUR);
      t.ctx.db.prepare('UPDATE company_pilots SET fatigue = 0').run();
      return before - (r.json().francs as number);
    };
    expect(await cost()).toBe(14); // Prosper 8 F + Grive 6 F
    t.ctx.db.prepare("UPDATE company_zones SET level = 3 WHERE zone = 'hangar'").run();
    expect(await cost()).toBe(12); // 8 + 6 ÷ 1,5
    await t.app.close();
  });
});
