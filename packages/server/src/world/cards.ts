/**
 * Les cartes : le moteur de variété du jeu.
 *
 * Trois par jour, dans une main de cinq. Les contrats ont un délai souple :
 * tenu, il rapporte un bonus ; dépassé, il ne coûte rien. Les imprévus se
 * résolvent par un choix. Les opportunités, on les saisit ou on les laisse.
 */
import type { CargoKind, ContractCard, EventCard, OpportunityCard, Text } from './types.ts';

function contract(id: string, destination: string, cargo: CargoKind, bags: number, reward: number, softDeadlineHours: number, bonus: number, weight: 1 | 2 | 3, title: Text, text: Text): ContractCard {
  return { kind: 'contract', id, destination, cargo, bags, reward, softDeadlineHours, bonus, weight, title, text };
}

/**
 * La ligne régulière : le sac de Pont-de-Brume part quand on veut, même la main
 * vide. Elle paie peu et n'a pas de bonus — c'est le pain de la compagnie, pas sa
 * fortune — mais elle garantit qu'on peut toujours faire voler quelqu'un.
 */
export const REGULAR_LINE: ContractCard = {
  ...contract('c-ligne-reguliere', 'pont-de-brume', 'letters', 1, 18, 24, 0, 1,
    { fr: 'La ligne régulière', en: 'The regular run' },
    { fr: "Le sac du jour pour Pont-de-Brume. Pas de contrat, pas de prime : la poste avance le salaire et le carburant, et les retient sur le tarif à l'arrivée. Il part quand vous voulez, même la caisse vide.", en: "The day's bag for Mistbridge. No contract, no bonus: the post advances the wage and the fuel, and keeps them back from the fee on arrival. It leaves whenever you like, even with an empty till." }),
  standing: true,
};

