/**
 * Client Altiplume — pages d'accueil, d'inscription, de connexion et de compte.
 *
 * Tout est du DOM ordinaire : lisible par un lecteur d'écran, navigable au clavier,
 * traduisible. Aucun script ni style en ligne, la CSP l'interdit.
 */
import { formatRemaining } from './time.ts';
import { getLocale, setLocale, t, translatePage, type Locale } from './i18n.ts';

export { formatRemaining };

type Json = Record<string, unknown>;

interface ApiResult {
  readonly status: number;
  readonly body: Json;
}

/** Appel JSON vers l'API, même origine, cookies inclus. */
async function api(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: Json): Promise<ApiResult> {
  const response = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    credentials: 'same-origin',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let parsed: Json = {};
  if (response.status !== 204) {
    try { parsed = (await response.json()) as Json; } catch { parsed = {}; }
  }
  return { status: response.status, body: parsed };
}

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function setMessage(id: string, text: string, kind: 'ok' | 'error' = 'error'): void {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('ok', kind === 'ok');
}

function setFieldError(field: string, code: string | null): void {
  const input = $(field) as HTMLInputElement | null;
  const err = $(`${field}-erreur`);
  if (input) input.setAttribute('aria-invalid', code ? 'true' : 'false');
  if (err) err.textContent = code ? t(`error.${code}`) : '';
}

/** Répartit les codes d'erreur de l'API entre les champs et le message global. */
function showErrors(messageId: string, fields: string[]): void {
  const byField: Record<string, string> = {};
  const global: string[] = [];
  for (const code of fields) {
    if (code.startsWith('email_')) byField['email'] = code;
    else if (code.startsWith('nickname_')) byField['nickname'] = code;
    else global.push(code);
  }
  setFieldError('email', byField['email'] ?? null);
  setFieldError('nickname', byField['nickname'] ?? null);
  setMessage(messageId, global.map((c) => t(`error.${c}`)).join(' '));
}

function stamp(): void {
  const el = $('cachet');
  const date = $('cachet-date');
  if (!el) return;
  if (date) date.textContent = new Date().toLocaleDateString(getLocale() === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  el.classList.remove('cache');
  el.classList.add('tampon');
}

function busy(form: HTMLFormElement, on: boolean): void {
  const button = form.querySelector('button[type=submit]') as HTMLButtonElement | null;
  if (button) button.disabled = on;
}

// ---- Pages ----

function pageIndex(): void {
  const form = $('signup') as HTMLFormElement | null;
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      email: String(data.get('email') ?? ''),
      nickname: String(data.get('nickname') ?? ''),
      locale: getLocale(),
      ageConfirmed: data.get('age') === 'on',
      acceptTerms: data.get('terms') === 'on',
    };
    setMessage('signup-message', '');
    busy(form, true);
    try {
      const r = await api('POST', '/v1/auth/register', payload);
      if (r.status === 202) {
        stamp();
        setMessage('signup-message', t('signup.sent'), 'ok');
        form.querySelectorAll('input, button').forEach((el) => { (el as HTMLInputElement).disabled = true; });
        return;
      }
      if (r.status === 429) { setMessage('signup-message', t('error.too_many_requests')); return; }
      showErrors('signup-message', (r.body['fields'] as string[] | undefined) ?? ['server_error']);
    } catch {
      setMessage('signup-message', t('error.network'));
    } finally {
      if (!form.querySelector('input[disabled]')) busy(form, false);
    }
  });
}

function pageConnexion(): void {
  const form = $('login') as HTMLFormElement | null;
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = String(new FormData(form).get('email') ?? '');
    setMessage('login-message', '');
    busy(form, true);
    try {
      const r = await api('POST', '/v1/auth/login', { email, locale: getLocale() });
      if (r.status === 202) {
        stamp();
        setMessage('login-message', t('login.sent'), 'ok');
        form.querySelectorAll('input, button').forEach((el) => { (el as HTMLInputElement).disabled = true; });
        return;
      }
      if (r.status === 429) { setMessage('login-message', t('error.too_many_requests')); return; }
      showErrors('login-message', (r.body['fields'] as string[] | undefined) ?? ['server_error']);
    } catch {
      setMessage('login-message', t('error.network'));
    } finally {
      if (!form.querySelector('input[disabled]')) busy(form, false);
    }
  });
}

