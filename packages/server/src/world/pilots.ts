/**
 * Les quatre premiers pilotes. Deux femmes, deux hommes, quatre régions d'origine.
 *
 * Leurs histoires sont le contenu émotionnel du jeu : trois scènes chacune, qui
 * s'ouvrent au fil des vols faits ensemble (l'affinité). On les écrit court, à
 * hauteur de comptoir de café, sans grands mots. Les noms de lieux du monde
 * inventé y passent naturellement, dont le chemin de la Croisette.
 */
import type { PilotTemplate } from './types.ts';

export const PILOTS: readonly PilotTemplate[] = [
  {
    id: 'marthe', gender: 'f', age: 44,
    name: { fr: 'Marthe Vaudrin', en: 'Martha Vaudrin' },
    origin: { fr: 'Vallées de Brume', en: 'Mistvale' },
    traits: ['weathersense', 'homeheart'],
    portrait: { fr: "Cheveux gris coupés court, blouson de cuir trop grand, un regard qui a déjà lu le ciel avant vous.", en: 'Short grey hair, a leather jacket a size too big, and eyes that have read the sky before you have.' },
    greeting: { fr: "Je volais déjà d'ici quand vous n'étiez pas né. On y va, ou on attend que ça se lève ?", en: 'I was flying out of here before you were born. Shall we go, or wait for it to lift?' },
    wage: 8, starter: true,
    story: {
      title: { fr: 'Le premier jour de brume', en: 'The First Day of Fog' },
      scenes: [
        {
          affinity: 3,
          title: { fr: 'La croix au bout du chemin', en: 'The cross at the end of the lane' },
          lines: [
            { who: 'narrator', text: { fr: "Marthe s'arrête à la fourche du chemin de la Croisette, là où la petite croix de pierre penche un peu. Elle pose deux doigts dessus, sans y penser.", en: 'Martha stops at the fork in Crosslet Lane, where the little stone cross leans slightly. She rests two fingers on it, without thinking.' } },
            { who: 'you', text: { fr: "Vous faites ça à chaque fois ?", en: 'You do that every time?' } },
            { who: 'pilot', text: { fr: "Tout le monde le fait. Le vieux Bastien le faisait, c'est lui qui m'a appris à voler. Son père le faisait avant lui, et je crois que lui non plus ne savait pas pourquoi.", en: 'Everyone does. Old Bastien did; he\'s the one who taught me to fly. His father did before him, and I don\'t think he knew why either.' } },
            { who: 'pilot', text: { fr: "Ce n'est pas de la superstition. C'est pour dire au chemin qu'on revient.", en: 'It isn\'t superstition. It\'s to tell the lane we\'re coming back.' } },
            { who: 'narrator', text: { fr: "Elle vous regarde. Vous touchez la croix. La brume commence à se lever.", en: 'She looks at you. You touch the cross. The fog begins to lift.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'Dix heures moins le quart', en: 'A quarter to ten' },
          lines: [
            { who: 'narrator', text: { fr: "Moulin-Gris est noyé. Vous ne voyez pas le bout de la piste. Marthe, elle, regarde ses mains.", en: 'Greymill is drowned in fog. You cannot see the end of the strip. Martha is looking at her hands.' } },
            { who: 'pilot', text: { fr: "Un quart d'heure. Le temps de boire quelque chose de chaud. Ça lève toujours au quart.", en: 'A quarter of an hour. Long enough for something hot. It always lifts at the quarter.' } },
            { who: 'you', text: { fr: "Comment vous savez ?", en: 'How do you know?' } },
            { who: 'pilot', text: { fr: "Je ne sais pas. Je sens. Ma mère sentait la pluie dans son genou ; moi c'est la brume, dans le dos. Ce n'est pas un don, c'est quarante ans ici.", en: 'I don\'t know. I feel it. My mother felt rain in her knee; with me it\'s fog, in my back. It isn\'t a gift, it\'s forty years here.' } },
            { who: 'narrator', text: { fr: "À dix heures moins le quart, la piste apparaît. Elle ne dit rien. Elle n'a pas besoin.", en: 'At a quarter to ten, the strip appears. She says nothing. She doesn\'t need to.' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: "Le hangar de Bastien", en: 'Bastien\'s hangar' },
          lines: [
            { who: 'narrator', text: { fr: "Le soir, dans le hangar, Marthe vous montre une marque au crayon sur la poutre, à hauteur d'épaule.", en: 'In the evening, in the hangar, Martha shows you a pencil mark on the beam, at shoulder height.' } },
            { who: 'pilot', text: { fr: "Bastien mesurait les pilotes ici, le jour de leur premier vol seul. Celle-là, c'est moi, à dix-sept ans. Il disait qu'on ne grandit plus après, sauf vers le haut.", en: 'Bastien measured pilots here, the day of their first solo. That one\'s me, at seventeen. He said you stop growing after that, except upward.' } },
            { who: 'you', text: { fr: "Et la vôtre, où est-elle ?", en: 'And where is yours?' } },
            { who: 'pilot', text: { fr: "Je viens de vous la montrer. Il n'y en a pas d'autre. Il n'a pas eu le temps de prendre un autre élève. Alors, je me suis dit… si le nouveau propriétaire tient la route, je ferai la marque moi-même.", en: 'I just showed you. There isn\'t another. He never got the time to take another student. So I thought… if the new owner is worth it, I\'ll make the mark myself.' } },
            { who: 'narrator', text: { fr: "Elle sort un crayon de sa poche. Elle le tenait depuis le premier jour.", en: 'She takes a pencil from her pocket. She has been carrying it since the first day.' } },
          ],
        },
      ],
    },
  },
  {
    id: 'ilias', gender: 'm', age: 27,
    name: { fr: 'Ilias Ferrant', en: 'Ilias Ferrant' },
    origin: { fr: "Hauts-Plateaux d'Ocre", en: 'Ochre Reach' },
    traits: ['daredevil', 'thrifty'],
    portrait: { fr: "Grand, maigre, une écharpe rouge délavée qu'il ne quitte pas, et un carnet de comptes dans la poche de poitrine.", en: 'Tall, thin, a faded red scarf he never takes off, and an account book in his breast pocket.' },
    greeting: { fr: "Je vole vite et je dépense peu. Les deux. Vous verrez.", en: 'I fly fast and I spend little. Both. You\'ll see.' },
    wage: 7, starter: false,
    story: {
      title: { fr: 'Le col et la lettre', en: 'The Pass and the Letter' },
      scenes: [
        {
          affinity: 3,
          title: { fr: 'La moitié', en: 'Half' },
          lines: [
            { who: 'narrator', text: { fr: "Jour de paie. Ilias compte deux fois, met la moitié dans une enveloppe, écrit une adresse sur les Hauts-Plateaux.", en: 'Payday. Ilias counts twice, puts half in an envelope, writes an address up on the plateaus.' } },
            { who: 'you', text: { fr: "La moitié, chaque fois ?", en: 'Half, every time?' } },
            { who: 'pilot', text: { fr: "Ma mère tient l'auberge du col. L'hiver, il n'y a personne. L'auberge tient parce que je vole. Ce n'est pas triste, c'est un arrangement.", en: 'My mother keeps the inn at the pass. In winter there\'s no one. The inn stands because I fly. It isn\'t sad, it\'s an arrangement.' } },
            { who: 'pilot', text: { fr: "Et puis d'ici, Combe-aux-Rosées, ce n'est qu'à trois lieues du pied du col. Un jour je livrerai l'enveloppe moi-même.", en: 'Besides, from here Dewcombe is only three leagues from the foot of the pass. One day I\'ll deliver the envelope myself.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'Plein gaz', en: 'Full throttle' },
          lines: [
            { who: 'narrator', text: { fr: "Le Martinet est rentré chaud, avec un bruit nouveau dans le moteur. Ilias a gagné vingt minutes sur l'horaire et perdu une bougie.", en: 'The Swift came back hot, with a new noise in the engine. Ilias gained twenty minutes on the schedule and lost a spark plug.' } },
            { who: 'you', text: { fr: "Vous économisez sur tout sauf sur le moteur.", en: 'You save on everything except the engine.' } },
            { who: 'pilot', text: { fr: "Sur le col, quand la neige vient, on ne ralentit pas pour ménager le mulet. On passe, ou on reste de l'autre côté jusqu'au printemps. J'ai appris à voler comme ça.", en: 'Up at the pass, when the snow comes, you don\'t slow down to spare the mule. You get through, or you stay on the other side until spring. That\'s how I learned to fly.' } },
            { who: 'pilot', text: { fr: "Mais vous avez raison. Je vais apprendre l'autre façon. Un peu.", en: 'But you\'re right. I\'ll learn the other way. A little.' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: 'Le Grand Blanc, un jour', en: 'The Great White, someday' },
          lines: [
            { who: 'narrator', text: { fr: "Sur la carte punaisée au mur du café, Ilias a tracé au crayon une ligne qui part de la Croisette et monte, monte, jusqu'au bord du papier.", en: 'On the map pinned to the café wall, Ilias has drawn a pencil line that leaves Crosslet Field and climbs, climbs, to the edge of the paper.' } },
            { who: 'pilot', text: { fr: "Le Grand Blanc. Huit heures de glace sans un village. Personne de chez moi n'y est allé.", en: 'The Great White. Eight hours of ice without a single village. No one from home has ever been.' } },
            { who: 'you', text: { fr: "Et vous voulez y aller avec le Martinet ?", en: 'And you want to go there in the Swift?' } },
            { who: 'pilot', text: { fr: "Non. Avec vous. Quand la compagnie aura un long-courrier et que j'aurai appris à ménager un moteur. Vous voyez, j'écoute. Je mets juste du temps.", en: 'No. With you. When the company has a long-hauler and I\'ve learned to nurse an engine. See, I do listen. I just take my time.' } },
            { who: 'narrator', text: { fr: "Il efface un bout de la ligne, et la retrace, un peu moins droite. Plus prudente.", en: 'He rubs out part of the line and draws it again, a little less straight. More careful.' } },
          ],
        },
      ],
    },
  },
  {
    id: 'yse', gender: 'f', age: 31,
    name: { fr: 'Ysé Loranne', en: 'Ysé Loranne' },
    origin: { fr: 'Archipel des Lanternes', en: 'Lantern Isles' },
    traits: ['nightowl', 'luckycharm'],
    portrait: { fr: "Petite, vive, une lanterne de cuivre accrochée au sac, et des taches de rousseur comme une carte d'îles.", en: 'Small, quick, a copper lantern hooked to her bag, and freckles like a map of islands.' },
    greeting: { fr: "Je préfère le soir. Le monde est plus honnête quand il faut l'éclairer soi-même.", en: 'I prefer the evening. The world is more honest when you have to light it yourself.' },
    wage: 8, starter: false,
    story: {
      title: { fr: 'Les lanternes du Val', en: 'The Lanterns of the Hollow' },
      scenes: [
        {
          affinity: 3,
          title: { fr: 'Une lanterne sur six', en: 'One lantern in six' },
          lines: [
            { who: 'narrator', text: { fr: "Lanterne-du-Val, à la nuit tombée. Ysé compte les lumières le long de la piste en se posant. Une sur six est éteinte.", en: 'Lanternhollow, after dark. Ysé counts the lights along the strip as she lands. One in six is out.' } },
            { who: 'pilot', text: { fr: "Chez moi, dans l'Archipel, une lanterne éteinte sur la jetée, c'est quelqu'un qui n'est pas rentré. Ici, c'est juste de l'huile. Je mets du temps à m'y faire.", en: 'Back home, in the Isles, a dead lantern on the jetty means someone didn\'t come back. Here it\'s just oil. It takes me a while to get used to that.' } },
            { who: 'you', text: { fr: "Vous voulez qu'on en apporte, de l'huile ?", en: 'Shall we bring them some oil?' } },
            { who: 'pilot', text: { fr: "Je l'ai déjà mise dans le sac. Un pilote de nuit transporte toujours de la lumière pour les autres. C'est la règle.", en: 'Already in the bag. A night pilot always carries light for others. That\'s the rule.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'Le bateau-poste', en: 'The mail boat' },
          lines: [
            { who: 'narrator', text: { fr: "Un contrat de lettres d'amour pour Lanterne-du-Val. Ysé lit l'étiquette du sac et sourit d'un côté seulement.", en: 'A contract of love letters for Lanternhollow. Ysé reads the bag\'s label and smiles with one side of her mouth only.' } },
            { who: 'pilot', text: { fr: "Mon père faisait le bateau-poste entre les îles. Il disait que les lettres d'amour pèsent plus lourd que les autres. Il l'a dit jusqu'au soir où le bateau n'est pas rentré.", en: 'My father ran the mail boat between the islands. He said love letters weigh more than the others. He said it right up to the evening the boat didn\'t come back.' } },
            { who: 'pilot', text: { fr: "Je suis venue dans les vallées pour ne plus voir la mer. J'ai trouvé un village qui allume des lanternes. On ne choisit pas ce qui nous suit.", en: 'I came to the valleys so I wouldn\'t have to look at the sea. I found a village that lights lanterns. You don\'t choose what follows you.' } },
            { who: 'you', text: { fr: "On peut donner ce sac à quelqu'un d'autre.", en: 'We can give this bag to someone else.' } },
            { who: 'pilot', text: { fr: "Sûrement pas. Il pèse lourd. C'est pour ça qu'il faut que ce soit moi.", en: 'Certainly not. It\'s heavy. That\'s exactly why it has to be me.' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: 'La lanterne de cuivre', en: 'The copper lantern' },
          lines: [
            { who: 'narrator', text: { fr: "Ysé décroche la lanterne de cuivre de son sac et la pose sur le comptoir du café, entre vous deux.", en: 'Ysé unhooks the copper lantern from her bag and sets it on the café counter, between the two of you.' } },
            { who: 'pilot', text: { fr: "C'est celle du bateau. La seule chose qui soit revenue. Je la porte depuis six ans et je ne l'ai jamais allumée.", en: 'It\'s the one from the boat. The only thing that came back. I\'ve carried it six years and never lit it.' } },
            { who: 'pilot', text: { fr: "Je voudrais qu'elle reste ici. Au bout de la piste, du côté du chemin de la Croisette. Pour ceux qui rentrent tard.", en: 'I\'d like it to stay here. At the end of the strip, on the Crosslet Lane side. For those who come home late.' } },
            { who: 'you', text: { fr: "On l'allumera tous les soirs.", en: 'We\'ll light it every evening.' } },
            { who: 'narrator', text: { fr: "Elle hoche la tête. Ce soir-là, pour la première fois, c'est elle qui craque l'allumette.", en: 'She nods. That evening, for the first time, she is the one who strikes the match.' } },
          ],
        },
      ],
    },
  },
  {
    id: 'aurele', gender: 'm', age: 58,
    name: { fr: 'Aurèle Combray', en: 'Aurel Combray' },
    origin: { fr: 'Côte de Saline', en: 'Saltshore' },
    traits: ['goldenhands', 'longhaul'],
    portrait: { fr: "Trapu, les mains tachées d'huile jusqu'aux coudes, une moustache blanche, et une photo d'enfant dans la casquette.", en: 'Stocky, oil-stained to the elbows, a white moustache, and a child\'s photograph tucked in his cap.' },
    greeting: { fr: "J'ai réparé des hydravions trente ans sur la Côte. Votre biplan, c'est une bicyclette. Donnez-le-moi une heure.", en: 'Thirty years fixing seaplanes on the Shore. Your biplane is a bicycle. Give it to me for an hour.' },
    wage: 9, starter: false,
    story: {
      title: { fr: 'Le moteur qui tousse', en: 'The Coughing Engine' },
      scenes: [
        {
          affinity: 3,
          title: { fr: 'Du fil de fer', en: 'Wire' },
          lines: [
            { who: 'narrator', text: { fr: "La Grive est rentrée avec un bruit de casserole. Aurèle a ouvert le capot, écouté, et sorti de sa poche un rouleau de fil de fer.", en: 'The Thrush came back sounding like a saucepan. Aurel opened the cowling, listened, and took a roll of wire from his pocket.' } },
            { who: 'you', text: { fr: "Du fil de fer ? Sérieusement ?", en: 'Wire? Seriously?' } },
            { who: 'pilot', text: { fr: "Sur la Côte, quand un hydravion tombe en panne, il est sur l'eau. Pas d'atelier à trois lieues. Vous réparez avec ce que vous avez dans les poches, ou vous dérivez jusqu'au large.", en: 'On the Shore, when a seaplane breaks down, it\'s on the water. No workshop three leagues away. You fix it with what\'s in your pockets, or you drift out to sea.' } },
            { who: 'pilot', text: { fr: "Ça tiendra jusqu'à Pont-de-Brume. Après, on fera les choses proprement. Mais d'abord, le courrier.", en: 'It\'ll hold to Mistbridge. After that we\'ll do it properly. But first, the mail.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'La photo dans la casquette', en: 'The photograph in the cap' },
          lines: [
            { who: 'narrator', text: { fr: "La photo est tombée de la casquette pendant qu'il se penchait sur le moteur. Une petite fille sur une jetée, les pieds dans l'eau.", en: 'The photograph fell from his cap as he bent over the engine. A little girl on a jetty, feet in the water.' } },
            { who: 'pilot', text: { fr: "Ma petite-fille. Lise. Huit ans. Elle vit sur la Côte avec sa mère. Elle croit que je suis chef mécanicien d'une grande compagnie.", en: 'My granddaughter. Lise. Eight. She lives on the Shore with her mother. She thinks I\'m chief engineer of a great company.' } },
            { who: 'you', text: { fr: "Vous l'êtes. On est juste une petite compagnie.", en: 'You are. We\'re just a small company.' } },
            { who: 'pilot', text: { fr: "Vous voyez ? C'est pour ça que je suis resté. Les gens d'ici disent les choses simplement. Je lui écris chaque semaine. Un jour, vous aurez un hydravion, et je lui porterai la lettre moi-même.", en: 'See? That\'s why I stayed. People here say things plainly. I write her every week. One day you\'ll have a seaplane, and I\'ll carry the letter myself.' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: "L'atelier", en: 'The workshop' },
          lines: [
            { who: 'narrator', text: { fr: "Aurèle a rangé le hangar sans qu'on le lui demande. Chaque outil a sa place dessinée au crayon sur la planche.", en: 'Aurel has tidied the hangar without being asked. Every tool has its place drawn in pencil on the board.' } },
            { who: 'pilot', text: { fr: "Sur la Côte, j'avais un atelier comme ça. Je l'ai vendu quand ma femme est partie. Je pensais que je n'en voudrais plus jamais.", en: 'On the Shore I had a workshop like this. I sold it when my wife died. I thought I\'d never want another.' } },
            { who: 'pilot', text: { fr: "Et puis il y a ce hangar qui ferme mal, et vos avions qui toussent, et ce chemin avec sa petite croix où tout le monde pose la main. On dirait que l'endroit avait besoin de quelqu'un.", en: 'And then there\'s this hangar that doesn\'t shut, and your coughing planes, and that lane with its little cross where everyone rests a hand. It\'s as if the place needed someone.' } },
            { who: 'you', text: { fr: "Il avait besoin de vous.", en: 'It needed you.' } },
            { who: 'pilot', text: { fr: "Alors on dira que c'est mon atelier. Et je ne le vendrai pas, celui-là.", en: 'Then we\'ll call it my workshop. And this one I\'m not selling.' } },
          ],
        },
      ],
    },
  },
];
