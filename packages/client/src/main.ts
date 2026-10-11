/**
 * Client Altiplume — pages d'accueil, d'inscription, de connexion et de compte.
 *
 * Tout est du DOM ordinaire : lisible par un lecteur d'écran, navigable au clavier,
 * traduisible. Aucun script ni style en ligne, la CSP l'interdit.
 */
import { browserSupportsWebAuthn, startAuthentication, WebAuthnError } from '@simplewebauthn/browser';
import { addPasskey } from './passkeys.ts';
import { toCanvas } from 'qrcode';
import { formatRemaining } from './time.ts';
import { getLocale, setLocale, t, translatePage, type Locale } from './i18n.ts';
import { pageAerodrome } from './aerodrome.ts';
import { pageContact } from './contact.ts';

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

/**
 * Affiche un message fait de clés de traduction. Les clés restent sur l'élément
 * (`data-i18n-keys`) : si la personne change de langue, le message suit.
 */
function setMessage(id: string, keys: string | string[], kind: 'ok' | 'error' = 'error'): void {
  const el = $(id);
  if (!el) return;
  const list = (Array.isArray(keys) ? keys : [keys]).filter(Boolean);
  if (list.length === 0) delete el.dataset['i18nKeys'];
  else el.dataset['i18nKeys'] = list.join(' ');
  el.textContent = list.map((k) => t(k)).join(' ');
  el.classList.toggle('ok', kind === 'ok');
}

/** Pose une date sur un élément ; `translatePage` la formate dans la langue courante. */
function setDate(el: HTMLElement | null, ms: number, style: 'short' | 'long' = 'long'): void {
  if (!el) return;
  el.dataset['date'] = String(ms);
  el.dataset['dateStyle'] = style;
}

function setFieldError(field: string, code: string | null): void {
  const input = $(field) as HTMLInputElement | null;
  const err = $(`${field}-erreur`);
  if (input) input.setAttribute('aria-invalid', code ? 'true' : 'false');
  if (err) {
    if (code) err.dataset['i18n'] = `error.${code}`; else delete err.dataset['i18n'];
    err.textContent = code ? t(`error.${code}`) : '';
  }
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
  setMessage(messageId, global.map((c) => `error.${c}`));
}

function errorKey(r: ApiResult): string {
  if (r.status === 429) return 'error.too_many_requests';
  const code = r.body['error'];
  return `error.${typeof code === 'string' && code !== 'invalid' ? code : 'server_error'}`;
}

function stamp(): void {
  const el = $('cachet');
  if (!el) return;
  setDate($('cachet-date'), Date.now(), 'short');
  translatePage();
  el.classList.remove('cache');
  el.classList.add('tampon');
}

/** Sous le cachet, l'adresse où le lien part : une faute de frappe se voit tout de suite. */
function showSentTo(id: string, email: string): void {
  const el = $(id);
  if (!el) return;
  el.replaceChildren();
  const label = document.createElement('span'); label.dataset['i18n'] = 'sent.to'; label.textContent = t('sent.to');
  const addr = document.createElement('strong'); addr.textContent = email.trim();
  el.append(label, ' ', addr);
  el.classList.remove('cache');
}

function busy(form: HTMLFormElement, on: boolean): void {
  const button = form.querySelector('button[type=submit]') as HTMLButtonElement | null;
  if (button) button.disabled = on;
}

/** Où aller après une connexion réussie : la page d'approbation si on en vient. */
const RETURN_KEY = 'altiplume.retour';
function afterSignIn(): void {
  let target = '/aerodrome';
  try {
    if (sessionStorage.getItem(RETURN_KEY) === 'approuver') target = '/approuver';
    sessionStorage.removeItem(RETURN_KEY);
  } catch { /* sans stockage, on va au compte */ }
  location.replace(target);
}

// ---- Pages ----

