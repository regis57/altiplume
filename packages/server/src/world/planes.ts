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
];
