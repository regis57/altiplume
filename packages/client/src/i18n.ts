/**
 * Traductions du client. Le français est écrit dans le HTML ; l'anglais remplace
 * les textes marqués `data-i18n` (texte) ou `data-i18n-html` (avec liens).
 *
 * Règle : jamais de concaténation de morceaux de phrase. Une clé, une phrase.
 */
export type Locale = 'fr' | 'en';

const STORAGE_KEY = 'altiplume.locale';

const FR: Record<string, string> = {
  'skip': 'Aller au contenu',
  'nav.login': 'Se connecter',
  'nav.account': 'Mon compte',
  'footer.legal': 'Mentions légales',
  'footer.privacy': 'Confidentialité',
  'footer.terms': "Conditions d'utilisation",

  'home.title': 'Un petit aérodrome, quelque part dans les nuages.',
  'home.pitch1': "Vous héritez d'une piste en herbe à moitié ruinée. Restaurez-la, recrutez des pilotes qui ont leur caractère, ouvrez des lignes de courrier vers des régions lointaines.",
  'home.pitch2': 'Les vols durent du vrai temps. On joue cinq minutes le matin ; on revient le soir voir si le courrier est arrivé.',
  'home.promise': "<strong>Rien ne se perd si vous ne vous connectez pas.</strong> C'est une règle du jeu, pas une promesse marketing.",

  'stamp.name': 'Altiplume',
  'stamp.sent': 'lien envoyé',

  'signup.title': 'Ouvrir un aérodrome',
  'signup.subtitle': 'Un email et un pseudonyme. Pas de mot de passe : vous recevrez un lien.',
  'signup.email': 'Adresse email',
  'signup.emailHelp': "Elle ne sert qu'à vous envoyer vos liens de connexion.",
  'signup.nickname': 'Pseudonyme',
  'signup.nicknameHelp': 'Public. De 3 à 20 caractères.',
  'signup.age': "J'ai 15 ans ou plus.",
  'signup.terms': 'J\'accepte les <a href="/cgu">conditions d\'utilisation</a> et la <a href="/confidentialite">politique de confidentialité</a>.',
  'signup.submit': 'Recevoir mon lien',
  'signup.already': 'Déjà un aérodrome ? <a href="/connexion">Se connecter</a>.',
  'signup.sent': 'Le courrier est parti. Ouvrez votre boîte email : le lien est valable dix minutes.',

  'login.title': 'Reprendre le courrier.',
  'login.pitch': 'Indiquez votre adresse ; vous recevrez un lien valable dix minutes. Pas de mot de passe à retenir, rien à perdre.',
  'login.formTitle': 'Se connecter',
  'login.subtitle': 'Le lien arrive par email.',
  'login.submit': 'Recevoir mon lien',
  'login.new': "Pas encore d'aérodrome ? <a href=\"/\">En ouvrir un</a>.",
  'login.sent': 'Si cette adresse a un aérodrome, un lien vient de partir. Il est valable dix minutes.',

  'verify.title': 'Votre courrier est arrivé.',
  'verify.pitch': "Un dernier geste : ouvrez-le. Ce bouton confirme que c'est bien vous, et pas un robot de messagerie qui pré-visite les liens.",
  'verify.formTitle': 'Ouvrir le courrier',
  'verify.submit': 'Ouvrir',
  'verify.retry': 'Lien expiré ou déjà utilisé ? <a href="/connexion">Demandez-en un nouveau</a>.',
  'verify.noscript': 'JavaScript est nécessaire pour ouvrir ce lien — et pour jouer.',

  'sent.title': 'Le courrier est parti.',
  'sent.text': 'Ouvrez votre boîte email : un lien vous attend. Il est valable dix minutes et ne sert qu\'une fois.',
  'sent.spam': "S'il n'arrive pas, regardez dans les courriers indésirables, ou <a href=\"/connexion\">demandez-en un autre</a>.",

  'account.title': 'Mon compte',
  'account.nickname': 'Pseudonyme',
  'account.since': 'Aérodrome ouvert le',
  'account.edit': 'Modifier',
  'account.language': 'Langue',
  'account.save': 'Enregistrer',
  'account.saved': 'Enregistré.',
  'account.data': 'Vos données',
  'account.dataText': "Tout ce que le jeu sait de vous tient dans un fichier. Vous pouvez l'emporter, ou tout effacer — immédiatement et définitivement.",
  'account.export': 'Télécharger mes données',
  'account.logout': 'Se déconnecter',
  'account.delete': "Fermer l'aérodrome",
  'account.deleteText': 'Votre compte, vos sessions et vos données de jeu sont effacés sur-le-champ. Pour confirmer, retapez votre pseudonyme exactement.',
  'account.confirm': 'Pseudonyme, pour confirmer',
  'account.deleteSubmit': 'Effacer mon compte',
  'account.deleted': 'Votre compte est effacé. Merci d\'être passé par ici.',

  'error.email_invalid': "Cette adresse n'a pas l'air valide.",
  'error.nickname_too_short': 'Trois caractères au moins.',
  'error.nickname_too_long': 'Vingt caractères au plus.',
  'error.nickname_invalid_chars': 'Lettres, chiffres, espaces, tirets et apostrophes seulement.',
  'error.nickname_reserved': 'Ce nom prête à confusion avec le jeu ou son équipe. Choisissez-en un autre.',
  'error.nickname_offensive': 'Ce nom ne convient pas. Choisissez-en un autre.',
  'error.nickname_taken': 'Ce pseudonyme est déjà pris, ou trop proche d\'un pseudonyme existant.',
  'error.locale_unsupported': 'Langue non prise en charge.',
  'error.age_not_confirmed': 'Le jeu est réservé aux 15 ans et plus.',
  'error.terms_not_accepted': 'Il faut accepter les conditions pour continuer.',
  'error.confirmation_mismatch': 'Le pseudonyme ne correspond pas. Retapez-le exactement.',
  'error.link_unknown': "Ce lien n'est pas valide.",
  'error.link_expired': 'Ce lien a expiré. Les liens ne durent que dix minutes.',
  'error.link_used': 'Ce lien a déjà servi, ou a été remplacé par un plus récent.',
  'error.already_registered': 'Cette adresse a déjà un aérodrome. Connectez-vous.',
  'error.too_many_requests': 'Trop de demandes en peu de temps. Réessayez dans quelques minutes.',
  'error.schema': 'La demande est mal formée.',
  'error.server_error': 'Le serveur a rencontré un problème. Réessayez dans un instant.',
  'error.network': 'Impossible de joindre le serveur. Vérifiez votre connexion.',
};

