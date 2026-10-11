/**
 * Configuration lue au démarrage. Tout vient de l'environnement ; rien n'est
 * codé en dur. Une valeur manquante ou incohérente fait échouer le démarrage
 * avec un message clair plutôt que de laisser tourner un serveur mal configuré.
 */
export interface Config {
  readonly env: 'development' | 'test' | 'production';
  readonly host: string;
  readonly port: number;
  /** Origine publique, sans barre oblique finale : https://altiplume.com */
  readonly publicOrigin: string;
  readonly databasePath: string;
  readonly mail: { readonly apiKey: string | null; readonly from: string };
  /** Clés VAPID pour les notifications ; absentes, les notifications sont simplement indisponibles. */
  readonly push: { readonly publicKey: string; readonly privateKey: string; readonly subject: string } | null;
  /** Vrai derrière le tunnel Cloudflare : les en-têtes X-Forwarded-* sont fiables. */
  readonly trustProxy: boolean;
}

export class ConfigError extends Error {}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const nodeEnv = env['NODE_ENV'] ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new ConfigError(`NODE_ENV invalide : ${nodeEnv}`);
  }
  const isProd = nodeEnv === 'production';

  const port = Number.parseInt(env['PORT'] ?? '3000', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new ConfigError('PORT invalide');

  const publicOrigin = (env['PUBLIC_ORIGIN'] ?? `http://localhost:${port}`).replace(/\/+$/, '');
  let origin: URL;
  try {
    origin = new URL(publicOrigin);
  } catch {
    throw new ConfigError(`PUBLIC_ORIGIN invalide : ${publicOrigin}`);
  }
  if (isProd && origin.protocol !== 'https:') {
    throw new ConfigError('PUBLIC_ORIGIN doit être en https en production');
  }

  const apiKey = env['MAIL_API_KEY']?.trim() || null;
  if (isProd && !apiKey) {
    throw new ConfigError('MAIL_API_KEY est requis en production : sans lui, aucun lien de connexion ne part');
  }

  const vapidPublic = env['VAPID_PUBLIC_KEY']?.trim() || null;
  const vapidPrivate = env['VAPID_PRIVATE_KEY']?.trim() || null;
  if ((vapidPublic === null) !== (vapidPrivate === null)) {
    throw new ConfigError('VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY vont ensemble');
  }
  const push = vapidPublic && vapidPrivate
    ? { publicKey: vapidPublic, privateKey: vapidPrivate, subject: env['VAPID_SUBJECT']?.trim() || `mailto:${env['MAIL_FROM'] ?? 'courrier@altiplume.com'}` }
    : null;

  return {
    env: nodeEnv as Config['env'],
    host: env['HOST'] ?? '127.0.0.1',
    port,
    publicOrigin,
    databasePath: env['DATABASE_PATH'] ?? './data/altiplume.db',
    mail: { apiKey, from: env['MAIL_FROM'] ?? 'courrier@altiplume.com' },
    push,
    trustProxy: env['TRUST_PROXY'] === '1' || isProd,
  };
}