/** Le compteur mondial anonyme, sur la page d'accueil. Un chiffre d'ambiance, jamais un classement. */
async function worldCounter(): Promise<void> {
  const el = $('monde');
  if (!el) return;
  const r = await api('GET', '/v1/world/stats').catch(() => null);
  if (!r || r.status !== 200) return;
  const month = Number(r.body['deliveriesThisMonth'] ?? 0);
  const total = Number(r.body['deliveriesTotal'] ?? 0);
  if (total === 0) return; // tant que personne n'a volé, on ne dit rien
  const n = month > 0 ? month : total;
  el.dataset['i18nKeys'] = month > 0 ? 'home.worldMonth' : 'home.worldTotal';
  el.dataset['count'] = String(n);
  el.textContent = t(month > 0 ? 'home.worldMonth' : 'home.worldTotal').replace('{n}', n.toLocaleString(getLocale() === 'fr' ? 'fr-FR' : 'en-GB'));
  el.classList.remove('cache');
}

function pageIndex(): void {
  void worldCounter();
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
        setMessage('signup-message', 'signup.sent', 'ok');
        showSentTo('signup-adresse', payload.email);
        form.querySelectorAll('input, button').forEach((el) => { (el as HTMLInputElement).disabled = true; });
        return;
      }
      if (r.status === 429) { setMessage('signup-message', 'error.too_many_requests'); return; }
      showErrors('signup-message', (r.body['fields'] as string[] | undefined) ?? ['server_error']);
    } catch {
      setMessage('signup-message', 'error.network');
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
        setMessage('login-message', 'login.sent', 'ok');
        showSentTo('login-adresse', email);
        form.querySelectorAll('input, button').forEach((el) => { (el as HTMLInputElement).disabled = true; });
        return;
      }
      if (r.status === 429) { setMessage('login-message', 'error.too_many_requests'); return; }
      showErrors('login-message', (r.body['fields'] as string[] | undefined) ?? ['server_error']);
    } catch {
      setMessage('login-message', 'error.network');
    } finally {
      if (!form.querySelector('input[disabled]')) busy(form, false);
    }
  });

  // Passkey : le navigateur propose les clés qu'il connaît pour ce site.
  const passkeyButton = document.querySelector<HTMLButtonElement>('[data-action=passkey-login]');
  if (passkeyButton && browserSupportsWebAuthn()) {
    passkeyButton.classList.remove('cache');
    passkeyButton.addEventListener('click', async () => {
      setMessage('login-message', '');
      passkeyButton.disabled = true;
      try {
        const opts = await api('POST', '/v1/auth/passkey/options', {});
        if (opts.status !== 200) { setMessage('login-message', errorKey(opts)); return; }
        const { options, challengeToken } = opts.body as { options: Parameters<typeof startAuthentication>[0]['optionsJSON']; challengeToken: string };
        let response;
        try {
          response = await startAuthentication({ optionsJSON: options });
        } catch (error) {
          setMessage('login-message', error instanceof WebAuthnError && error.name === 'NotAllowedError' ? 'login.passkeyCancelled' : 'error.passkey_rejected');
          return;
        }
        const r = await api('POST', '/v1/auth/passkey/verify', { challengeToken, response: response as unknown as Json });
        if (r.status === 200) { afterSignIn(); return; }
        setMessage('login-message', errorKey(r));
      } catch {
        setMessage('login-message', 'error.network');
      } finally {
        passkeyButton.disabled = false;
      }
    });
  }

  // QR : cet écran demande un code ; le téléphone, déjà connecté, l'approuve.
  const showQr = document.querySelector<HTMLButtonElement>('[data-action=show-qr]');
  const qrBox = $('qr');
  const canvas = $('qr-canvas') as HTMLCanvasElement | null;
  let polling: ReturnType<typeof setInterval> | null = null;
  showQr?.addEventListener('click', async () => {
    if (!qrBox || !canvas) return;
    if (polling) { clearInterval(polling); polling = null; }
    setMessage('login-message', '');
    showQr.disabled = true;
    try {
      const r = await api('POST', '/v1/auth/device/start', {});
      if (r.status !== 201) { setMessage('login-message', errorKey(r)); return; }
      const start = r.body as { pollToken: string; userCode: string; expiresAt: number; approveUrl: string };
      await toCanvas(canvas, start.approveUrl, { width: 196, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#2a2f33', light: '#f6f1e7' } });
      const code = $('qr-code'); if (code) code.textContent = `${start.userCode.slice(0, 3)} ${start.userCode.slice(3)}`;
      setMessage('qr-status', 'login.qrWaiting', 'ok');
      qrBox.classList.remove('cache');
      const stop = (key: string) => {
        if (polling) { clearInterval(polling); polling = null; }
        setMessage('qr-status', key, key === 'login.qrApproved' ? 'ok' : 'error');
        showQr.disabled = false;
      };
      polling = setInterval(async () => {
        if (Date.now() > start.expiresAt) { stop('login.qrExpired'); return; }
        try {
          const p = await api('POST', '/v1/auth/device/poll', { pollToken: start.pollToken });
          const status = p.body['status'];
          if (status === 'approved') { stop('login.qrApproved'); afterSignIn(); }
          else if (status === 'denied') stop('login.qrDenied');
          else if (status === 'expired') stop('login.qrExpired');
        } catch { /* réseau capricieux : on réessaie au prochain tour */ }
      }, 2000);
    } catch {
      setMessage('login-message', 'error.network');
      showQr.disabled = false;
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
    setMessage('verify-message', 'error.link_unknown');
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
        afterSignIn();
        return;
      }
      setMessage('verify-message', errorKey(r));
      form.classList.add('cache');
      $('verify-retry')?.classList.remove('cache');
    } catch {
      setMessage('verify-message', 'error.network');
      busy(form, false);
    }
  });
}

