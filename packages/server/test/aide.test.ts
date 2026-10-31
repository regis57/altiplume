import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { companyFleet, companyLuck, DAILY_DRAW, drawCards, HAND_SIZE, listHand, unlockedRegions, type Fleet } from '../src/game/sim.ts';
import { gameDayIndex } from '../src/sim/day.ts';
import { deriveSeed, makeRng } from '../src/sim/rng.ts';
import { seasonOf } from '../src/sim/saison.ts';
import { cardRegion, findPlane, WORLD } from '../src/world/index.ts';
import { sessionCookie, testApp } from './helpers.ts';

/**
 * L'aide et la page de version disent ce que fait le jeu (étude de la progression,
 * 31 octobre 2026). L'aide promettait « vous ne perdez rien » et des cartes tirées
 * « même les jours où vous ne venez pas » : une carte sans place est perdue pour ce
 * tirage, carte pilote comprise (elle se représente au premier tirage qui trouve une
 * place), et au retour seuls la veille et le jour tirent les leurs. Elle disait
 * qu'aux imprévus « il y en a toujours une qui ne coûte rien » : vrai en francs
 * seulement, attendre ferme la piste. Et la page de version renvoyait chaque changement
 * à un journal clos depuis le 17 octobre. Chaque phrase est lue ici avec la règle qui
 * la rend vraie.
 */
const lire = (chemin: string) => readFileSync(new URL(`../../../${chemin}`, import.meta.url), 'utf8');
/** Une page bilingue : l'article français, puis l'article anglais. */
const langues = (page: string) => {
  const [fr, en] = page.split('data-lang="en"') as [string, string];
  expect(fr).toContain('data-lang="fr"');
  return { fr, en };
};
const aide = langues(lire('packages/client/src/pages/aide.html'));

const signup = { email: 'aide@example.test', nickname: 'Aide', locale: 'fr', ageConfirmed: true, acceptTerms: true };
const DAY = 86_400_000;

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Aide & Cie' }, cookie);
  const { id, player } = t.ctx.db.prepare('SELECT id, player_id AS player FROM companies').get() as { id: string; player: string };
  const visit = () => t.json('GET', '/v1/company', undefined, cookie);
  const hand = () => listHand(t.ctx.db, id).map((h) => h.card).sort();
  return { ...t, cookie, id, player, visit, hand };
}

describe("l'aide dit vrai sur le courrier du jour", () => {
  it("une carte sans place n'est pas pour vous cette fois : l'aide ne promet plus de ne rien perdre, et dit de garder une place", () => {
    expect(aide.fr).not.toContain('vous ne perdez rien');
    expect(aide.fr).not.toContain('même les jours où vous ne venez pas');
    expect(aide.en).not.toContain('you lose nothing');
    expect(aide.en).not.toContain("even on days you don't drop by");
    expect(aide.fr).toContain("quelqu'un d'autre la porte : cette fois, elle n'est pas pour vous. Elle pourra revenir un autre jour");
    expect(aide.en).toContain("goes to someone else — this time round, it's not for you. It may come back another day");
    expect(aide.fr).toContain('<strong>Gardez une place libre</strong>');
    expect(aide.en).toContain('<strong>Leave some room</strong>');
    expect(aide.fr).toContain(`<strong>trois cartes</strong> arrivent, et vous en gardez <strong>cinq au plus</strong>`);
    expect([DAILY_DRAW, HAND_SIZE]).toEqual([3, 5]);
  });

  it("la perte ne vaut que pour ce tirage : une carte sans place peut revenir, le pilote qui manque se présente au premier tirage qui a la place", () => {
    expect(aide.fr).toContain("s'il manque un pilote à l'un de vos avions, il se présente au premier tirage qui trouve une place");
    expect(aide.en).toContain('if one of your planes is short of a pilot, one turns up with the first draw that finds room');
    // Main pleine : le tirage du jour part avec d'autres. Rien ne le retient contre vous :
    // les tirages suivants, avec la même main, le ramènent.
    const grive = findPlane('grive')!;
    const unEquipage: Fleet = { planes: [grive], pilots: 1, reach: 1, home: 'short' };
    const main = WORLD.cards.filter((c) => c.kind === 'contract' && !c.standing && !c.heavy && !c.season && !c.requires && cardRegion(c) === 'brume').slice(0, HAND_SIZE).map((c) => c.id);
    const draw = (day: number, fleet: Fleet) => drawCards(makeRng(deriveSeed('aide', day, 'cards')), main, 1, DAILY_DRAW, ['brume'], [], 'automne', fleet);
    const perdues = draw(0, unEquipage);
    const ensuite = new Set(Array.from({ length: 60 }, (_, d) => draw(d + 1, unEquipage)).flat());
    for (const card of perdues) expect(ensuite.has(card), card).toBe(true);
    // Deux Grives, un seul pilote : la carte d'embauche passe en tête de chaque tirage —
    // la première place libre est pour elle.
    const deuxGrives: Fleet = { ...unEquipage, planes: [grive, grive] };
    const hire = (id: string | undefined) => WORLD.cards.some((c) => c.id === id && c.kind === 'opportunity' && c.offer.type === 'pilot');
    for (let day = 0; day < 30; day += 1) expect(hire(draw(day, deuxGrives)[0]), `jour ${day}`).toBe(true);
  });

  it('au retour, seuls la veille et le jour tirent leurs cartes, comme le dit l\'aide', async () => {
    expect(aide.fr).toContain('les cartes de la veille et du jour vous attendent');
    expect(aide.en).toContain("After time away, yesterday's and today's cards are waiting for you, as long as there's room");
    const t = await company();
    await t.visit();
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    t.advance(4 * DAY);
    // Le tirage de deux jours, rejoué avec les graines du serveur : main vide, puis ce qui reste de place.
    const now = t.ctx.now();
    const fleet = companyFleet(t.ctx.db, t.id);
    const album = (t.ctx.db.prepare('SELECT stamp FROM company_stamps').all() as { stamp: string }[]).map((r) => r.stamp);
    const draw = (day: number, exclude: string[]) => drawCards(makeRng(deriveSeed(t.player, day, 'cards')), exclude, companyLuck(t.ctx.db, t.id), DAILY_DRAW, unlockedRegions(t.ctx.db, t.id), album, seasonOf(now).season, fleet);
    const twoDays = (first: number) => { const a = draw(first, []); return [...a, ...draw(first + 1, a).slice(0, HAND_SIZE - a.length)].sort(); };
    const today = gameDayIndex(now);
    // Les deux plus anciens jours d'absence n'auraient pas donné la même main : le test départage.
    expect(twoDays(today - 3)).not.toEqual(twoDays(today - 1));
    await t.visit();
    expect(t.hand()).toEqual(twoDays(today - 1));
    await t.app.close();
  });
});

