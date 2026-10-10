import type { Database } from './db/database.ts';
import type { Config } from './config.ts';
import type { Mailer } from './mail/mailer.ts';

/**
 * Tout ce dont les routes ont besoin, injecté plutôt qu'importé : les tests
 * fournissent une base en mémoire, un envoi d'emails factice et une horloge fixe.
 */
export interface AppContext {
  readonly db: Database;
  readonly config: Config;
  readonly mailer: Mailer;
  /** Horloge injectable : jamais `Date.now()` directement dans une route. */
  readonly now: () => number;
}