/** Le téléphone a lu le QR : il affiche le code et demande confirmation. */
async function pageApprouver(): Promise<void> {
  const pending = $('approve-pending');
  if (!pending) return;
  // Un second QR lu alors que cette page est déjà ouverte ne change que le fragment :
  // le navigateur ne recharge pas. On le fait pour lui.
  window.addEventListener('hashchange', () => { if (location.hash.includes('code=')) location.reload(); });
  // Le code voyage dans le fragment : il n'a jamais été envoyé au serveur par l'URL.
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  let code = hash.get('code');
  history.replaceState(null, '', '/approuver');
  const STORE = 'altiplume.appareil';
  try {
    if (code) sessionStorage.setItem(STORE, code);
    else code = sessionStorage.getItem(STORE);
  } catch { /* pas de stockage : on ne survivra pas à une connexion intermédiaire */ }
  if (!code) { setMessage('approve-message', 'approve.missing'); return; }

  const peek = await api('POST', '/v1/auth/device/peek', { deviceCode: code });
  if (peek.status === 401) {
    try { sessionStorage.setItem(RETURN_KEY, 'approuver'); } catch { /* idem */ }
    $('approve-login')?.classList.remove('cache');
    return;
  }
  if (peek.status !== 200) { setMessage('approve-message', errorKey(peek)); clear(); return; }
  const userCode = String(peek.body['userCode'] ?? '');
  const codeEl = $('approve-code'); if (codeEl) codeEl.textContent = `${userCode.slice(0, 3)} ${userCode.slice(3)}`;
  pending.classList.remove('cache');

  async function decide(approve: boolean): Promise<void> {
    pending!.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    try {
      const r = await api('POST', '/v1/auth/device/approve', { deviceCode: code!, approve });
      if (r.status === 204) {
        pending!.classList.add('cache');
        setMessage('approve-message', approve ? 'approve.approved' : 'approve.denied', approve ? 'ok' : 'error');
        $('approve-done')?.classList.remove('cache');
      } else {
        setMessage('approve-message', errorKey(r));
      }
    } catch {
      setMessage('approve-message', 'error.network');
      pending!.querySelectorAll('button').forEach((b) => { b.disabled = false; });
      return;
    }
    clear();
  }
  function clear(): void { try { sessionStorage.removeItem(STORE); } catch { /* rien */ } }

  document.querySelector('[data-action=approve]')?.addEventListener('click', () => void decide(true));
  document.querySelector('[data-action=deny]')?.addEventListener('click', () => void decide(false));
}

