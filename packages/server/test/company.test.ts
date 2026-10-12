import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

async function signedIn(locale = 'fr') {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', { ...signup, locale });
  const r = await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
  return { ...t, cookie: sessionCookie(r) };
}

describe('la compagnie', () => {
  it('exige une session', async () => {
    const t = await testApp();
    expect((await t.json('GET', '/v1/company')).statusCode).toBe(401);
    expect((await t.json('GET', '/v1/company/names')).statusCode).toBe(401);
    expect((await t.json('POST', '/v1/company', { name: 'Brume & Cie' })).statusCode).toBe(401);
    await t.app.close();
  });

  it('propose trois noms dans la langue du joueur, reproductibles, et d\'autres sur demande', async () => {
    const t = await signedIn('en');
    const a = (await t.json('GET', '/v1/company/names', undefined, t.cookie)).json().names as string[];
    const b = (await t.json('GET', '/v1/company/names', undefined, t.cookie)).json().names as string[];
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
    for (const n of a) expect(n).toMatch(/Co\.|Line|Sons|Airmail|Airways|Company|Wings/);
    const c = (await t.json('GET', '/v1/company/names?draw=1', undefined, t.cookie)).json().names as string[];
    expect(c).not.toEqual(a);
    const fr = (await t.json('GET', '/v1/company/names?locale=fr', undefined, t.cookie)).json().names as string[];
    for (const n of fr) expect(n).toMatch(/Cie|Compagnie|Comptoir|Messageries|Lignes|Fils|Poste|Ailes/);
    expect((await t.json('GET', '/v1/company/names?draw=12', undefined, t.cookie)).statusCode).toBe(400);
    await t.app.close();
  });

  it('n\'existe pas avant la fondation, puis démarre avec l\'état du monde', async () => {
    const t = await signedIn();
    expect((await t.json('GET', '/v1/company', undefined, t.cookie)).statusCode).toBe(404);
    const r = await t.json('POST', '/v1/company', { name: '  Messageries   Rosée ' }, t.cookie);
    expect(r.statusCode).toBe(201);
    const c = r.json();
    expect(c.name).toBe('Messageries Rosée');
    expect(c.francs).toBe(300);
    expect(c.planes).toHaveLength(1);
    expect(c.planes[0].model).toBe('grive');
    expect(c.pilots).toHaveLength(1);
    expect(c.pilots[0]).toMatchObject({ pilot: 'prosper', affinity: 0, morale: 10, fatigue: 0, busyUntil: null });
    expect(c.hand).toHaveLength(3);
    expect(c.flights).toEqual([]);
    expect(c.zones).toEqual({ runway: 1, hangar: 1, ponton: 1, tour: 1 });
    expect(c.regions).toEqual(['brume']);
    expect(c.decorations).toEqual([]);
    expect(c.album.map((s: { id: string }) => s.id)).toEqual(['s-fondation']);
    expect(c.stamps).toBe(1);
    expect(c.foundedAt).toBe(t.ctx.now());
    // Les nouvelles (le tirage du jour) ne se lisent qu'une fois ; le reste est identique.
    expect(c.news).toEqual([{ kind: 'cards.drawn', count: 3 }]);
    expect((await t.json('GET', '/v1/company', undefined, t.cookie)).json()).toEqual({ ...c, news: [] });
    await t.app.close();
  });

  it('refuse une seconde fondation, et les noms impossibles', async () => {
    const t = await signedIn();
    expect((await t.json('POST', '/v1/company', { name: 'Ab' }, t.cookie)).json().fields).toEqual(['company_name_invalid']);
    expect((await t.json('POST', '/v1/company', { name: 'Air France Express' }, t.cookie)).statusCode).toBe(400);
    expect((await t.json('POST', '/v1/company', { name: '<b>Brume</b>' }, t.cookie)).statusCode).toBe(400);
    expect((await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, t.cookie)).statusCode).toBe(201);
    expect((await t.json('POST', '/v1/company', { name: 'Autre & Cie' }, t.cookie)).statusCode).toBe(409);
    expect((await t.json('PATCH', '/v1/company', { name: "Les Ailes de la Croisette" }, t.cookie)).statusCode).toBe(204);
    expect((await t.json('GET', '/v1/company', undefined, t.cookie)).json().name).toBe('Les Ailes de la Croisette');
    await t.app.close();
  });

  it('garde les histoires sous clé tant que l\'affinité n\'y est pas, puis colle un cachet', async () => {
    const t = await signedIn();
    await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, t.cookie);
    const locked = await t.json('GET', '/v1/company/pilots/prosper/story/0', undefined, t.cookie);
    expect(locked.statusCode).toBe(403);
    expect(locked.json()).toEqual({ error: 'scene_locked', affinity: 3 });
    expect((await t.json('GET', '/v1/company/pilots/ilias/story/0', undefined, t.cookie)).statusCode).toBe(404); // pas embauché
    expect((await t.json('GET', '/v1/company/pilots/prosper/story/7', undefined, t.cookie)).statusCode).toBe(404);
    // Trois vols ensemble (simulés directement en base : les vols arrivent dans la PR suivante).
    t.ctx.db.prepare('UPDATE company_pilots SET affinity = 3').run();
    const scene = await t.json('GET', '/v1/company/pilots/prosper/story/0', undefined, t.cookie);
    expect(scene.statusCode).toBe(200);
    expect(scene.json().title).toBe('La croix au bout du chemin');
    expect(scene.json().lines[0].text).toContain('chemin de la Croisette');
    const company = (await t.json('GET', '/v1/company', undefined, t.cookie)).json();
    expect(company.pilots[0].scenesSeen).toBe(1);
    expect(company.album.map((s: { id: string }) => s.id)).toContain('s-histoire');
    expect(company.stamps).toBe(2);
    // Relire ne redonne pas de cachet.
    await t.json('GET', '/v1/company/pilots/prosper/story/0', undefined, t.cookie);
    expect((await t.json('GET', '/v1/company', undefined, t.cookie)).json().stamps).toBe(2);
    // En anglais, si le joueur passe en anglais.
    await t.json('PATCH', '/v1/account', { locale: 'en' }, t.cookie);
    expect((await t.json('GET', '/v1/company/pilots/prosper/story/0', undefined, t.cookie)).json().title).toBe('The cross at the end of the lane');
    // La langue de la page l'emporte sur celle du compte (bug vu le 11/10 : compte en anglais, page en français).
    expect((await t.json('GET', '/v1/company/pilots/prosper/story/0?locale=fr', undefined, t.cookie)).json().title).toBe('La croix au bout du chemin');
    expect((await t.json('GET', '/v1/company/pilots/prosper/story/0?locale=xx', undefined, t.cookie)).json().title).toBe('The cross at the end of the lane');
    await t.app.close();
  });

  it('part avec le compte : export puis effacement', async () => {
    const t = await signedIn();
    await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, t.cookie);
    const data = (await t.json('GET', '/v1/account/export', undefined, t.cookie)).json();
    expect(data.game.company.name).toBe('Brume & Cie');
    expect(data.game.pilots[0].pilot).toBe('prosper');
    expect(data.events.map((e: { event: string }) => e.event)).toContain('company.founded');
    expect((await t.json('DELETE', '/v1/account', { confirmNickname: 'Régis' }, t.cookie)).statusCode).toBe(204);
    for (const table of ['companies', 'company_planes', 'company_pilots', 'company_zones', 'company_stamps']) {
      expect((t.ctx.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n, table).toBe(0);
    }
    await t.app.close();
  });
});
