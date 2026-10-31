/**
 * Les cartes : le moteur de variété du jeu.
 *
 * Trois par jour, dans une main de cinq. Les contrats ont un délai souple :
 * tenu, il rapporte un bonus ; dépassé, il ne coûte rien. Les imprévus se
 * résolvent par un choix. Les opportunités, on les saisit ou on les laisse.
 */
import type { CargoKind, ContractCard, EventCard, OpportunityCard, Season, Text } from './types.ts';

function contract(id: string, destination: string, cargo: CargoKind, bags: number, reward: number, softDeadlineHours: number, bonus: number, weight: 1 | 2 | 3, title: Text, text: Text): ContractCard {
  return { kind: 'contract', id, destination, cargo, bags, reward, softDeadlineHours, bonus, weight, title, text };
}

/** Un contrat qui ne se tire qu'en sa saison. */
function seasonal(season: Season, id: string, destination: string, cargo: CargoKind, bags: number, reward: number, softDeadlineHours: number, bonus: number, weight: 1 | 2 | 3, title: Text, text: Text): ContractCard {
  return { ...contract(id, destination, cargo, bags, reward, softDeadlineHours, bonus, weight, title, text), season };
}

/**
 * Le fret lourd : plus de sacs qu'aucun avion capable de se poser là-bas n'en porte
 * seul. Il part en convoi — deux avions, deux pilotes, deux salaires — et paie en
 * conséquence. Il peut coller une page d'album, ou en attendre une pour se tirer.
 */
function heavy(id: string, destination: string, cargo: CargoKind, bags: number, reward: number, softDeadlineHours: number, bonus: number, weight: 1 | 2 | 3, title: Text, text: Text, extra: { stamp?: string; requires?: string } = {}): ContractCard {
  return { ...contract(id, destination, cargo, bags, reward, softDeadlineHours, bonus, weight, title, text), heavy: true, ...extra };
}

/**
 * La ligne régulière : le sac de Pont-de-Brume part quand on veut, même la main
 * vide. Elle paie peu et n'a pas de bonus — c'est le pain de la compagnie, pas sa
 * fortune — mais elle garantit qu'on peut toujours faire voler quelqu'un.
 */
export const REGULAR_LINE: ContractCard = {
  ...contract('c-ligne-reguliere', 'pont-de-brume', 'letters', 1, 25, 24, 0, 1,
    { fr: 'La ligne régulière', en: 'The regular run' },
    { fr: "Le sac du jour pour Pont-de-Brume. Pas de contrat, pas de prime : la poste avance le salaire et le carburant, et les retient sur le tarif à l'arrivée. Il part quand vous voulez, même la caisse vide.", en: "The day's bag for Mistbridge. No contract, no bonus: the post advances the wage and the fuel, and keeps them back from the fee on arrival. It leaves whenever you like, even with an empty till." }),
  standing: true,
};

