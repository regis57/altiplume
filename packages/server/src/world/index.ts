/**
 * Le monde, assemblé, et les fonctions pour le lire dans une langue.
 */
import type { Locale } from '../auth/validation.ts';
import { DECORATIONS, STAMPS, ZONES } from './aerodrome.ts';
import { BRUME, DESTINATIONS, HOME } from './brume.ts';
import { CONTRACTS, EVENTS, OPPORTUNITIES } from './cards.ts';
import { PILOTS } from './pilots.ts';
import { PLANES } from './planes.ts';
import { SALINE, SALINE_DESTINATIONS } from './saline.ts';
import { ARCHIPEL, ARCHIPEL_DESTINATIONS } from './archipel.ts';
import { CUIVRE, CUIVRE_DESTINATIONS } from './cuivre.ts';
import { TRAITS } from './traits.ts';
import { SEASONS } from './saisons.ts';
import type { Card, Destination, PilotTemplate, PlaneModel, Region, RegionId, Text, Trait, World } from './types.ts';

export const WORLD: World = {
  region: BRUME,
  regions: [BRUME, SALINE, ARCHIPEL, CUIVRE],
  home: HOME,
  destinations: [...DESTINATIONS, ...SALINE_DESTINATIONS, ...ARCHIPEL_DESTINATIONS, ...CUIVRE_DESTINATIONS],
  planes: PLANES,
  traits: TRAITS,
  pilots: PILOTS,
  cards: [...CONTRACTS, ...EVENTS, ...OPPORTUNITIES],
  zones: ZONES,
  decorations: DECORATIONS,
  stamps: STAMPS,
  seasons: SEASONS,
  start: { francs: 300, stamps: 0, planes: ['grive'], pilots: ['prosper'] },
};

export function text(t: Text, locale: Locale): string {
  return t[locale];
}

export function findRegion(id: string): Region | undefined {
  return WORLD.regions.find((r) => r.id === id);
}
/** Les escales d'une région. */
export function regionDestinations(region: RegionId): readonly Destination[] {
  return WORLD.destinations.filter((d) => d.region === region);
}
/** La région dont une carte dépend : celle de sa destination pour un contrat, la sienne sinon. */
export function cardRegion(card: Card): RegionId {
  if (card.kind === 'contract') return findDestination(card.destination)?.region ?? 'brume';
  return card.region ?? 'brume';
}
export function findDestination(id: string): Destination | undefined {
  return WORLD.destinations.find((d) => d.id === id);
}
export function findPlane(id: string): PlaneModel | undefined {
  return WORLD.planes.find((p) => p.id === id);
}
export function findPilot(id: string): PilotTemplate | undefined {
  return WORLD.pilots.find((p) => p.id === id);
}
export function findTrait(id: string): Trait | undefined {
  return WORLD.traits.find((t) => t.id === id);
}
export function findCard(id: string): Card | undefined {
  return WORLD.cards.find((c) => c.id === id);
}

/** Durée d'un vol aller simple, en millisecondes, pour un avion donné (hors traits). */
export function flightDurationMs(destination: Destination, plane: PlaneModel, speedFactor = 1): number {
  const hours = destination.distance / (plane.speed * speedFactor);
  return Math.round(hours * 3_600_000);
}

/**
 * Le monde tel que le client le reçoit : textes dans une langue, sans les histoires
 * des pilotes (elles se gagnent, vol après vol) et sans les poids de tirage.
 */
export function localizeWorld(locale: Locale) {
  const tx = (t: Text) => text(t, locale);
  return {
    region: { id: WORLD.region.id, name: tx(WORLD.region.name), tagline: tx(WORLD.region.tagline), description: tx(WORLD.region.description), palette: WORLD.region.palette },
    regions: WORLD.regions.map((r) => ({
      id: r.id, name: tx(r.name), tagline: tx(r.tagline), description: tx(r.description), palette: r.palette, ...(r.route ? { route: r.route } : {}),
    })),
    home: { name: tx(WORLD.home.name), address: tx(WORLD.home.address), description: tx(WORLD.home.description) },
    destinations: WORLD.destinations.map((d) => ({
      id: d.id, region: d.region, name: tx(d.name), description: tx(d.description), distance: d.distance, runway: d.runway, hazard: d.hazard, mail: d.mail,
    })),
    planes: WORLD.planes.map((p) => ({
      id: p.id, archetype: p.archetype, name: tx(p.name), description: tx(p.description),
      range: p.range, capacity: p.capacity, speed: p.speed, reliability: p.reliability, runway: p.runway, price: p.price, upkeep: p.upkeep,
    })),
    traits: WORLD.traits.map((t) => ({ id: t.id, name: tx(t.name), description: tx(t.description) })),
    pilots: WORLD.pilots.map((p) => ({
      id: p.id, name: tx(p.name), gender: p.gender, age: p.age, origin: tx(p.origin), traits: p.traits,
      portrait: tx(p.portrait), greeting: tx(p.greeting), wage: p.wage, storyTitle: tx(p.story.title), scenes: p.story.scenes.length,
    })),
    seasons: WORLD.seasons.map((x) => ({ id: x.id, name: tx(x.name), tagline: tx(x.tagline), effects: x.effects })),
    cards: WORLD.cards.map((c) => {
      const base = { kind: c.kind, id: c.id, title: tx(c.title), text: tx(c.text) };
      if (c.kind === 'contract') return { ...base, destination: c.destination, cargo: c.cargo, bags: c.bags, reward: c.reward, softDeadlineHours: c.softDeadlineHours, bonus: c.bonus, ...(c.standing ? { standing: true } : {}), ...(c.heavy ? { heavy: true } : {}), ...(c.season ? { season: c.season } : {}) };
      if (c.kind === 'event') return { ...base, choices: c.choices.map((ch) => ({ id: ch.id, label: tx(ch.label), outcome: tx(ch.outcome), effects: ch.effects })) };
      return { ...base, offer: c.offer };
    }),
    zones: WORLD.zones.map((z) => ({
      id: z.id, name: tx(z.name),
      levels: z.levels.map((l) => ({ level: l.level, name: tx(l.name), description: tx(l.description), cost: l.cost, runway: l.runway, planes: l.planes, maintenance: l.maintenance, seaplanes: l.seaplanes })),
    })),
    decorations: WORLD.decorations.map((d) => ({ id: d.id, name: tx(d.name), description: tx(d.description), cost: d.cost, morale: d.morale })),
    stamps: WORLD.stamps.map((s) => ({ id: s.id, name: tx(s.name), description: tx(s.description) })),
    start: WORLD.start,
  };
}

/** Une scène d'histoire, dans une langue. */
export function localizeScene(pilot: PilotTemplate, index: number, locale: Locale) {
  const scene = pilot.story.scenes[index];
  if (!scene) return null;
  return {
    index, affinity: scene.affinity, title: text(scene.title, locale), storyTitle: text(pilot.story.title, locale),
    lines: scene.lines.map((l) => ({ who: l.who, text: text(l.text, locale) })),
  };
}
