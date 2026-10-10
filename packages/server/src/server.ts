import { buildApp } from './app.ts';
import { loadConfig, ConfigError } from './config.ts';
import { openDatabase } from './db/database.ts';
import { purgeExpiredLinks } from './db/repos/magicLinks.ts';
import { purgeExpiredSessions } from './db/repos/sessions.ts';
import { purgeOldAudit } from './db/repos/audit.ts';
import { purgeExpiredChallenges } from './db/repos/passkeys.ts';
import { purgeExpiredDeviceCodes } from './db/repos/deviceCodes.ts';
import { BrevoMailer, ConsoleMailer, type Mailer } from './mail/mailer.ts';
import type { AppContext } from './context.ts';

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error(error instanceof ConfigError ? `Configuration : ${error.message}` : error);
  process.exit(1);
}

const db = openDatabase({ path: config.databasePath });
const mailer: Mailer = config.mail.apiKey
  ? new BrevoMailer(config.mail.apiKey, config.mail.from)
  : new ConsoleMailer();

const ctx: AppContext = { db, config, mailer, now: () => Date.now() };
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
}, 3_600_000);
housekeeping.unref();

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    clearInterval(housekeeping);
    app.close().then(
      () => { db.close(); process.exit(0); },
      () => process.exit(1),
    );
  });
}

try {
  await app.listen({ port: config.port, host: config.host });
  if (!config.mail.apiKey) app.log.warn('MAIL_API_KEY absent : les liens de connexion s\'affichent dans la console.');
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