interface PasskeyView { id: string; name: string; backedUp: boolean; createdAt: number; lastUsedAt: number | null }

/** Liste des passkeys du compte, avec renommage et suppression. */
async function renderPasskeys(): Promise<void> {
  const list = $('passkeys-list');
  if (!list) return;
  const r = await api('GET', '/v1/passkeys');
  const keys = (r.status === 200 ? (r.body as unknown as PasskeyView[]) : []);
  list.replaceChildren();
  $('passkeys-empty')?.classList.toggle('cache', keys.length > 0);
  for (const k of keys) {
    const li = document.createElement('li');
    const form = document.createElement('form');
    form.className = 'cle';
    form.noValidate = true;

    const label = document.createElement('label');
    label.className = 'visually-hidden';
    label.htmlFor = `cle-${k.id.slice(0, 12)}`;
    label.dataset['i18n'] = 'passkeys.nameLabel';
    const input = document.createElement('input');
    input.id = label.htmlFor;
    input.type = 'text';
    input.name = 'name';
    input.value = k.name;
    input.maxLength = 40;
    input.autocomplete = 'off';

    const meta = document.createElement('p');
    meta.className = 'aide';
    const created = document.createElement('span'); created.dataset['i18n'] = 'passkeys.created';
    const createdDate = document.createElement('span'); setDate(createdDate, k.createdAt, 'short');
    const sep = document.createTextNode(' · ');
    const used = document.createElement('span'); used.dataset['i18n'] = 'passkeys.lastUsed';
    const usedDate = document.createElement('span');
    if (k.lastUsedAt) setDate(usedDate, k.lastUsedAt, 'short'); else usedDate.dataset['i18n'] = 'passkeys.neverUsed';
    meta.append(created, ' ', createdDate, sep, used, ' ', usedDate);
    if (k.backedUp) {
      const synced = document.createElement('span'); synced.dataset['i18n'] = 'passkeys.synced';
      meta.append(' · ', synced);
    }

    const actions = document.createElement('div');
    actions.className = 'actions';
    const rename = document.createElement('button');
    rename.type = 'submit'; rename.className = 'bouton secondaire'; rename.dataset['i18n'] = 'passkeys.rename';
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'bouton danger'; remove.dataset['i18n'] = 'passkeys.remove';
    actions.append(rename, remove);

    form.append(label, input, meta, actions);
    li.append(form);
    list.append(li);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setMessage('passkeys-message', '');
      const res = await api('PATCH', `/v1/passkeys/${encodeURIComponent(k.id)}`, { name: input.value }).catch(() => ({ status: 0, body: {} as Json }));
      if (res.status === 204) setMessage('passkeys-message', 'passkeys.renamed', 'ok');
      else setMessage('passkeys-message', res.status === 0 ? 'error.network' : (res.body['fields'] as string[] | undefined)?.map((c) => `error.${c}`) ?? errorKey(res));
    });
    remove.addEventListener('click', async () => {
      setMessage('passkeys-message', '');
      remove.disabled = true;
      const res = await api('DELETE', `/v1/passkeys/${encodeURIComponent(k.id)}`, {}).catch(() => ({ status: 0, body: {} as Json }));
      if (res.status === 204) { setMessage('passkeys-message', 'passkeys.removed', 'ok'); await renderPasskeys(); }
      else { setMessage('passkeys-message', res.status === 0 ? 'error.network' : errorKey(res)); remove.disabled = false; }
    });
  }
  translatePage();
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
  setDate($('fiche-since'), p.createdAt, 'long');
  const nickInput = $('nickname') as HTMLInputElement | null; if (nickInput) nickInput.value = p.nickname;
  const localeSelect = $('locale') as HTMLSelectElement | null; if (localeSelect) localeSelect.value = p.locale;
  if (p.locale !== getLocale()) setLocale(p.locale);
  translatePage();
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
        setMessage('account-message', 'account.saved', 'ok');
        const newLocale = String(data.get('locale')) as Locale;
        if (nick) nick.textContent = String(data.get('nickname'));
        if (newLocale !== getLocale()) { setLocale(newLocale); translatePage(); }
        setFieldError('nickname', null);
      } else {
        showErrors('account-message', (r.body['fields'] as string[] | undefined) ?? ['server_error']);
      }
    } catch {
      setMessage('account-message', 'error.network');
    } finally {
      busy(rename, false);
    }
  });

  // Passkeys.
  const add = document.querySelector<HTMLButtonElement>('[data-action=passkey-add]');
  if (browserSupportsWebAuthn()) {
    add?.classList.remove('cache');
    add?.addEventListener('click', async () => {
      setMessage('passkeys-message', '');
      add.disabled = true;
      const result = await addPasskey(api);
      add.disabled = false;
      setMessage('passkeys-message', result.key, result.ok ? 'ok' : 'error');
      if (result.ok) await renderPasskeys();
    });
  } else {
    $('passkeys-unsupported')?.classList.remove('cache');
  }
  void renderPasskeys();

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
      setMessage('account-message', 'error.network');
    } finally {
      busy(del, false);
    }
  });
}

