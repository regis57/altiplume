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
  {
    version: 2,
    name: 'passkeys-et-appareils',
    sql: `
      -- Passkeys (WebAuthn). On stocke la clé PUBLIQUE : elle ne sert qu'à vérifier.
      CREATE TABLE passkeys (
        id              TEXT PRIMARY KEY,                  -- identifiant de la clé, base64url
        player_id       TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        public_key      BLOB NOT NULL,
        counter         INTEGER NOT NULL DEFAULT 0,        -- anti-clonage : doit toujours croître
        transports      TEXT,                              -- JSON : ["internal","hybrid"]
        device_type     TEXT NOT NULL,                     -- singleDevice | multiDevice
        backed_up       INTEGER NOT NULL DEFAULT 0,
        name            TEXT NOT NULL,                     -- « iPhone de Régis », modifiable
        created_at      INTEGER NOT NULL,
        last_used_at    INTEGER
      );
      CREATE INDEX passkeys_player ON passkeys(player_id);

      -- Défis WebAuthn en attente : une seule réponse, courte durée.
      CREATE TABLE webauthn_challenges (
        id         TEXT PRIMARY KEY,                       -- sha256 du jeton de défi (cookie)
        challenge  TEXT NOT NULL,                          -- le défi envoyé au navigateur
        purpose    TEXT NOT NULL CHECK (purpose IN ('register', 'authenticate')),
        player_id  TEXT,                                   -- requis pour register
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );

      -- Connexion d'un PC par le téléphone : le PC affiche un QR, le téléphone approuve.
      CREATE TABLE device_codes (
        id          TEXT PRIMARY KEY,                      -- sha256 du code d'appareil (dans le QR)
        user_code   TEXT NOT NULL,                         -- 6 chiffres, affichés sur les deux écrans
        poll_key    TEXT NOT NULL UNIQUE,                  -- sha256 du jeton que le PC garde pour interroger
        status      TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'consumed')),
        player_id   TEXT,                                  -- posé à l'approbation
        created_at  INTEGER NOT NULL,
        expires_at  INTEGER NOT NULL
      );
      CREATE INDEX device_codes_expires ON device_codes(expires_at);
    `,
  },
];
