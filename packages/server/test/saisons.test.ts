import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { drawCards, seasonEffect } from '../src/game/sim.ts';
import { seasonOf } from '../src/sim/saison.ts';
import { makeRng } from '../src/sim/rng.ts';
import { WORLD, cardRegion, findCard } from '../src/world/index.ts';
import type { Card, Text } from '../src/world/types.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

describe('les saisons — le calendrier', () => {
  it('suit les dates du calendrier, en temps universel', () => {
    expect(seasonOf(Date.UTC(2027, 2, 19, 23, 59)).season).toBe('hiver');
    expect(seasonOf(Date.UTC(2027, 2, 20)).season).toBe('printemps');
    expect(seasonOf(Date.UTC(2027, 5, 21)).season).toBe('ete');
    expect(seasonOf(Date.UTC(2026, 9, 12, 18)).season).toBe('automne');
    expect(seasonOf(Date.UTC(2026, 11, 21)).season).toBe('hiver');
  });

  it("enjambe le nouvel an : l'hiver commence en décembre et finit en mars", () => {
    const s = seasonOf(Date.UTC(2027, 0, 1));
    expect(s.season).toBe('hiver');
    expect(s.startsAt).toBe(Date.UTC(2026, 11, 21));
    expect(s.endsAt).toBe(Date.UTC(2027, 2, 20));
  });

  it("dit ce qu'elle change, et rien de plus", () => {
    const at = (m: number) => Date.UTC(2027, m, 1);
    expect(seasonEffect(at(0), 'duration')).toBe(1.15); // janvier : hiver
    expect(seasonEffect(at(0), 'reward')).toBe(1.2);
    expect(seasonEffect(at(6), 'fogRisk')).toBe(0.5); // juillet : été
    expect(seasonEffect(at(6), 'seawindRisk')).toBe(0.5);
    expect(seasonEffect(at(9), 'fogRisk')).toBe(1.5); // octobre : automne
    expect(seasonEffect(at(3), 'seedsWeight')).toBe(2); // avril : printemps
    expect(seasonEffect(at(3), 'duration')).toBe(1);
    expect(WORLD.seasons.map((s) => s.id)).toEqual(['printemps', 'ete', 'automne', 'hiver']);
  });
});

describe('les saisons — le courrier', () => {
  const regions = ['brume', 'saline'] as const;
  const draws = (season: 'printemps' | 'ete' | 'automne' | 'hiver') => {
    const all: string[] = [];
    for (let seed = 0; seed < 2000; seed += 1) all.push(...drawCards(makeRng(seed), [], 1, 3, regions, [], season));
    return all;
  };

  it("ne tire une carte de saison qu'en sa saison", () => {
    for (const season of ['printemps', 'ete', 'automne', 'hiver'] as const) {
      const seen = new Set(draws(season));
      for (const c of WORLD.cards) {
        if (c.kind === 'opportunity' || !c.season) continue;
        if (!(regions as readonly string[]).includes(cardRegion(c))) continue;
        expect(seen.has(c.id), `${c.id} en ${season}`).toBe(c.season === season);
      }
    }
    // Sans saison donnée, aucune carte de saison.
    const sans = new Set<string>();
    for (let seed = 0; seed < 500; seed += 1) for (const id of drawCards(makeRng(seed), [], 1, 3, regions)) sans.add(id);
    expect([...sans].some((id) => { const c = findCard(id)!; return c.kind !== 'opportunity' && c.season; })).toBe(false);
  });

  it('remplit les sacs de semences au printemps', () => {
    const seeds = (list: string[]) => list.filter((id) => { const c = findCard(id)!; return c.kind === 'contract' && c.cargo === 'seeds'; }).length;
    expect(seeds(draws('printemps'))).toBeGreaterThan(seeds(draws('automne')) * 1.4);
  });

  it('donne à chaque saison deux contrats et un imprévu', () => {
    for (const season of ['printemps', 'ete', 'automne', 'hiver']) {
      expect(WORLD.cards.filter((c) => c.kind === 'contract' && c.season === season), season).toHaveLength(2);
      expect(WORLD.cards.filter((c) => c.kind === 'event' && c.season === season), season).toHaveLength(1);
    }
  });
});

describe('les saisons — en vol', () => {
  async function company(at: number) {
    const t = await testApp(at);
    await t.json('POST', '/v1/auth/register', signup);
    const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    await t.json('POST', '/v1/company', { name: 'Les Ailes de la Croisette' }, cookie);
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json();
    const give = (card: string) => t.ctx.db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
    return { ...t, cookie, state, give };
  }

  it("rallonge les vols l'hiver, et paie la prime de froid", async () => {
    const t = await company(Date.UTC(2027, 0, 12, 10));
    const s0 = await t.state();
    expect(s0.season).toEqual({ id: 'hiver', endsAt: Date.UTC(2027, 2, 20) });
    t.give('c-journal');
    const r = await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie);
    expect(r.statusCode).toBe(201);
    const f = r.json().flights[0];
    // 5 min × 1,15 ; × 1,3 encore si l'aléa du vol a frappé.
    expect([Math.round(5 * 60_000 * 1.15), Math.round(Math.round(5 * 60_000 * 1.15) * 1.3)]).toContain(f.arrivesAt - f.departedAt);
    // Le journal du matin vaut 33 F ; l'hiver, 40.
    expect(f.reward).toBe(Math.round(33 * 1.2));
    await t.app.close();
  });

  it("colle la page de la saison à la première livraison, et « Une année » à la quatrième", async () => {
    const t = await company(Date.UTC(2027, 0, 12, 10));
    // Trois saisons déjà vécues.
    for (const s of ['s-printemps', 's-ete', 's-automne']) {
      t.ctx.db.prepare('INSERT INTO company_stamps (company_id, stamp, earned_at) VALUES ((SELECT id FROM companies), ?, 0)').run(s);
    }
    const s0 = await t.state();
    await t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie);
    t.advance(60 * 60_000);
    const s = await t.state();
    const pages = s.news.filter((n: { kind: string }) => n.kind === 'stamp').map((n: { stamp: string }) => n.stamp);
    expect(pages).toContain('s-hiver');
    expect(pages).toContain('s-annee');
    await t.app.close();
  });
});

