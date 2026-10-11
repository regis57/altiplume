import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

describe('le compteur mondial', () => {
  it('est public, anonyme, arrondi, et ne compte que les arrivées', async () => {
    const t = await testApp();
    let r = await t.app.inject({ method: 'GET', url: '/v1/world/stats' });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ deliveriesThisMonth: 0, deliveriesTotal: 0, companies: 0 });
    expect(r.headers['cache-control']).toBe('public, max-age=600');

    await t.json('POST', '/v1/auth/register', signup);
    const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, cookie);
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    t.ctx.db.prepare("INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) SELECT id, 'c-journal', 0 FROM companies").run();
    const s = (await t.json('GET', '/v1/company', undefined, cookie)).json();
    await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: s.planes[0].id, pilot: s.pilots[0].id }, cookie);
    t.advance(11 * 60_000); // le cache de dix minutes est dépassé, et le vol est arrivé
    await t.json('GET', '/v1/company', undefined, cookie);
    r = await t.app.inject({ method: 'GET', url: '/v1/world/stats' });
    expect(r.json()).toEqual({ deliveriesThisMonth: 1, deliveriesTotal: 1, companies: 0 }); // une compagnie s'arrondit à zéro
    expect(JSON.stringify(r.json())).not.toContain('Brume');
    await t.app.close();
  });
});
