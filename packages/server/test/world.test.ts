import { describe, expect, it } from 'vitest';
import { WORLD, cardRegion, findDestination, findPilot, findPlane, flightDurationMs, localizeScene, localizeWorld, regionDestinations } from '../src/world/index.ts';
import { cleanCompanyName, foldName, isDeniedName, suggestNames } from '../src/world/names.ts';
import type { Text } from '../src/world/types.ts';
import { testApp } from './helpers.ts';

/** Parcourt récursivement un objet et rend tous les `Text` trouvés. */
function texts(value: unknown, path = 'racine'): { path: string; text: Text }[] {
  if (value === null || typeof value !== 'object') return [];
  const o = value as Record<string, unknown>;
  if (typeof o['fr'] === 'string' && typeof o['en'] === 'string' && Object.keys(o).length === 2) return [{ path, text: o as unknown as Text }];
  return Object.entries(o).flatMap(([k, v]) => texts(v, `${path}.${k}`));
}

describe('le monde — intégrité', () => {
  it('a des identifiants uniques partout', () => {
    for (const list of [WORLD.destinations, WORLD.planes, WORLD.traits, WORLD.pilots, WORLD.cards, WORLD.decorations, WORLD.stamps]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('a chaque texte en français ET en anglais, jamais vide, jamais identique sauf noms propres', () => {
    const all = texts(WORLD);
    expect(all.length).toBeGreaterThan(250);
    for (const { path, text } of all) {
      expect(text.fr.trim(), path).not.toBe('');
      expect(text.en.trim(), path).not.toBe('');
    }
    // Les descriptions (phrases) doivent différer ; seuls de courts noms propres peuvent coïncider.
    const same = all.filter(({ text }) => text.fr === text.en && text.fr.length > 20);
    expect(same.map((s) => s.path)).toEqual([]);
  });

  it('nomme les lieux nativement en anglais, sans traduction littérale', () => {
    const literal = ['Mist Valley', 'Bridge of Mist', 'Grey Mill', 'High Ferrand', 'Lantern of the Vale'];
    const en = [WORLD.region.name.en, ...WORLD.destinations.map((d) => d.name.en)];
    for (const name of en) expect(literal).not.toContain(name);
    expect(WORLD.home.address.en).toContain('Crosslet Lane');
    expect(WORLD.home.address.fr).toMatch(/chemin de la Croisette/i);
  });

  it('compte autant de femmes que d\'hommes parmi les pilotes, venus de lieux différents', () => {
    const f = WORLD.pilots.filter((p) => p.gender === 'f').length;
    const m = WORLD.pilots.filter((p) => p.gender === 'm').length;
    // Règle du projet depuis le premier jour. Rompue le 12/10 par le renommage de
    // Marthe Vaudrin en Prosper Chickenman, rétablie le jour même par Garance
    // Thuillier et Hedda Vilmorin.
    expect(f).toBe(m);
    expect(new Set(WORLD.pilots.map((p) => p.origin.fr)).size).toBe(WORLD.pilots.length);
  });

  it('donne à chaque pilote deux traits existants et une histoire en trois scènes croissantes', () => {
    const traitIds = new Set(WORLD.traits.map((t) => t.id));
    for (const p of WORLD.pilots) {
      expect(p.traits[0]).not.toBe(p.traits[1]);
      for (const t of p.traits) expect(traitIds.has(t), `${p.id}: ${t}`).toBe(true);
      expect(p.story.scenes.length).toBe(3);
      const aff = p.story.scenes.map((s) => s.affinity);
      expect([...aff].sort((a, b) => a - b)).toEqual(aff);
      for (const s of p.story.scenes) expect(s.lines.length).toBeGreaterThanOrEqual(4);
    }
    // Le chemin de la Croisette existe dans les histoires, pas seulement sur l'adresse.
    const story = JSON.stringify(WORLD.pilots.map((p) => p.story));
    expect(story).toContain('chemin de la Croisette');
    expect(story).toContain('Crosslet Lane');
  });

  it('livre la vallée (v0.1) : 6 destinations, 3 avions, 4 pilotes, 20+10+4 cartes et la ligne régulière, 10 décorations', () => {
    const brume = (c: (typeof WORLD.cards)[number]) => cardRegion(c) === 'brume';
    expect(regionDestinations('brume')).toHaveLength(6);
    // Les avions de la vallée : une piste ordinaire (ni l'eau, ni la clairière).
    expect(WORLD.planes.filter((p) => ['short', 'medium', 'long'].includes(p.runway)).map((p) => p.id)).toEqual(['grive', 'martinet', 'heron']);
    expect(WORLD.pilots.filter((p) => p.starter || ['ilias', 'yse', 'aurele'].includes(p.id))).toHaveLength(4);
    expect(WORLD.cards.filter((c) => c.kind === 'contract' && !c.standing && brume(c))).toHaveLength(20);
    expect(WORLD.cards.filter((c) => c.kind === 'contract' && c.standing)).toHaveLength(1);
    expect(WORLD.cards.filter((c) => c.kind === 'event' && brume(c))).toHaveLength(10);
    expect(WORLD.cards.filter((c) => c.kind === 'opportunity' && brume(c))).toHaveLength(4);
    expect(WORLD.decorations).toHaveLength(10);
  });

  it('livre la Côte de Saline (v0.2) : 6 escales dont 3 sur l\'eau, un hydravion, 15+2+2 cartes, une route à 10 cachets', () => {
    const saline = (c: (typeof WORLD.cards)[number]) => cardRegion(c) === 'saline';
    const escales = regionDestinations('saline');
    expect(escales).toHaveLength(6);
    expect(escales.filter((d) => d.runway === 'water')).toHaveLength(3);
    expect(WORLD.planes.filter((p) => p.runway === 'water').map((p) => p.id)).toEqual(['sterne', 'goeland']);
    expect(WORLD.cards.filter((c) => c.kind === 'contract' && saline(c))).toHaveLength(15);
    expect(WORLD.cards.filter((c) => c.kind === 'event' && saline(c))).toHaveLength(2);
    expect(WORLD.cards.filter((c) => c.kind === 'opportunity' && saline(c))).toHaveLength(3); // + le Goéland, vendu à Port-Sel
    expect(WORLD.regions.map((r) => r.id)).toEqual(['brume', 'saline', 'archipel', 'cuivre']);
    expect(WORLD.regions[1]!.route).toEqual({ requires: 's-vallee', cost: 10 });
    expect(WORLD.region.route).toBeUndefined();
    // Chaque escale a sa page, la Côte a la sienne, et la route aussi.
    for (const id of ['s-cote', 's-route-saline', 's-hydravion']) expect(WORLD.stamps.some((s) => s.id === id), id).toBe(true);
    // Le ponton accueille un hydravion au niveau 2, aucun avant.
    const ponton = WORLD.zones.find((z) => z.id === 'ponton')!;
    expect(ponton.levels.map((l) => l.seaplanes)).toEqual([0, 1, 2]);
  });

  it("livre l'Archipel des Lanternes (v0.2) : 6 îles sur l'eau, la plupart de nuit, 12+2+1 cartes, le Goéland, une route à 15 cachets, deux pilotes de plus", () => {
    const archipel = (c: (typeof WORLD.cards)[number]) => cardRegion(c) === 'archipel';
    const iles = regionDestinations('archipel');
    expect(iles).toHaveLength(6);
    expect(iles.every((d) => d.runway === 'water')).toBe(true);
    expect(iles.filter((d) => d.hazard === 'night').length).toBeGreaterThanOrEqual(4);
    expect(WORLD.cards.filter((c) => c.kind === 'contract' && archipel(c))).toHaveLength(12);
    expect(WORLD.cards.filter((c) => c.kind === 'event' && archipel(c))).toHaveLength(2);
    expect(WORLD.cards.filter((c) => c.kind === 'opportunity' && archipel(c))).toHaveLength(1);
    expect(WORLD.regions[2]!.route).toEqual({ requires: 's-cote', cost: 15 });
    for (const id of ['s-archipel', 's-route-archipel']) expect(WORLD.stamps.some((s) => s.id === id), id).toBe(true);
    // Le Goéland atteint tout ; la Sterne n'atteint les îles qu'avec un pilote de Longues routes (× 1,2 → 16,8).
    const goeland = findPlane('goeland')!; const sterne = findPlane('sterne')!;
    for (const d of iles) expect(d.distance).toBeLessThanOrEqual(goeland.range);
    expect(iles.filter((d) => d.distance <= sterne.range * 1.2).map((d) => d.id)).toEqual(['ile-aux-fanaux', 'grand-recif', 'sainte-lueur']);
    expect(iles.some((d) => d.distance > sterne.range * 1.2)).toBe(true);
    // Huit pilotes à la v0.2, parité gardée, une Nocturne pour les îles.
    expect(WORLD.pilots.length).toBeGreaterThanOrEqual(8);
    expect(WORLD.pilots.filter((p) => p.traits.includes('nightowl')).length).toBeGreaterThanOrEqual(2);
  });

  it("livre la Forêt de Cuivre (v0.3) : 6 escales dont 3 clairières, le Pic, 12+2+3 cartes, une seconde route depuis la vallée à 12 cachets, deux pilotes", () => {
    const cuivre = (c: (typeof WORLD.cards)[number]) => cardRegion(c) === 'cuivre';
    const escales = regionDestinations('cuivre');
    expect(escales).toHaveLength(6);
    expect(escales.filter((d) => d.runway === 'clearing').map((d) => d.id)).toEqual(['sonnefeuille', 'vert-de-gris', 'le-hetre-roi']);
    expect(escales.filter((d) => d.hazard === 'canopy').length).toBeGreaterThanOrEqual(3);
    expect(WORLD.cards.filter((c) => c.kind === 'contract' && cuivre(c))).toHaveLength(12);
    expect(WORLD.cards.filter((c) => c.kind === 'event' && cuivre(c))).toHaveLength(2);
    expect(WORLD.cards.filter((c) => c.kind === 'opportunity' && cuivre(c))).toHaveLength(3);
    // Une seconde route part de la vallée : on choisit par où l'on grandit, la mer ou les arbres.
    expect(WORLD.regions.find((r) => r.id === 'cuivre')!.route).toEqual({ requires: 's-vallee', cost: 12 });
    for (const id of ['s-route-cuivre', 's-clairiere', 's-foret']) expect(WORLD.stamps.some((s) => s.id === id), id).toBe(true);
    // Le Pic atteint tout, entre une demi-heure et une heure ; la Grive, deux escales seule et une troisième avec un pilote de Longues routes.
    const pic = findPlane('pic')!; const grive = findPlane('grive')!;
    expect(pic.runway).toBe('clearing');
    for (const d of escales) {
      const minutes = flightDurationMs(d, pic) / 60_000;
      expect(minutes, d.id).toBeGreaterThanOrEqual(30);
      expect(minutes, d.id).toBeLessThanOrEqual(60);
      expect(d.distance, d.id).toBeLessThanOrEqual(pic.range);
    }
    const land = escales.filter((d) => d.runway !== 'clearing');
    expect(land.filter((d) => d.distance <= grive.range).map((d) => d.id)).toEqual(['les-charbonnieres', 'villechaudron']);
    expect(land.filter((d) => d.distance <= grive.range * 1.2).map((d) => d.id)).toEqual(['les-charbonnieres', 'villechaudron', 'les-scieries']);
    // Dix pilotes : cinq femmes, cinq hommes. Gaspard et Rosalie arrivent les derniers.
    expect(WORLD.pilots).toHaveLength(10);
    expect(WORLD.pilots.slice(-2).map((p) => [p.id, p.gender])).toEqual([['gaspard', 'm'], ['rosalie', 'f']]);
  });

  it('tisse les histoires entre elles : la forêt répond à ce qui existe déjà', () => {
    const story = (id: string) => JSON.stringify(findPilot(id)!.story);
    // Gaspard rapporte le sac de Bastien sous la poutre de Prosper ; Hedda reconnaît les boîtes du nord.
    expect(story('gaspard')).toContain('Bastien');
    expect(story('gaspard')).toContain('poutre');
    expect(story('gaspard')).toContain('Hedda');
    // Rosalie reconnaît le poinçon de sa grand-mère sur la lanterne de Solenn, et prépare la cloche de Sainte-Lueur.
    expect(story('rosalie')).toContain('Solenn');
    expect(story('rosalie')).toContain('Sainte-Lueur');
    expect(story('rosalie')).toContain('Villechaudron');
    // Les escales le savent aussi.
    expect(findDestination('les-scieries')!.description.fr).toContain('Solenn');
    expect(findDestination('le-hetre-roi')!.description.fr).toContain('facteur des bois');
  });

  it('ne référence que des destinations, avions et pilotes existants', () => {
    for (const c of WORLD.cards) {
      if (c.kind === 'contract') {
        const d = findDestination(c.destination);
        expect(d, c.id).toBeDefined();
        expect(d!.mail, `${c.id} : ${c.cargo} n'est pas un courrier de ${c.destination}`).toContain(c.cargo);
        expect(c.bags).toBeGreaterThanOrEqual(1);
        if (c.standing) expect(c.bonus).toBe(0); else expect(c.bonus).toBeGreaterThan(0);
      }
      if (c.kind === 'opportunity' && c.offer.type === 'plane') expect(findPlane(c.offer.model)).toBeDefined();
      if (c.kind === 'event') expect(c.choices.length).toBeGreaterThanOrEqual(2);
    }
    for (const id of WORLD.start.planes) expect(findPlane(id)?.starter).toBe(true);
    for (const id of WORLD.start.pilots) expect(findPilot(id)?.starter).toBe(true);
    for (const d of WORLD.destinations) expect(WORLD.stamps.some((s) => s.id === `s-${d.id}`), d.id).toBe(true);
  });

  it('tient les temps de vol de la vallée entre 3 et 45 minutes avec le biplan, et toute la vallée à sa portée', () => {
    const grive = findPlane('grive')!;
    for (const d of regionDestinations('brume')) {
      const minutes = flightDurationMs(d, grive) / 60_000;
      expect(minutes, d.id).toBeGreaterThanOrEqual(3);
      expect(minutes, d.id).toBeLessThanOrEqual(45);
      expect(d.distance, d.id).toBeLessThanOrEqual(grive.range);
    }
    // Le Martinet va deux fois plus vite ; le Héron ne se pose que sur piste longue.
    expect(flightDurationMs(findDestination('combe-aux-rosees')!, findPlane('martinet')!)).toBe(15 * 60_000);
    expect(findPlane('heron')!.runway).toBe('long');
  });

  it('met toute la Côte à portée de la Sterne, entre 30 et 60 minutes, et deux escales à portée des avions de la vallée', () => {
    const sterne = findPlane('sterne')!;
    const escales = regionDestinations('saline');
    for (const d of escales) {
      const minutes = flightDurationMs(d, sterne) / 60_000;
      expect(minutes, d.id).toBeGreaterThanOrEqual(30);
      expect(minutes, d.id).toBeLessThanOrEqual(60);
      expect(d.distance, d.id).toBeLessThanOrEqual(sterne.range);
      // Les escales de la Côte sont toutes plus loin que le bout de la vallée.
      expect(d.distance).toBeGreaterThan(findDestination('combe-aux-rosees')!.distance);
    }
    const grive = findPlane('grive')!;
    const reachable = escales.filter((d) => d.distance <= grive.range && d.runway !== 'water');
    expect(reachable.map((d) => d.id)).toEqual(['port-sel', 'les-oeillets']);
  });

  it('rend chaque contrat rentable, et les lointains mieux payés', () => {
    const grive = findPlane('grive')!;
    const prosper = findPilot('prosper')!;
    for (const c of WORLD.cards) {
      if (c.kind !== 'contract') continue;
      expect(c.reward).toBeGreaterThan(grive.upkeep + prosper.wage);
    }
    const byDistance = WORLD.destinations.map((d) => {
      const rewards = WORLD.cards.flatMap((c) => (c.kind === 'contract' && c.destination === d.id ? [c.reward] : []));
      return { distance: d.distance, avg: rewards.reduce((a, b) => a + b, 0) / rewards.length };
    }).sort((a, b) => a.distance - b.distance);
    for (let i = 1; i < byDistance.length; i += 1) expect(byDistance[i]!.avg).toBeGreaterThan(byDistance[i - 1]!.avg);
  });

  it('se lit dans une langue, sans les histoires ni les poids', () => {
    const fr = localizeWorld('fr');
    const en = localizeWorld('en');
    expect(fr.destinations[0]!.name).toBe('Pont-de-Brume');
    expect(en.destinations[0]!.name).toBe('Mistbridge');
    expect(en.pilots[0]!.name).toBe('Prosper Chickenman');
    expect(JSON.stringify(fr)).not.toContain('"weight"');
    expect(JSON.stringify(fr)).not.toContain('Bastien mesurait');
    const scene = localizeScene(findPilot('prosper')!, 0, 'en')!;
    expect(scene.title).toBe('The cross at the end of the lane');
    expect(localizeScene(findPilot('prosper')!, 3, 'en')).toBeNull();
  });
});

describe('noms de compagnie', () => {
  it('propose trois noms distincts, reproductibles, natifs dans chaque langue', () => {
    const a = suggestNames('fr', 42);
    const b = suggestNames('fr', 42);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(3);
    expect(suggestNames('fr', 43)).not.toEqual(a);
    for (const n of suggestNames('en', 7)) expect(n).toMatch(/Co\.|Line|Sons|Airmail|Airways|Company|Wings/);
    for (const n of a) expect(n).toMatch(/Cie|Compagnie|Comptoir|Messageries|Lignes|Fils|Poste|Ailes/);
  });

  it('ne produit jamais un nom de la liste noire, sur mille tirages', () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      for (const n of suggestNames(seed % 2 ? 'fr' : 'en', seed)) expect(isDeniedName(n), n).toBe(false);
    }
  });

  it('nettoie et refuse ce qu\'il faut', () => {
    expect(cleanCompanyName('  Brume   Dorée & Cie ')).toBe('Brume Dorée & Cie');
    expect(cleanCompanyName('Altiplume & Co.')).toBe('Altiplume & Co.');
    expect(cleanCompanyName('Ab')).toBeNull();
    expect(cleanCompanyName('x'.repeat(41))).toBeNull();
    expect(cleanCompanyName('<script>')).toBeNull();
    expect(cleanCompanyName('Air France Cargo')).toBeNull();
    expect(cleanCompanyName('Aéropostale')).toBeNull();
    expect(foldName('Aéro-Postale')).toBe('aero postale');
    expect(isDeniedName('Lufthansa Express')).toBe(true);
    expect(isDeniedName('Lanterne & Fils')).toBe(false);
  });
});

describe('GET /v1/world', () => {
  it('est public, mis en cache, et suit la langue demandée', async () => {
    const t = await testApp();
    const fr = await t.app.inject({ method: 'GET', url: '/v1/world' });
    expect(fr.statusCode).toBe(200);
    expect(fr.headers['cache-control']).toBe('public, max-age=3600');
    expect(fr.json().home.name).toBe('Aérodrome de la Croisette');
    const en = await t.app.inject({ method: 'GET', url: '/v1/world?locale=en' });
    expect(en.json().home.name).toBe('Crosslet Field');
    expect(en.json().pilots.map((p: { name: string }) => p.name)).toContain('Aurel Combray');
    expect((await t.app.inject({ method: 'GET', url: '/v1/world?locale=de' })).json().home.name).toBe('Aérodrome de la Croisette');
    expect((await t.app.inject({ method: 'GET', url: '/v1/world?x=1' })).statusCode).toBe(400);
    await t.app.close();
  });
});

describe('noms de compagnie — articles', () => {
  it('ne produit jamais « des la » ni « de Brume » sans article', async () => {
    const { suggestNames } = await import('../src/world/names.ts');
    const seen = new Set<string>();
    for (let i = 0; i < 300; i += 1) for (const n of suggestNames('fr', i)) seen.add(n);
    for (const n of seen) {
      expect(n).not.toMatch(/\bdes la\b/);
      expect(n).not.toMatch(/\b(Compagnie|Lignes|Ailes) (Brume|Saline|Ocre|Cuivre|Verre)\b/);
    }
    expect([...seen].some((n) => n === 'Compagnie de la Croisette')).toBe(true);
  });
});
