import { describe, expect, it } from 'vitest';
import { migrate, openDatabase, transaction } from '../src/db/database.ts';
import { createPlayer, deletePlayer, findPlayerByEmail, findPlayerById, nicknameTaken } from '../src/db/repos/players.ts';
import { createSession, resolveSession, revokeAllSessions, revokeSession, SESSION_TTL_MS } from '../src/db/repos/sessions.ts';
import { consumeMagicLink, createMagicLink, MAGIC_LINK_TTL_MS } from '../src/db/repos/magicLinks.ts';
import { audit } from '../src/db/repos/audit.ts';
import { fingerprint, newToken } from '../src/auth/tokens.ts';

const T0 = Date.UTC(2026, 9, 11, 0, 0, 0);
const player = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', termsVersion: '2026-10-11' };

describe('base de données', () => {
  it('applique les migrations une seule fois', () => {
    const db = openDatabase({ path: ':memory:' });
    expect(migrate(db)).toBe(0);
  });

  it('annule une transaction qui lève', () => {
    const db = openDatabase({ path: ':memory:' });
    expect(() => transaction(db, () => {
      createPlayer(db, player, T0);
      throw new Error('boum');
    })).toThrow('boum');
    expect(findPlayerByEmail(db, player.email)).toBeNull();
  });
});

describe('joueurs', () => {
  it('crée et retrouve un joueur', () => {
    const db = openDatabase({ path: ':memory:' });
    const p = createPlayer(db, player, T0);
    expect(findPlayerById(db, p.id)?.nickname).toBe('Régis');
    expect(p.ageConfirmed).toBe(true);
    expect(p.termsVersion).toBe('2026-10-11');
  });

  it('refuse deux fois le même email, et les pseudonymes qui se ressemblent', () => {
    const db = openDatabase({ path: ':memory:' });
    createPlayer(db, player, T0);
    expect(() => createPlayer(db, { ...player, nickname: 'Autre' }, T0)).toThrow();
    // Anti-usurpation : casse, accents et chiffres-lettres ne distinguent pas deux noms.
    expect(nicknameTaken(db, 'RÉGIS')).toBe(true);
    expect(nicknameTaken(db, 'Regis')).toBe(true);
    expect(nicknameTaken(db, 'R3g1s')).toBe(true);
    expect(nicknameTaken(db, 'Régine')).toBe(false);
    // Le joueur peut garder son propre nom en changeant la casse.
    const p = findPlayerByEmail(db, player.email)!;
    expect(nicknameTaken(db, 'REGIS', p.id)).toBe(false);
  });

  it('supprime un joueur et ses sessions en cascade', () => {
    const db = openDatabase({ path: ':memory:' });
    const p = createPlayer(db, player, T0);
    const { token } = createSession(db, p.id, T0);
    expect(deletePlayer(db, p.id)).toBe(true);
    expect(resolveSession(db, token, T0 + 1)).toBeNull();
    expect(deletePlayer(db, p.id)).toBe(false);
  });
});

describe('sessions', () => {
  it('ne stocke que l\'empreinte du jeton', () => {
    const db = openDatabase({ path: ':memory:' });
    const p = createPlayer(db, player, T0);
    const { token, session } = createSession(db, p.id, T0);
    expect(session.id).toBe(fingerprint(token));
    expect(session.id).not.toContain(token);
  });

  it('résout un jeton valide, refuse un jeton inconnu ou mal formé', () => {
    const db = openDatabase({ path: ':memory:' });
    const p = createPlayer(db, player, T0);
    const { token } = createSession(db, p.id, T0);
    expect(resolveSession(db, token, T0 + 1)?.playerId).toBe(p.id);
    expect(resolveSession(db, newToken(), T0 + 1)).toBeNull();
    expect(resolveSession(db, 'court', T0 + 1)).toBeNull();
    expect(resolveSession(db, '', T0 + 1)).toBeNull();
  });

  it('expire, et se prolonge à l\'usage', () => {
    const db = openDatabase({ path: ':memory:' });
    const p = createPlayer(db, player, T0);
    const { token } = createSession(db, p.id, T0);
    expect(resolveSession(db, token, T0 + SESSION_TTL_MS)).toBeNull();
    const { token: t2 } = createSession(db, p.id, T0);
    resolveSession(db, t2, T0 + 20 * 24 * 3_600_000); // usage au jour 20 → prolongé
    expect(resolveSession(db, t2, T0 + 45 * 24 * 3_600_000)).not.toBeNull();
  });

  it('se révoque, une ou toutes', () => {
    const db = openDatabase({ path: ':memory:' });
    const p = createPlayer(db, player, T0);
    const a = createSession(db, p.id, T0).token;
    const b = createSession(db, p.id, T0).token;
    revokeSession(db, a);
    expect(resolveSession(db, a, T0 + 1)).toBeNull();
    expect(resolveSession(db, b, T0 + 1)).not.toBeNull();
    expect(revokeAllSessions(db, p.id)).toBe(1);
  });
});

describe('liens magiques', () => {
  it('se consomme une seule fois', () => {
    const db = openDatabase({ path: ':memory:' });
    const token = createMagicLink(db, player.email, 'login', null, T0);
    const first = consumeMagicLink(db, token, T0 + 1);
    expect(first.ok).toBe(true);
    const second = consumeMagicLink(db, token, T0 + 2);
    expect(second).toEqual({ ok: false, reason: 'used' });
  });

  it('expire au bout de dix minutes', () => {
    const db = openDatabase({ path: ':memory:' });
    const token = createMagicLink(db, player.email, 'login', null, T0);
    expect(consumeMagicLink(db, token, T0 + MAGIC_LINK_TTL_MS)).toEqual({ ok: false, reason: 'expired' });
  });

  it('un nouveau lien invalide le précédent', () => {
    const db = openDatabase({ path: ':memory:' });
    const old = createMagicLink(db, player.email, 'login', null, T0);
    createMagicLink(db, player.email, 'login', null, T0 + 1);
    expect(consumeMagicLink(db, old, T0 + 2)).toEqual({ ok: false, reason: 'used' });
  });

  it('transporte la charge d\'inscription', () => {
    const db = openDatabase({ path: ':memory:' });
    const payload = { nickname: 'Régis', locale: 'fr', termsVersion: '2026-10-11' };
    const token = createMagicLink(db, player.email, 'signup', payload, T0);
    const r = consumeMagicLink(db, token, T0 + 1);
    expect(r.ok && r.link.payload).toEqual(payload);
  });

  it('refuse un jeton inconnu sans révéler s\'il a existé', () => {
    const db = openDatabase({ path: ':memory:' });
    expect(consumeMagicLink(db, newToken(), T0)).toEqual({ ok: false, reason: 'unknown' });
  });
});

describe('audit', () => {
  it('écrit des événements sans donnée personnelle', () => {
    const db = openDatabase({ path: ':memory:' });
    audit(db, 'player.registered', 'abc', { locale: 'fr' }, T0);
    const row = db.prepare('SELECT * FROM audit').get() as { event: string; meta: string };
    expect(row.event).toBe('player.registered');
    expect(row.meta).not.toContain('@');
  });
});