describe("l'aide dit vrai sur les imprévus", () => {
  const events = WORLD.cards.filter((c) => c.kind === 'event');
  const free = (e: (typeof events)[number]) => e.choices.filter((ch) => (ch.effects.francs ?? 0) >= 0);

  it("une réponse sans francs, toujours ; mais souvent, c'est attendre, et attendre ferme la piste", () => {
    for (const e of events) expect(free(e).length, e.id).toBeGreaterThan(0);
    // Des imprévus dont la seule réponse sans francs est d'attendre : la vache, la citerne, la marée…
    const onlyWait = events.filter((e) => free(e).every((ch) => ch.effects.waitHours)).map((e) => e.id);
    expect(onlyWait).toEqual(expect.arrayContaining(['e-vache', 'e-citerne', 'e-hetre-couche']));
    expect(aide.fr).not.toContain('il y en a toujours une qui ne coûte rien');
    expect(aide.en).not.toContain('there is always one that costs nothing');
    expect(aide.fr).toContain('il y en a toujours une qui ne coûte aucun franc, mais elle a souvent un autre prix');
    expect(aide.en).toContain("there is always one that doesn't cost a franc, but it often costs something else");
    expect(aide.fr).toContain('<strong>Attendre ferme la piste</strong> le temps écrit sur la réponse');
    expect(aide.en).toContain('<strong>Waiting closes the runway</strong> for as long as the answer says');
  });

  it("« Expédier » grisé : un imprévu à trancher, ou une piste fermée parce qu'on a choisi d'attendre", () => {
    expect(aide.fr).not.toContain('Tranchez-le, la piste se libère');
    expect(aide.en).not.toContain('Decide it, and the runway clears');
    expect(aide.fr).toContain("Si vous avez choisi d'attendre, la piste reste fermée jusqu'à l'heure écrite sur vos cartes");
    expect(aide.en).toContain('If you chose to wait, the runway stays closed until the time shown on your cards');
  });
});

describe('une occasion attend dans la main, et l\'aide le dit', () => {
  it("la carte d'une Grive trop chère reste en main, refus d'achat et tirages passés", async () => {
    expect(aide.fr).toContain("une occasion qui attend dans votre main n'expire pas");
    expect(aide.en).toContain('an opportunity waiting in your hand never expires');
    const t = await company();
    await t.visit();
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    t.ctx.db.prepare("INSERT INTO company_hand (company_id, card, drawn_at) VALUES (?, 'o-grive', ?)").run(t.id, t.ctx.now());
    // 300 F en caisse et un hangar à une place, déjà pris : l'achat est refusé, la carte reste.
    expect(WORLD.start.francs).toBeLessThan(1500);
    expect((await t.json('POST', '/v1/company/cards/o-grive/play', {}, t.cookie)).statusCode).not.toBe(200);
    expect(t.hand()).toContain('o-grive');
    for (let day = 0; day < 5; day += 1) {
      t.advance(DAY);
      await t.visit();
      expect(t.hand(), `jour ${day + 1}`).toContain('o-grive');
    }
    await t.app.close();
  });
});

describe('la page de version ne renvoie plus chaque changement au journal clos', () => {
  const version = langues(lire('packages/client/src/pages/version.html'));
  const journal = lire('docs/JOURNAL.md');

  it("le journal s'arrête au 17 octobre ; la suite se lit dans l'historique du dépôt, la conception et le monde", () => {
    expect(version.fr).not.toContain('Chaque changement est raconté');
    expect(version.en).not.toContain('Every change is told');
    const days = [...journal.matchAll(/^## Chapitre [^\n]*\((\d+) octobre 2026/gm)].map((m) => Number(m[1]));
    const [first, last] = [Math.min(...days), Math.max(...days)];
    expect(journal).toContain("c'est ici que le récit s'arrête");
    expect(version.fr).toContain(`raconte la naissance du jeu, du ${first} au ${last} octobre 2026, et s'arrête là`);
    expect(version.en).toContain(`tells how the game was born, from ${first} to ${last} October 2026, and stops there`);
    for (const page of [version.fr, version.en]) {
      expect(page).toContain('https://github.com/regis57/altiplume/pulls?q=is%3Apr+is%3Amerged');
      for (const doc of ['docs/CONCEPTION.md', 'docs/MONDE.md']) {
        expect(page).toContain(`https://github.com/regis57/altiplume/blob/main/${doc}`);
        expect(existsSync(new URL(`../../../${doc}`, import.meta.url)), doc).toBe(true);
      }
    }
  });
});
