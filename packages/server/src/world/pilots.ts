/**
 * Les pilotes. Chacun vient d'une région différente du monde inventé.
 *
 * Leurs histoires sont le contenu émotionnel du jeu : trois scènes chacune, qui
 * s'ouvrent au fil des vols faits ensemble (l'affinité). On les écrit court, à
 * hauteur de comptoir de café, sans grands mots. Les noms de lieux du monde
 * inventé y passent naturellement, dont le chemin de la Croisette.
 */
import type { PilotTemplate } from './types.ts';

export const PILOTS: readonly PilotTemplate[] = [
  {
    id: 'prosper', gender: 'm', age: 44,
    name: { fr: 'Prosper Chickenman', en: 'Prosper Chickenman' },
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
            { who: 'narrator', text: { fr: "Prosper s'arrête à la fourche du chemin de la Croisette, là où la petite croix de pierre penche un peu. Il pose deux doigts dessus, sans y penser.", en: 'Prosper stops at the fork in Crosslet Lane, where the little stone cross leans slightly. He rests two fingers on it, without thinking.' } },
            { who: 'you', text: { fr: "Vous faites ça à chaque fois ?", en: 'You do that every time?' } },
            { who: 'pilot', text: { fr: "Tout le monde le fait. Le vieux Bastien le faisait, c'est lui qui m'a appris à voler. Son père le faisait avant lui, et je crois que lui non plus ne savait pas pourquoi.", en: 'Everyone does. Old Bastien did; he\'s the one who taught me to fly. His father did before him, and I don\'t think he knew why either.' } },
            { who: 'pilot', text: { fr: "Ce n'est pas de la superstition. C'est pour dire au chemin qu'on revient.", en: 'It isn\'t superstition. It\'s to tell the lane we\'re coming back.' } },
            { who: 'narrator', text: { fr: "Il vous regarde. Vous touchez la croix. La brume commence à se lever.", en: 'He looks at you. You touch the cross. The fog begins to lift.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'Dix heures moins le quart', en: 'A quarter to ten' },
          lines: [
            { who: 'narrator', text: { fr: "Moulin-Gris est noyé. Vous ne voyez pas le bout de la piste. Prosper, lui, regarde ses mains.", en: 'Greymill is drowned in fog. You cannot see the end of the strip. Prosper is looking at his hands.' } },
            { who: 'pilot', text: { fr: "Un quart d'heure. Le temps de boire quelque chose de chaud. Ça lève toujours au quart.", en: 'A quarter of an hour. Long enough for something hot. It always lifts at the quarter.' } },
            { who: 'you', text: { fr: "Comment vous savez ?", en: 'How do you know?' } },
            { who: 'pilot', text: { fr: "Je ne sais pas. Je sens. Ma mère sentait la pluie dans son genou ; moi c'est la brume, dans le dos. Ce n'est pas un don, c'est quarante ans ici.", en: 'I don\'t know. I feel it. My mother felt rain in her knee; with me it\'s fog, in my back. It isn\'t a gift, it\'s forty years here.' } },
            { who: 'narrator', text: { fr: "À dix heures moins le quart, la piste apparaît. Il ne dit rien. Il n'a pas besoin.", en: 'At a quarter to ten, the strip appears. He says nothing. He doesn\'t need to.' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: "Le hangar de Bastien", en: 'Bastien\'s hangar' },
          lines: [
            { who: 'narrator', text: { fr: "Le soir, dans le hangar, Prosper vous montre une marque au crayon sur la poutre, à hauteur d'épaule.", en: 'In the evening, in the hangar, Prosper shows you a pencil mark on the beam, at shoulder height.' } },
            { who: 'pilot', text: { fr: "Bastien mesurait les pilotes ici, le jour de leur premier vol seul. Celle-là, c'est moi, à dix-sept ans. Il disait qu'on ne grandit plus après, sauf vers le haut.", en: 'Bastien measured pilots here, the day of their first solo. That one\'s me, at seventeen. He said you stop growing after that, except upward.' } },
            { who: 'you', text: { fr: "Et la vôtre, où est-elle ?", en: 'And where is yours?' } },
            { who: 'pilot', text: { fr: "Je viens de vous la montrer. Il n'y en a pas d'autre. Il n'a pas eu le temps de prendre un autre élève. Alors, je me suis dit… si le nouveau propriétaire tient la route, je ferai la marque moi-même.", en: 'I just showed you. There isn\'t another. He never got the time to take another student. So I thought… if the new owner is worth it, I\'ll make the mark myself.' } },
            { who: 'narrator', text: { fr: "Il sort un crayon de sa poche. Il le tenait depuis le premier jour.", en: 'He takes a pencil from his pocket. He has been carrying it since the first day.' } },
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
    id: 'garance', gender: 'f', age: 29,
    name: { fr: 'Garance Thuillier', en: 'Garance Thuillier' },
    origin: { fr: 'Pont-de-Brume', en: 'Mistbridge' },
    traits: ['daredevil', 'homeheart'],
    portrait: { fr: "Petite, vive, une écharpe nouée serré et des lunettes d'aviateur remontées sur le front même au sol. Elle parle vite et atterrit court.", en: 'Small, quick, a tightly knotted scarf and flying goggles pushed up on her forehead even on the ground. She talks fast and lands short.' },
    greeting: { fr: "J'ai grandi de l'autre côté de la rivière, à vous regarder vous poser. Vous avez une place, ou je dois encore regarder ?", en: "I grew up on the other side of the river, watching you land. Have you got a seat, or do I keep watching?" },
    wage: 9, starter: false,
    story: {
      title: { fr: "De l'autre côté de la rivière", en: 'The Other Side of the River' },
      scenes: [
        {
          affinity: 3,
          title: { fr: 'Le quai du marché', en: 'The market quay' },
          lines: [
            { who: 'narrator', text: { fr: "Au retour de Pont-de-Brume, Garance ne descend pas tout de suite. Elle regarde le quai du marché, de l'autre côté de l'eau.", en: 'Back from Mistbridge, Garance does not climb out straight away. She looks at the market quay, on the other side of the water.' } },
            { who: 'pilot', text: { fr: "C'est là que je me mettais. Entre les caisses de poisson, pour que le poissonnier ne me voie pas. De là, on voit toute la piste de la Croisette.", en: "That's where I used to stand. Between the fish crates, so the fishmonger wouldn't see me. From there you can see the whole Crosslet strip." } },
            { who: 'you', text: { fr: "Vous regardiez quoi ?", en: 'What were you watching?' } },
            { who: 'pilot', text: { fr: "Les atterrissages. Un bon, on l'entend avant de le voir : le moteur baisse, et plus rien. J'ai appris à les noter avant de savoir écrire.", en: "The landings. You hear a good one before you see it: the engine drops, and then nothing. I was grading them before I could write." } },
            { who: 'narrator', text: { fr: "Elle saute du marchepied. Vous n'avez pas entendu le moteur baisser, tout à l'heure. Vous ne lui direz pas.", en: 'She jumps down from the step. You did not hear her engine drop just now. You will not tell her.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'Trop court', en: 'Too short' },
          lines: [
            { who: 'narrator', text: { fr: "Garance se pose aux Tilleuls en deux fois moins de pré qu'il n'en faut. Les vaches n'ont pas bougé. Prosper, lui, a posé sa tasse.", en: 'Garance lands at Lindenhollow in half the meadow it takes. The cows did not move. Prosper, though, has put down his cup.' } },
            { who: 'pilot', text: { fr: "Quoi ? Il restait de la place.", en: 'What? There was room to spare.' } },
            { who: 'you', text: { fr: "Il en restait trois mètres.", en: 'Three metres of it.' } },
            { who: 'pilot', text: { fr: "Trois mètres, c'est trois mètres. Je sais ce que la Grive peut faire. C'est tout ce que j'ai appris sur mon quai : ce que les avions peuvent faire, et ce que les pilotes croient qu'ils peuvent faire. Ce n'est pas pareil.", en: "Three metres is three metres. I know what the Thrush can do. That's all I ever learned on my quay: what planes can do, and what pilots think they can do. They aren't the same." } },
            { who: 'narrator', text: { fr: "Prosper reprend sa tasse. Il ne dit rien, mais il la regarde ranger l'avion, et il hoche la tête une fois.", en: 'Prosper picks up his cup again. He says nothing, but he watches her put the plane away, and nods once.' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: 'La poutre', en: 'The beam' },
          lines: [
            { who: 'narrator', text: { fr: "Un soir, Garance s'arrête devant la poutre du hangar, là où une seule marque au crayon est tracée à hauteur d'épaule.", en: 'One evening, Garance stops in front of the hangar beam, where a single pencil mark is drawn at shoulder height.' } },
            { who: 'pilot', text: { fr: "Prosper m'a expliqué. Bastien mesurait les pilotes ici, le jour de leur premier vol seul. Moi, mon premier vol seul, je l'ai fait à seize ans, sur un appareil qui n'était pas à moi, et personne ne m'a mesurée.", en: "Prosper explained it to me. Bastien measured pilots here, the day of their first solo. My first solo was at sixteen, in a machine that wasn't mine, and nobody measured me." } },
            { who: 'you', text: { fr: "Vous voulez qu'on le fasse maintenant ?", en: 'Do you want us to do it now?' } },
            { who: 'pilot', text: { fr: "Treize ans après ? Oui. Pas pour la marque. Pour qu'il y en ait deux sur cette poutre au lieu d'une.", en: "Thirteen years late? Yes. Not for the mark. So that there are two on this beam instead of one." } },
            { who: 'narrator', text: { fr: "Prosper sort son crayon. Il le tenait depuis le premier jour, et il n'a jamais dit pour qui.", en: 'Prosper takes out his pencil. He has been carrying it since the first day, and he never said who for.' } },
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
  // ---- v0.2 : deux pilotes de passage, venus de plus loin ----
  {
    id: 'solenn', gender: 'f', age: 36,
    name: { fr: 'Solenn Darrieux', en: 'Solenn Darrieux' },
    origin: { fr: 'Forêt de Cuivre', en: 'Copperwood' },
    traits: ['nightowl', 'goldenhands'],
    portrait: { fr: "Une tresse rousse serrée, des mains tachées de graisse, et une petite lanterne de cuivre accrochée à la ceinture qu'elle ne retire jamais.", en: 'A tight red braid, grease-stained hands, and a small copper lantern hooked to her belt that she never takes off.' },
    greeting: { fr: "On m'a dit que vous alliez ouvrir les îles. Les îles, c'est la nuit. Et la nuit, c'est moi.", en: "I heard you were opening the Isles. The Isles mean night. And night is my business." },
    wage: 10, starter: false,
    story: {
      title: { fr: 'La lanterne de la forêt', en: 'The Forest Lantern' },
      scenes: [
        {
          affinity: 3,
          title: { fr: 'Ce qu\'on voit la nuit', en: 'What you see at night' },
          lines: [
            { who: 'narrator', text: { fr: "Solenn rentre de Lanterne-du-Val à onze heures du soir, comme si c'était midi. Elle accroche sa petite lanterne au clou du hangar avant de parler.", en: 'Solenn comes back from Lanternhollow at eleven at night as if it were noon. She hangs her little lantern on the hangar nail before she speaks.' } },
            { who: 'you', text: { fr: "Vous n'avez pas peur de la nuit ?", en: "You're not afraid of the dark?" } },
            { who: 'pilot', text: { fr: "Dans la Forêt de Cuivre, la nuit tombe à quatre heures sous les arbres. On apprend à voir autrement : les ombres qui bougent, celles qui ne bougent pas, et la lumière qu'on emporte.", en: "In Copperwood, night falls at four under the trees. You learn to see differently: the shadows that move, the ones that don't, and the light you carry with you." } },
            { who: 'pilot', text: { fr: "Le jour, tout le monde voit tout. La nuit, on ne voit que ce qui compte.", en: 'By day, everyone sees everything. By night, you only see what matters.' } },
            { who: 'narrator', text: { fr: "Elle reprend sa lanterne. Elle ne l'a pas allumée de tout le vol.", en: 'She takes back her lantern. She never lit it the whole flight.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'Le moteur de son père', en: "Her father's engine" },
          lines: [
            { who: 'narrator', text: { fr: "Un matin, vous trouvez Solenn sous la Grive, qui parle au moteur. Pas fort. Comme à un cheval.", en: 'One morning you find Solenn under the Thrush, talking to the engine. Not loudly. The way you talk to a horse.' } },
            { who: 'you', text: { fr: "Il répond ?", en: 'Does it answer?' } },
            { who: 'pilot', text: { fr: "Toujours. Mon père réparait les scieries de la Forêt. Il disait qu'une machine qui casse, c'est une machine qu'on n'a pas écoutée. J'ai écouté toute mon enfance.", en: "Always. My father fixed the sawmills in the Forest. He said a machine that breaks is a machine nobody listened to. I listened all through my childhood." } },
            { who: 'pilot', text: { fr: "Celui-ci dit qu'il a soif, et qu'il n'aime pas la brume. Comme Prosper.", en: "This one says it's thirsty, and it doesn't like fog. Like Prosper." } },
            { who: 'narrator', text: { fr: "Prosper, derrière vous, ne dit rien. Mais il sourit, ce qui est rare.", en: 'Prosper, behind you, says nothing. But he smiles, which is rare.' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: 'La lanterne de cuivre', en: 'The copper lantern' },
          lines: [
            { who: 'narrator', text: { fr: "Le soir où vous ouvrez la route des îles, Solenn décroche sa petite lanterne et vous la tend.", en: 'The evening you open the island road, Solenn unhooks her little lantern and holds it out to you.' } },
            { who: 'pilot', text: { fr: "Elle vient de la fabrique de l'Anse-des-Lanternes. Ma mère l'a rapportée de là-bas, avant moi. Elle disait qu'une lanterne, ça ne sert pas à voir : ça sert à être vue.", en: "It comes from the works at Lanterncove. My mother brought it back from there, before I was born. She said a lantern isn't for seeing: it's for being seen." } },
            { who: 'you', text: { fr: "Pourquoi me la donner ?", en: 'Why give it to me?' } },
            { who: 'pilot', text: { fr: "Je ne vous la donne pas. Je la mets au bout de votre ponton. Pour que les îles sachent d'où on vient. Et pour que je retrouve le chemin de la Croisette, la nuit.", en: "I'm not giving it to you. I'm putting it at the end of your pontoon. So the Isles know where we come from. And so I can find Crosslet Lane again at night." } },
            { who: 'narrator', text: { fr: "Elle l'allume. C'est la première fois que vous la voyez allumée.", en: 'She lights it. It is the first time you have seen it lit.' } },
          ],
        },
      ],
    },
  },
  {
    id: 'teodor', gender: 'm', age: 41,
    name: { fr: 'Teodor Vashti', en: 'Teodor Vashti' },
    origin: { fr: 'Désert de Verre', en: 'Glass Flats' },
    traits: ['longhaul', 'luckycharm'],
    portrait: { fr: "Un grand homme calme, la peau tannée, un foulard blanc qu'il garde même sous la pluie. Il compte tout : les lieues, les litres, les étoiles.", en: 'A tall, calm man, sun-tanned, with a white scarf he keeps on even in the rain. He counts everything: leagues, litres, stars.' },
    greeting: { fr: "Je viens de loin et je vais loin. Si vous avez des lignes qui dépassent l'horizon, on peut discuter.", en: 'I come from far and I go far. If you have routes past the horizon, we can talk.' },
    wage: 11, starter: false,
    story: {
      title: { fr: 'Le compte des étoiles', en: 'Counting the Stars' },
      scenes: [
        {
          affinity: 3,
          title: { fr: 'Les lieues et les litres', en: 'Leagues and litres' },
          lines: [
            { who: 'narrator', text: { fr: "Avant chaque vol, Teodor écrit trois chiffres sur sa manche, au crayon. Il les efface au retour.", en: 'Before every flight, Teodor writes three numbers on his sleeve, in pencil. He rubs them out when he is back.' } },
            { who: 'you', text: { fr: "Qu'est-ce que vous notez ?", en: 'What do you write?' } },
            { who: 'pilot', text: { fr: "Les lieues, les litres, et le nombre d'étoiles que je dois voir avant de faire demi-tour. Dans le Désert de Verre, il n'y a pas de village au bout. Il n'y a que le chiffre.", en: "The leagues, the litres, and the number of stars I must see before turning back. In the Glass Flats there is no village at the end. There is only the number." } },
            { who: 'pilot', text: { fr: "Ici, il y a toujours un village. Je note quand même. Par respect pour le désert.", en: 'Here, there is always a village. I still write it down. Out of respect for the desert.' } },
            { who: 'narrator', text: { fr: "Il efface les chiffres avec le pouce. La manche est grise de tous les vols d'avant.", en: 'He rubs the numbers out with his thumb. The sleeve is grey with all the flights before.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'Le porte-bonheur', en: 'The lucky charm' },
          lines: [
            { who: 'narrator', text: { fr: "Yse prétend que Teodor a de la chance. Il a traversé un grain sans une goutte, trouvé une pièce rare au marché, et le bac était à quai quand il est arrivé.", en: 'Ysé claims Teodor is lucky. He crossed a squall without a drop, found a rare part at the market, and the ferry was at the quay when he arrived.' } },
            { who: 'you', text: { fr: "C'est le foulard ?", en: 'Is it the scarf?' } },
            { who: 'pilot', text: { fr: "Le foulard est à mon frère. Il est resté dans le désert. La chance, c'est de regarder plus longtemps que les autres avant de décider. Les gens appellent ça de la chance parce qu'ils ne voient pas le regard.", en: "The scarf is my brother's. He stayed in the desert. Luck is looking longer than the others before deciding. People call it luck because they don't see the looking." } },
            { who: 'pilot', text: { fr: "Mais je ne contredis pas Ysé. Ça lui fait plaisir, et ça ne coûte rien.", en: "But I don't contradict Ysé. It makes her happy, and it costs nothing." } },
            { who: 'narrator', text: { fr: "Il remet le foulard droit. Il pleut. Il ne l'enlève pas.", en: 'He straightens the scarf. It is raining. He does not take it off.' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: "La dernière île", en: 'The last island' },
          lines: [
            { who: 'narrator', text: { fr: "Teodor rentre de l'Île-du-Bout à l'aube. Il ne descend pas tout de suite du Goéland. Il regarde vers le nord.", en: 'Teodor comes back from Lastholm at dawn. He does not climb out of the Gull straight away. He is looking north.' } },
            { who: 'pilot', text: { fr: "Il y avait une lettre à la dernière lanterne. Pour quelqu'un parti vers le Grand Blanc. Personne ne l'a prise depuis trois ans.", en: 'There was a letter at the last lantern. For someone gone to the Great White. No one has collected it in three years.' } },
            { who: 'you', text: { fr: "Vous l'avez laissée ?", en: 'Did you leave it?' } },
            { who: 'pilot', text: { fr: "Je l'ai laissée. Et j'en ai mis une à côté. Pour mon frère. Le désert et la glace, c'est le même endroit, vu d'assez haut : un endroit où on ne revient pas, et où quelqu'un pose quand même une lettre.", en: "I left it. And I put one beside it. For my brother. The desert and the ice are the same place, seen from high enough: a place you don't come back from, where someone still leaves a letter." } },
            { who: 'narrator', text: { fr: "Il écrit trois chiffres sur sa manche. Il ne les efface pas, cette fois.", en: 'He writes three numbers on his sleeve. This time, he does not rub them out.' } },
          ],
        },
      ],
    },
  },
  {
    id: 'hedda', gender: 'f', age: 49,
    name: { fr: 'Hedda Vilmorin', en: 'Hedda Vilmorin' },
    origin: { fr: 'Grand Blanc', en: 'Great White' },
    traits: ['longhaul', 'thrifty'],
    portrait: { fr: "Grande, lente à parler, une parka usée jusqu'à la trame et des gants qu'elle ne quitte jamais tout à fait. Elle calcule le carburant à voix haute, par habitude.", en: 'Tall, slow to speak, a parka worn through and gloves she never quite takes off. She counts fuel out loud, from habit.' },
    greeting: { fr: "Je descends du nord. Là-haut, on vole loin ou on ne vole pas. J'ai entendu dire que vous ouvriez des lignes.", en: "I've come down from the north. Up there you fly far or you don't fly. I hear you've been opening routes." },
    wage: 12, starter: false,
    story: {
      title: { fr: 'Ce que le nord garde', en: 'What the North Keeps' },
      scenes: [
        {
          affinity: 3,
          title: { fr: 'Le litre de trop', en: 'The extra litre' },
          lines: [
            { who: 'narrator', text: { fr: "Avant chaque vol, Hedda vide un peu du réservoir. Un seau, pas plus, qu'elle repose près du hangar.", en: 'Before each flight, Hedda drains a little from the tank. A bucket, no more, which she sets down beside the hangar.' } },
            { who: 'you', text: { fr: "Vous enlevez du carburant ?", en: 'You take fuel out?' } },
            { who: 'pilot', text: { fr: "Je mets ce qu'il faut, plus un quart. Pas plus. Au Grand Blanc, le litre de trop, c'est du poids ; le litre qui manque, c'est la glace. On apprend vite où est la ligne.", en: "I put in what's needed, plus a quarter. No more. In the Great White, the extra litre is weight; the missing litre is the ice. You learn fast where the line is." } },
            { who: 'pilot', text: { fr: "Ici, vous avez des villages partout. Vous n'imaginez pas le luxe que c'est.", en: "Here you have villages everywhere. You have no idea what a luxury that is." } },
            { who: 'narrator', text: { fr: "Elle laisse le seau. Le lendemain, il est vide : quelqu'un a rempli la lampe du hangar avec.", en: 'She leaves the bucket. The next day it is empty: someone has filled the hangar lamp from it.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'Les boîtes de la dernière lanterne', en: 'The boxes at the last lantern' },
          lines: [
            { who: 'narrator', text: { fr: "Au retour de l'Île-du-Bout, Hedda pose une petite boîte en fer-blanc sur l'établi. Teodor s'approche sans rien demander.", en: 'Back from Lastholm, Hedda sets a small tin box on the workbench. Teodor comes over without asking anything.' } },
            { who: 'pilot', text: { fr: "Au nord, chaque poste a une boîte comme celle-ci. On y met les lettres pour ceux qui sont partis plus loin. Elles attendent. Parfois trois ans, parfois dix.", en: "Up north, every post has a box like this one. You put in the letters for those who've gone further. They wait. Sometimes three years, sometimes ten." } },
            { who: 'you', text: { fr: "Et ensuite ?", en: 'And then?' } },
            { who: 'pilot', text: { fr: "Ensuite quelqu'un revient, et il y a son nom dessus. Ça arrive. Pas souvent. Mais ça arrive, et ce jour-là il n'y a rien de plus important au monde que cette boîte.", en: "Then someone comes back, and their name is on one. It happens. Not often. But it happens, and on that day there is nothing in the world more important than that box." } },
            { who: 'narrator', text: { fr: "Teodor ne dit rien. Il sort, et il reste longtemps à regarder le nord.", en: 'Teodor says nothing. He goes outside, and stands a long while looking north.' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: 'Pourquoi elle est descendue', en: 'Why she came south' },
          lines: [
            { who: 'narrator', text: { fr: "Un soir d'hiver, sous la lanterne de cuivre du ponton, Hedda parle sans qu'on lui demande.", en: 'One winter evening, under the copper lantern on the pontoon, Hedda speaks without being asked.' } },
            { who: 'pilot', text: { fr: "Vingt-deux ans au Grand Blanc. J'ai porté du courrier à des gens que je n'ai jamais vus, dans des endroits qui n'ont pas de nom sur les cartes. Un jour, j'ai posé l'appareil et je me suis dit : je ne sais plus à quoi ressemble quelqu'un qui attend sa lettre.", en: "Twenty-two years in the Great White. I carried mail to people I never saw, in places with no name on the charts. One day I set the machine down and thought: I no longer know what someone waiting for their letter looks like." } },
            { who: 'you', text: { fr: "Et maintenant ?", en: 'And now?' } },
            { who: 'pilot', text: { fr: "Maintenant je le sais. Ils sont douze sur un ponton avec des lanternes de couleur, et ils comptent les hublots. Je volerai encore loin, mais je veux voir qui reçoit.", en: "Now I know. They're twelve on a jetty with coloured lanterns, counting the portholes. I'll still fly far, but I want to see who receives." } },
            { who: 'narrator', text: { fr: "Elle regarde vers le nord, une dernière fois, puis rentre. Elle n'a pas remis ses gants.", en: 'She looks north, one last time, then goes inside. She has not put her gloves back on.' } },
          ],
        },
      ],
    },
  },
  // ---- v0.3 : la Forêt de Cuivre — un homme, une femme ; la parité tient à dix ----
  {
    id: 'gaspard', gender: 'm', age: 52,
    name: { fr: 'Gaspard Sorbier', en: 'Gaspard Sorbier' },
    origin: { fr: 'Villechaudron', en: 'Kettleby' },
    traits: ['weathersense', 'thrifty'],
    portrait: { fr: "Un homme sec aux jambes de marcheur, une besace de cuir en bandoulière même quand elle est vide, et une barbe grise où il reste toujours une feuille rousse.", en: 'A wiry man with a walker\'s legs, a leather satchel across his chest even when it is empty, and a grey beard that always has a copper leaf caught in it.' },
    greeting: { fr: "Trente ans que je porte le courrier de la forêt à pied. On dit que vos avions passent au-dessus. Moi, je connais chaque clairière par en dessous.", en: 'Thirty years carrying the forest\'s mail on foot. They say your planes fly over it. I know every clearing from underneath.' },
    wage: 8, starter: false,
    story: {
      title: { fr: 'Trente ans à pied', en: 'Thirty Years on Foot' },
      scenes: [
        {
          affinity: 3,
          title: { fr: 'Par en dessous', en: 'From underneath' },
          lines: [
            { who: 'narrator', text: { fr: "Au-dessus de la Forêt de Cuivre, Gaspard colle le front au hublot. Il ne regarde pas le cap. Il regarde les trous dans les feuilles.", en: 'Over Copperwood, Gaspard presses his forehead to the window. He is not watching the heading. He is watching the gaps in the leaves.' } },
            { who: 'pilot', text: { fr: "Là, le sentier des Charbonnières. Là, la source où je remplissais la gourde. Et là — vous voyez la tache claire ? — le pré où les sangliers m'ont fait monter dans un arbre, l'hiver de mes vingt ans.", en: 'There, the Charwood path. There, the spring where I filled my flask. And there — see the pale patch? — the meadow where the boar sent me up a tree, the winter I turned twenty.' } },
            { who: 'you', text: { fr: "Vous la reconnaissez, d'aussi haut ?", en: 'You can tell, from this high?' } },
            { who: 'pilot', text: { fr: "C'est la même forêt. Simplement, je ne l'avais jamais vue à l'endroit.", en: "It's the same forest. I'd just never seen it right side up." } },
            { who: 'narrator', text: { fr: "Il compte les clairières jusqu'à l'atterrissage, à voix basse, comme on compte des marches dans le noir.", en: 'He counts the clearings all the way down, under his breath, the way you count stairs in the dark.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'Le creux du Hêtre-Roi', en: 'The hollow in the King Beech' },
          lines: [
            { who: 'narrator', text: { fr: "Au Hêtre-Roi, Gaspard descend avant que l'hélice ait fini de tourner. Il va droit à l'arbre — il faut six personnes pour en faire le tour — et passe le bras dans un creux, à hauteur d'homme.", en: 'At Kingbeech, Gaspard climbs down before the propeller has stopped. He goes straight to the tree — it takes six people to ring it with their arms — and reaches into a hollow at head height.' } },
            { who: 'pilot', text: { fr: "Ma boîte aux lettres. Ceux du fond des bois y laissaient leur courrier, et je passais le jeudi. Trois jours de marche pour un aller.", en: 'My letterbox. The people from deep in the woods left their mail in here, and I came by on Thursdays. Three days\' walk, one way.' } },
            { who: 'narrator', text: { fr: "Il en ressort une enveloppe verdie par la mousse. Pas d'adresse. Juste : « Au facteur. »", en: 'He brings out an envelope gone green with moss. No address. Just: "To the postman."' } },
            { who: 'you', text: { fr: "Elle est pour vous ?", en: "It's for you?" } },
            { who: 'pilot', text: { fr: "Depuis que j'ai arrêté, c'est à moi qu'ils écrivent. Pour me dire que le courrier arrive, maintenant, et qu'il arrive vite. Et qu'ils regrettent un peu le jeudi.", en: 'Since I stopped, they write to me. To tell me the mail comes now, and comes fast. And that they miss Thursdays, a little.' } },
            { who: 'narrator', text: { fr: "Le soir, au café, Hedda écoute l'histoire du creux sans rien dire. Puis, seulement : « Chez nous, c'était une boîte en fer-blanc. »", en: 'That evening, in the café, Hedda listens to the story of the hollow without a word. Then, only: "Back home it was a tin box."' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: 'Le sac de Bastien', en: "Bastien's bag" },
          lines: [
            { who: 'narrator', text: { fr: "Gaspard entre au hangar avec un vieux sac de toile sous le bras, raide de poussière, renforcé de cuir aux coins. Sur le rabat, au pochoir à moitié effacé : CROISETTE.", en: 'Gaspard comes into the hangar with an old canvas mailbag under his arm, stiff with dust, leather at the corners. On the flap, in half-faded stencil: CROSSLET.' } },
            { who: 'pilot', text: { fr: "Il y a trente ans, un biplan est passé au-dessus du Hêtre-Roi et a lâché ce sac dans la clairière. Le premier courrier tombé du ciel dans la forêt. J'avais vingt-deux ans ; c'est moi qui l'ai porté le reste du chemin.", en: 'Thirty years ago, a biplane flew over Kingbeech and dropped this bag in the clearing. The first mail that ever fell out of the sky into the forest. I was twenty-two; I carried it the rest of the way.' } },
            { who: 'you', text: { fr: "Bastien.", en: 'Bastien.' } },
            { who: 'pilot', text: { fr: "Il a fait trois passages pour être sûr qu'on l'avait vu. Je lui ai fait signe avec ma casquette, il a battu des ailes. Je ne l'ai jamais rencontré. J'ai gardé le sac en me disant qu'un jour, je le rapporterais.", en: 'He made three passes to be sure someone had seen. I waved my cap and he rocked his wings. I never met him. I kept the bag, telling myself that one day I\'d bring it back.' } },
            { who: 'narrator', text: { fr: "Il l'accroche au clou, sous la poutre aux marques de crayon. Prosper le regarde faire sans un mot. Puis il touche le sac du bout des doigts, comme la croix du chemin de la Croisette.", en: 'He hangs it on the nail, under the beam with the pencil marks. Prosper watches without a word. Then he touches the bag with his fingertips, the way he touches the cross on Crosslet Lane.' } },
          ],
        },
      ],
    },
  },
  {
    id: 'rosalie', gender: 'f', age: 26,
    name: { fr: 'Rosalie Martel', en: 'Rosalie Martel' },
    origin: { fr: 'Haut-Ferrand', en: 'Ferncrest' },
    traits: ['goldenhands', 'homeheart'],
    portrait: { fr: "Des avant-bras de forgeronne, une cicatrice blanche sur le dos d'une main, et un petit marteau de chaudronnier passé à la ceinture, comme d'autres portent un couteau.", en: "A smith's forearms, a white scar across the back of one hand, and a small coppersmith's hammer through her belt, the way other people carry a knife." },
    greeting: { fr: "Mon père tient la forge de Haut-Ferrand. Ça fait des mois que vous portez ses pièces : je suis venue voir qui.", en: "My father keeps the forge at Ferncrest. You've been flying his parts for months — I came to see who." },
    wage: 9, starter: false,
    story: {
      title: { fr: 'La marque au marteau', en: 'The Hammer Mark' },
      scenes: [
        {
          affinity: 3,
          title: { fr: 'Ce qui sonne encore', en: 'While it still rings' },
          lines: [
            { who: 'narrator', text: { fr: "La Grive est rentrée de Haut-Ferrand le capot cabossé : un caillou levé par le vent de crête. Rosalie ne demande pas d'outil. Elle sort le petit marteau de sa ceinture.", en: 'The Thrush came back from Ferncrest with a dented cowling: a stone thrown up by the ridge wind. Rosalie doesn\'t ask for tools. She takes the little hammer from her belt.' } },
            { who: 'narrator', text: { fr: "Dix minutes, une centaine de coups très légers, et la tôle est lisse.", en: 'Ten minutes, a hundred very light blows, and the metal is smooth.' } },
            { who: 'you', text: { fr: "On aurait changé la pièce.", en: "We'd have replaced the part." } },
            { who: 'pilot', text: { fr: "À Haut-Ferrand, on ne jette pas ce qui sonne encore. Écoutez.", en: "At Ferncrest, you don't throw away anything that still rings. Listen." } },
            { who: 'narrator', text: { fr: "Elle tapote le capot. Il sonne clair, comme une cloche qu'on aurait couchée sur le flanc.", en: 'She taps the cowling. It rings clear, like a bell laid on its side.' } },
          ],
        },
        {
          affinity: 7,
          title: { fr: 'Le poinçon', en: "The maker's mark" },
          lines: [
            { who: 'narrator', text: { fr: "Rosalie demande à voir la petite lanterne de cuivre de Solenn. Solenn la lui tend sans comprendre. Rosalie la retourne et passe le pouce sur le fond.", en: "Rosalie asks to see Solenn's little copper lantern. Solenn hands it over without understanding. Rosalie turns it upside down and runs her thumb across the base." } },
            { who: 'pilot', text: { fr: "Un marteau et une étoile. C'est le poinçon de ma grand-mère. Elle était chaudronnière à Villechaudron, avant que la famille monte à Haut-Ferrand.", en: "A hammer and a star. That's my grandmother's mark. She was a coppersmith at Kettleby, before the family moved up to Ferncrest." } },
            { who: 'narrator', text: { fr: "Solenn ne dit rien pendant un moment. « Ma mère l'a achetée à la fabrique de l'Anse-des-Lanternes, dit-elle enfin. Au bout du monde. »", en: 'Solenn says nothing for a while. "My mother bought it at the Lanterncove works," she says at last. "At the end of the world."' } },
            { who: 'pilot', text: { fr: "Le cuivre de la forêt part aux îles en feuilles, et revient en lanternes. Ma grand-mère disait qu'on ne sait jamais qui on éclaire.", en: "Copperwood's copper goes out to the Isles in sheets and comes back as lanterns. My grandmother used to say you never know who you're lighting." } },
            { who: 'narrator', text: { fr: "Elle rend la lanterne. Solenn la tient un peu différemment, maintenant.", en: 'She hands the lantern back. Solenn holds it a little differently now.' } },
          ],
        },
        {
          affinity: 12,
          title: { fr: 'La cloche de Sonnefeuille', en: 'The Ringleaf bell' },
          lines: [
            { who: 'narrator', text: { fr: "Un soir, Rosalie déplie sur l'établi un dessin à l'encre : une cloche, ses cotes, son épaisseur, la courbe de ses flancs.", en: 'One evening Rosalie spreads an ink drawing across the workbench: a bell, its measurements, its thickness, the curve of its sides.' } },
            { who: 'pilot', text: { fr: "Les moines de Sonnefeuille fondaient les cloches de toute la forêt. La dernière a quarante ans. Le vieux frère Anselme veut en couler une encore, une seule, avant de ne plus pouvoir. Il m'a demandé de l'aider.", en: 'The Ringleaf monks cast the bells for the whole forest. The last one is forty years old. Old Brother Anselm wants to pour one more — just one — before he no longer can. He asked me to help.' } },
            { who: 'you', text: { fr: "Pour qui ?", en: 'Who is it for?' } },
            { who: 'pilot', text: { fr: "Pour Sainte-Lueur. La chapelle de l'île n'a jamais eu de cloche : les enfants guettent le courrier en comptant les hublots. Je voudrais qu'ils l'entendent arriver.", en: 'For Glimmerkirk. The island chapel has never had a bell: the children watch for the mail by counting portholes. I\'d like them to hear it coming.' } },
            { who: 'narrator', text: { fr: "Elle pose le doigt sur le chiffre écrit sous la cloche : son poids. Puis elle vous regarde. « Ça ne tiendra jamais dans un seul avion. »", en: 'She puts her finger on the number written under the bell: its weight. Then she looks at you. "It\'ll never fit in one plane."' } },
          ],
        },
      ],
    },
  },
];
