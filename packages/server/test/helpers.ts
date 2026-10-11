import { buildApp } from '../src/app.ts';
import type { AppContext } from '../src/context.ts';
import { loadConfig } from '../src/config.ts';
import { openDatabase } from '../src/db/database.ts';
import { ConsoleMailer } from '../src/mail/mailer.ts';

/** Application de test : base en mémoire, emails capturés, horloge pilotée. */
export async function testApp(startAt = Date.UTC(2026, 9, 11, 9, 0, 0), env: Record<string, string> = {}) {
  let clock = startAt;
  const mailer = new ConsoleMailer(() => undefined);
  const ctx: AppContext = {
    db: openDatabase({ path: ':memory:' }),
    config: loadConfig({ NODE_ENV: 'test', PORT: '3000', PUBLIC_ORIGIN: 'http://localhost:3000', MAIL_CONTACT: 'bonjour@altiplume.com', ...env }),
    mailer,
    push: null,
    now: () => clock,
  };
  const app = await buildApp(ctx, { clientDir: '/nonexistent' });
  return {
    app, ctx, mailer,
    advance: (ms: number) => { clock += ms; },
    /** Extrait le jeton du dernier email envoyé. */
    lastToken: () => {
      const last = mailer.sent.at(-1);
      if (!last) throw new Error('aucun email envoyé');
      const m = /jeton=([A-Za-z0-9_%-]+)/.exec(last.text);
      if (!m) throw new Error('pas de jeton dans l\'email');
      return decodeURIComponent(m[1] as string);
    },
    json: (method: 'POST' | 'PATCH' | 'DELETE' | 'GET', url: string, body?: unknown, cookie?: string) =>
      app.inject({
        method, url,
        headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
        ...(body !== undefined ? { payload: JSON.stringify(body) } : {}),
      }),
  };
}

export function sessionCookie(response: { cookies: { name: string; value: string }[] }): string {
  const c = response.cookies.find((x) => x.name === 'altiplume_session');
  if (!c) throw new Error('pas de cookie de session');
  return `altiplume_session=${c.value}`;
}