const EN: Record<string, string> = {
  'skip': 'Skip to content',
  'nav.login': 'Sign in',
  'nav.account': 'My account',
  'footer.legal': 'Legal notice',
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms of use',

  'home.title': 'A small aerodrome, somewhere in the clouds.',
  'home.pitch1': 'You inherit a half-ruined grass airstrip. Restore it, hire pilots with minds of their own, open mail routes to faraway regions.',
  'home.pitch2': 'Flights take real time. Play five minutes in the morning; come back tonight to see if the mail got through.',
  'home.promise': "<strong>Nothing is lost if you don't log in.</strong> That's a rule of the game, not a marketing promise.",

  'stamp.name': 'Altiplume',
  'stamp.sent': 'link sent',

  'signup.title': 'Open an aerodrome',
  'signup.subtitle': "An email and a nickname. No password: you'll receive a link.",
  'signup.email': 'Email address',
  'signup.emailHelp': 'Only used to send you your sign-in links.',
  'signup.nickname': 'Nickname',
  'signup.nicknameHelp': 'Public. 3 to 20 characters.',
  'signup.age': "I'm 15 or older.",
  'signup.terms': 'I accept the <a href="/cgu">terms of use</a> and the <a href="/confidentialite">privacy policy</a>.',
  'signup.submit': 'Send me my link',
  'signup.already': 'Already have an aerodrome? <a href="/connexion">Sign in</a>.',
  'signup.sent': 'The mail is on its way. Check your inbox: the link is valid for ten minutes.',

  'login.title': 'Back to the mail.',
  'login.pitch': "Enter your address; you'll receive a link valid for ten minutes. No password to remember, nothing to lose.",
  'login.formTitle': 'Sign in',
  'login.subtitle': 'The link arrives by email.',
  'login.submit': 'Send me my link',
  'login.new': 'No aerodrome yet? <a href="/">Open one</a>.',
  'login.sent': 'If this address has an aerodrome, a link is on its way. It is valid for ten minutes.',

  'verify.title': 'Your mail has arrived.',
  'verify.pitch': "One last step: open it. This button confirms it's really you, and not a mail scanner pre-visiting links.",
  'verify.formTitle': 'Open the mail',
  'verify.submit': 'Open',
  'verify.retry': 'Link expired or already used? <a href="/connexion">Request a new one</a>.',
  'verify.noscript': 'JavaScript is required to open this link — and to play.',

  'sent.title': 'The mail is on its way.',
  'sent.text': 'Check your inbox: a link is waiting. It is valid for ten minutes and works only once.',
  'sent.spam': "If it doesn't arrive, check your spam folder, or <a href=\"/connexion\">request another</a>.",

  'account.title': 'My account',
  'account.nickname': 'Nickname',
  'account.since': 'Aerodrome opened on',
  'account.edit': 'Edit',
  'account.language': 'Language',
  'account.save': 'Save',
  'account.saved': 'Saved.',
  'account.data': 'Your data',
  'account.dataText': 'Everything the game knows about you fits in one file. Take it with you, or erase it all — immediately and permanently.',
  'account.export': 'Download my data',
  'account.logout': 'Sign out',
  'account.delete': 'Close the aerodrome',
  'account.deleteText': 'Your account, sessions and game data are erased on the spot. To confirm, retype your nickname exactly.',
  'account.confirm': 'Nickname, to confirm',
  'account.deleteSubmit': 'Erase my account',
  'account.deleted': 'Your account is erased. Thanks for stopping by.',

  'error.email_invalid': "That address doesn't look valid.",
  'error.nickname_too_short': 'At least three characters.',
  'error.nickname_too_long': 'Twenty characters at most.',
  'error.nickname_invalid_chars': 'Letters, digits, spaces, hyphens and apostrophes only.',
  'error.nickname_reserved': 'That name could be confused with the game or its team. Pick another.',
  'error.nickname_offensive': "That name isn't suitable. Pick another.",
  'error.nickname_taken': 'That nickname is taken, or too close to an existing one.',
  'error.locale_unsupported': 'Unsupported language.',
  'error.age_not_confirmed': 'The game is for people aged 15 and over.',
  'error.terms_not_accepted': 'You need to accept the terms to continue.',
  'error.confirmation_mismatch': "The nickname doesn't match. Retype it exactly.",
  'error.link_unknown': "This link isn't valid.",
  'error.link_expired': 'This link has expired. Links only last ten minutes.',
  'error.link_used': 'This link was already used, or replaced by a newer one.',
  'error.already_registered': 'This address already has an aerodrome. Sign in instead.',
  'error.too_many_requests': 'Too many requests in a short time. Try again in a few minutes.',
  'error.schema': 'The request is malformed.',
  'error.server_error': 'The server ran into a problem. Try again in a moment.',
  'error.network': "Can't reach the server. Check your connection.",
};

const DICT: Record<Locale, Record<string, string>> = { fr: FR, en: EN };

let current: Locale = detect();

function detect(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') return stored;
  } catch { /* stockage indisponible : on retombe sur le navigateur */ }
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
  try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* sans importance */ }
}

export function t(key: string): string {
  return DICT[current][key] ?? DICT.fr[key] ?? key;
}

/** Applique la langue courante à toute la page. */
export function translatePage(): void {
  document.documentElement.lang = current;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset['i18n'];
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.dataset['i18nHtml'];
    // Les chaînes avec balises viennent du dictionnaire embarqué, jamais du réseau.
    if (key) el.innerHTML = t(key);
  });
  document.querySelectorAll<HTMLElement>('[data-lang]').forEach((el) => {
    el.classList.toggle('cache', el.dataset['lang'] !== current);
  });
  const toggle = document.querySelector<HTMLButtonElement>('[data-action=toggle-lang]');
  if (toggle) {
    toggle.textContent = current === 'fr' ? 'EN' : 'FR';
    toggle.setAttribute('aria-label', current === 'fr' ? 'Switch to English' : 'Passer en français');
    toggle.lang = current === 'fr' ? 'en' : 'fr';
  }
}
