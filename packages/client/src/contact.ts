/**
 * La page « Écrire à l'aérodrome ».
 *
 * Le navigateur mesure le temps passé sur le formulaire et le joint à l'envoi :
 * un robot qui remplit et soumet en une demi-seconde se trahit. Le champ-piège
 * fait le reste. Aucun captcha, aucun tiers — la CSP ne les laisserait pas
 * entrer de toute façon.
 */
type Json = Record<string, unknown>;
type Api = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: Json) => Promise<{ status: number; body: Json }>;
type SetMessage = (id: string, keys: string | string[], kind?: 'ok' | 'error') => void;
type SetDate = (el: HTMLElement | null, ms: number, style?: 'short' | 'long') => void;

export async function pageContact(api: Api, setMessage: SetMessage, setDate: SetDate): Promise<void> {
  const form = document.getElementById('contact') as HTMLFormElement | null;
  if (!form) return;
  const ouvert = Date.now();

  const dispo = await api('GET', '/v1/contact').catch(() => null);
  if (dispo && dispo.status === 200 && dispo.body['available'] === false) {
    form.classList.add('cache');
    setMessage('contact-message', 'contact.unavailable');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const bouton = form.querySelector('button[type=submit]') as HTMLButtonElement | null;
    const sujet = (document.getElementById('contact-sujet') as HTMLInputElement | null)?.value ?? '';
    const email = (document.getElementById('contact-email') as HTMLInputElement | null)?.value ?? '';
    const texte = (document.getElementById('contact-texte') as HTMLTextAreaElement | null)?.value ?? '';
    const piege = (document.getElementById('contact-site') as HTMLInputElement | null)?.value ?? '';

    const erreurTexte = document.getElementById('contact-texte-erreur');
    if (erreurTexte) erreurTexte.textContent = '';
    if (texte.trim().length < 10) {
      if (erreurTexte) { erreurTexte.dataset['i18n'] = 'error.message_too_short'; erreurTexte.textContent = ' '; }
      setMessage('contact-message', 'error.message_too_short');
      document.getElementById('contact-texte')?.focus();
      return;
    }

    if (bouton) bouton.disabled = true;
    setMessage('contact-message', '');
    const r = await api('POST', '/v1/contact', {
      message: texte, subject: sujet, email, site: piege, elapsed: Date.now() - ouvert,
    }).catch(() => null);

    if (r && r.status === 202) {
      form.reset();
      setMessage('contact-message', 'contact.sent', 'ok');
      const cachet = document.getElementById('cachet');
      if (cachet) { cachet.classList.remove('cache'); setDate(document.getElementById('cachet-date'), Date.now(), 'short'); }
    } else {
      const code = r ? String((r.body as { error?: string; fields?: string[] }).fields?.[0] ?? (r.body as { error?: string }).error ?? 'server_error') : 'network';
      setMessage('contact-message', `error.${code}`);
    }
    if (bouton) bouton.disabled = false;
  });
}
