import { buildApp } from './app.ts';
import { loadConfig, ConfigError } from './config.ts';
import { openDatabase, compact } from './db/database.ts';
import { purgeExpiredLinks } from './db/repos/magicLinks.ts';
import { purgeExpiredSessions } from './db/repos/sessions.ts';
import { purgeOldAudit } from './db/repos/audit.ts';
import { purgeExpiredChallenges } from './db/repos/passkeys.ts';
import { purgeExpiredDeviceCodes } from './db/repos/deviceCodes.ts';
import { sweepInactive } from './account/inactivite.ts';
import { BrevoMailer, ConsoleMailer, type Mailer } from './mail/mailer.ts';
import type { AppContext } from './context.ts';
import { WebPushSender } from './push/webpush.ts';
import { notifyArrivals } from './push/routes.ts';

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error(error instanceof ConfigError ? `Configuration : ${error.message}` : error);
  process.exit(1);
}

const db = openDatabase({ path: config.databasePath });
compact(db);
const mailer: Mailer = config.mail.apiKey
  ? new BrevoMailer(config.mail.apiKey, config.mail.from)
  : new ConsoleMailer();

const push = config.push ? new WebPushSender(config.push) : null;
const ctx: AppContext = { db, config, mailer, push, now: () => Date.now() };
const app = await buildApp(ctx, { logger: true });

// Ménage : pas de tâche de fond pour le jeu, mais un balayage horaire des
// jetons expirés garde la base petite. Léger, et sans effet sur la simulation.
const housekeeping = setInterval(() => {
  const now = Date.now();
  purgeExpiredSessions(db, now);
  purgeExpiredLinks(db, now);
  purgeOldAudit(db, now);
  purgeExpiredChallenges(db, now);
  purgeExpiredDeviceCodes(db, now);
  // Les comptes inactifs : avertis à 22 et 23 mois, effacés à 24 — la promesse de la politique de confidentialité.
  sweepInactive(ctx, now).catch((error) => app.log.error(error));
}, 3_600_000);
housekeeping.unref();

// Le courrier qui se pose : toutes les trente secondes, on prévient les joueurs
// dont un vol vient d'arriver. Sans clés VAPID, on marque seulement les vols.
let notifying = false;
const courrier = setInterval(() => {
  if (notifying) return;
  notifying = true;
  notifyArrivals(ctx).catch((error) => app.log.error(error)).finally(() => { notifying = false; });
}, 30_000);
courrier.unref();

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    clearInterval(housekeeping);
    clearInterval(courrier);
    app.close().then(
      () => { db.close(); process.exit(0); },
      () => process.exit(1),
    );
  });
}

try {
  await app.listen({ port: config.port, host: config.host });
  if (!config.mail.apiKey) app.log.warn('MAIL_API_KEY absent : les liens de connexion s\'affichent dans la console.');
  if (!config.push) app.log.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY absents : pas de notifications « courrier arrivé ».');
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
