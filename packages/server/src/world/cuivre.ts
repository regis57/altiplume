/**
 * La Forêt de Cuivre — la quatrième région, et la seconde route qui part de la
 * vallée.
 *
 * Derrière la crête de Haut-Ferrand commence une hêtraie si vieille que ses
 * feuilles restent aux branches tout l'hiver, couleur de cuivre. Sous elle, une
 * mine : c'est son cuivre que la fabrique de l'Anse-des-Lanternes martèle en
 * lanternes, et qui revient éclairer les îles, et jusqu'au ponton de la
 * Croisette. Les deux lanternes de cuivre du jeu — celle d'Ysé, celle de
 * Solenn — sont nées ici.
 *
 * Peu de pistes : des clairières, un carreau de mine, un champ de foire. On s'y
 * pose court, et l'humidité des sous-bois fait tousser les moteurs. La route
 * s'ouvre comme celle de la Côte, une fois toute la vallée livrée, contre douze
 * cachets : on choisit par où l'on grandit, la mer ou les arbres.
 */
import type { Destination, Region } from './types.ts';

export const CUIVRE: Region = {
  id: 'cuivre',
  name: { fr: 'Forêt de Cuivre', en: 'Copperwood' },
  tagline: { fr: 'Sous les hêtres, la nuit tombe à quatre heures.', en: 'Under the beeches, night falls at four.' },
  description: {
    fr: "Une forêt de hêtres si vieille que leurs feuilles restent aux branches tout l'hiver, couleur de cuivre — et dessous, la mine qui a donné son cuivre aux lanternes des îles. Peu de pistes : des clairières, un carreau de mine, un champ de foire. On s'y pose court, et on écoute le moteur : l'humidité des sous-bois ne pardonne rien.",
    en: 'A beech forest so old its leaves stay on the branches all winter, the colour of copper — and beneath it, the mine that gave its copper to the lanterns of the Isles. Few airstrips: clearings, a pithead yard, a fairground. You land short there, and you listen to the engine: the damp under the trees forgives nothing.',
  },
  palette: { sky: '#d9b48a', ground: '#2f4a32', accent: '#b8733a' },
  route: { requires: 's-vallee', cost: 12 },
};

/**
 * Six escales, de 7 à 12 lieues, que la route des charrettes met à trois jours
 * de marche les unes des autres. Deux se font avec les avions de la vallée ; une
 * troisième avec la Grive et un pilote de Longues routes ; les trois clairières
 * du fond demandent le Pic.
 */
export const CUIVRE_DESTINATIONS: readonly Destination[] = [
  {
    id: 'les-charbonnieres', region: 'cuivre',
    name: { fr: 'Les Charbonnières', en: 'Charwood' },
    description: {
      fr: "Le camp des charbonniers, à la lisière. Des meules qui fument nuit et jour, une piste taillée entre deux coupes, et des hommes noirs de suie qui s'essuient les mains sur leur tablier avant de prendre leurs lettres.",
      en: "The charcoal-burners' camp at the forest edge. Kilns smoking night and day, a strip cut between two fellings, and soot-black men who wipe their hands on their aprons before they take their letters.",
    },
    distance: 7, runway: 'short', hazard: 'canopy', mail: ['letters', 'parcels', 'parts'], firstDeliveryStamps: 2,
  },
  {
    id: 'villechaudron', region: 'cuivre',
    name: { fr: 'Villechaudron', en: 'Kettleby' },
    description: {
      fr: "La ville des chaudronniers. On l'entend avant de la voir : cent marteaux sur le cuivre. Le bureau de poste de toute la forêt est ici, et une vraie piste, sur l'ancien champ de foire.",
      en: "The coppersmiths' town. You hear it before you see it: a hundred hammers on copper. The post office for the whole forest is here, and a real airstrip, on the old fairground.",
    },
    distance: 8, runway: 'medium', hazard: 'none', mail: ['copper', 'letters', 'parcels', 'urgent'], firstDeliveryStamps: 2,
  },
  {
    id: 'les-scieries', region: 'cuivre',
    name: { fr: 'Les Scieries', en: 'Millhurst' },
    description: {
      fr: "Trois scieries sur le ruisseau, des roues à aubes, des piles de planches qui sentent la sève. Le père de Solenn y a réparé toutes les roues. On se pose sur le parc à grumes, entre deux troncs couchés.",
      en: "Three sawmills on the brook, waterwheels, stacks of planks smelling of sap. Solenn's father mended every one of those wheels. You land on the log yard, between two felled trunks.",
    },
    distance: 9, runway: 'short', hazard: 'canopy', mail: ['parts', 'letters', 'parcels'], firstDeliveryStamps: 2,
  },
  {
    id: 'sonnefeuille', region: 'cuivre',
    name: { fr: 'Sonnefeuille', en: 'Ringleaf' },
    description: {
      fr: "Une abbaye au fond d'une clairière, et la seule fonderie de cloches de la forêt. On se pose dans le verger des moines ; ils sonnent quand ils vous entendent, pour que vous trouviez la trouée.",
      en: 'An abbey deep in a clearing, and the only bell foundry in the forest. You land in the monks\' orchard; they ring when they hear you coming, so you can find the gap in the trees.',
    },
    distance: 10, runway: 'clearing', hazard: 'canopy', mail: ['letters', 'fragile', 'seeds', 'copper'], firstDeliveryStamps: 3,
  },
  {
    id: 'vert-de-gris', region: 'cuivre',
    name: { fr: 'Vert-de-Gris', en: 'Verdigris' },
    description: {
      fr: "La vieille mine de cuivre. Tout y est vert : le ruisseau, les toits, les mains des mineurs. On se pose sur l'ancien carreau, court et bosselé, entre les wagonnets.",
      en: "The old copper mine. Everything there is green: the stream, the roofs, the miners' hands. You land on the old pithead yard, short and lumpy, between the tubs.",
    },
    distance: 11, runway: 'clearing', hazard: 'canopy', mail: ['parts', 'medicine', 'letters', 'copper'], firstDeliveryStamps: 3,
  },
  {
    id: 'le-hetre-roi', region: 'cuivre',
    name: { fr: 'Le Hêtre-Roi', en: 'Kingbeech' },
    description: {
      fr: "Au cœur de la forêt, un hêtre si vieux et si large qu'il a donné son nom à la clairière, et une maison forestière. Dans son tronc, un creux où l'on laissait le courrier au facteur des bois. Sous ses branches, la nuit tombe à quatre heures.",
      en: "At the heart of the forest, a beech so old and so broad that it gave the clearing its name, and a forester's lodge. In its trunk, a hollow where people left their mail for the forest postman. Under its branches, night falls at four.",
    },
    distance: 12, runway: 'clearing', hazard: 'night', mail: ['letters', 'loveletters', 'newspapers'], firstDeliveryStamps: 3,
  },
];
