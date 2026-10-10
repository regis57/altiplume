/**
 * Envoi d'emails. Une seule interface, deux implémentations :
 *  - ConsoleMailer en développement et en test : le lien s'affiche dans la console ;
 *  - BrevoMailer en production : appel direct à l'API, sans SDK à auditer.
 *
 * Un email ne contient jamais autre chose que ce qui est nécessaire pour agir :
 * un lien, sa durée de validité, et à qui s'adresser si on ne l'a pas demandé.
 */
import type { Locale } from '../auth/validation.ts';

export interface Message {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export interface Mailer {
  send(message: Message): Promise<void>;
}

export class ConsoleMailer implements Mailer {
  public readonly sent: Message[] = [];
  private readonly log: (line: string) => void;
  constructor(log: (line: string) => void = (l) => console.warn(l)) {
    this.log = log;
  }
  async send(message: Message): Promise<void> {
    this.sent.push(message);
    this.log(`\n[mail → ${message.to}] ${message.subject}\n${message.text}\n`);
  }
}

export class BrevoMailer implements Mailer {
  private readonly apiKey: string;
  private readonly from: string;
  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }
  async send(message: Message): Promise<void> {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: this.from, name: 'Altiplume' },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      // On ne journalise jamais le destinataire ; le code suffit à diagnostiquer.
      throw new Error(`envoi refusé par Brevo : HTTP ${response.status}`);
    }
  }
}

const COPY = {
  fr: {
    signupSubject: 'Confirmez votre inscription à Altiplume',
    loginSubject: 'Votre lien de connexion à Altiplume',
    signupIntro: 'Bienvenue. Pour terminer votre inscription, ouvrez ce lien :',
    loginIntro: 'Pour vous connecter, ouvrez ce lien :',
    validity: 'Il est valable dix minutes et ne sert qu\'une fois.',
    ignore: 'Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement ce message : rien ne sera fait.',
    sign: 'Altiplume — un petit aérodrome postal, quelque part dans les nuages.',
  },
  en: {
    signupSubject: 'Confirm your Altiplume registration',
    loginSubject: 'Your Altiplume sign-in link',
    signupIntro: 'Welcome. To finish signing up, open this link:',
    loginIntro: 'To sign in, open this link:',
    validity: 'It is valid for ten minutes and works only once.',
    ignore: 'If you did not request this, simply ignore this message: nothing will happen.',
    sign: 'Altiplume — a small airmail aerodrome, somewhere in the clouds.',
  },
} as const;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function magicLinkMessage(to: string, link: string, purpose: 'signup' | 'login', locale: Locale): Message {
  const c = COPY[locale];
  const intro = purpose === 'signup' ? c.signupIntro : c.loginIntro;
  const subject = purpose === 'signup' ? c.signupSubject : c.loginSubject;
  const text = `${intro}\n\n${link}\n\n${c.validity}\n${c.ignore}\n\n— ${c.sign}`;
  const html = `<!doctype html><html lang="${locale}"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#2b2420;max-width:36em">
<p>${escapeHtml(intro)}</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:.6em 1.2em;background:#b4552d;color:#fff;text-decoration:none;border-radius:4px">${purpose === 'signup' ? (locale === 'fr' ? 'Confirmer mon inscription' : 'Confirm my registration') : (locale === 'fr' ? 'Me connecter' : 'Sign me in')}</a></p>
<p style="font-size:.9em;color:#6b5f58">${escapeHtml(link)}</p>
<p>${escapeHtml(c.validity)}<br>${escapeHtml(c.ignore)}</p>
<p style="color:#6b5f58">— ${escapeHtml(c.sign)}</p>
</body></html>`;
  return { to, subject, text, html };
}