export const CONTRACTS: readonly ContractCard[] = [
  REGULAR_LINE,
  // Pont-de-Brume — le pain quotidien
  contract('c-journal', 'pont-de-brume', 'newspapers', 1, 24, 4, 6, 1,
    { fr: 'Le journal du matin', en: 'The morning paper' },
    { fr: "L'imprimeur de Pont-de-Brume a bouclé tard. Les abonnés de la vallée attendent leur journal avant le café.", en: 'The Mistbridge printer ran late. The valley\'s subscribers want their paper before coffee.' }),
  contract('c-lettres-pont', 'pont-de-brume', 'letters', 2, 30, 12, 6, 1,
    { fr: 'Le sac de la poste', en: 'The post bag' },
    { fr: "Deux sacs de lettres ordinaires pour le bureau de poste. Rien d'urgent, tout attendu.", en: 'Two bags of ordinary letters for the post office. Nothing urgent, everything expected.' }),
  contract('c-colis-pont', 'pont-de-brume', 'parcels', 2, 34, 24, 8, 1,
    { fr: 'Colis du marché', en: 'Market parcels' },
    { fr: "Des commandes passées au marché de samedi : du drap, une horloge, un chapeau. Les gens viendront les chercher au bureau.", en: 'Orders placed at Saturday market: cloth, a clock, a hat. People will come to the office to collect them.' }),
  contract('c-urgent-pont', 'pont-de-brume', 'urgent', 1, 42, 2, 18, 2,
    { fr: 'Pli du notaire', en: 'The notary\'s letter' },
    { fr: "Le notaire de Pont-de-Brume a besoin d'une signature avant midi. Un seul pli, mais il y tient.", en: 'The Mistbridge notary needs a signature before noon. One letter, but he is adamant.' }),
  // Les Tilleuls — vergers et miel
  contract('c-semences', 'les-tilleuls', 'seeds', 2, 38, 24, 8, 1,
    { fr: 'Semences de printemps', en: 'Spring seeds' },
    { fr: "La coopérative des Tilleuls attend ses sachets de semences. Si on les livre avant le prochain jour de pluie, elles seront en terre à temps.", en: 'The Lindenhollow cooperative is waiting for its seed packets. Delivered before the next rain, they\'ll be in the ground in time.' }),
  contract('c-miel', 'les-tilleuls', 'parcels', 1, 34, 12, 6, 1,
    { fr: 'Pots de miel', en: 'Honey jars' },
    { fr: "Douze pots de miel bien calés dans la paille. Le biplan va sentir bon toute la semaine.", en: 'Twelve honey jars packed in straw. The biplane will smell sweet all week.' }),
  contract('c-lettres-tilleuls', 'les-tilleuls', 'letters', 1, 32, 24, 4, 1,
    { fr: 'Courrier du hameau', en: 'Hamlet mail' },
    { fr: "Les Tilleuls n'ont pas de bureau de poste. Leurs lettres passent par vous, et par la boîte en bois clouée au tilleul.", en: 'Lindenhollow has no post office. Their letters go through you, and through the wooden box nailed to the linden tree.' }),
  // Moulin-Gris — brume et farine
  contract('c-farine', 'moulin-gris', 'parcels', 3, 44, 24, 10, 1,
    { fr: 'Sacs de farine', en: 'Flour sacks' },
    { fr: "Trois sacs de farine pour la boulangère de Pont-de-Brume, qui préfère la farine de Moulin-Gris à toute autre.", en: 'Three sacks of flour for the Mistbridge baker, who prefers Greymill flour to any other.' }),
  contract('c-tissu', 'moulin-gris', 'fragile', 1, 38, 12, 10, 2,
    { fr: 'Le tissu de la mariée', en: 'The bride\'s cloth' },
    { fr: "Un rouleau de tissu brodé pour une noce à Moulin-Gris. Fragile, et attendu avec impatience.", en: 'A roll of embroidered cloth for a wedding in Greymill. Fragile, and impatiently awaited.' }),
  contract('c-meuniers', 'moulin-gris', 'letters', 2, 32, 24, 6, 1,
    { fr: 'Les lettres des meuniers', en: 'The millers\' letters' },
    { fr: "Les meuniers de Moulin-Gris écrivent beaucoup. Deux sacs pleins, et il paraît que c'est une semaine calme.", en: 'The Greymill millers write a great deal. Two full bags, and apparently it\'s a quiet week.' }),
  // Haut-Ferrand — la forge
  contract('c-pieces', 'haut-ferrand', 'parts', 2, 52, 24, 12, 1,
    { fr: 'Pièces pour la forge', en: 'Parts for the forge' },
    { fr: "Le forgeron de Haut-Ferrand a cassé son soufflet. Les pièces sont lourdes, la piste est courte, le vent de travers.", en: 'The Ferncrest blacksmith has broken his bellows. The parts are heavy, the strip is short, the wind is across.' }),
  contract('c-outils', 'haut-ferrand', 'parcels', 2, 46, 36, 8, 1,
    { fr: 'Outils neufs', en: 'New tools' },
    { fr: "Des outils forgés à Haut-Ferrand, pour les fermes de la vallée. On les monte vides, on redescend plein.", en: 'Tools forged in Ferncrest for the valley farms. Up empty, down full.' }),
  contract('c-urgent-ferrand', 'haut-ferrand', 'urgent', 1, 58, 3, 20, 2,
    { fr: 'Le télégramme', en: 'The telegram' },
    { fr: "Un télégramme pour Haut-Ferrand, qui n'a pas le télégraphe. Trois heures, dit l'étiquette. Le vent dira le reste.", en: 'A telegram for Ferncrest, which has no telegraph. Three hours, says the label. The wind will say the rest.' }),
  // Lanterne-du-Val — le soir
  contract('c-amour', 'lanterne-du-val', 'loveletters', 1, 54, 12, 14, 2,
    { fr: "Lettres d'amour", en: 'Love letters' },
    { fr: "Un petit sac, fermé d'un ruban. L'étiquette dit « poste du soir ». Personne ne pose de questions.", en: 'A small bag, tied with a ribbon. The label says "evening post". No one asks questions.' }),
  contract('c-lanternes', 'lanterne-du-val', 'fragile', 2, 58, 24, 10, 1,
    { fr: 'Verres de lanterne', en: 'Lantern glass' },
    { fr: "Des verres de rechange pour les lanternes de la piste. Emballés un par un. Pas de secousses, s'il vous plaît.", en: 'Replacement glass for the strip lanterns. Wrapped one by one. No bumps, please.' }),
  contract('c-poste-soir', 'lanterne-du-val', 'letters', 2, 54, 10, 12, 1,
    { fr: 'La poste du soir', en: 'The evening post' },
    { fr: "Le courrier de Lanterne-du-Val part à la nuit tombée, c'est la tradition. Les lanternes seront allumées pour vous.", en: 'Lanternhollow\'s mail goes out at nightfall, by tradition. The lanterns will be lit for you.' }),
  // Combe-aux-Rosées — le bout de la vallée
  contract('c-medicaments', 'combe-aux-rosees', 'medicine', 1, 90, 6, 30, 2,
    { fr: 'Médicaments pour le dispensaire', en: 'Medicine for the clinic' },
    { fr: "Le dispensaire de Combe-aux-Rosées a besoin de sérum. Six heures, et la route des plateaux est coupée. Il n'y a que le ciel.", en: 'The Dewcombe clinic needs serum. Six hours, and the plateau road is cut. There is only the sky.' }),
  contract('c-nouvelles', 'combe-aux-rosees', 'letters', 3, 84, 48, 12, 1,
    { fr: 'Nouvelles du bout du monde', en: 'News from the end of the world' },
    { fr: "Trois sacs pour Combe-aux-Rosées, qui n'a vu personne depuis dix jours. Les gens y lisent les lettres sur le pas de la porte.", en: 'Three bags for Dewcombe, which has seen no one for ten days. People there read their letters on the doorstep.' }),
  contract('c-urgent-combe', 'combe-aux-rosees', 'urgent', 1, 96, 4, 36, 3,
    { fr: 'Le pli du préfet', en: 'The prefect\'s dispatch' },
    { fr: "Un pli cacheté pour le maire de Combe-aux-Rosées. Quatre heures. On ne vous dit pas ce qu'il y a dedans ; on vous dit que c'est important.", en: 'A sealed dispatch for the mayor of Dewcombe. Four hours. They won\'t tell you what\'s inside; they tell you it matters.' }),
  contract('c-colis-combe', 'combe-aux-rosees', 'parcels', 2, 78, 48, 10, 1,
    { fr: 'Provisions pour la Combe', en: 'Supplies for the Combe' },
    { fr: "Du sel, du café, du fil, des aiguilles. Tout ce qui manque au bout de la vallée quand la route est fermée.", en: 'Salt, coffee, thread, needles. Everything the end of the valley runs out of when the road is closed.' }),
  // ---- Côte de Saline : ne se tirent qu'une fois la route ouverte ----
  // Port-Sel — le port
  contract('c-capitainerie', 'port-sel', 'letters', 2, 92, 24, 14, 1,
    { fr: 'Le sac de la capitainerie', en: "The harbourmaster's bag" },
    { fr: "Deux sacs pour le port : les lettres de toute la Côte, qui passent par la capitainerie avant de prendre le bateau.", en: "Two bags for the harbour: letters for the whole Shore, which pass through the harbourmaster's office before taking the boat." }),
  contract('c-sel-gris', 'port-sel', 'salt', 3, 96, 48, 10, 1,
    { fr: 'Sel pour les quais', en: 'Salt for the quays' },
    { fr: "Trois sacs de sel gris des Œillets à porter au port, où les saleurs de poisson l'attendent. Lourd, et sans aucune urgence.", en: 'Three sacks of Panbrook grey salt for the harbour, where the fish-salters are waiting. Heavy, and in no hurry at all.' }),
  contract('c-urgent-port', 'port-sel', 'urgent', 1, 108, 3, 36, 2,
    { fr: "Le pli de l'armateur", en: "The shipowner's letter" },
    { fr: "Un armateur de Port-Sel doit signer avant la marée du soir, sinon le bateau part sans sa cargaison. Un seul pli, qui vaut un bateau.", en: 'A Saltharbour shipowner must sign before the evening tide, or the boat sails without its cargo. One letter, worth a ship.' }),
  // Les Œillets — les salines
  contract('c-semences-jardin', 'les-oeillets', 'seeds', 2, 98, 36, 12, 1,
    { fr: 'Semences pour les jardins de sel', en: 'Seeds for the salt gardens' },
    { fr: "Les sauniers cultivent des jardins sur les digues, dans de la terre rapportée. Ils commandent leurs graines loin, et attendent.", en: 'The salters grow gardens on the dykes, in carted-in soil. They order their seeds from far away, and wait.' }),
  contract('c-sauniers', 'les-oeillets', 'letters', 2, 104, 24, 12, 1,
    { fr: 'Les lettres des sauniers', en: "The salters' letters" },
    { fr: "Les Œillets n'ont ni bureau ni route carrossable. Les lettres partent par la digue, c'est-à-dire par vous.", en: 'Panbrook has neither post office nor carriage road. Letters leave by the dyke — that is, by you.' }),
  contract('c-fleur-de-sel', 'les-oeillets', 'salt', 1, 110, 12, 24, 2,
    { fr: 'La fleur de sel', en: 'The salt flower' },
    { fr: "La première récolte de fleur de sel de l'année, dans des boîtes de bois, pour la table d'un notable de Pont-de-Brume. Elle doit arriver sèche.", en: "The first salt-flower harvest of the year, in wooden boxes, for a Mistbridge notable's table. It must arrive dry." }),
  // Marais-Blanc — les pilotis
  contract('c-dispensaire', 'marais-blanc', 'medicine', 1, 118, 6, 36, 2,
    { fr: 'Le dispensaire du marais', en: 'The fen clinic' },
    { fr: "La fièvre des marais revient avec la saison. Le dispensaire de Marais-Blanc a besoin de quinine avant la nuit.", en: 'The fen fever is back with the season. The Whitefen clinic needs quinine before nightfall.' }),
  contract('c-pilotis', 'marais-blanc', 'parcels', 3, 114, 48, 12, 1,
    { fr: 'Colis pour les pilotis', en: 'Parcels for the stilts' },
    { fr: "Des lampes, de la toile cirée, un accordéon. Marais-Blanc commande tout ce qui ne pousse pas dans la vase.", en: 'Lamps, oilcloth, an accordion. Whitefen orders everything that does not grow in mud.' }),
  contract('c-lettres-marais', 'marais-blanc', 'letters', 2, 122, 24, 12, 1,
    { fr: 'Courrier du marais', en: 'Fen mail' },
    { fr: "Deux sacs de lettres, et la brume de sel qui traîne jusqu'à dix heures sur la seule terre ferme.", en: 'Two bags of letters, and the salt haze that lingers until ten over the only firm ground.' }),
  // Anse-aux-Goémons — sur l'eau
  contract('c-coquillages', 'anse-aux-goemons', 'shellfish', 2, 130, 8, 30, 1,
    { fr: 'Les coquillages du matin', en: 'The morning shellfish' },
    { fr: "Deux paniers de coquillages pêchés à l'aube, pour la table de Port-Sel. Ils ne supportent pas la journée : on se pose, on charge, on repart.", en: 'Two baskets of shellfish gathered at dawn, for the tables of Saltharbour. They will not keep the day: land, load, leave.' }),
  contract('c-lettres-anse', 'anse-aux-goemons', 'letters', 2, 138, 36, 14, 1,
    { fr: "Le sac de l'anse", en: 'The cove bag' },
    { fr: "Les lettres des ramasseurs de goémon, portées jusqu'à l'hydravion en barque. Le passeur attend que vous soyez posé.", en: "The wrack-gatherers' letters, rowed out to the seaplane. The boatman waits until you are down." }),
  // Phare de Brisant — la lumière
  contract('c-gardiens', 'phare-de-brisant', 'letters', 1, 146, 48, 14, 1,
    { fr: 'Les lettres des gardiens', en: "The keepers' letters" },
    { fr: "Deux gardiens, quinze jours chacun. Leurs lettres sont la seule chose qui monte et descend du phare avec régularité.", en: 'Two keepers, a fortnight each. Their letters are the only thing that goes up and down the lighthouse with any regularity.' }),
  contract('c-lentille', 'phare-de-brisant', 'parts', 2, 156, 12, 40, 3,
    { fr: 'La pièce de la lanterne', en: 'The lantern part' },
    { fr: "Le mécanisme de rotation du phare a cassé. Une pièce forgée à Haut-Ferrand, à poser avant la nuit, ou la Côte navigue sans lumière.", en: "The lighthouse's turning gear has broken. A part forged in Ferncrest, to fit before dark, or the Shore sails without a light." }),
  // Île Sainte-Ambre — le large
  contract('c-lettres-ile', 'ile-sainte-ambre', 'letters', 3, 164, 48, 16, 1,
    { fr: "Le courrier de l'île", en: 'The island mail' },
    { fr: "Trois sacs pour l'île : tout ce qu'un mois sans bateau a laissé en attente. On vous regarde arriver depuis la chapelle.", en: 'Three bags for the island: everything a month without a boat has left waiting. They watch you come in from the chapel.' }),
  contract('c-amour-ile', 'ile-sainte-ambre', 'loveletters', 1, 176, 12, 36, 2,
    { fr: 'Une lettre pour le large', en: 'A letter for the open sea' },
    { fr: "Une seule enveloppe, cachetée de cire, et quelqu'un à Lanterne-du-Val qui a demandé trois fois si elle était partie.", en: 'A single envelope, sealed with wax, and someone in Lanternhollow who has asked three times whether it has gone.' }),
  // ---- Archipel des Lanternes : ne se tirent qu'une fois la route ouverte ----
  // Île-aux-Fanaux
  contract('c-douze-lanternes', 'ile-aux-fanaux', 'letters', 2, 190, 36, 16, 1,
    { fr: 'Les douze lanternes', en: 'The twelve lanterns' },
    { fr: "Deux sacs pour les douze familles de l'île. Chacune laisse sa lanterne allumée tant que sa lettre n'est pas arrivée.", en: "Two bags for the island's twelve families. Each keeps its lantern lit until its letter has come." }),
  contract('c-amour-fanaux', 'ile-aux-fanaux', 'loveletters', 1, 204, 12, 40, 2,
    { fr: 'La lanterne bleue', en: 'The blue lantern' },
    { fr: "Une lettre pour la maison à la lanterne bleue. On vous a dit de ne pas la donner à quelqu'un d'autre, même si on insiste.", en: 'A letter for the house with the blue lantern. You were told not to hand it to anyone else, however much they insist.' }),
  // Grand-Récif
  contract('c-coquillages-recif', 'grand-recif', 'shellfish', 3, 212, 8, 36, 1,
    { fr: 'La pêche du lagon', en: 'The lagoon catch' },
    { fr: "Trois paniers pêchés à marée basse, pour Port-Sel. Il faut se poser, charger et repartir avant que le lagon se vide.", en: 'Three baskets gathered at low tide, bound for Saltharbour. Land, load and leave before the lagoon empties.' }),
  contract('c-pieces-recif', 'grand-recif', 'parts', 2, 220, 24, 20, 1,
    { fr: 'Le moteur du bateau-poste', en: "The mail boat's engine" },
    { fr: "Le bateau-poste du Récif est en panne. Des pièces de Haut-Ferrand, et tout le village qui attend sur le ponton.", en: "The Reef's mail boat has broken down. Parts from Ferncrest, and the whole village waiting on the jetty." }),
  // Sainte-Lueur
  contract('c-ecole', 'sainte-lueur', 'newspapers', 2, 232, 48, 14, 1,
    { fr: "Les journaux de l'école", en: "The school's newspapers" },
    { fr: "La maîtresse de Sainte-Lueur apprend à lire dans le journal de Pont-de-Brume. Deux sacs, et les enfants qui comptent les hublots.", en: 'The Glimmerkirk schoolmistress teaches reading from the Mistbridge paper. Two bags, and the children counting the portholes.' }),
  contract('c-quinine-lueur', 'sainte-lueur', 'medicine', 1, 244, 6, 48, 2,
    { fr: 'La fièvre de Sainte-Lueur', en: 'The Glimmerkirk fever' },
    { fr: "Trois enfants malades, un dispensaire sans quinine, et la nuit qui tombe. On vise la lanterne de la chapelle.", en: 'Three sick children, a clinic without quinine, and night falling. You aim for the chapel lantern.' }),
  // Le Rocher-Noir
  contract('c-guetteurs', 'le-rocher-noir', 'newspapers', 1, 250, 48, 14, 1,
    { fr: 'Les nouvelles du rocher', en: 'News for the rock' },
    { fr: "Trois guetteurs, un chien, et des journaux vieux d'une semaine qu'ils lisent comme s'ils étaient d'hier.", en: 'Three watchers, a dog, and week-old newspapers they read as if they were from yesterday.' }),
  contract('c-semaphore', 'le-rocher-noir', 'parts', 2, 262, 10, 50, 3,
    { fr: 'Le sémaphore cassé', en: 'The broken semaphore' },
    { fr: "Sans son sémaphore, le Rocher-Noir ne peut plus prévenir des tempêtes. Deux caisses de pièces, avant le prochain grain.", en: 'Without its semaphore, Blackstack can no longer warn of storms. Two crates of parts, before the next squall.' }),
  // Anse-des-Lanternes
  contract('c-poste-minuit', 'anse-des-lanternes', 'letters', 4, 276, 24, 20, 1,
    { fr: 'La poste de minuit', en: 'The midnight post' },
    { fr: "Quatre sacs pour le bureau de l'Anse, ouvert jusqu'à minuit. C'est le gros courrier de l'archipel, et il part de nuit.", en: "Four bags for the Cove's office, open till midnight. It is the Isles' big mail, and it goes at night." }),
  contract('c-lanternes-fragiles', 'anse-des-lanternes', 'fragile', 2, 288, 24, 24, 2,
    { fr: 'Les verres de la fabrique', en: "The works' glass" },
    { fr: "Des verres soufflés pour la fabrique de lanternes, calés dans la paille. Un seul cassé et toute une île reste dans le noir.", en: 'Blown glass for the lantern works, packed in straw. One broken and a whole island stays dark.' }),
  // Île-du-Bout
  contract('c-derniere-ile', 'ile-du-bout', 'letters', 2, 304, 48, 20, 1,
    { fr: 'Le courrier du bout', en: 'Mail for the end' },
    { fr: "Deux sacs pour la dernière île. Après elle, plus personne à qui écrire. Avant elle, tout le monde.", en: 'Two bags for the last island. Beyond it, no one left to write to. Before it, everyone.' }),
  contract('c-lettre-grand-blanc', 'ile-du-bout', 'loveletters', 1, 320, 12, 48, 3,
    { fr: 'Une lettre vers le Grand Blanc', en: 'A letter towards the Great White' },
    { fr: "Une lettre pour quelqu'un parti vers le nord, à laisser à la dernière lanterne. On ne sait pas qui la prendra. On sait qu'elle doit y être.", en: 'A letter for someone gone north, to be left at the last lantern. No one knows who will collect it. Everyone knows it must be there.' }),
];

