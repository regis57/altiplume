import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { WORLD } from '../src/world/index.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, cookie);
  return { ...t, cookie, state: async () => (await t.json('GET', '/v1/company', undefined, cookie)).json() };
}

describe('restaurer et décorer', () => {
  it('monte la piste niveau par niveau, au prix du monde, et refuse au-delà', async () => {
    const t = await company();
    expect((await t.json('POST', '/v1/company/zones/runway/upgrade', {}, t.cookie)).json().error).toBe('not_enough_francs'); // 900 > 300
    t.ctx.db.prepare('UPDATE companies SET francs = 5000').run();
    const r = await t.json('POST', '/v1/company/zones/runway/upgrade', {}, t.cookie);
    expect(r.statusCode).toBe(200);
    expect(r.json().zones.runway).toBe(2);
    expect(r.json().francs).toBe(5000 - 900);
    expect(r.json().logbook[0]).toMatchObject({ kind: 'build.zone', francs: -900, ref: 'runway:2' });
    expect((await t.json('POST', '/v1/company/zones/runway/upgrade', {}, t.cookie)).json().zones.runway).toBe(3);
    expect((await t.json('POST', '/v1/company/zones/runway/upgrade', {}, t.cookie)).json().error).toBe('zone_max');
    expect((await t.json('POST', '/v1/company/zones/tour/upgrade', {}, t.cookie)).statusCode).toBe(404);
    expect((await t.state()).francs).toBe(5000 - 900 - 2400);
    await t.app.close();
  });

  it('le hangar agrandi permet un avion de plus', async () => {
    const t = await company();
    t.ctx.db.prepare('UPDATE companies SET francs = 5000').run();
    t.ctx.db.prepare("INSERT INTO company_hand (company_id, card, drawn_at) SELECT id, 'o-martinet', 0 FROM companies").run();
    expect((await t.json('POST', '/v1/company/cards/o-martinet/play', {}, t.cookie)).json().error).toBe('hangar_full');
    expect((await t.json('POST', '/v1/company/zones/hangar/upgrade', {}, t.cookie)).json().zones.hangar).toBe(2);
    expect((await t.json('POST', '/v1/company/cards/o-martinet/play', {}, t.cookie)).json().planes).toHaveLength(2);
    await t.app.close();
  });

  it('pose chaque décoration une fois, et remonte un peu le moral', async () => {
    const t = await company();
    const r0 = await t.json('POST', '/v1/company/decorations/d-fleurs', {}, t.cookie); // 20 F sur 300
    expect(r0.statusCode).toBe(200);
    expect(r0.json().decorations).toEqual(['d-fleurs']);
    expect(r0.json().francs).toBe(280);
    expect(r0.json().pilots[0].morale).toBe(11);
    expect((await t.json('POST', '/v1/company/decorations/d-fleurs', {}, t.cookie)).json().error).toBe('decoration_owned');
    t.ctx.db.prepare('UPDATE companies SET francs = 10').run();
    expect((await t.json('POST', '/v1/company/decorations/d-peinture', {}, t.cookie)).json().error).toBe('not_enough_francs');
    expect((await t.json('POST', '/v1/company/decorations/d-licorne', {}, t.cookie)).statusCode).toBe(404);
    t.ctx.db.prepare('UPDATE companies SET francs = 9999').run();
    for (const d of WORLD.decorations) await t.json('POST', `/v1/company/decorations/${d.id}`, {}, t.cookie);
    const s = await t.state();
    expect(s.decorations).toHaveLength(WORLD.decorations.length);
    expect(s.pilots[0].morale).toBeLessThanOrEqual(20);
    expect((await t.json('GET', '/v1/account/export', undefined, t.cookie)).json().game.decorations).toHaveLength(10);
    await t.app.close();
  });
});