// ---- Jour / nuit ----

const THEME_KEY = 'altiplume.theme';
type Theme = 'light' | 'dark';

/** Le thème effectivement affiché : le choix enregistré, sinon celui du système. */
function currentTheme(): Theme {
  const forced = document.documentElement.dataset['theme'];
  if (forced === 'dark' || forced === 'light') return forced;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme | null): void {
  if (theme) document.documentElement.dataset['theme'] = theme;
  else delete document.documentElement.dataset['theme'];
  try {
    if (theme) localStorage.setItem(THEME_KEY, theme); else localStorage.removeItem(THEME_KEY);
  } catch { /* sans stockage, le choix vaut pour cette page */ }
  updateThemeButton();
}

function updateThemeButton(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-action=toggle-theme]');
  if (!button) return;
  const dark = currentTheme() === 'dark';
  button.dataset['i18nAria'] = dark ? 'theme.toLight' : 'theme.toDark';
  button.setAttribute('aria-label', t(dark ? 'theme.toLight' : 'theme.toDark'));
  button.setAttribute('aria-pressed', dark ? 'true' : 'false');
  // La barre du navigateur mobile suit : brume de jour, nuit sinon.
  document.querySelectorAll<HTMLMetaElement>('meta[name=theme-color]').forEach((m) => m.remove());
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = dark ? '#1f262c' : '#cfd8dd';
  document.head.append(meta);
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
  updateThemeButton();
  document.querySelector('[data-action=toggle-theme]')?.addEventListener('click', () => {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButton);

  const page = document.documentElement.dataset['page'];
  switch (page) {
    case 'index': pageIndex(); break;
    case 'connexion': pageConnexion(); break;
    case 'verifier': pageVerifier(); break;
    case 'approuver': void pageApprouver(); break;
    case 'compte': void pageCompte(); break;
    case 'aerodrome': void pageAerodrome(api, setMessage); break;
    case 'contact': void pageContact(api, setMessage, setDate); break;
    default: break;
  }
  if (page !== 'compte' && page !== 'aerodrome') void updateNav();

  if (new URLSearchParams(location.search).get('supprime') === '1') {
    setMessage('signup-message', 'account.deleted', 'ok');
    history.replaceState(null, '', '/');
  }
}

main();