export const EVENTS: readonly EventCard[] = [
  {
    kind: 'event', id: 'e-brume', weight: 1,
    title: { fr: 'Brume tenace', en: 'Stubborn fog' },
    text: { fr: "La brume ne se lève pas. On ne voit pas le bout de la piste.", en: 'The fog isn\'t lifting. You can\'t see the end of the strip.' },
    choices: [
      { id: 'wait', label: { fr: 'Attendre que ça lève', en: 'Wait for it to lift' }, outcome: { fr: "Deux heures de perdues, un café de gagné.", en: 'Two hours lost, a coffee gained.' }, effects: { delayHours: 2 } },
      { id: 'go', label: { fr: 'Décoller quand même', en: 'Take off anyway' }, outcome: { fr: "Le pilote y va à l'instinct. Ça passe, mais l'avion a frôlé les tilleuls.", en: 'The pilot goes on instinct. It works, but the plane brushed the lindens.' }, effects: { wear: 8, morale: -2 } },
    ],
  },
  {
    kind: 'event', id: 'e-vache', weight: 1,
    title: { fr: 'Une vache sur la piste', en: 'A cow on the strip' },
    text: { fr: "Aux Tilleuls, une vache a décidé que la piste était un pré. Elle n'a pas tort.", en: 'At Lindenhollow a cow has decided the strip is a meadow. She has a point.' },
    choices: [
      { id: 'wait', label: { fr: 'Attendre le fermier', en: 'Wait for the farmer' }, outcome: { fr: "Le fermier arrive en sifflant. Une heure, et une tarte aux pommes en dédommagement.", en: 'The farmer strolls up whistling. An hour, and an apple tart by way of apology.' }, effects: { delayHours: 1, morale: 2 } },
      { id: 'push', label: { fr: 'La pousser soi-même', en: 'Push her yourself' }, outcome: { fr: "La vache ne bouge pas. Le pilote, lui, a les bottes pleines de boue.", en: 'The cow doesn\'t move. The pilot\'s boots, however, are full of mud.' }, effects: { delayHours: 1, morale: -1 } },
    ],
  },
  {
    kind: 'event', id: 'e-bougie', weight: 1,
    title: { fr: 'Moteur qui tousse', en: 'Coughing engine' },
    text: { fr: "Au point fixe, le moteur rate un temps sur quatre.", en: 'At run-up, the engine misses one beat in four.' },
    choices: [
      { id: 'fix', label: { fr: 'Changer la bougie (12 F)', en: 'Replace the plug (12 F)' }, outcome: { fr: "Une bougie neuve, et le moteur ronronne.", en: 'A new plug, and the engine purrs.' }, effects: { francs: -12 } },
      { id: 'risk', label: { fr: 'Partir comme ça', en: 'Go as it is' }, outcome: { fr: "Ça tient. Mais l'avion revient fatigué.", en: 'It holds. But the plane comes back tired.' }, effects: { wear: 12 } },
    ],
  },
  {
    kind: 'event', id: 'e-rhume', weight: 1,
    title: { fr: 'Pilote enrhumé', en: 'Pilot with a cold' },
    text: { fr: "Le pilote a le nez rouge et la voix de Moulin-Gris un jour de brume.", en: 'The pilot has a red nose and a voice like Greymill on a foggy day.' },
    choices: [
      { id: 'rest', label: { fr: 'Le laisser au lit', en: 'Send them to bed' }, outcome: { fr: "Une journée de repos. Le moral remonte, le courrier attend.", en: 'A day of rest. Spirits lift, the mail waits.' }, effects: { delayHours: 24, morale: 3 } },
      { id: 'fly', label: { fr: 'Voler avec un grog', en: 'Fly on a hot toddy' }, outcome: { fr: "Le vol se fait. Le pilote s'en souviendra.", en: 'The flight gets done. The pilot will remember it.' }, effects: { morale: -3 } },
    ],
  },
  {
    kind: 'event', id: 'e-vent', weight: 1,
    title: { fr: 'Vent de crête', en: 'Ridge wind' },
    text: { fr: "Haut-Ferrand annonce un vent de travers à faire plier la manche à air.", en: 'Ferncrest reports a crosswind bending the windsock double.' },
    choices: [
      { id: 'wait', label: { fr: 'Attendre le soir', en: 'Wait for evening' }, outcome: { fr: "Le vent tombe avec le soleil. Trois heures de retard, un atterrissage de velours.", en: 'The wind drops with the sun. Three hours late, a velvet landing.' }, effects: { delayHours: 3 } },
      { id: 'go', label: { fr: 'Se poser quand même', en: 'Land anyway' }, outcome: { fr: "Un rebond, deux, et une roue à redresser.", en: 'One bounce, two, and a wheel to straighten.' }, effects: { wear: 10 } },
    ],
  },
  {
    kind: 'event', id: 'e-sac', weight: 2,
    title: { fr: 'Un sac en trop', en: 'One bag too many' },
    text: { fr: "Au moment de charger, le receveur vous tend un sac de plus. « Si vous avez la place. »", en: 'As you load up, the postmaster hands you one more bag. "If you have the room."' },
    choices: [
      { id: 'take', label: { fr: 'Le prendre', en: 'Take it' }, outcome: { fr: "Un peu plus lourd, un peu plus lent, et quinze francs de plus à l'arrivée.", en: 'A little heavier, a little slower, and fifteen francs more on arrival.' }, effects: { francs: 15, delayHours: 1 } },
      { id: 'leave', label: { fr: 'Le laisser pour demain', en: 'Leave it for tomorrow' }, outcome: { fr: "Il attendra. Le receveur hausse les épaules, sans rancune.", en: 'It will wait. The postmaster shrugs, no hard feelings.' }, effects: {} },
    ],
  },
  {
    kind: 'event', id: 'e-pluie', weight: 1,
    title: { fr: 'Averse', en: 'Downpour' },
    text: { fr: "Une averse surprend l'avion en route. Le courrier est sous la bâche, le pilote non.", en: 'A shower catches the plane en route. The mail is under the tarp; the pilot isn\'t.' },
    choices: [
      { id: 'shelter', label: { fr: "S'abriter aux Tilleuls", en: 'Shelter at Lindenhollow' }, outcome: { fr: "Une heure sous le hangar à foin, avec du cidre. Personne ne se plaint.", en: 'An hour under the hay barn, with cider. Nobody complains.' }, effects: { delayHours: 1, morale: 1 } },
      { id: 'go', label: { fr: 'Continuer trempé', en: 'Press on soaked' }, outcome: { fr: "Le courrier arrive à l'heure. Le pilote éternue pendant deux jours.", en: 'The mail arrives on time. The pilot sneezes for two days.' }, effects: { morale: -2 } },
    ],
  },
  {
    kind: 'event', id: 'e-bac', weight: 1,
    title: { fr: 'Le bac est en grève', en: 'The ferry is on strike' },
    text: { fr: "Le passeur de Pont-de-Brume ne passe plus. Toute la vallée voudrait voler aujourd'hui.", en: 'The Mistbridge ferryman isn\'t crossing. The whole valley wants to fly today.' },
    choices: [
      { id: 'raise', label: { fr: 'Prendre un passager (20 F)', en: 'Take a passenger (20 F)' }, outcome: { fr: "Le pharmacien monte avec sa sacoche. Il paie en liquide et en sirop.", en: 'The pharmacist climbs in with his satchel. He pays in cash and cough syrup.' }, effects: { francs: 20, delayHours: 1 } },
      { id: 'mail', label: { fr: 'Rester au courrier', en: 'Stick to the mail' }, outcome: { fr: "Le courrier d'abord. C'est écrit sur l'enseigne.", en: 'Mail first. It says so on the sign.' }, effects: { morale: 1 } },
    ],
  },
  {
    kind: 'event', id: 'e-nuit', weight: 1,
    title: { fr: 'La nuit tombe tôt', en: 'Night falls early' },
    text: { fr: "Le vol a pris du retard et le soleil n'attend pas. Lanterne-du-Val allumera ses lanternes ; les autres pistes, non.", en: 'The flight ran late and the sun won\'t wait. Lanternhollow will light its lanterns; the other strips won\'t.' },
    choices: [
      { id: 'sleep', label: { fr: 'Dormir sur place', en: 'Sleep over' }, outcome: { fr: "Une nuit à l'auberge. Le courrier repart à l'aube.", en: 'A night at the inn. The mail leaves at dawn.' }, effects: { francs: -8, delayHours: 10 } },
      { id: 'go', label: { fr: 'Rentrer de nuit', en: 'Fly home in the dark' }, outcome: { fr: "Le pilote compte les lumières des fermes. Il rentre. Il ne recommencera pas de bon cœur.", en: 'The pilot counts farmhouse lights. They get home. They won\'t do it again gladly.' }, effects: { wear: 6, morale: -2 } },
    ],
  },
  {
    kind: 'event', id: 'e-lettre-perdue', weight: 2,
    title: { fr: 'Une lettre sans adresse', en: 'A letter with no address' },
    text: { fr: "Dans le sac, une enveloppe sans nom ni village. Juste « à celle qui attend ».", en: 'In the bag, an envelope with no name and no village. Just "to the one who waits".' },
    choices: [
      { id: 'ask', label: { fr: 'Demander au village', en: 'Ask around the village' }, outcome: { fr: "Une vieille dame la prend sans un mot et vous serre la main longtemps. Un cachet pour l'album.", en: 'An old lady takes it without a word and shakes your hand for a long time. A stamp for the album.' }, effects: { delayHours: 1, stamps: 1 } },
      { id: 'return', label: { fr: 'La rapporter au bureau', en: 'Return it to the office' }, outcome: { fr: "La poste la gardera. Quelqu'un la réclamera peut-être.", en: 'The post office keeps it. Someone may claim it.' }, effects: {} },
    ],
  },
  // ---- Côte de Saline ----
  {
    kind: 'event', id: 'e-grain', weight: 1, region: 'saline',
    title: { fr: 'Un grain sur la Côte', en: 'A squall on the Shore' },
    text: { fr: "Le ciel noircit au large en un quart d'heure. La capitainerie de Port-Sel hisse le pavillon : on ne décolle pas, ou on fait vite.", en: 'The sky goes black offshore in a quarter of an hour. The Saltharbour harbourmaster runs up the flag: nobody takes off, or they do it quickly.' },
    choices: [
      { id: 'wait', label: { fr: 'Attendre que ça passe', en: 'Wait it out' }, outcome: { fr: "Deux heures au café de la capitainerie, à regarder la pluie marcher sur l'eau. Le courrier arrivera mouillé de rien.", en: 'Two hours in the harbourmaster\'s café, watching the rain walk across the water. The mail arrives none the wetter.' }, effects: { delayHours: 2, morale: 1 } },
      { id: 'dash', label: { fr: 'Partir avant le grain', en: 'Beat the squall' }, outcome: { fr: "Le pilote décolle dans la première rafale. Il passe. Les flotteurs ont pris une vague et le moteur a bu du sel.", en: 'The pilot takes off into the first gust. They make it. The floats took a wave and the engine drank salt.' }, effects: { wear: 8, morale: -1 } },
    ],
  },
  {
    kind: 'event', id: 'e-maree', weight: 2, region: 'saline',
    title: { fr: 'La marée a tout changé', en: 'The tide changed everything' },
    text: { fr: "À marée basse, l'anse n'est plus qu'un miroir de vase. La barque du passeur est à sec et le sac attend sur la cale.", en: 'At low tide the cove is nothing but a mirror of mud. The boatman\'s boat is high and dry and the bag waits on the slipway.' },
    choices: [
      { id: 'tide', label: { fr: 'Attendre la marée', en: 'Wait for the tide' }, outcome: { fr: "Trois heures. Le passeur raconte les naufrages du siècle dernier ; le pilote repart avec le sac et deux histoires.", en: 'Three hours. The boatman tells of last century\'s wrecks; the pilot leaves with the bag and two stories.' }, effects: { delayHours: 3, morale: 1 } },
      { id: 'walk', label: { fr: 'Aller chercher le sac à pied (10 F)', en: 'Fetch the bag on foot (10 F)' }, outcome: { fr: "Jusqu'aux genoux dans la vase, bottes louées au village. Le sac arrive à l'heure ; les bottes ne reviennent pas.", en: 'Knee-deep in mud in boots hired from the village. The bag arrives on time; the boots do not come back.' }, effects: { francs: -10 } },
    ],
  },
  // ---- Archipel des Lanternes ----
  {
    kind: 'event', id: 'e-lanterne-eteinte', weight: 1, region: 'archipel',
    title: { fr: 'La lanterne est éteinte', en: 'The lantern is out' },
    text: { fr: "Nuit noire, et le ponton visé n'a pas allumé sa lanterne. Le pilote tourne au-dessus de l'île, sans savoir où est l'eau et où est le rocher.", en: 'Pitch dark, and the jetty you were aiming for has not lit its lantern. The pilot circles the island, not knowing where the water ends and the rock begins.' },
    choices: [
      { id: 'wait', label: { fr: "Attendre l'aube", en: 'Wait for dawn' }, outcome: { fr: "Trois heures à tourner, puis le jour. Le gardien du ponton, penaud, offre le café et une lanterne de rechange.", en: 'Three hours of circling, then daylight. The sheepish jetty keeper offers coffee and a spare lantern.' }, effects: { delayHours: 3, morale: 1 } },
      { id: 'moon', label: { fr: 'Se poser à la lune', en: 'Land by the moon' }, outcome: { fr: "La coque racle quelque chose. Le pilote se pose, pâle. On réparera au ponton.", en: 'The hull scrapes something. The pilot lands, pale. Repairs can wait till the pontoon.' }, effects: { wear: 10, morale: -2 } },
    ],
  },
  {
    kind: 'event', id: 'e-fete-lanternes', weight: 2, region: 'archipel',
    title: { fr: 'La nuit des lanternes', en: 'Lantern night' },
    text: { fr: "Toute la chaîne d'îles a allumé ses lanternes en même temps : c'est la fête de l'archipel. On vous attend sur chaque ponton, et personne ne comprendrait qu'on reparte vite.", en: 'The whole chain of islands has lit its lanterns at once: it is the Isles\' festival. You are expected on every jetty, and no one would understand a quick departure.' },
    choices: [
      { id: 'stay', label: { fr: 'Rester à la fête', en: 'Stay for the festival' }, outcome: { fr: "Le courrier arrivera demain. Les pilotes dansent sur un ponton et personne ne le regrettera.", en: 'The mail will arrive tomorrow. The pilots dance on a jetty and nobody will regret it.' }, effects: { delayHours: 8, morale: 4 } },
      { id: 'mail', label: { fr: 'Le courrier d\'abord', en: 'Mail first' }, outcome: { fr: "Un verre à chaque ponton, pas plus. Le sac arrive à l'heure, le pilote un peu moins.", en: 'One glass at each jetty, no more. The bag arrives on time; the pilot, a little less so.' }, effects: { delayHours: 1 } },
    ],
  },
];

