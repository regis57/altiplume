import { describe, expect, it } from 'vitest';
import { foundingRefusal } from '../src/fondation.ts';

describe('fonder : chaque refus dit le sien', () => {
  it('« nom invalide » seulement quand le nom est en cause', () => {
    expect(foundingRefusal({ status: 400, body: { error: 'invalid', fields: ['company_name_invalid'] } })).toEqual({ kind: 'field', key: 'error.company_name_invalid' });
  });

  it('déjà fondée ailleurs : on affiche la compagnie, on ne redemande pas un nom', () => {
    expect(foundingRefusal({ status: 409, body: { error: 'company_exists' } })).toEqual({ kind: 'exists' });
  });

  it('dix essais en un quart d\'heure, une panne, pas de réseau : le vrai motif', () => {
    expect(foundingRefusal({ status: 429, body: { error: 'Too Many Requests' } })).toEqual({ kind: 'message', key: 'error.too_many_requests' });
    expect(foundingRefusal({ status: 500, body: {} })).toEqual({ kind: 'message', key: 'error.server_error' });
    expect(foundingRefusal(null)).toEqual({ kind: 'message', key: 'error.network' });
  });
});
