import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { WORLD } from '../src/world/index.ts';

/**
 * Les imprévus se passent à l'aérodrome, avant un départ (règle du 14/10). « Attendre »
 * ferme vraiment la piste le temps annoncé ; « y aller quand même » la laisse ouverte.
 * Le cas réel : « Dormir sur place » choisi, et un vol expédié dans la foulée.
 */
const signup = { email: 'toto@example.test', nickname: 'Toto', locale: 'fr', ageConfirmed: true, acceptTerms: true };

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Toto & Cie' }, cookie);
  const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json();
  const give = (card: string) => {
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    t.ctx.db.prepare('INSERT INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
  };
  const play = (card: string, choice: string) => t.json('POST', `/v1/company/cards/${card}/play`, { choice }, cookie);
  const send = async () => {
    const s = await state();
    return t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: s.planes[0].id, pilot: s.pilots[0].id }, cookie);
  };
  return { ...t, state, give, play, send };
}

describe('les imprévus, au sol', () => {
  it("« attendre » ferme la piste le temps annoncé, puis elle rouvre", async () => {
    const t = await company();
    t.give('e-brume');
    expect((await t.play('e-brume', 'wait')).statusCode).toBe(200);
    const s = await t.state();
    expect(s.runwayClosedUntil).toBe(t.ctx.now() + 2 * 3_600_000);
    expect((await t.send()).json().error).toBe('runway_closed');
    t.advance(2 * 3_600_000 - 60_000);
    expect((await t.send()).json().error).toBe('runway_closed');
    t.advance(60_001);
    expect((await t.send()).statusCode).toBe(201);
    expect((await t.state()).runwayClosedUntil).toBeNull();
  });

  it('« y aller quand même » laisse la piste ouverte', async () => {
    const t = await company();
    t.give('e-brume');
    await t.play('e-brume', 'go');
    expect((await t.state()).runwayClosedUntil).toBeNull();
    expect((await t.send()).statusCode).toBe(201);
  });

  it("chaque imprévu ne dit que ce qu'il fait : pas de vol en l'air, l'attente écrite sur le bouton", () => {
    const events = WORLD.cards.filter((c) => c.kind === 'event');
    expect(events.map((e) => e.id)).not.toContain('e-nuit');
    for (const e of events) {
      for (const ch of e.choices) {
        expect(Object.keys(ch.effects).every((k) => ['francs', 'waitHours', 'wear', 'morale', 'stamps'].includes(k)), `${e.id}/${ch.id}`).toBe(true);
        // L'attente annoncée est celle qui est appliquée : « (2 h) » sur le bouton.
        if (ch.effects.waitHours) {
          expect(ch.label.fr, `${e.id}/${ch.id}`).toContain(`${ch.effects.waitHours} h)`);
          expect(ch.label.en, `${e.id}/${ch.id}`).toContain(`${ch.effects.waitHours} h)`);
        }
      }
      // Rien qui suppose un avion déjà parti, ni une heure du jour qui pourrait mentir.
      for (const txt of [e.text.fr, ...e.choices.map((c) => c.outcome.fr)]) {
        expect(txt, e.id).not.toMatch(/en route|a pris du retard|\bce matin\b|\bce soir\b|l'aube|dans la nuit|cette nuit/i);
      }
    }
  });
});