export const OPPORTUNITIES: readonly OpportunityCard[] = [
  {
    kind: 'opportunity', id: 'o-martinet', weight: 2,
    title: { fr: "Un Martinet d'occasion", en: 'A second-hand Swift' },
    text: { fr: "Un pilote de Pont-de-Brume raccroche. Son Martinet est en bon état et il le laisse pour un bon prix, à qui en prendra soin.", en: 'A Mistbridge pilot is hanging up his goggles. His Swift is in good shape and he\'ll let it go for a fair price, to someone who will look after it.' },
    offer: { type: 'plane', model: 'martinet', price: 2600 },
  },
  {
    kind: 'opportunity', id: 'o-pilote', weight: 2,
    title: { fr: 'Un pilote de passage', en: 'A pilot passing through' },
    text: { fr: "Quelqu'un boit un café au comptoir, le sac à ses pieds, et regarde votre piste avec l'air de quelqu'un qui pourrait rester.", en: 'Someone is drinking a coffee at the counter, bag at their feet, looking at your strip like someone who might stay.' },
    offer: { type: 'pilot', pilot: 'rotating' },
  },
  {
    kind: 'opportunity', id: 'o-fete', weight: 1,
    title: { fr: 'La fête des Tilleuls', en: 'The Lindenhollow fair' },
    text: { fr: "Les Tilleuls fêtent la floraison. Il y a du cidre, un bal, et tout le monde demande si les pilotes viendront.", en: 'Lindenhollow is celebrating the blossom. There is cider, a dance, and everyone is asking whether the pilots will come.' },
    offer: { type: 'fete', morale: 6, cost: 15 },
  },
  {
    kind: 'opportunity', id: 'o-carte', weight: 3,
    title: { fr: 'La vieille carte de Bastien', en: 'Old Bastien\'s map' },
    text: { fr: "En rangeant le hangar, une carte roulée dans un tube : les lignes que Bastien n'a jamais ouvertes, annotées de sa main. Un cachet pour l'album, et une idée pour plus tard.", en: 'Tidying the hangar, a map rolled in a tube: the routes Bastien never opened, annotated in his hand. A stamp for the album, and an idea for later.' },
    offer: { type: 'map', stamps: 1 },
  },
  // ---- Côte de Saline ----
  {
    kind: 'opportunity', id: 'o-sterne', weight: 2, region: 'saline',
    title: { fr: 'Une Sterne à Port-Sel', en: 'A Tern at Saltharbour' },
    text: { fr: "Un hydravion des douanes est réformé à Port-Sel : flotteurs refaits, moteur neuf, et un capitaine qui préfère le vendre à quelqu'un qui portera du courrier plutôt qu'à la ferraille.", en: 'A customs seaplane is being retired at Saltharbour: floats redone, new engine, and a captain who would rather sell it to someone who will carry mail than to the scrapyard.' },
    offer: { type: 'plane', model: 'sterne', price: 4400 },
  },
  {
    kind: 'opportunity', id: 'o-carte-marine', weight: 3, region: 'saline',
    title: { fr: 'La carte marine du gardien', en: 'The keeper\'s sea chart' },
    text: { fr: "Un des gardiens de Brisant vous confie sa vieille carte de la Côte : les passes, les hauts-fonds, et un trait au crayon vers des îles qui n'y figurent pas encore. Un cachet pour l'album.", en: 'One of the Breaker keepers hands you his old chart of the Shore: the channels, the shoals, and a pencil line towards islands that are not on it yet. A stamp for the album.' },
    offer: { type: 'map', stamps: 1 },
  },
  // ---- Archipel des Lanternes ----
  {
    kind: 'opportunity', id: 'o-goeland', weight: 2, region: 'saline',
    title: { fr: 'Un Goéland à Port-Sel', en: 'A Gull at Saltharbour' },
    text: { fr: "La compagnie des bateaux-poste revend son hydravion long-courrier : une coque, deux moteurs, et de quoi tenir jusqu'à la dernière île. Elle veut quelqu'un qui le fera voler, pas quelqu'un qui le revendra.", en: 'The mail-boat company is selling its long-range seaplane: a hull, two engines, enough fuel to reach the last island. They want someone who will fly it, not someone who will sell it on.' },
    offer: { type: 'plane', model: 'goeland', price: 6600 },
  },
  {
    kind: 'opportunity', id: 'o-pilote-iles', weight: 2, region: 'archipel',
    title: { fr: 'Quelqu\'un sur le ponton', en: 'Someone on the jetty' },
    text: { fr: "À l'Anse-des-Lanternes, quelqu'un attend sur le ponton avec un sac et une lanterne, et demande si votre compagnie prend encore des pilotes.", en: 'At Lanterncove, someone is waiting on the jetty with a bag and a lantern, asking whether your company is still taking pilots.' },
    offer: { type: 'pilot', pilot: 'rotating' },
  },
];
