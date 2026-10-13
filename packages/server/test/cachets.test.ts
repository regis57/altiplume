import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { stampValue } from '../src/world/index.ts';

/**
 * Ce que vaut une page d'album, en cachets. Chaque page en vaut un ; une première
 * livraison lointaine en vaut plus : Haut-Ferrand et Lanterne-du-Val deux,
 * Combe-aux-Rosées trois. Le 14 octobre, un compte s'étonnait de n'avoir que dix
 * cachets : la règle n'était gardée par aucun test. La voici, de bout en bout.
 */
const signup = { email: 'altiboss@example.test', nickname: 'Altiboss', locale: 'en', ageConfirmed: true, acceptTerms: true };

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Altiboss' }, cookie);
  const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json();
  const give = (card: string) => t.ctx.db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
  /** Envoie une carte, attend le retour au sol, et rend l'état. */
  const deliver = async (card: string) => {
    const s = await state();
    give(card);
    // Pas d'imprévu en travers : on vide la main de tout ce qui n'est pas la carte voulue.
    t.ctx.db.prepare("DELETE FROM company_hand WHERE card <> ?").run(card);
    const r = await t.json('POST', '/v1/company/flights', { card, plane: s.planes[0].id, pilot: s.pilots[0].id }, cookie);
    expect(r.statusCode, JSON.stringify(r.json())).toBe(201);
    t.advance(6 * 3_600_000);
    t.ctx.db.prepare('UPDATE company_pilots SET fatigue = 0').run();
    return state();
  };
  return { ...t, state, deliver };
}

const earned = (s: { album: { id: string }[] }, id: string) => s.album.some((a) => a.id === id);

describe('les cachets', () => {
  it("une page d'album vaut un cachet, une première livraison lointaine deux ou trois", async () => {
    const t = await company();
    const s0 = await t.state();
    const base = s0.stamps;
    expect(base).toBe(s0.album.length); // à la fondation : une page, un cachet

    // Pont-de-Brume, tout près : la page de l'escale, celle du premier vol, et celle de la saison.
    const s1 = await t.deliver('c-journal');
    const pages1 = s1.album.length - s0.album.length;
    expect(s1.stamps - base).toBe(pages1);

    // Haut-Ferrand, une crête lointaine : sa page en vaut deux.
    const s2 = await t.deliver('c-urgent-ferrand');
    expect(earned(s2, 's-haut-ferrand')).toBe(true);
    expect(s2.stamps - s1.stamps).toBe((s2.album.length - s1.album.length) + 1);

    // Combe-aux-Rosées, le bout de la vallée : sa page en vaut trois.
    const s3 = await t.deliver('c-medicaments');
    expect(earned(s3, 's-combe-aux-rosees')).toBe(true);
    expect(s3.stamps - s2.stamps).toBe((s3.album.length - s2.album.length) + 2);

    // Livrer encore au même endroit ne colle rien, et ne rapporte aucun cachet.
    const s4 = await t.deliver('c-medicaments');
    expect(s4.stamps).toBe(s3.stamps);

    // Ce que l'album affiche (la valeur de chaque page) fait exactement le compte en caisse.
    const somme = s4.album.reduce((n: number, a: { id: string }) => n + stampValue(a.id), 0);
    expect(somme).toBe(s4.stamps);
    expect(stampValue('s-combe-aux-rosees')).toBe(3);
    expect(stampValue('s-haut-ferrand')).toBe(2);
    expect(stampValue('s-premier-vol')).toBe(1);
  });
});