export const CONTRACTS: readonly ContractCard[] = [
  REGULAR_LINE,
  // Pont-de-Brume — le pain quotidien
  contract('c-journal', 'pont-de-brume', 'newspapers', 1, 33, 4, 8, 1,
    { fr: 'Le journal du matin', en: 'The morning paper' },
    { fr: "L'imprimeur de Pont-de-Brume a bouclé tard. Les abonnés de la vallée attendent leur journal avant le café.", en: 'The Mistbridge printer ran late. The valley\'s subscribers want their paper before coffee.' }),
  contract('c-lettres-pont', 'pont-de-brume', 'letters', 2, 42, 12, 8, 1,
    { fr: 'Le sac de la poste', en: 'The post bag' },
    { fr: "Deux sacs de lettres ordinaires pour le bureau de poste. Rien d'urgent, tout attendu.", en: 'Two bags of ordinary letters for the post office. Nothing urgent, everything expected.' }),
  contract('c-colis-pont', 'pont-de-brume', 'parcels', 2, 47, 24, 11, 1,
    { fr: 'Colis du marché', en: 'Market parcels' },
    { fr: "Des commandes passées au marché de samedi : du drap, une horloge, un chapeau. Les gens viendront les chercher au bureau.", en: 'Orders placed at Saturday market: cloth, a clock, a hat. People will come to the office to collect them.' }),
  contract('c-urgent-pont', 'pont-de-brume', 'urgent', 1, 58, 2, 25, 2,
    { fr: 'Pli du notaire', en: 'The notary\'s letter' },
    { fr: "Le notaire de Pont-de-Brume a besoin d'une signature dans les deux heures. Un seul pli, mais il y tient.", en: 'The Mistbridge notary needs a signature within two hours. One letter, but he is adamant.' }),
  // Les Tilleuls — vergers et miel
  contract('c-semences', 'les-tilleuls', 'seeds', 2, 53, 24, 11, 1,
    { fr: 'Sachets de semences', en: 'Seed packets' },
    { fr: "La coopérative des Tilleuls attend ses sachets de semences. Si on les livre avant le prochain jour de pluie, elles seront en terre à temps.", en: 'The Lindenhollow cooperative is waiting for its seed packets. Delivered before the next rain, they\'ll be in the ground in time.' }),
  contract('c-miel', 'les-tilleuls', 'parcels', 1, 47, 12, 8, 1,
    { fr: 'Pots de miel', en: 'Honey jars' },
    { fr: "Douze pots de miel bien calés dans la paille. Le biplan va sentir bon toute la semaine.", en: 'Twelve honey jars packed in straw. The biplane will smell sweet all week.' }),
  contract('c-lettres-tilleuls', 'les-tilleuls', 'letters', 1, 44, 24, 6, 1,
    { fr: 'Courrier du hameau', en: 'Hamlet mail' },
    { fr: "Les Tilleuls n'ont pas de bureau de poste. Leurs lettres passent par vous, et par la boîte en bois clouée au tilleul.", en: 'Lindenhollow has no post office. Their letters go through you, and through the wooden box nailed to the linden tree.' }),
  // Moulin-Gris — brume et farine
  // Fret lourd depuis le 12/10 : trois sacs pleins, et aucun avion qui se pose au moulin n'en porte plus de deux.
  // C'était une carte impossible à livrer depuis la v0.1.
  heavy('c-farine', 'moulin-gris', 'parcels', 3, 140, 24, 25, 1,
    { fr: 'Sacs de farine', en: 'Flour sacks' },
    { fr: "Trois sacs de farine de Moulin-Gris pour la boulangère de Pont-de-Brume, qui n'en veut pas d'autre. Trois sacs pleins : une Grive n'en soulève que deux.", en: 'Three sacks of Greymill flour for the Mistbridge baker, who will have no other. Three full sacks: a Thrush lifts only two.' }),
  contract('c-tissu', 'moulin-gris', 'fragile', 1, 53, 12, 14, 2,
    { fr: 'Le tissu de la mariée', en: 'The bride\'s cloth' },
    { fr: "Un rouleau de tissu brodé pour une noce à Moulin-Gris. Fragile, et attendu avec impatience.", en: 'A roll of embroidered cloth for a wedding in Greymill. Fragile, and impatiently awaited.' }),
  contract('c-meuniers', 'moulin-gris', 'letters', 2, 44, 24, 8, 1,
    { fr: 'Les lettres des meuniers', en: 'The millers\' letters' },
    { fr: "Les meuniers de Moulin-Gris écrivent beaucoup. Deux sacs pleins, et il paraît que c'est une semaine calme.", en: 'The Greymill millers write a great deal. Two full bags, and apparently it\'s a quiet week.' }),
  // Haut-Ferrand — la forge
  contract('c-pieces', 'haut-ferrand', 'parts', 2, 72, 24, 17, 1,
    { fr: 'Pièces pour la forge', en: 'Parts for the forge' },
    { fr: "Le forgeron de Haut-Ferrand a cassé son soufflet. Les pièces sont lourdes, la piste est courte, le vent de travers.", en: 'The Ferncrest blacksmith has broken his bellows. The parts are heavy, the strip is short, the wind is across.' }),
  contract('c-outils', 'haut-ferrand', 'parcels', 2, 64, 36, 11, 1,
    { fr: 'Outils neufs', en: 'New tools' },
    { fr: "Des outils forgés à Haut-Ferrand, pour les fermes de la vallée. On les monte vides, on redescend plein.", en: 'Tools forged in Ferncrest for the valley farms. Up empty, down full.' }),
  contract('c-urgent-ferrand', 'haut-ferrand', 'urgent', 1, 81, 3, 28, 2,
    { fr: 'Le télégramme', en: 'The telegram' },
    { fr: "Un télégramme pour Haut-Ferrand, qui n'a pas le télégraphe. Trois heures, dit l'étiquette. Le vent dira le reste.", en: 'A telegram for Ferncrest, which has no telegraph. Three hours, says the label. The wind will say the rest.' }),
  // Lanterne-du-Val — le soir
  contract('c-amour', 'lanterne-du-val', 'loveletters', 1, 75, 12, 19, 2,
    { fr: "Lettres d'amour", en: 'Love letters' },
    { fr: "Un petit sac, fermé d'un ruban. L'étiquette dit « poste du soir ». Personne ne pose de questions.", en: 'A small bag, tied with a ribbon. The label says "evening post". No one asks questions.' }),
  contract('c-lanternes', 'lanterne-du-val', 'fragile', 2, 81, 24, 14, 1,
    { fr: 'Verres de lanterne', en: 'Lantern glass' },
    { fr: "Des verres de rechange pour les lanternes de la piste. Emballés un par un. Pas de secousses, s'il vous plaît.", en: 'Replacement glass for the strip lanterns. Wrapped one by one. No bumps, please.' }),
  contract('c-poste-soir', 'lanterne-du-val', 'letters', 2, 75, 10, 17, 1,
    { fr: 'La poste du soir', en: 'The evening post' },
    { fr: "Le courrier de Lanterne-du-Val part à la nuit tombée, c'est la tradition. Les lanternes seront allumées pour vous.", en: 'Lanternhollow\'s mail goes out at nightfall, by tradition. The lanterns will be lit for you.' }),
  // Combe-aux-Rosées — le bout de la vallée
  contract('c-medicaments', 'combe-aux-rosees', 'medicine', 1, 125, 6, 42, 2,
    { fr: 'Médicaments pour le dispensaire', en: 'Medicine for the clinic' },
    { fr: "Le dispensaire de Combe-aux-Rosées a besoin de sérum. Six heures, et la route des plateaux est coupée. Il n'y a que le ciel.", en: 'The Dewcombe clinic needs serum. Six hours, and the plateau road is cut. There is only the sky.' }),
  contract('c-nouvelles', 'combe-aux-rosees', 'letters', 3, 117, 48, 17, 1,
    { fr: 'Nouvelles du bout du monde', en: 'News from the end of the world' },
    { fr: "Trois sacs pour Combe-aux-Rosées, qui n'a vu personne depuis dix jours. Les gens y lisent les lettres sur le pas de la porte.", en: 'Three bags for Dewcombe, which has seen no one for ten days. People there read their letters on the doorstep.' }),
  contract('c-urgent-combe', 'combe-aux-rosees', 'urgent', 1, 133, 4, 50, 3,
    { fr: 'Le pli du préfet', en: 'The prefect\'s dispatch' },
    { fr: "Un pli cacheté pour le maire de Combe-aux-Rosées. Quatre heures. On ne vous dit pas ce qu'il y a dedans ; on vous dit que c'est important.", en: 'A sealed dispatch for the mayor of Dewcombe. Four hours. They won\'t tell you what\'s inside; they tell you it matters.' }),
  contract('c-colis-combe', 'combe-aux-rosees', 'parcels', 2, 108, 48, 14, 1,
    { fr: 'Provisions pour la Combe', en: 'Supplies for the Combe' },
    { fr: "Du sel, du café, du fil, des aiguilles. Tout ce qui manque au bout de la vallée quand la route est fermée.", en: 'Salt, coffee, thread, needles. Everything the end of the valley runs out of when the road is closed.' }),
  // ---- Côte de Saline : ne se tirent qu'une fois la route ouverte ----
  // Port-Sel — le port
  contract('c-capitainerie', 'port-sel', 'letters', 2, 128, 24, 19, 1,
    { fr: 'Le sac de la capitainerie', en: "The harbourmaster's bag" },
    { fr: "Deux sacs pour le port : les lettres de toute la Côte, qui passent par la capitainerie avant de prendre le bateau.", en: "Two bags for the harbour: letters for the whole Shore, which pass through the harbourmaster's office before taking the boat." }),
  // Fret lourd depuis le 12/10 (même défaut que la farine : impossible à livrer depuis la v0.2).
  heavy('c-sel-gris', 'port-sel', 'salt', 3, 330, 48, 40, 1,
    { fr: 'Sel pour les quais', en: 'Salt for the quays' },
    { fr: "Trois sacs de sel gris des Œillets à porter au port, où les saleurs de poisson l'attendent. Lourd — deux avions —, et sans aucune urgence.", en: "Three sacks of Panbrook grey salt for the harbour, where the fish-salters are waiting. Heavy — two planes' worth — and in no hurry at all." }),
  contract('c-urgent-port', 'port-sel', 'urgent', 1, 150, 3, 50, 2,
    { fr: "Le pli de l'armateur", en: "The shipowner's letter" },
    { fr: "Un armateur de Port-Sel doit signer dans les trois heures : à la marée suivante, le bateau part sans sa cargaison. Un seul pli, qui vaut un bateau.", en: 'A Saltharbour shipowner must sign within three hours: on the next tide, the boat sails without its cargo. One letter, worth a ship.' }),
  // Les Œillets — les salines
  contract('c-semences-jardin', 'les-oeillets', 'seeds', 2, 136, 36, 17, 1,
    { fr: 'Semences pour les jardins de sel', en: 'Seeds for the salt gardens' },
    { fr: "Les sauniers cultivent des jardins sur les digues, dans de la terre rapportée. Ils commandent leurs graines loin, et attendent.", en: 'The salters grow gardens on the dykes, in carted-in soil. They order their seeds from far away, and wait.' }),
  contract('c-sauniers', 'les-oeillets', 'letters', 2, 144, 24, 17, 1,
    { fr: 'Les lettres des sauniers', en: "The salters' letters" },
    { fr: "Les Œillets n'ont ni bureau ni route carrossable. Les lettres partent par la digue, c'est-à-dire par vous.", en: 'Panbrook has neither post office nor carriage road. Letters leave by the dyke — that is, by you.' }),
  contract('c-fleur-de-sel', 'les-oeillets', 'salt', 1, 153, 12, 33, 2,
    { fr: 'La fleur de sel', en: 'The salt flower' },
    { fr: "De la fleur de sel cueillie à la main sur les œillets, dans des boîtes de bois, pour la table d'un notable de Pont-de-Brume. Elle doit arriver sèche.", en: "Salt flower skimmed by hand off the pans, in wooden boxes, for a Mistbridge notable's table. It must arrive dry." }),
  // Marais-Blanc — les pilotis
  contract('c-dispensaire', 'marais-blanc', 'medicine', 1, 164, 6, 50, 2,
    { fr: 'Le dispensaire du marais', en: 'The fen clinic' },
    { fr: "La fièvre des marais est revenue avec la brume. Le dispensaire de Marais-Blanc a besoin de quinine dans les six heures.", en: 'The fen fever has come back with the mist. The Whitefen clinic needs quinine within six hours.' }),
  // Deux sacs depuis le 12/10 : à trois, aucun avion qui se pose au marais ne les portait.
  contract('c-pilotis', 'marais-blanc', 'parcels', 2, 158, 48, 17, 1,
    { fr: 'Colis pour les pilotis', en: 'Parcels for the stilts' },
    { fr: "Des lampes, de la toile cirée, un accordéon. Marais-Blanc commande tout ce qui ne pousse pas dans la vase.", en: 'Lamps, oilcloth, an accordion. Whitefen orders everything that does not grow in mud.' }),
  contract('c-lettres-marais', 'marais-blanc', 'letters', 2, 169, 24, 17, 1,
    { fr: 'Courrier du marais', en: 'Fen mail' },
    { fr: "Deux sacs de lettres, et la brume de sel qui traîne jusqu'à dix heures sur la seule terre ferme.", en: 'Two bags of letters, and the salt haze that lingers until ten over the only firm ground.' }),
  // Anse-aux-Goémons — sur l'eau
  contract('c-coquillages', 'anse-aux-goemons', 'shellfish', 2, 181, 8, 42, 1,
    { fr: 'Les coquillages du matin', en: 'The morning shellfish' },
    { fr: "Deux paniers de coquillages pêchés à l'aube, pour la table de Port-Sel. Ils ne supportent pas la journée : on se pose, on charge, on repart.", en: 'Two baskets of shellfish gathered at dawn, for the tables of Saltharbour. They will not keep the day: land, load, leave.' }),
  contract('c-lettres-anse', 'anse-aux-goemons', 'letters', 2, 192, 36, 19, 1,
    { fr: "Le sac de l'anse", en: 'The cove bag' },
    { fr: "Les lettres des ramasseurs de goémon, portées jusqu'à l'hydravion en barque. Le passeur attend que vous soyez posé.", en: "The wrack-gatherers' letters, rowed out to the seaplane. The boatman waits until you are down." }),
  // Phare de Brisant — la lumière
  contract('c-gardiens', 'phare-de-brisant', 'letters', 1, 203, 48, 19, 1,
    { fr: 'Les lettres des gardiens', en: "The keepers' letters" },
    { fr: "Deux gardiens, quinze jours chacun. Leurs lettres sont la seule chose qui monte et descend du phare avec régularité.", en: 'Two keepers, a fortnight each. Their letters are the only thing that goes up and down the lighthouse with any regularity.' }),
  contract('c-lentille', 'phare-de-brisant', 'parts', 2, 217, 12, 56, 3,
    { fr: 'La pièce de la lanterne', en: 'The lantern part' },
    { fr: "Le mécanisme de rotation du phare a cassé. Une pièce forgée à Haut-Ferrand, à poser dans les douze heures, ou la Côte navigue sans lumière.", en: "The lighthouse's turning gear has broken. A part forged in Ferncrest, to fit within twelve hours, or the Shore sails without a light." }),
  // Île Sainte-Ambre — le large
  contract('c-lettres-ile', 'ile-sainte-ambre', 'letters', 3, 228, 48, 22, 1,
    { fr: "Le courrier de l'île", en: 'The island mail' },
    { fr: "Trois sacs pour l'île : tout ce qu'un mois sans bateau a laissé en attente. On vous regarde arriver depuis la chapelle.", en: 'Three bags for the island: everything a month without a boat has left waiting. They watch you come in from the chapel.' }),
  contract('c-amour-ile', 'ile-sainte-ambre', 'loveletters', 1, 244, 12, 50, 2,
    { fr: 'Une lettre pour le large', en: 'A letter for the open sea' },
    { fr: "Une seule enveloppe, cachetée de cire, et quelqu'un à Lanterne-du-Val qui a demandé trois fois si elle était partie.", en: 'A single envelope, sealed with wax, and someone in Lanternhollow who has asked three times whether it has gone.' }),
  // ---- Archipel des Lanternes : ne se tirent qu'une fois la route ouverte ----
  // Île-aux-Fanaux
  contract('c-douze-lanternes', 'ile-aux-fanaux', 'letters', 2, 264, 36, 22, 1,
    { fr: 'Les douze lanternes', en: 'The twelve lanterns' },
    { fr: "Deux sacs pour les douze familles de l'île. Chacune laisse sa lanterne allumée tant que sa lettre n'est pas arrivée.", en: "Two bags for the island's twelve families. Each keeps its lantern lit until its letter has come." }),
  contract('c-amour-fanaux', 'ile-aux-fanaux', 'loveletters', 1, 283, 12, 56, 2,
    { fr: 'La lanterne bleue', en: 'The blue lantern' },
    { fr: "Une lettre pour la maison à la lanterne bleue. On vous a dit de ne pas la donner à quelqu'un d'autre, même si on insiste.", en: 'A letter for the house with the blue lantern. You were told not to hand it to anyone else, however much they insist.' }),
  // Grand-Récif
  contract('c-coquillages-recif', 'grand-recif', 'shellfish', 3, 294, 8, 50, 1,
    { fr: 'La pêche du lagon', en: 'The lagoon catch' },
    { fr: "Trois paniers pêchés à marée basse, pour Port-Sel. Il faut se poser, charger et repartir avant que le lagon se vide.", en: 'Three baskets gathered at low tide, bound for Saltharbour. Land, load and leave before the lagoon empties.' }),
  contract('c-pieces-recif', 'grand-recif', 'parts', 2, 306, 24, 28, 1,
    { fr: 'Le moteur du bateau-poste', en: "The mail boat's engine" },
    { fr: "Le bateau-poste du Récif est en panne. Des pièces de Haut-Ferrand, et tout le village qui attend sur le ponton.", en: "The Reef's mail boat has broken down. Parts from Ferncrest, and the whole village waiting on the jetty." }),
  // Sainte-Lueur
  contract('c-ecole', 'sainte-lueur', 'newspapers', 2, 322, 48, 19, 1,
    { fr: "Les journaux de l'école", en: "The school's newspapers" },
    { fr: "La maîtresse de Sainte-Lueur apprend à lire dans le journal de Pont-de-Brume. Deux sacs, et les enfants qui comptent les hublots.", en: 'The Glimmerkirk schoolmistress teaches reading from the Mistbridge paper. Two bags, and the children counting the portholes.' }),
  contract('c-quinine-lueur', 'sainte-lueur', 'medicine', 1, 339, 6, 67, 2,
    { fr: 'La fièvre de Sainte-Lueur', en: 'The Glimmerkirk fever' },
    { fr: "Trois enfants malades, un dispensaire sans quinine, et six heures pour l'y porter. On vise la lanterne de la chapelle.", en: 'Three sick children, a clinic without quinine, and six hours to bring it. You aim for the chapel lantern.' }),
  // Le Rocher-Noir
  contract('c-guetteurs', 'le-rocher-noir', 'newspapers', 1, 347, 48, 19, 1,
    { fr: 'Les nouvelles du rocher', en: 'News for the rock' },
    { fr: "Trois guetteurs, un chien, et des journaux vieux d'une semaine qu'ils lisent comme s'ils étaient d'hier.", en: 'Three watchers, a dog, and week-old newspapers they read as if they were from yesterday.' }),
  contract('c-semaphore', 'le-rocher-noir', 'parts', 2, 364, 10, 69, 3,
    { fr: 'Le sémaphore cassé', en: 'The broken semaphore' },
    { fr: "Sans son sémaphore, le Rocher-Noir ne peut plus prévenir des tempêtes. Deux caisses de pièces, avant le prochain grain.", en: 'Without its semaphore, Blackstack can no longer warn of storms. Two crates of parts, before the next squall.' }),
  // Anse-des-Lanternes
  contract('c-poste-minuit', 'anse-des-lanternes', 'letters', 4, 383, 24, 28, 1,
    { fr: 'La poste de minuit', en: 'The midnight post' },
    { fr: "Quatre sacs pour le bureau de l'Anse, ouvert jusqu'à minuit. C'est le gros courrier de l'archipel, et il part de nuit.", en: "Four bags for the Cove's office, open till midnight. It is the Isles' big mail, and it goes at night." }),
  contract('c-lanternes-fragiles', 'anse-des-lanternes', 'fragile', 2, 400, 24, 33, 2,
    { fr: 'Les verres de la fabrique', en: "The works' glass" },
    { fr: "Des verres soufflés pour la fabrique de lanternes, calés dans la paille. Un seul cassé et toute une île reste dans le noir.", en: 'Blown glass for the lantern works, packed in straw. One broken and a whole island stays dark.' }),
  // Île-du-Bout
  contract('c-derniere-ile', 'ile-du-bout', 'letters', 2, 422, 48, 28, 1,
    { fr: 'Le courrier du bout', en: 'Mail for the end' },
    { fr: "Deux sacs pour la dernière île. Après elle, plus personne à qui écrire. Avant elle, tout le monde.", en: 'Two bags for the last island. Beyond it, no one left to write to. Before it, everyone.' }),
  contract('c-lettre-grand-blanc', 'ile-du-bout', 'loveletters', 1, 444, 12, 67, 3,
    { fr: 'Une lettre vers le Grand Blanc', en: 'A letter towards the Great White' },
    { fr: "Une lettre pour quelqu'un parti vers le nord, à laisser à la dernière lanterne. On ne sait pas qui la prendra. On sait qu'elle doit y être.", en: 'A letter for someone gone north, to be left at the last lantern. No one knows who will collect it. Everyone knows it must be there.' }),
  // ---- Forêt de Cuivre : ne se tirent qu'une fois la route ouverte ----
  // Les Charbonnières
  contract('c-charbonniers', 'les-charbonnieres', 'letters', 2, 122, 36, 17, 1,
    { fr: 'Les lettres de la lisière', en: 'Letters for the forest edge' },
    { fr: "Les charbonniers ne quittent pas leurs meules : un feu qu'on laisse est un feu perdu. Leurs lettres arrivent avec la fumée — c'est-à-dire avec vous.", en: 'The charcoal-burners never leave their kilns: a fire left alone is a fire lost. Their letters come in with the smoke — which is to say, with you.' }),
  contract('c-soufflet', 'les-charbonnieres', 'parts', 1, 134, 10, 33, 2,
    { fr: 'Le soufflet fendu', en: 'The split bellows' },
    { fr: "Le grand soufflet de la meule du bas s'est fendu. Une pièce de cuir et de laiton, faite à Haut-Ferrand, avant que la braise s'endorme.", en: 'The big bellows on the lower kiln has split. A part in leather and brass, made in Ferncrest, before the embers go to sleep.' }),
  // Villechaudron
  contract('c-cuivre-mine', 'villechaudron', 'copper', 2, 146, 48, 19, 1,
    { fr: 'Le cuivre de la mine', en: 'Copper from the mine' },
    { fr: "Deux sacs de cuivre en feuilles, sortis de Vert-de-Gris, pour les chaudronniers. La route des charrettes est défoncée depuis l'automne ; le ciel, lui, ne l'est pas.", en: 'Two sacks of copper sheet out of Verdigris, for the smiths. The cart road has been ruined since autumn; the sky has not.' }),
  contract('c-receveur', 'villechaudron', 'urgent', 1, 156, 4, 42, 2,
    { fr: 'Le pli du receveur', en: "The postmaster's packet" },
    { fr: "Un pli recommandé pour le receveur de Villechaudron : le cadastre de la forêt, signé à Pont-de-Brume, qu'il attend dans les quatre heures.", en: 'A registered packet for the Kettleby postmaster: the forest survey, signed at Mistbridge, which he expects within four hours.' }),
  // Les Scieries
  contract('c-courroie', 'les-scieries', 'parts', 2, 152, 8, 33, 2,
    { fr: 'La courroie de la grande roue', en: "The big wheel's belt" },
    { fr: "La courroie de la scierie du bas a cédé, et la roue tourne dans le vide. Deux caisses de pièces, et trois scieurs assis sur les planches à vous attendre.", en: "The lower mill's drive belt has snapped, and the wheel is turning for nothing. Two crates of parts, and three sawyers sitting on the planks, waiting for you." }),
  contract('c-scieurs', 'les-scieries', 'letters', 2, 162, 36, 19, 1,
    { fr: 'Le courrier des scieurs', en: "The sawyers' mail" },
    { fr: "Deux sacs pour la vallée des scieries. On les lit à voix haute pendant la pause, assis sur les grumes, pour ceux à qui personne n'écrit.", en: 'Two bags for the sawmill valley. They are read aloud at the break, sitting on the logs, for those nobody writes to.' }),
  // Sonnefeuille
  contract('c-simples', 'sonnefeuille', 'seeds', 2, 170, 48, 19, 1,
    { fr: 'Les graines du jardin des simples', en: 'Seeds for the herb garden' },
    { fr: "Les moines de Sonnefeuille soignent toute la forêt avec leur jardin. Deux sacs de graines, de la sauge à la reine-des-prés.", en: 'The Ringleaf monks doctor the whole forest from their garden. Two bags of seed, from sage to meadowsweet.' }),
  contract('c-cire', 'sonnefeuille', 'fragile', 1, 184, 12, 42, 2,
    { fr: 'La cire pour le moule', en: 'Wax for the mould' },
    { fr: "Pour couler une cloche, on la modèle d'abord en cire. Une caisse de cire d'abeille de Lanterne-du-Val, calée dans le foin, qui ne doit ni chauffer ni geler.", en: 'To cast a bell, you first model it in wax. A crate of Lanternhollow beeswax, packed in hay, that must neither warm up nor freeze.' }),
  // Vert-de-Gris
  contract('c-mineurs', 'vert-de-gris', 'medicine', 1, 192, 6, 50, 2,
    { fr: 'La toux des mineurs', en: "The miners' cough" },
    { fr: "La poussière verte finit toujours par entrer dans les poitrines. Le médecin de Villechaudron envoie ce qu'il faut, et il le faut dans les six heures.", en: "The green dust always gets into chests in the end. The Kettleby doctor is sending what's needed, and it's needed within six hours." }),
  contract('c-lampes-mine', 'vert-de-gris', 'parts', 2, 206, 24, 28, 1,
    { fr: 'Les lampes de la mine', en: 'Lamps for the pit' },
    { fr: "Deux caisses de lampes de mineur, des mèches et des verres. Au fond, on ne voit que la lumière qu'on emporte.", en: 'Two crates of miners\' lamps, wicks and glasses. Down there, you only see the light you bring with you.' }),
  // Le Hêtre-Roi
  contract('c-garde', 'le-hetre-roi', 'newspapers', 1, 214, 48, 22, 1,
    { fr: 'Les journaux du garde', en: "The forester's papers" },
    { fr: "Le garde du Hêtre-Roi lit le journal de Pont-de-Brume avec une semaine de retard, et trois jours d'avance sur tout le fond des bois.", en: 'The Kingbeech forester reads the Mistbridge paper a week late, and three days ahead of everyone else in the deep woods.' }),
  contract('c-creux', 'le-hetre-roi', 'loveletters', 1, 232, 12, 56, 3,
    { fr: "Une lettre pour le creux de l'arbre", en: 'A letter for the hollow tree' },
    { fr: "Une lettre à glisser dans le creux du Hêtre-Roi, là où le facteur des bois relevait le courrier le jeudi. Quelqu'un passera la prendre. Personne ne dit qui.", en: 'A letter to slip into the hollow of the King Beech, where the forest postman used to collect on Thursdays. Someone will come by for it. Nobody says who.' }),
  // ---- Le fret lourd : deux avions pour un courrier ----
  heavy('c-pressoir', 'les-tilleuls', 'parcels', 3, 150, 48, 30, 2,
    { fr: 'Le pressoir des Tilleuls', en: 'The Lindenhollow press' },
    { fr: "Le pressoir à cidre du hameau a rendu l'âme, la vis cassée net. Le neuf arrive en pièces de Pont-de-Brume : trois caisses, trop lourdes pour une seule Grive. Le cidrier, lui, compte les jours.", en: "The hamlet's cider press has given out, its screw snapped clean through. The new one comes in pieces from Mistbridge: three crates, too heavy for a single Thrush. The cider-maker is counting the days." }),
  heavy('c-chaudiere', 'combe-aux-rosees', 'parcels', 6, 420, 72, 60, 2,
    { fr: 'La chaudière du dispensaire', en: "The clinic's boiler" },
    { fr: "Le dispensaire de Combe-aux-Rosées a passé l'hiver dernier à trois couvertures par lit. La chaudière neuve pèse six sacs : il faudra le Héron, et quelqu'un pour voler à côté de lui.", en: 'The Dewcombe clinic spent last winter at three blankets a bed. The new boiler weighs six bags: it will take the Heron, and someone flying alongside it.' }),
  heavy('c-treuil', 'port-sel', 'parcels', 3, 380, 48, 50, 2,
    { fr: 'Le treuil de la capitainerie', en: "The harbourmaster's winch" },
    { fr: "Le treuil qui hisse les barques sur la cale a cassé sa couronne. Une pièce neuve de Haut-Ferrand, en trois caisses de fonte. Le capitaine a déjà calé deux barques sur des tonneaux.", en: 'The winch that hauls boats up the slipway has cracked its crown wheel. A new one from Ferncrest, in three crates of cast iron. The harbourmaster has already propped two boats up on barrels.' }),
  heavy('c-bronze', 'sonnefeuille', 'copper', 3, 520, 72, 70, 2,
    { fr: 'Le bronze de la cloche', en: 'Bronze for the bell' },
    { fr: "Pour la cloche de frère Anselme : du cuivre de Vert-de-Gris et de l'étain de la Côte, en lingots. Trois sacs que seul un Pic peut poser dans le verger — et un Pic n'en porte que deux.", en: "For Brother Anselm's bell: Verdigris copper and tin from the Shore, in ingots. Three bags that only a Woodpecker can set down in the orchard — and a Woodpecker carries two." },
    { stamp: 's-fonderie', requires: 's-sonnefeuille' }),
  heavy('c-cloche', 'sainte-lueur', 'fragile', 6, 1400, 96, 160, 3,
    { fr: 'La cloche de Sainte-Lueur', en: 'The Glimmerkirk bell' },
    { fr: "Elle est coulée. Frère Anselme l'a fait sonner une fois dans le verger, une seule, pour savoir. Six sacs de bronze sous une bâche, et une chapelle sur l'eau qui n'a jamais eu de cloche. Il faut deux hydravions, et les enfants le savent déjà.", en: "It is cast. Brother Anselm rang it once in the orchard, just once, to be sure. Six bags of bronze under a tarpaulin, and a chapel on the water that has never had a bell. It takes two seaplanes, and the children already know." },
    { stamp: 's-cloche', requires: 's-fonderie' }),
  // ---- Les saisons : deux contrats chacune, qui ne se tirent qu'en leur temps ----
  // Printemps
  seasonal('printemps', 'c-greffons', 'les-tilleuls', 'seeds', 1, 47, 24, 12, 2,
    { fr: 'Les greffons des vergers', en: 'Grafts for the orchards' },
    { fr: "Les Tilleuls greffent leurs pommiers avant que la sève monte. Un sac de rameaux enveloppés de mousse humide, à poser avant qu'ils sèchent.", en: 'Lindenhollow grafts its apple trees before the sap rises. A bag of scions wrapped in damp moss, to land before they dry out.' }),
  seasonal('printemps', 'c-clochettes', 'lanterne-du-val', 'fragile', 1, 78, 6, 25, 2,
    { fr: 'Les clochettes de mai', en: 'The May bells' },
    { fr: "À Lanterne-du-Val, on offre un brin de clochettes blanches le premier matin de mai, pour porter bonheur. Une caisse fraîchement cueillie, qui fanera en quelques heures.", en: 'In Lanternhollow they give a sprig of little white bells on the first morning of May, for luck. A freshly picked crate, wilting within hours.' }),
  // Été
  seasonal('ete', 'c-glace', 'port-sel', 'urgent', 1, 140, 3, 50, 2,
    { fr: 'La glace des poissonniers', en: "The fishmongers' ice" },
    { fr: "La glacière de Port-Sel est à sec en pleine chaleur. Un pain de glace dans la sciure, et toute la pêche du matin qui attend sur le quai.", en: "Saltharbour's ice house has run dry in the heat. A block of ice packed in sawdust, and the whole morning's catch waiting on the quay." }),
  seasonal('ete', 'c-cartes-postales', 'ile-sainte-ambre', 'letters', 2, 236, 48, 22, 1,
    { fr: "Les cartes postales de l'été", en: 'Summer postcards' },
    { fr: "L'été, Sainte-Ambre a des visiteurs, et les visiteurs écrivent. Deux sacs de cartes postales : la chapelle, la plage, la chapelle encore.", en: 'In summer Amber Holm has visitors, and visitors write. Two bags of postcards: the chapel, the beach, the chapel again.' }),
  // Automne
  seasonal('automne', 'c-cidre', 'les-tilleuls', 'parcels', 1, 48, 24, 12, 1,
    { fr: 'Les bondes du cidre nouveau', en: 'Bungs for the new cider' },
    { fr: "Le cidre nouveau bout dans les tonneaux des Tilleuls, et il manque des bondes. Un sac de bouchons de chêne, avant que tout déborde.", en: "The new cider is working in the Lindenhollow barrels, and they're short of bungs. A bag of oak stoppers, before it all froths over." }),
  seasonal('automne', 'c-chataignes', 'haut-ferrand', 'parcels', 2, 72, 36, 14, 1,
    { fr: 'Les sacs des châtaignes', en: 'Sacks for the chestnuts' },
    { fr: "Sur la crête, les châtaigniers ont donné d'un coup. Haut-Ferrand demande des sacs de jute, et des lettres de commande pour les vendre en bas.", en: 'Up on the ridge the chestnut trees have dropped all at once. Ferncrest wants jute sacks, and order letters to sell them in the valley.' }),
  // Hiver
  seasonal('hiver', 'c-etrennes', 'pont-de-brume', 'parcels', 1, 46, 48, 10, 1,
    { fr: 'Les étrennes', en: "New Year's gifts" },
    { fr: "Le premier de l'an, à Pont-de-Brume, on s'offre des étrennes : des oranges, des mitaines, un almanach. La poste en déborde.", en: "On New Year's Day in Mistbridge, people give each other small gifts: oranges, mittens, an almanac. The post office is overflowing." }),
  seasonal('hiver', 'c-couvertures', 'combe-aux-rosees', 'medicine', 1, 121, 12, 33, 2,
    { fr: 'Le sirop et les couvertures', en: 'Syrup and blankets' },
    { fr: "La chaudière tient la Combe au chaud, mais l'hiver est long au bout de la vallée. Du sirop contre la toux, et des couvertures pour la salle commune.", en: "The boiler keeps Dewcombe warm, but winter is long at the end of the valley. Cough syrup, and blankets for the common room." }),
];