/**
 * Une carte sans saison se tire toute l'année (une opportunité, toujours) : son
 * texte ne peut pas parler d'une saison. Le 18/10, en automne, « Les Tilleuls fêtent
 * la floraison » ; le pressoir cassait « la veille de la récolte » et la fleur de sel
 * était « la première récolte de l'année », en toute saison.
 */
describe('les saisons — les textes', () => {
  // Les mots d'une saison, pris en début de mot (« gel » prend « geler », pas « Angèle »).
  const SAISONNIERS: Record<keyof Text, RegExp> = {
    fr: /(?<!\p{L})(saisons?|printemps|printani\p{L}*|(?:l'|cet |en |d')été|estival\p{L}*|automn\p{L}*|hiver\p{L}*|neig\p{L}*|enneig\p{L}*|gel(?:é|ée|er|ent|ait)?s?|givre|verglas|dégel|redoux|floraison|en fleurs?|bourgeon\p{L}*|sève|récolte\p{L}*|vendange\p{L}*|moisson\p{L}*|fenaison|cueillette|feuilles mortes|canicule|chaleur|noël|pâques|toussaint|étrennes|nouvel an|jour de l'an|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)(?!\p{L})/iu,
    en: /(?<!\p{L})(seasons?|seasonal|spring(?:time)?|summer\p{L}*|autumn\p{L}*|winter\p{L}*|snow\p{L}*|frost\p{L}*|freez\p{L}*|froze\p{L}*|thaw\p{L}*|blossom\p{L}*|bloom\p{L}*|buds?|sap|harvest\p{L}*|vintage|haymaking|heatwave|heat|christmas|easter|new year\p{L}*|january|february|march|april|june|july|august|september|october|november|december|(?:of|in) may|may day)(?!\p{L})/iu,
  };
  // Ce qui reste vrai toute l'année : un souvenir, ou une consigne.
  const PERMIS: Record<string, readonly string[]> = {
    'c-chaudiere': ["l'hiver dernier", 'last winter'], // l'hiver passé : vrai en toute saison
    'c-cuivre-mine': ["depuis l'automne", 'since autumn'], // depuis le dernier automne
    'c-cire': ['ni geler', 'nor freeze'], // une consigne d'emballage
  };

  function textes(c: Card): { où: string; t: Text }[] {
    const out = [{ où: 'titre', t: c.title }, { où: 'texte', t: c.text }];
    if (c.kind === 'event') for (const ch of c.choices) out.push({ où: `${ch.id}.choix`, t: ch.label }, { où: `${ch.id}.issue`, t: ch.outcome });
    return out;
  }

  it("ne parlent d'une saison que si elles ne se tirent qu'en elle", () => {
    const sansSaison = WORLD.cards.filter((c) => c.kind === 'opportunity' || !c.season);
    expect(sansSaison.length).toBeGreaterThan(80);
    const fautes: string[] = [];
    for (const c of sansSaison) {
      for (const { où, t } of textes(c)) {
        for (const lang of ['fr', 'en'] as const) {
          let s = t[lang];
          for (const p of PERMIS[c.id] ?? []) s = s.replace(p, '');
          const m = s.match(SAISONNIERS[lang]);
          if (m) fautes.push(`${c.id} ${où} ${lang} : « ${m[0]} »`);
        }
      }
    }
    expect(fautes).toEqual([]);
  });

  it('les exceptions sont encore là, mot pour mot', () => {
    for (const [id, phrases] of Object.entries(PERMIS)) {
      const tout = textes(findCard(id)!).flatMap(({ t }) => [t.fr, t.en]).join(' ');
      for (const p of phrases) expect(tout, `${id} : ${p}`).toContain(p);
    }
  });

  it('le filtre reconnaît une saison, et pas un mot ordinaire', () => {
    for (const s of ['Les Tilleuls fêtent la floraison.', 'la veille de la récolte', "L'été, Sainte-Ambre a des visiteurs", 'Le premier matin de mai', 'La neige a tout recouvert.']) expect(s).toMatch(SAISONNIERS.fr);
    for (const s of ['celebrating the blossom', 'the day before the harvest', 'In summer Amber Holm', 'the first morning of May', 'Snow has covered everything.']) expect(s).toMatch(SAISONNIERS.en);
    for (const s of ['La fleur de sel', 'Il a été là', 'La maison du maire', 'Angèle et Gélase']) expect(s).not.toMatch(SAISONNIERS.fr);
    for (const s of ['Someone may claim it.', 'The salt flower', 'Up on the ridge', 'a spare glass']) expect(s).not.toMatch(SAISONNIERS.en);
  });
});