function pageVerifier(): void {
  const form = $('verify') as HTMLFormElement | null;
  if (!form) return;
  const token = new URLSearchParams(location.search).get('jeton');
  // On retire le jeton de la barre d'adresse : il ne doit pas rester dans l'historique.
  history.replaceState(null, '', '/verifier');
  if (!token) {
    setMessage('verify-message', t('error.link_unknown'));
    form.classList.add('cache');
    $('verify-retry')?.classList.remove('cache');
    return;
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    busy(form, true);
    try {
      const r = await api('POST', '/v1/auth/verify', { token });
      if (r.status === 200 || r.status === 201) {
        location.replace('/compte');
        return;
      }
      const code = (r.body['error'] as string | undefined) ?? 'server_error';
      setMessage('verify-message', t(`error.${code}`));
      form.classList.add('cache');
      $('verify-retry')?.classList.remove('cache');
    } catch {
      setMessage('verify-message', t('error.network'));
      busy(form, false);
    }
  });
}

async function pageCompte(): Promise<void> {
  const me = await api('GET', '/v1/account');
  if (me.status !== 200) {
    location.replace('/connexion');
    return;
  }
  const p = me.body as { nickname: string; email: string; locale: Locale; createdAt: number };
  const nick = $('fiche-nickname'); if (nick) nick.textContent = p.nickname;
  const mail = $('fiche-email'); if (mail) mail.textContent = p.email;
  const since = $('fiche-since');
  if (since) since.textContent = new Date(p.createdAt).toLocaleDateString(p.locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const nickInput = $('nickname') as HTMLInputElement | null; if (nickInput) nickInput.value = p.nickname;
  const localeSelect = $('locale') as HTMLSelectElement | null; if (localeSelect) localeSelect.value = p.locale;
  if (p.locale !== getLocale()) { setLocale(p.locale); translatePage(); }
  document.querySelectorAll('[data-when=anonymous]').forEach((el) => el.classList.add('cache'));
  document.querySelectorAll('[data-when=player]').forEach((el) => el.classList.remove('cache'));

  const rename = $('rename') as HTMLFormElement | null;
  rename?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(rename);
    setMessage('account-message', '');
    busy(rename, true);
    try {
      const r = await api('PATCH', '/v1/account', { nickname: String(data.get('nickname') ?? ''), locale: String(data.get('locale') ?? 'fr') });
      if (r.status === 204) {
        setMessage('account-message', t('account.saved'), 'ok');
        const newLocale = String(data.get('locale')) as Locale;
        if (nick) nick.textContent = String(data.get('nickname'));
        if (newLocale !== getLocale()) { setLocale(newLocale); translatePage(); }
        setFieldError('nickname', null);
      } else {
        showErrors('account-message', (r.body['fields'] as string[] | undefined) ?? ['server_error']);
      }
    } catch {
      setMessage('account-message', t('error.network'));
    } finally {
      busy(rename, false);
    }
  });

  document.querySelector('[data-action=logout]')?.addEventListener('click', async () => {
    await api('POST', '/v1/auth/logout', {});
    location.replace('/');
  });

  const del = $('delete') as HTMLFormElement | null;
  del?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const confirmNickname = String(new FormData(del).get('confirm') ?? '');
    setMessage('account-message', '');
    busy(del, true);
    try {
      const r = await api('DELETE', '/v1/account', { confirmNickname });
      if (r.status === 204) {
        location.replace('/?supprime=1');
        return;
      }
      showErrors('account-message', (r.body['fields'] as string[] | undefined) ?? ['server_error']);
    } catch {
      setMessage('account-message', t('error.network'));
    } finally {
      busy(del, false);
    }
  });
}

/** Affiche « Se connecter » ou « Mon compte » selon la session, sans bloquer la page. */
async function updateNav(): Promise<void> {
  const r = await api('GET', '/v1/account').catch(() => ({ status: 0, body: {} as Json }));
  const signedIn = r.status === 200;
  document.querySelectorAll('[data-when=anonymous]').forEach((el) => el.classList.toggle('cache', signedIn));
  document.querySelectorAll('[data-when=player]').forEach((el) => el.classList.toggle('cache', !signedIn));
}

function main(): void {
  translatePage();
  document.querySelector('[data-action=toggle-lang]')?.addEventListener('click', () => {
    setLocale(getLocale() === 'fr' ? 'en' : 'fr');
    translatePage();
  });

  const page = document.documentElement.dataset['page'];
  switch (page) {
    case 'index': pageIndex(); break;
    case 'connexion': pageConnexion(); break;
    case 'verifier': pageVerifier(); break;
    case 'compte': void pageCompte(); break;
    default: break;
  }
  if (page !== 'compte') void updateNav();

  if (new URLSearchParams(location.search).get('supprime') === '1') {
    setMessage('signup-message', t('account.deleted'), 'ok');
    history.replaceState(null, '', '/');
  }
}

main();