export const EVENTS: readonly EventCard[] = [
  // Tous les imprévus se passent ici, à l'aérodrome de la Croisette, avant un départ :
  // ils bloquent la piste tant qu'on ne les a pas tranchés, et « attendre » la ferme
  // vraiment, le nombre d'heures annoncé. Aucun ne parle d'un vol déjà en l'air, ni
  // d'une heure du jour : ils restent vrais le matin comme le soir (règle du 14/10).
  {
    kind: 'event', id: 'e-brume', weight: 1,
    title: { fr: 'Brume tenace', en: 'Stubborn fog' },
    text: { fr: "La brume ne se lève pas. Du seuil du hangar, on ne voit pas le bout de la piste.", en: "The fog won't lift. From the hangar door you can't see the end of the strip." },
    choices: [
      { id: 'wait', label: { fr: 'Attendre que ça lève (2 h)', en: 'Wait for it to lift (2 h)' }, outcome: { fr: "Deux heures de perdues, un café de gagné. La piste rouvre quand on revoit les tilleuls.", en: 'Two hours lost, one coffee gained. The strip reopens once the lime trees come back into view.' }, effects: { waitHours: 2 } },
      { id: 'go', label: { fr: 'Décoller quand même', en: 'Take off anyway' }, outcome: { fr: "Le pilote partira à l'instinct. Il frôlera les tilleuls, et l'avion le sentira.", en: 'The pilot will go by instinct, brush the lime trees, and the plane will feel it.' }, effects: { wear: 8, morale: -2 } },
    ],
  },
  {
    kind: 'event', id: 'e-vache', weight: 1,
    title: { fr: 'Une vache sur la piste', en: 'A cow on the strip' },
    text: { fr: "La vache du voisin a trouvé la barrière ouverte et décidé que la piste était un pré. Elle n'a pas tort.", en: "The neighbour's cow found the gate open and decided the strip was a meadow. She isn't wrong." },
    choices: [
      { id: 'wait', label: { fr: 'Attendre le fermier (1 h)', en: 'Wait for the farmer (1 h)' }, outcome: { fr: "Le fermier arrive en sifflant, une heure plus tard, avec une tarte aux pommes pour se faire pardonner.", en: 'The farmer turns up whistling an hour later, with an apple tart by way of apology.' }, effects: { waitHours: 1, morale: 2 } },
      { id: 'push', label: { fr: 'La pousser soi-même (1 h)', en: 'Shove her off yourself (1 h)' }, outcome: { fr: "Une heure de palabres avec la vache. Elle finit par partir ; le pilote, lui, a les bottes pleines de boue.", en: 'An hour of negotiation with the cow. She leaves in the end; the pilot is left with boots full of mud.' }, effects: { waitHours: 1, morale: -1 } },
    ],
  },
  {
    kind: 'event', id: 'e-bougie', weight: 1,
    title: { fr: 'Moteur qui tousse', en: 'Coughing engine' },
    text: { fr: "Au point fixe, le moteur rate un temps sur quatre.", en: 'At run-up, the engine misses one beat in four.' },
    choices: [
      { id: 'fix', label: { fr: 'Changer la bougie (12 F)', en: 'Replace the plug (12 F)' }, outcome: { fr: "Une bougie neuve, et le moteur ronronne.", en: 'A new plug, and the engine purrs.' }, effects: { francs: -12 } },
      { id: 'risk', label: { fr: 'Partir comme ça', en: 'Go as it is' }, outcome: { fr: "Ça tiendra. Mais l'avion reviendra fatigué.", en: "It'll hold. But the plane will come back tired." }, effects: { wear: 12 } },
    ],
  },
  {
    kind: 'event', id: 'e-rhume', weight: 1,
    title: { fr: 'Pilote enrhumé', en: 'Pilot with a cold' },
    text: { fr: "Le pilote a le nez rouge et la voix de Moulin-Gris un jour de brume.", en: 'The pilot has a red nose and a voice like Greymill on a foggy day.' },
    choices: [
      { id: 'rest', label: { fr: 'Le laisser au lit (3 h)', en: 'Send them to bed (3 h)' }, outcome: { fr: "Trois heures sous l'édredon, une tisane au thym. Personne ne décolle d'ici là ; le moral remonte.", en: 'Three hours under the eiderdown and a thyme tea. Nobody takes off until then; spirits lift.' }, effects: { waitHours: 3, morale: 3 } },
      { id: 'fly', label: { fr: 'Voler avec un grog', en: 'Fly on a hot toddy' }, outcome: { fr: "La piste est libre : le pilote volera quand vous l'enverrez, grog en poche. Il s'en souviendra.", en: "The strip is clear: the pilot will fly when you send them, toddy in hand. They'll remember it." }, effects: { morale: -3 } },
    ],
  },
  {
    kind: 'event', id: 'e-vent', weight: 1,
    title: { fr: 'Vent de travers', en: 'Crosswind' },
    text: { fr: "Le vent descend de la crête de Haut-Ferrand et prend la piste en travers. La manche à air est à l'horizontale.", en: 'The wind comes down off the Ferncrest ridge and cuts across the strip. The windsock is standing straight out.' },
    choices: [
      { id: 'wait', label: { fr: 'Attendre qu\'il tombe (3 h)', en: 'Wait for it to drop (3 h)' }, outcome: { fr: "Trois heures à regarder la manche à air. Puis elle retombe, et le décollage est de velours.", en: 'Three hours watching the windsock. Then it sags, and the take-off is silk.' }, effects: { waitHours: 3 } },
      { id: 'go', label: { fr: 'Décoller quand même', en: 'Take off anyway' }, outcome: { fr: "Un écart, deux, et une roue à redresser au retour.", en: 'A swerve, then another, and a wheel to straighten when it gets back.' }, effects: { wear: 10 } },
    ],
  },
  {
    kind: 'event', id: 'e-sac', weight: 2,
    title: { fr: 'Un sac en trop', en: 'One bag too many' },
    text: { fr: "Au moment de charger, le receveur vous tend un sac de plus. « Si vous avez la place. »", en: 'As you load up, the postmaster hands you one more bag. "If you have the room."' },
    choices: [
      { id: 'take', label: { fr: 'Le prendre', en: 'Take it' }, outcome: { fr: "Le receveur paie d'avance : quinze francs, et un merci.", en: 'The postmaster pays up front: fifteen francs, and a thank-you.' }, effects: { francs: 15 } },
      { id: 'leave', label: { fr: 'Le laisser pour demain', en: 'Leave it for tomorrow' }, outcome: { fr: "Il attendra. Le receveur hausse les épaules, sans rancune.", en: 'It will wait. The postmaster shrugs, no hard feelings.' }, effects: {} },
    ],
  },
  {
    kind: 'event', id: 'e-pluie', weight: 1,
    title: { fr: 'Averse', en: 'Downpour' },
    text: { fr: "Une averse s'abat sur la piste au moment de partir. Le courrier est sous la bâche, le pilote non.", en: "A downpour hits the strip just as you're about to leave. The mail is under the tarpaulin; the pilot isn't." },
    choices: [
      { id: 'shelter', label: { fr: 'Attendre sous l\'auvent (1 h)', en: 'Wait under the awning (1 h)' }, outcome: { fr: "Une heure sous l'auvent du hangar, avec du cidre des Tilleuls. Personne ne se plaint.", en: 'An hour under the hangar awning with Lindenhollow cider. Nobody complains.' }, effects: { waitHours: 1, morale: 1 } },
      { id: 'go', label: { fr: 'Partir trempé', en: 'Go wet through' }, outcome: { fr: "Le courrier partira à l'heure. Le pilote éternuera pendant deux jours.", en: 'The mail will leave on time. The pilot will sneeze for two days.' }, effects: { morale: -2 } },
    ],
  },
  {
    kind: 'event', id: 'e-bac', weight: 1,
    title: { fr: 'Le bac est en grève', en: 'The ferry is on strike' },
    text: { fr: "Le passeur de Pont-de-Brume ne passe plus. Toute la vallée voudrait voler aujourd'hui, et le pharmacien est déjà au bout du chemin.", en: "The Mistbridge ferryman has stopped running. The whole valley wants to fly today, and the pharmacist is already at the end of the lane." },
    choices: [
      { id: 'raise', label: { fr: 'Le prendre en passager (+20 F, 1 h)', en: 'Take him as a passenger (+20 F, 1 h)' }, outcome: { fr: "Le temps qu'il monte avec sa sacoche et qu'on fasse de la place : une heure. Il paie en liquide et en sirop.", en: 'By the time he climbs in with his satchel and room is made: an hour. He pays in cash and cough syrup.' }, effects: { francs: 20, waitHours: 1 } },
      { id: 'mail', label: { fr: 'Rester au courrier', en: 'Stick to the mail' }, outcome: { fr: "Le courrier d'abord. C'est écrit sur l'enseigne.", en: "The mail comes first. It says so on the sign." }, effects: { morale: 1 } },
    ],
  },
  {
    kind: 'event', id: 'e-citerne', weight: 1,
    title: { fr: 'La citerne en retard', en: 'The fuel cart is late' },
    text: { fr: "La charrette du carburant aurait dû passer depuis longtemps. Le réservoir de l'aérodrome sonne creux.", en: "The fuel cart should have been here long ago. The aerodrome tank sounds hollow." },
    choices: [
      { id: 'wait', label: { fr: 'L\'attendre (2 h)', en: 'Wait for it (2 h)' }, outcome: { fr: "Deux heures. Le charretier s'excuse : une roue, un fossé, un cheval têtu.", en: 'Two hours. The carter apologises: a wheel, a ditch, a stubborn horse.' }, effects: { waitHours: 2 } },
      { id: 'buy', label: { fr: 'Acheter au garage du village (10 F)', en: 'Buy from the village garage (10 F)' }, outcome: { fr: "Plus cher, mais tout de suite. Le garagiste remplit les bidons en parlant de sa sœur à Moulin-Gris.", en: 'Dearer, but straight away. The garage man fills the cans while talking about his sister in Greymill.' }, effects: { francs: -10 } },
    ],
  },
  {
    kind: 'event', id: 'e-lettre-perdue', weight: 2,
    title: { fr: 'Une lettre sans adresse', en: 'A letter with no address' },
    text: { fr: "Au tri, une enveloppe sans nom ni village. Juste « à celle qui attend ».", en: 'In the sorting, an envelope with no name and no village. Just "to the one who is waiting".' },
    choices: [
      { id: 'ask', label: { fr: 'Demander au village (1 h)', en: 'Ask in the village (1 h)' }, outcome: { fr: "Une heure de porte en porte. Une vieille dame la prend sans un mot et vous serre la main longtemps. Un cachet pour l'album.", en: 'An hour from door to door. An old woman takes it without a word and holds your hand a long time. A stamp for the album.' }, effects: { waitHours: 1, stamps: 1 } },
      { id: 'return', label: { fr: 'La rapporter au bureau', en: 'Take it back to the office' }, outcome: { fr: "La poste la gardera. Quelqu'un la réclamera peut-être.", en: 'The post office will keep it. Someone may claim it.' }, effects: {} },
    ],
  },
  {
    kind: 'event', id: 'e-grain', weight: 1, region: 'saline', needsSeaplane: true,
    title: { fr: 'Un grain annoncé', en: 'A squall on the way' },
    text: { fr: "Le télégraphe de Port-Sel annonce un grain sur la Côte, et le baromètre du hangar dégringole. On ne part pas vers la mer, ou on part vite.", en: 'The Saltharbour telegraph warns of a squall along the Shore, and the hangar barometer is falling fast. Either you stay off the sea, or you go now.' },
    choices: [
      { id: 'wait', label: { fr: 'Le laisser passer (2 h)', en: 'Let it blow over (2 h)' }, outcome: { fr: "Deux heures à regarder la pluie marcher sur la rivière. Le courrier partira sec.", en: 'Two hours watching the rain walk along the river. The mail will leave dry.' }, effects: { waitHours: 2, morale: 1 } },
      { id: 'dash', label: { fr: 'Partir avant le grain', en: 'Beat the squall' }, outcome: { fr: "Le pilote décollera dans la première rafale. Les flotteurs prendront une vague, et le moteur du sel.", en: 'The pilot will take off into the first gust. The floats will take a wave, and the engine some salt.' }, effects: { wear: 8, morale: -1 } },
    ],
  },
  {
    kind: 'event', id: 'e-maree', weight: 2, region: 'saline', needsSeaplane: true,
    title: { fr: 'Basses eaux', en: 'Low water' },
    text: { fr: "La rivière a baissé. Au bout du ponton, la coque touche la vase.", en: 'The river has dropped. At the end of the pontoon, the hull is touching mud.' },
    choices: [
      { id: 'tide', label: { fr: 'Attendre que l\'eau remonte (3 h)', en: 'Wait for the water to rise (3 h)' }, outcome: { fr: "Trois heures. Le passeur raconte les naufrages du siècle dernier, et l'eau revient.", en: "Three hours. The ferryman tells of last century's wrecks, and the water comes back." }, effects: { waitHours: 3, morale: 1 } },
      { id: 'walk', label: { fr: 'Faire tirer la coque (10 F)', en: 'Have the hull hauled out (10 F)' }, outcome: { fr: "Deux gars du village, des cordes, des bottes louées. L'hydravion flotte ; les bottes ne reviennent pas.", en: 'Two lads from the village, ropes, hired boots. The seaplane floats; the boots never come back.' }, effects: { francs: -10 } },
    ],
  },
  {
    kind: 'event', id: 'e-lanterne-eteinte', weight: 1, region: 'archipel',
    title: { fr: 'La lanterne du ponton', en: 'The pontoon lantern' },
    text: { fr: "Le verre de la lanterne du ponton s'est fendu. Sans elle, personne ne rentrera des îles après la tombée du jour.", en: "The pontoon lantern's glass has cracked. Without it, nobody will find their way back from the Isles after dark." },
    choices: [
      { id: 'moon', label: { fr: 'Faire changer le verre (12 F)', en: 'Have the glass replaced (12 F)' }, outcome: { fr: "Le chaudronnier de Pont-de-Brume a un verre de rechange, et une opinion sur tout.", en: 'The Mistbridge tinsmith has a spare glass, and an opinion on everything.' }, effects: { francs: -12 } },
      { id: 'wait', label: { fr: 'Le réparer soi-même (3 h)', en: 'Fix it yourselves (3 h)' }, outcome: { fr: "Trois heures, du mastic et de la patience. La lanterne tient ; les pilotes en sont fiers.", en: 'Three hours, putty and patience. The lantern holds; the pilots are proud of it.' }, effects: { waitHours: 3, morale: 1 } },
    ],
  },
  {
    kind: 'event', id: 'e-fete-lanternes', weight: 2, region: 'archipel',
    title: { fr: 'L\'invitation des îles', en: 'An invitation from the Isles' },
    text: { fr: "Un mot est arrivé avec le courrier : les îles fêtent leurs lanternes, et les pilotes sont invités sur chaque ponton.", en: 'A note came with the mail: the Isles are holding their lantern festival, and the pilots are invited to every jetty.' },
    choices: [
      { id: 'stay', label: { fr: 'Fermer pour la fête (8 h)', en: 'Close for the festival (8 h)' }, outcome: { fr: "On ferme la piste et on y va. Huit heures de musique sur l'eau ; personne ne le regrettera.", en: "The strip closes and everyone goes. Eight hours of music on the water; nobody will regret it." }, effects: { waitHours: 8, morale: 4 } },
      { id: 'mail', label: { fr: 'Le courrier d\'abord', en: 'The mail comes first' }, outcome: { fr: "On envoie un mot et des vœux. Les pilotes soupirent, un peu.", en: 'A note and good wishes go back instead. The pilots sigh, a little.' }, effects: { morale: -1 } },
    ],
  },
  {
    kind: 'event', id: 'e-giboulees', weight: 1, season: 'printemps',
    title: { fr: 'Les giboulées', en: 'April showers' },
    text: { fr: "Soleil, grêle, soleil, averse : le ciel change d'avis toutes les dix minutes. La manche à air ne sait plus où se mettre.", en: "Sun, hail, sun, rain: the sky changes its mind every ten minutes. The windsock doesn't know which way to point." },
    choices: [
      { id: 'wait', label: { fr: 'Attendre une éclaircie (1 h)', en: 'Wait for a clear spell (1 h)' }, outcome: { fr: "Une heure sous l'auvent du hangar, à compter les grêlons. L'éclaircie vient ; l'arc-en-ciel aussi.", en: 'An hour under the hangar awning counting hailstones. The clear spell comes; so does the rainbow.' }, effects: { waitHours: 1, morale: 1 } },
      { id: 'go', label: { fr: 'Passer entre deux', en: 'Slip through a gap' }, outcome: { fr: "Le pilote partira dans le soleil et trouvera la grêle plus loin. L'entoilage prendra quelques coups.", en: 'The pilot will leave in sunshine and meet hail on the way. The fabric will take a few knocks.' }, effects: { wear: 4 } },
    ],
  },
  {
    kind: 'event', id: 'e-orage-ete', weight: 1, season: 'ete',
    title: { fr: "L'orage de chaleur", en: 'Heat storm' },
    text: { fr: "Après trois jours de chaleur, un orage monte derrière la crête : un mur gris, des éclairs sans bruit encore.", en: 'After three days of heat, a storm is building behind the ridge: a grey wall, lightning still silent.' },
    choices: [
      { id: 'wait', label: { fr: 'Le laisser passer (2 h)', en: 'Let it pass (2 h)' }, outcome: { fr: "Deux heures de pluie chaude sur la tôle. Après, l'air sent l'herbe coupée et tout le monde respire.", en: 'Two hours of warm rain on the tin roof. Afterwards the air smells of cut grass and everyone breathes again.' }, effects: { waitHours: 2, morale: 1 } },
      { id: 'go', label: { fr: 'Partir devant', en: 'Go ahead of it' }, outcome: { fr: "Le pilote filera avant le front ; la turbulence le rattrapera au retour, et il rentrera secoué.", en: 'The pilot will race ahead of the front; the turbulence will catch up on the way back, and they will come home shaken.' }, effects: { wear: 6, morale: -1 } },
    ],
  },
  {
    kind: 'event', id: 'e-feuilles', weight: 1, season: 'automne',
    title: { fr: 'Les feuilles sur la piste', en: 'Leaves on the strip' },
    text: { fr: "Le vent a couvert la piste de feuilles mouillées. Ça glisse comme du savon.", en: 'The wind has covered the strip in wet leaves. It is as slippery as soap.' },
    choices: [
      { id: 'rake', label: { fr: 'Ratisser (8 F)', en: 'Rake it (8 F)' }, outcome: { fr: "Deux gamins du village ratissent pour huit francs et un tour de hangar. La piste est nette.", en: 'Two village children rake for eight francs and a look round the hangar. The strip is clear.' }, effects: { francs: -8 } },
      { id: 'go', label: { fr: 'Décoller quand même', en: 'Take off anyway' }, outcome: { fr: "L'avion partira en crabe sur dix mètres avant de mordre. Le train souffrira.", en: 'The plane will crab ten metres before it bites. The undercarriage will suffer.' }, effects: { wear: 5 } },
    ],
  },
  {
    kind: 'event', id: 'e-neige', weight: 1, season: 'hiver',
    title: { fr: 'La neige sur la piste', en: 'Snow on the strip' },
    text: { fr: "La neige a tout recouvert. La piste n'est plus qu'une page blanche, et les pierres de balisage ont disparu.", en: 'Snow has covered everything. The strip is a blank page, and the marker stones have vanished.' },
    choices: [
      { id: 'shovel', label: { fr: 'Faire déblayer (15 F)', en: 'Have it cleared (15 F)' }, outcome: { fr: "Le cantonnier vient avec son cheval et sa lame. Une bande nette, et un bol de soupe au café pour lui.", en: 'The roadman comes with his horse and blade. One clean strip, and a bowl of soup at the café for him.' }, effects: { francs: -15 } },
      { id: 'wait', label: { fr: 'Attendre le redoux (3 h)', en: 'Wait for the thaw (3 h)' }, outcome: { fr: "Trois heures au coin du poêle. Le soleil fait le travail, et les pilotes jouent aux cartes.", en: 'Three hours by the stove. The sun does the work, and the pilots play cards.' }, effects: { waitHours: 3, morale: 1 } },
    ],
  },
  {
    kind: 'event', id: 'e-hetre-couche', weight: 1, region: 'cuivre',
    title: { fr: 'Un hêtre en travers', en: 'A beech across the strip' },
    text: { fr: "Un hêtre de la Forêt de Cuivre, tombé du chargement de bois, barre le bout de la piste. Le tronc est plus gros qu'un tonneau.", en: "A Copperwood beech, fallen off the timber load, blocks the end of the strip. The trunk is thicker than a barrel." },
    choices: [
      { id: 'saw', label: { fr: 'Payer les scieurs (18 F)', en: 'Pay the sawyers (18 F)' }, outcome: { fr: "Ils descendent des Scieries avec le passe-partout. Le temps d'un café, la piste est libre et le bois déjà vendu.", en: 'They come down from Millhurst with the crosscut saw. Before the coffee is cold, the strip is clear and the timber already sold.' }, effects: { francs: -18 } },
      { id: 'wait', label: { fr: 'Attendre le débardeur (3 h)', en: 'Wait for the logger (3 h)' }, outcome: { fr: "Le cheval du débardeur arrive à son pas. Trois heures, et une leçon sur la façon de tirer un tronc sans le fâcher.", en: "The logger's horse arrives at its own pace. Three hours, and a lesson in how to pull a trunk without upsetting it." }, effects: { waitHours: 3, morale: 1 } },
    ],
  },
  {
    kind: 'event', id: 'e-sous-bois', weight: 2, region: 'cuivre',
    title: { fr: "L'humidité des sous-bois", en: 'Damp from the woods' },
    text: { fr: "L'avion est rentré de la forêt couvert de rosée, et la porte du hangar ferme mal. Le moteur tousse comme un charbonnier.", en: "The plane came back from the woods dripping with dew, and the hangar door doesn't shut. Now the engine is coughing like a charcoal-burner." },
    choices: [
      { id: 'dry', label: { fr: 'Le sécher au poêle (12 F)', en: 'Dry it by the stove (12 F)' }, outcome: { fr: "Douze francs de bois dans le poêle. Le moteur repart, tiède et content.", en: 'Twelve francs of firewood by the stove. The engine starts again, warm and content.' }, effects: { francs: -12 } },
      { id: 'go', label: { fr: 'Partir quand même', en: 'Go anyway' }, outcome: { fr: "Il crachera, il hésitera, il prendra. Il faudra regarder les bougies de près.", en: 'It will spit, hesitate, catch. The plugs will need a close look.' }, effects: { wear: 8 } },
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
    // Poids 1 depuis le 14/10 : c'est le palier du premier mois. Son pilote suit au tirage
    // d'après (le hangar attend son pilote, sim.ts) : à une heure par jour, deux équipages
    // volent vers le jour 23, contre le jour 29 sans cette règle (médiane des 60 joueurs,
    // mesurée le 31/10/2026 par un robot qui ne se trompe jamais : un plafond).
    kind: 'opportunity', id: 'o-grive', weight: 1,
    title: { fr: 'Une Grive à Moulin-Gris', en: 'A Thrush at Greymill' },
    text: { fr: "Le meunier de Moulin-Gris envoyait sa farine par avion ; il l'envoie maintenant par camion. Sa Grive dort dans la grange, entoilée de frais, avec une odeur de farine qui ne partira jamais.", en: 'The Greymill miller used to send his flour by air; now he sends it by lorry. His Thrush sleeps in the barn, freshly doped, with a smell of flour that will never come out.' },
    offer: { type: 'plane', model: 'grive', price: 1500 },
  },
  {
    kind: 'opportunity', id: 'o-heron', weight: 3,
    title: { fr: 'Le Héron des Messageries', en: "The carriers' Heron" },
    text: { fr: "Les Messageries de Pont-de-Brume remplacent leur trimoteur par deux camions. Le Héron est à vendre : trois moteurs révisés, cinq sacs dans la soute. Il lui faut la grande piste — c'est à ça qu'elle sert.", en: "The Mistbridge carriers are replacing their trimotor with two lorries. The Heron is for sale: three engines overhauled, five bags in the hold. It needs the long strip — that's what the long strip is for." },
    offer: { type: 'plane', model: 'heron', price: 5600 },
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
    text: { fr: "Le hameau des Tilleuls donne sa fête, des lampions à chaque fenêtre. Il y a du cidre, un bal, et tout le monde demande si les pilotes viendront.", en: 'Lindenhollow is holding its fair, a paper lantern in every window. There is cider, a dance, and everyone is asking whether the pilots will come.' },
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
    offer: { type: 'plane', model: 'sterne', price: 3850 },
  },
  {
    kind: 'opportunity', id: 'o-carte-marine', weight: 3, region: 'saline',
    title: { fr: 'La carte marine du gardien', en: 'The keeper\'s sea chart' },
    text: { fr: "Un des gardiens de Brisant vous confie sa vieille carte de la Côte : les passes, les hauts-fonds, et un trait au crayon vers des îles qui n'y figurent pas encore. Un cachet pour l'album.", en: 'One of the Breaker keepers hands you his old chart of the Shore: the channels, the shoals, and a pencil line towards islands that are not on it yet. A stamp for the album.' },
    offer: { type: 'map', stamps: 1 },
  },
  // ---- Archipel des Lanternes ----
  {
    // Le Goéland est l'avion de l'Archipel : il ne vient qu'une fois sa route ouverte.
    // Le 18 octobre, il tombait dès la Côte ouverte, à 6 600 F devant une caisse de
    // 194 F, sans ponton ni route pour lui : une carte qui ne pouvait dire que non.
    kind: 'opportunity', id: 'o-goeland', weight: 2, region: 'archipel',
    title: { fr: 'Un Goéland à Port-Sel', en: 'A Gull at Saltharbour' },
    text: { fr: "La compagnie des bateaux-poste revend son hydravion long-courrier : une coque, deux moteurs, et de quoi tenir jusqu'à la dernière île. Elle veut quelqu'un qui le fera voler, pas quelqu'un qui le revendra.", en: 'The mail-boat company is selling its long-range seaplane: a hull, two engines, enough fuel to reach the last island. They want someone who will fly it, not someone who will sell it on.' },
    offer: { type: 'plane', model: 'goeland', price: 6600 },
  },
  {
    kind: 'opportunity', id: 'o-pilote-iles', weight: 2, region: 'archipel',
    title: { fr: 'Un pilote se présente', en: 'A pilot turns up' },
    text: { fr: "Un pilote attend près du hangar, un sac à l'épaule, et demande si votre compagnie prend encore du monde.", en: 'A pilot is waiting by the hangar with a bag over one shoulder, asking whether your company is still taking people on.' },
    offer: { type: 'pilot', pilot: 'rotating' },
  },
  // ---- Forêt de Cuivre ----
  {
    kind: 'opportunity', id: 'o-pic', weight: 2, region: 'cuivre',
    title: { fr: 'Le Pic du receveur', en: "The postmaster's Woodpecker" },
    text: { fr: "Le receveur de Villechaudron a voulu faire porter le courrier de la forêt par un Pic. Il n'a jamais appris à le piloter. L'avion attend sous une bâche, aile haute et pneus ballons, comme un oiseau qui ne sait pas qu'il vole.", en: "The Kettleby postmaster once meant to have the forest mail carried by a Woodpecker. He never learned to fly it. It waits under a tarpaulin, high wing and balloon tyres, like a bird that doesn't know it can fly." },
    offer: { type: 'plane', model: 'pic', price: 3150 },
  },
  {
    kind: 'opportunity', id: 'o-releve', weight: 3, region: 'cuivre',
    title: { fr: 'Le relevé des clairières', en: 'The clearing survey' },
    text: { fr: "Le garde du Hêtre-Roi vous donne une copie de son relevé : chaque clairière de la forêt, sa longueur au pas, et le côté d'où le vent du soir y descend. Un cachet pour l'album.", en: 'The Kingbeech forester gives you a copy of his survey: every clearing in the forest, its length in paces, and the side the evening wind comes down from. A stamp for the album.' },
    offer: { type: 'map', stamps: 1 },
  },
  {
    kind: 'opportunity', id: 'o-pilote-foret', weight: 2, region: 'cuivre',
    title: { fr: 'Une lettre de candidature', en: 'A letter of application' },
    text: { fr: "Avec le courrier est arrivée une lettre de candidature : un pilote cherche une compagnie et assure savoir voler partout, jour et nuit.", en: 'Among the mail came a letter of application: a pilot is looking for a company and promises to fly anywhere, day or night.' },
    offer: { type: 'pilot', pilot: 'rotating' },
  },
];
