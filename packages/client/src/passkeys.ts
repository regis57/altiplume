/**
 * Ajouter une passkey — la même action depuis « Mon compte » et depuis
 * l'invitation de l'aérodrome. Rend la clé de message à afficher.
 */
import { browserSupportsWebAuthn, startRegistration, WebAuthnError } from '@simplewebauthn/browser';

type Json = Record<string, unknown>;
type Api = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: Json) => Promise<{ status: number; body: Json }>;

export { browserSupportsWebAuthn };

export interface AddResult { readonly ok: boolean; readonly key: string }

function errorKey(r: { status: number; body: Json }): string {
  if (r.status === 429) return 'error.too_many_requests';
  const code = r.body['error'];
  return `error.${typeof code === 'string' && code !== 'invalid' ? code : 'server_error'}`;
}

/** Demande les options, laisse l'appareil créer la clé, l'enregistre. */
export async function addPasskey(api: Api): Promise<AddResult> {
  try {
    const opts = await api('POST', '/v1/passkeys/options', {});
    if (opts.status !== 200) return { ok: false, key: errorKey(opts) };
    const { options, challengeToken } = opts.body as { options: Parameters<typeof startRegistration>[0]['optionsJSON']; challengeToken: string };
    let response;
    try {
      response = await startRegistration({ optionsJSON: options });
    } catch (error) {
      const name = error instanceof WebAuthnError ? error.name : '';
      return { ok: false, key: name === 'NotAllowedError' ? 'passkeys.cancelled' : name === 'InvalidStateError' ? 'error.passkey_exists' : 'error.passkey_rejected' };
    }
    const r = await api('POST', '/v1/passkeys/register', { challengeToken, response: response as unknown as Json });
    return r.status === 201 ? { ok: true, key: 'passkeys.added' } : { ok: false, key: errorKey(r) };
  } catch {
    return { ok: false, key: 'error.network' };
  }
}

const LATER_KEY = 'altiplume.passkey.plus-tard';
const LATER_MS = 3 * 24 * 3_600_000;

/**
 * L'invitation sur l'aérodrome : tant qu'il n'y a aucune passkey, on propose d'en
 * créer une — gentiment, et « Plus tard » fait taire l'invitation trois jours.
 * Dès qu'une clé existe, l'invitation disparaît pour de bon : la gestion reste
 * dans « Mon compte ».
 */
export async function setupPasskeyInvitation(api: Api, setMessage: (id: string, keys: string | string[], kind?: 'ok' | 'error') => void): Promise<void> {
  const card = document.getElementById('fiche-passkey');
  if (!card || card.dataset['ready'] || !browserSupportsWebAuthn()) return;
  card.dataset['ready'] = '1';
  let later = 0;
  try { later = Number(localStorage.getItem(LATER_KEY) ?? 0); } catch { /* sans stockage */ }
  if (Date.now() - later < LATER_MS) return;
  const list = await api('GET', '/v1/passkeys');
  if (list.status !== 200 || (list.body as unknown as unknown[]).length > 0) return;
  card.classList.remove('cache');

  card.querySelector('[data-action=passkey-later]')?.addEventListener('click', () => {
    try { localStorage.setItem(LATER_KEY, String(Date.now())); } catch { /* sans importance */ }
    card.classList.add('cache');
  });
  const button = card.querySelector<HTMLButtonElement>('[data-action=passkey-create]');
  button?.addEventListener('click', async () => {
    button.disabled = true;
    const result = await addPasskey(api);
    button.disabled = false;
    setMessage('jeu-message', result.key, result.ok ? 'ok' : 'error');
    if (result.ok) card.classList.add('cache');
  });
}
