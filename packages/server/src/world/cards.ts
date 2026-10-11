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
    { fr: "Le sac du jour pour Pont-de-Brume. Pas de contrat, pas de prime : la poste paie le tarif, et elle paie toujours. Il part quand vous voulez.", en: 'The day\'s bag for Mistbridge. No contract, no bonus: the post pays the rate, and it always pays. It leaves whenever you like.' }),
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
];
