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
  {
    version: 3,
    name: 'compagnies',
    sql: `
      -- La compagnie d'un joueur : une par compte. Les francs et les cachets sont
      -- des entiers tenus par le serveur ; le navigateur n'envoie que des intentions.
      CREATE TABLE companies (
        id          TEXT PRIMARY KEY,
        player_id   TEXT NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        francs      INTEGER NOT NULL DEFAULT 0,
        stamps      INTEGER NOT NULL DEFAULT 0,
        founded_at  INTEGER NOT NULL
      );

      -- Les avions d'une compagnie : un modèle du monde, une usure en points.
      CREATE TABLE company_planes (
        id          TEXT PRIMARY KEY,
        company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        model       TEXT NOT NULL,
        wear        INTEGER NOT NULL DEFAULT 0,
        acquired_at INTEGER NOT NULL
      );
      CREATE INDEX company_planes_company ON company_planes(company_id);

      -- Les pilotes embauchés : un gabarit du monde, et ce qui évolue avec le joueur.
      CREATE TABLE company_pilots (
        id          TEXT PRIMARY KEY,
        company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        pilot       TEXT NOT NULL,
        affinity    INTEGER NOT NULL DEFAULT 0,   -- vols faits ensemble
        morale      INTEGER NOT NULL DEFAULT 10,  -- 0..20
        fatigue     INTEGER NOT NULL DEFAULT 0,   -- minutes de vol accumulées (voir la v11)
        scenes_seen INTEGER NOT NULL DEFAULT 0,   -- scènes d'histoire déjà lues
        hired_at    INTEGER NOT NULL,
        UNIQUE (company_id, pilot)
      );

      -- Niveau de chaque zone de l'aérodrome.
      CREATE TABLE company_zones (
        company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        zone        TEXT NOT NULL,
        level       INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (company_id, zone)
      );

      CREATE TABLE company_decorations (
        company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        decoration  TEXT NOT NULL,
        placed_at   INTEGER NOT NULL,
        PRIMARY KEY (company_id, decoration)
      );

      -- L'album de cachets : une page par « première », datée.
      CREATE TABLE company_stamps (
        company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        stamp       TEXT NOT NULL,
        earned_at   INTEGER NOT NULL,
        PRIMARY KEY (company_id, stamp)
      );
    `,
  },
  {
    version: 4,
    name: 'courrier',
    sql: `
      -- Le jour du dernier tirage de cartes, pour ne tirer qu'une fois par jour de jeu.
      ALTER TABLE companies ADD COLUMN last_draw_day INTEGER NOT NULL DEFAULT -1;
      -- Compteur de vols, qui sert de graine aux aléas de chaque vol.
      ALTER TABLE companies ADD COLUMN flights_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE companies ADD COLUMN deadlines_met INTEGER NOT NULL DEFAULT 0;
      -- La fatigue se déduit du temps écoulé depuis sa dernière mise à jour : sans tick.
      ALTER TABLE company_pilots ADD COLUMN fatigue_at INTEGER NOT NULL DEFAULT 0;

      -- La main : au plus cinq cartes, identifiées par leur carte du monde.
      CREATE TABLE company_hand (
        company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        card        TEXT NOT NULL,
        drawn_at    INTEGER NOT NULL,
        PRIMARY KEY (company_id, card)
      );

      -- Les vols. L'état se déduit des horodatages ; rien ne les fait avancer.
      CREATE TABLE flights (
        id           TEXT PRIMARY KEY,
        company_id   TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        card         TEXT NOT NULL,
        plane_id     TEXT NOT NULL,
        pilot_id     TEXT NOT NULL,
        destination  TEXT NOT NULL,
        departed_at  INTEGER NOT NULL,
        duration_ms  INTEGER NOT NULL,            -- aller simple ; retour de même durée
        deadline_at  INTEGER NOT NULL,            -- délai souple : bonus si arrivée avant
        reward       INTEGER NOT NULL,
        bonus        INTEGER NOT NULL,
        incident     INTEGER NOT NULL DEFAULT 0,  -- 1 si l'aléa du vol a frappé
        settled_at   INTEGER                      -- NULL tant que l'arrivée n'a pas été encaissée
      );
      CREATE INDEX flights_company ON flights(company_id, settled_at);

      -- Le livre de bord : chaque mouvement, en ajout seulement.
      CREATE TABLE ledger (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        at          INTEGER NOT NULL,
        kind        TEXT NOT NULL,                -- flight.departed, flight.arrived, card.played, purchase, ...
        francs      INTEGER NOT NULL DEFAULT 0,   -- signé
        ref         TEXT                          -- carte, destination, avion... un code, jamais du texte libre
      );
      CREATE INDEX ledger_company ON ledger(company_id, at);
    `,
  },
  {
    version: 5,
    name: 'noms-articles',
    sql: `
      -- Le générateur produisait « Compagnie des la Croisette » (vu en production le 11/10).
      UPDATE companies SET name = replace(name, 'des la Croisette', 'de la Croisette') WHERE name LIKE '%des la Croisette%';
    `,
  },
  {
    version: 6,
    name: 'courrier-arrive',
    sql: `
      -- Abonnements aux notifications : une adresse et deux clés fournies par le
      -- navigateur. Supprimés avec le joueur ; l'adresse est une donnée personnelle.
      CREATE TABLE push_subscriptions (
        id          TEXT PRIMARY KEY,
        player_id   TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        endpoint    TEXT NOT NULL UNIQUE,
        p256dh      TEXT NOT NULL,
        auth        TEXT NOT NULL,
        created_at  INTEGER NOT NULL,
        last_used_at INTEGER
      );
      CREATE INDEX push_subscriptions_player ON push_subscriptions(player_id);
      -- Un vol prévient une fois à l'arrivée, qu'il y ait ou non un abonné.
      ALTER TABLE flights ADD COLUMN notified_at INTEGER;
      CREATE INDEX flights_to_notify ON flights(notified_at) WHERE notified_at IS NULL;
    `,
  },
  {
    version: 7,
    name: 'cote-de-saline',
    sql: `
      -- Les routes ouvertes : une ligne par région au-delà de celle de départ.
      CREATE TABLE company_regions (
        company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        region      TEXT NOT NULL,
        opened_at   INTEGER NOT NULL,
        PRIMARY KEY (company_id, region)
      );
      INSERT INTO company_regions (company_id, region, opened_at) SELECT id, 'brume', founded_at FROM companies;
      -- Le ponton : une zone de plus, au niveau 1 (la rive nue) pour les compagnies existantes.
      INSERT OR IGNORE INTO company_zones (company_id, zone, level) SELECT id, 'ponton', 1 FROM companies;
    `,
  },
  {
    version: 8,
    name: 'cachets-lointains',
    sql: `
      -- Les premières livraisons lointaines devaient valoir 2 ou 3 cachets (MONDE.md) ;
      -- le code n'en donnait qu'un (vu le 11/10). On rend ce qui était dû, une fois.
      UPDATE companies SET stamps = stamps + (
        SELECT COALESCE(SUM(CASE stamp
          WHEN 's-haut-ferrand' THEN 1 WHEN 's-lanterne-du-val' THEN 1 WHEN 's-combe-aux-rosees' THEN 2
          WHEN 's-port-sel' THEN 1 WHEN 's-les-oeillets' THEN 1 WHEN 's-marais-blanc' THEN 1
          WHEN 's-anse-aux-goemons' THEN 2 WHEN 's-phare-de-brisant' THEN 2 WHEN 's-ile-sainte-ambre' THEN 2
          ELSE 0 END), 0)
        FROM company_stamps s WHERE s.company_id = companies.id
      );
    `,
  },
  {
    version: 9,
    name: 'inactivite',
    sql: `
      -- Suppression après 24 mois sans connexion, promise par la politique de
      -- confidentialité : deux avertissements (22 et 23 mois), puis l'effacement.
      -- 0 = rien envoyé, 1 = premier avertissement, 2 = second. Remis à zéro à la connexion.
      ALTER TABLE players ADD COLUMN inactivity_warned INTEGER NOT NULL DEFAULT 0;
      CREATE INDEX players_last_seen ON players(last_seen_at);
    `,
  },
  {
    version: 10,
    name: 'prosper',
    sql: `
      -- Marthe Vaudrin devient Prosper Chickenman (12/10) : les compagnies existantes
      -- gardent leur pilote, son affinité, son moral et les scènes déjà vues.
      UPDATE company_pilots SET pilot = 'prosper' WHERE pilot = 'marthe';
    `,
  },
  {
    version: 11,
    name: 'fatigue-en-minutes',
    sql: `
      -- La fatigue ne compte plus des crans mais des minutes de vol (12/10), et le
      -- repos va deux fois plus vite que le vol. Les anciennes valeurs n'ont plus le
      -- même sens : la poste offre une nuit de repos à tous les pilotes en service.
      UPDATE company_pilots SET fatigue = 0, fatigue_at = 0;
    `,
  },
  {
    version: 12,
    name: 'fret-lourd',
    sql: `
      -- Le fret lourd (12/10) : un courrier trop lourd pour un seul avion part en
      -- convoi. Deux lignes de vol, parties ensemble ; « convoy » désigne la tête.
      ALTER TABLE flights ADD COLUMN convoy TEXT;
    `,
  },
];
