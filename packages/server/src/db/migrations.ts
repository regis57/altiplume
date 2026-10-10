/**
 * Migrations du schéma, dans l'ordre. Ne jamais modifier une migration existante.
 *
 * Principe de minimisation : on ne stocke que ce qui sert au jeu. Pas de nom, pas
 * d'adresse, pas d'IP, pas de date de naissance — seulement la confirmation d'âge.
 */
export interface Migration {
  readonly version: number;
  readonly name: string;
  readonly sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'comptes',
    sql: `
      -- Un joueur. L'email est la seule donnée de contact ; le pseudonyme est public.
      CREATE TABLE players (
        id                TEXT PRIMARY KEY,
        email             TEXT NOT NULL UNIQUE,            -- en minuscules, normalisé
        nickname          TEXT NOT NULL,                   -- forme affichée, telle que saisie
        nickname_key      TEXT NOT NULL UNIQUE,            -- forme repliée : unicité anti-usurpation
        locale            TEXT NOT NULL DEFAULT 'fr',
        age_confirmed     INTEGER NOT NULL DEFAULT 0,      -- 1 = a déclaré avoir 15 ans ou plus
        terms_version     TEXT NOT NULL,                   -- version des CGU acceptées
        terms_accepted_at INTEGER NOT NULL,
        created_at        INTEGER NOT NULL,
        last_seen_at      INTEGER NOT NULL
      );

      -- Sessions : on ne stocke que l'empreinte du jeton, jamais le jeton.
      CREATE TABLE sessions (
        id           TEXT PRIMARY KEY,                     -- sha256 du jeton
        player_id    TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        created_at   INTEGER NOT NULL,
        expires_at   INTEGER NOT NULL,
        last_used_at INTEGER NOT NULL
      );
      CREATE INDEX sessions_player ON sessions(player_id);
      CREATE INDEX sessions_expires ON sessions(expires_at);

      -- Liens magiques : à usage unique, courte durée, empreinte seulement.
      CREATE TABLE magic_links (
        id         TEXT PRIMARY KEY,                       -- sha256 du jeton
        email      TEXT NOT NULL,
        purpose    TEXT NOT NULL CHECK (purpose IN ('signup', 'login')),
        payload    TEXT,                                   -- JSON : pseudonyme, locale, CGU (inscription)
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        used_at    INTEGER
      );
      CREATE INDEX magic_links_email ON magic_links(email);

      -- Journal d'audit sans donnée personnelle : des événements, pas des gens.
      CREATE TABLE audit (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        at        INTEGER NOT NULL,
        event     TEXT NOT NULL,
        player_id TEXT,                                    -- peut survivre à la suppression (orphelin volontaire)
        meta      TEXT                                     -- JSON, jamais d'email ni d'IP
      );
      CREATE INDEX audit_at ON audit(at);
    `,
  },
];
