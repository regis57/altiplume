import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';

/**
 * L'absence n'est jamais punie : les jours où l'on ne vient pas tirent aussi leurs
 * cartes. Jusqu'au 18 octobre 2026, un seul tirage était fait au retour, avec la
 * graine du jour : deux jours d'absence avec la main vide rendaient trois cartes, là
 * où un joueur venu chaque jour en avait cinq.
 */
const signup = { email: 'absente@example.test', nickname: 'Absente', locale: 'fr', ageConfirmed: true, acceptTerms: true };
const DAY = 86_400_000;

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Absente' }, cookie);
  const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json() as Promise<{ hand: { card: string }[]; news: { kind: string; count?: number }[] }>;
  const emptyHand = () => t.ctx.db.prepare('DELETE FROM company_hand').run();
  return { ...t, state, emptyHand };
}

describe("les cartes des jours d'absence", () => {
  it('une compagnie neuve ne tire que les cartes du jour', async () => {
    const t = await company();
    const s = await t.state();
    expect(s.hand.length).toBe(3);
  });

  it('main vidée, deux jours d’absence : cinq cartes, comme un joueur venu chaque jour', async () => {
    const absente = await company();
    await absente.state();
    absente.emptyHand();
    absente.advance(2 * DAY);
    const retour = await absente.state();
    expect(retour.hand.length).toBe(5);
    // Une seule nouvelle, avec le total.
    expect(retour.news.filter((n) => n.kind === 'cards.drawn')).toEqual([{ kind: 'cards.drawn', count: 5 }]);

    const fidele = await company();
    await fidele.state();
    fidele.emptyHand();
    fidele.advance(DAY);
    expect((await fidele.state()).hand.length).toBe(3);
    fidele.advance(DAY);
    expect((await fidele.state()).hand.length).toBe(5);
  });

  it('deux cartes en main, deux jours d’absence : la main se remplit, sans doublon', async () => {
    const t = await company();
    const s0 = await t.state();
    const kept = s0.hand.slice(0, 2).map((h) => h.card) as [string, string];
    t.ctx.db.prepare('DELETE FROM company_hand WHERE card NOT IN (?, ?)').run(kept[0], kept[1]);
    t.advance(2 * DAY);
    const s = await t.state();
    expect(s.hand.length).toBe(5);
    expect(new Set(s.hand.map((h) => h.card)).size).toBe(5);
    expect(s.hand.map((h) => h.card)).toEqual(expect.arrayContaining(kept));
  });

  it('dix jours d’absence ne donnent jamais plus d’une main pleine', async () => {
    const t = await company();
    await t.state();
    t.emptyHand();
    t.advance(10 * DAY);
    const s = await t.state();
    expect(s.hand.length).toBe(5);
    expect(s.news.filter((n) => n.kind === 'cards.drawn')).toEqual([{ kind: 'cards.drawn', count: 5 }]);
    // Et le lendemain, la main pleine ne reçoit rien.
    t.advance(DAY);
    expect((await t.state()).news.some((n) => n.kind === 'cards.drawn')).toBe(false);
  });
});
