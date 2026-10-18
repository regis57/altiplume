/**
 * Les pseudonymes refusés : une liste écrite pour Altiplume, en français et en anglais.
 *
 * Elle n'a pas vocation à être exhaustive — aucune liste ne l'est — mais à écarter
 * l'évident sans refuser un vrai prénom. Chaque entrée est comparée sous sa forme
 * repliée (`foldNickname` : sans accents ni casse, 3→e, 1→i, 0→o, 4→a, 5→s, sans
 * ponctuation ni espaces) : « Nègre », « N3gre » et « negre » sont la même entrée.
 *
 * Inspirée, sans copie, de la base publique LDNOOBW, « List of Dirty, Naughty,
 * Obscene, and Otherwise Bad Words » (listes `fr` et `en`, consultées le 18 octobre
 * 2026), sous licence Creative Commons Attribution 4.0 :
 * https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
 * On n'en a gardé que ce qui insulte, sexualise ou glorifie la haine ; on a écarté ce
 * qui n'est que familier (« caca », « meuf »), ce qui est aussi un prénom (« Dick »,
 * « Kike », « Anal »), et ajouté ce qui manquait : symboles et codes néonazis,
 * pédocriminalité, insultes racistes et homophobes françaises.
 *
 * Trois familles :
 * 1. RACINES — sans ambiguïté, cherchées partout, même collées (« xXnaziXx »,
 *    « LeFuckeur ») ou écartelées (« Na Zi »). Chacune a été passée contre des listes
 *    de prénoms et de noms de famille de plusieurs origines et contre les mots
 *    français et anglais : aucune ne se cache dans un nom ordinaire, sauf celles que
 *    la troisième famille rattrape.
 * 2. MOTS — refusés seulement entiers (le pseudonyme, ou l'un de ses mots séparés par
 *    une espace, un tiret, une apostrophe) : ils se cachent dans des mots ordinaires.
 *    « viol » dans Violette, « rape » dans Drapeau, « pute » dans Computer, « sex »
 *    dans Essex, « porn » dans Pornic, « cunt » dans Scunthorpe, « nique » dans
 *    Monique, « negre » dans Negrete, « penis » dans Penistone, « rapist » dans
 *    therapist, « ss » dans tous les doubles s.
 * 3. EXCEPTIONS — des prénoms, noms et mots réels qui contiennent une racine : ils
 *    passent quand ils sont un mot entier du pseudonyme. « Nazir » passe ; « xXnazirXx »,
 *    collé à autre chose, ne passe pas (qu'on l'écrive séparé).
 */

/** Famille 1 : cherchées partout dans la forme repliée. */
export const RACINES: readonly string[] = [
  // Nazisme, néonazisme et leurs symboles
  'nazi', 'hitler', 'himmler', 'goebbels', 'mengele', 'gestapo', 'waffenss', 'siegheil', 'heilhitler',
  'thirdreich', 'troisiemereich', 'drittesreich', 'swastika', 'svastika', 'hakenkreuz', 'croixgammee',
  'zyklon', 'auschwitz', 'holohoax', '1488', 'fourteenwords', 'whitepower', 'whitepride', 'kukluxklan', 'kkk',
  // Haine raciale et antisémite
  'nigger', 'nigga', 'bougnoul', 'youpin', 'youtre', 'salejuif', 'salearabe', 'salenoir', 'salenegre',
  'mortauxjuifs', 'killjews', 'gasthejews', 'crouille', 'chinetoque', 'chintok', 'niakoue', 'raghead',
  'towelhead', 'wetback', 'beaner', 'jigaboo', 'jiggaboo', 'sandnig',
  // Homophobie
  'faggot', 'tapette', 'tarlouze', 'tafiole', 'tantouze', 'shemale',
  // Sexisme et insultes
  'salope', 'connard', 'connasse', 'pouffiasse', 'petasse', 'grognasse', 'putain', 'filsdepute', 'fillesdepute',
  'whore', 'encule', 'enculer', 'niquetamere', 'niquetarace', 'fuck', 'motherf',
  // Vulgarités sexuelles
  'porno', 'pussy', 'vagina', 'blowjob', 'handjob', 'gangbang', 'bukkake', 'cumshot', 'creampie', 'dildo',
  'jizz', 'orgasm', 'hentai', 'branleur', 'branlette', 'sodomi', 'zoophil', 'necrophil', 'inceste', 'incest',
  // Viol et pédocriminalité
  'violeur', 'violeuse', 'pedo', 'pedophil', 'paedophil', 'pedofil', 'pedocrim', 'lolicon', 'shotacon',
  'pthc', 'childporn', 'kiddieporn', 'jailbait',
];

/** Famille 2 : refusés seulement comme mot entier. */
export const MOTS: readonly string[] = [
  // Nazisme : codes trop courts pour être cherchés partout (« ss » est dans « Vassili »,
  // « 88 » dans une année de naissance collée à un nom, « Paul88 », qui passe).
  'ss', '88', 'heil',
  // Haine raciale
  'negre', 'negro', 'negros', 'bicot', 'bamboula', 'coon', 'spic', 'chink', 'gook', 'paki',
  // Homophobie
  'pd', 'pede', 'fag', 'tranny', 'gouine', 'gouines',
  // Sexisme et insultes
  'pute', 'putes', 'fdp', 'ntm', 'bitch', 'slut', 'cunt', 'twat', 'conne', 'nique', 'retard',
  'merde', 'shit',
  // Vulgarités sexuelles
  'porn', 'sex', 'sexy', 'xxx', 'cum', 'anus', 'penis', 'tits', 'boobs', 'milf', 'cock', 'bite',
  'chatte', 'couille', 'couilles',
  // Viol
  'viol', 'rape', 'rapist', 'raped',
];

/**
 * Famille 3 : mots réels qui contiennent une racine. Un mot entier du pseudonyme qui
 * figure ici ne compte pas dans la recherche des racines.
 */
export const EXCEPTIONS: readonly string[] = [
  // « nazi » : prénoms arabes, persans, turcs, ourdous (Nazir, Nazira, Nazim,
  // Benazir…), le nom Ashkenazi, l'italien (nazionale, nazione), la ville turque de Nazilli.
  'nazir', 'nazira', 'nazim', 'nazima', 'nazih', 'naziha', 'nazif', 'nazifa', 'nazia', 'nazila',
  'nazik', 'nazime', 'nazish', 'benazir', 'ashkenazi', 'ashkenazim', 'nazirite',
  'nazionale', 'nazionali', 'nazione', 'nazioni', 'nazilli',
  // « nigger », « nigga » : des mots anglais ordinaires (ricaner, avare).
  'snigger', 'sniggers', 'sniggering', 'niggard', 'niggardly', 'niggards',
  // « salope » : le vêtement. « tafiole » : le juron du capitaine Haddock.
  'salopette', 'salopettes', 'patafiole', 'patafioles',
  // « pedo » : la torpille, le sol, le pas, Empédocle, des noms italiens et espagnols.
  'torpedo', 'torpedos', 'pedologie', 'pedologue', 'pedologia', 'pedometre', 'pedometer', 'empedocle',
  'empedocles', 'pedone', 'pedoni', 'impedovo', 'cespedosa',
];
