/**
 * Les avions de la première version. Trois archétypes, trois oiseaux.
 *
 * Les chiffres sont volontairement simples : une lieue est l'unité de distance du
 * monde, une heure est une vraie heure. Le biplan fait 12 lieues à l'heure, soit
 * cinq minutes pour une lieue ; c'est la base de tous les temps de vol.
 */
import type { PlaneModel } from './types.ts';

export const PLANES: readonly PlaneModel[] = [
  {
    id: 'grive', archetype: 'biplane',
    name: { fr: 'Grive G-2', en: 'Thrush G-2' },
    description: {
      fr: "Le biplan courrier de tout le monde. Lent, solide, pardonne presque tout. Il était déjà dans le hangar quand vous êtes arrivé.",
      en: 'Everybody\'s mail biplane. Slow, sturdy, forgives almost anything. It was already in the hangar when you arrived.',
    },
    range: 8, capacity: 2, speed: 12, reliability: 0.94, runway: 'short', price: 1800, upkeep: 6, starter: true,
  },
  {
    id: 'martinet', archetype: 'monoplane',
    name: { fr: 'Martinet M-1', en: 'Swift M-1' },
    description: {
      fr: "Un monoplan nerveux pour les plis urgents. Deux fois plus vite, un sac à la fois, et il n'aime pas les prés.",
      en: 'A nervy monoplane for urgent mail. Twice as fast, one bag at a time, and it does not like meadows.',
    },
    range: 10, capacity: 1, speed: 24, reliability: 0.86, runway: 'medium', price: 3200, upkeep: 10, starter: false,
  },
  {
    id: 'heron', archetype: 'trimotor',
    name: { fr: 'Héron H-3', en: 'Heron H-3' },
    description: {
      fr: "Le cheval de trait : trois moteurs, cinq sacs, et une piste longue pour se poser. Avec lui, on ouvre les lignes qui comptent.",
      en: 'The workhorse: three engines, five bags, and a long strip to land on. This is the plane that opens the routes that matter.',
    },
    range: 16, capacity: 5, speed: 15, reliability: 0.92, runway: 'long', price: 6500, upkeep: 16, starter: false,
  },
  {
    id: 'sterne', archetype: 'seaplane',
    name: { fr: 'Sterne S-1', en: 'Tern S-1' },
    description: {
      fr: "L'hydravion de la Côte : deux flotteurs, un moteur qui n'aime pas le sel, et la seule façon d'atteindre les îles. Il se pose sur l'eau, et seulement sur l'eau — il lui faut un ponton.",
      en: "The Shore's seaplane: two floats, an engine that dislikes salt, and the only way to reach the islands. It lands on water, and only on water — it needs a pontoon.",
    },
    range: 14, capacity: 3, speed: 14, reliability: 0.9, runway: 'water', price: 4725, upkeep: 14, starter: false,
  },
  {
    id: 'goeland', archetype: 'seaplane',
    name: { fr: 'Goéland G-4', en: 'Gull G-4' },
    description: {
      fr: "L'hydravion long-courrier : une coque au lieu de flotteurs, deux moteurs, et de quoi tenir jusqu'à la dernière île et revenir. Il préfère la nuit calme au vent de mer.",
      en: 'The long-range seaplane: a hull instead of floats, two engines, and enough fuel to reach the last island and come home. It prefers a calm night to a sea wind.',
    },
    range: 22, capacity: 4, speed: 16, reliability: 0.91, runway: 'water', price: 7800, upkeep: 18, starter: false,
  },
  {
    id: 'pic', archetype: 'highwing',
    name: { fr: 'Pic P-1', en: 'Woodpecker W-1' },
    description: {
      fr: "L'avion des clairières : une aile haute, des volets qui descendent comme des paupières, des pneus ballons. Il décolle en cinquante pas et se pose là où un autre ferait demi-tour. Il n'est pas rapide ; il n'a pas besoin de l'être.",
      en: "The clearing plane: a high wing, flaps that drop like eyelids, balloon tyres. It takes off in fifty paces and lands where another plane would turn back. It isn't fast; it doesn't need to be.",
    },
    range: 12, capacity: 2, speed: 13, reliability: 0.93, runway: 'clearing', price: 3675, upkeep: 9, starter: false,
  },
];
