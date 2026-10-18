/**
 * Accès à la base SQLite via le module intégré à Node (`node:sqlite`).
 *
 * Choix délibéré : pas de dépendance native à compiler, pas de binaire tiers à
 * auditer, un seul fichier à sauvegarder. SQLite en mode WAL tient sans peine
 * plusieurs milliers de joueurs sur un NAS ; le jour où ce ne sera plus vrai, la
 * couche d'accès est isolée ici et dans `repos/`, et rien d'autre ne change.
 *
 * `node:sqlite` est encore marqué « expérimental » par Node 22 bien que son API soit
 * figée depuis 22.13 ; on neutralise l'avertissement au démarrage (voir package.json).
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { MIGRATIONS } from './migrations.ts';

export type Database = DatabaseSync;

export interface OpenOptions {
  /** `:memory:` pour les tests. */
  readonly path: string;
}

export function openDatabase(options: OpenOptions): Database {
  if (options.path !== ':memory:') mkdirSync(dirname(options.path), { recursive: true });
  const db = new DatabaseSync(options.path);

  // WAL : lectures et écritures concurrentes sans se bloquer.
  db.exec('PRAGMA journal_mode = WAL');
  // Les clés étrangères ne sont PAS vérifiées par défaut dans SQLite : on l'exige.
  db.exec('PRAGMA foreign_keys = ON');
  // Attendre un verrou plutôt qu'échouer immédiatement.
  db.exec('PRAGMA busy_timeout = 5000');
  // Bon compromis durabilité / vitesse en WAL : une coupure ne corrompt rien.
  db.exec('PRAGMA synchronous = NORMAL');
  // Ce qui est effacé est écrasé, pas seulement marqué libre : sans cela, l'adresse
  // d'un compte supprimé restait lisible dans le fichier et dans chaque sauvegarde.
  db.exec('PRAGMA secure_delete = ON');

  migrate(db);
  return db;
}

/**
 * Récrit le fichier de la base page par page : ce que d'anciens effacements avaient
 * laissé dans la place libre disparaît. Lancé au démarrage du serveur (le NAS
 * redémarre chaque semaine) ; la base est petite, c'est l'affaire d'un instant.
 */
export function compact(db: Database): void {
  db.exec('VACUUM');
}

/**
 * Applique les migrations manquantes, dans l'ordre, chacune dans sa transaction.
 * Une migration déjà appliquée n'est jamais rejouée ; une migration ne se modifie
 * jamais après coup — on en ajoute une nouvelle.
 */
export function migrate(db: Database): number {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);
  const applied = new Set(
    (db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[])
      .map((r) => r.version),
  );

  let count = 0;
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;
    db.exec('BEGIN');
    try {
      db.exec(migration.sql);
      migration.run?.(db);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
        .run(migration.version, Date.now());
      db.exec('COMMIT');
      count += 1;
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(`migration ${migration.version} (${migration.name}) a échoué`, { cause: error });
    }
  }
  return count;
}

/** Exécute `fn` dans une transaction ; annule tout si elle lève. */
export function transaction<T>(db: Database, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
