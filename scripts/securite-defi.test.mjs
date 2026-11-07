import { describe, expect, it } from 'vitest';
import { defiCloudflare } from './securite-defi.mjs';

const enTetes = (o) => ({ get: (k) => o[k.toLowerCase()] ?? null });

describe('defiCloudflare', () => {
  it("reconnaît un défi annoncé par Cloudflare", () => {
    expect(defiCloudflare(403, enTetes({ 'cf-mitigated': 'challenge', server: 'cloudflare' })))
      .toBe('défi de Cloudflare (HTTP 403, cf-mitigated : challenge)');
  });

  it("reconnaît un 403 de Cloudflare même sans l'en-tête de défi", () => {
    expect(defiCloudflare(403, enTetes({ server: 'cloudflare' }))).toBe('blocage de Cloudflare (HTTP 403)');
  });

  it("laisse passer une réponse du jeu, même derrière Cloudflare", () => {
    expect(defiCloudflare(200, enTetes({ server: 'cloudflare', 'content-security-policy': "default-src 'none'" }))).toBeNull();
    expect(defiCloudflare(404, enTetes({ server: 'cloudflare' }))).toBeNull();
    expect(defiCloudflare(403, enTetes({ server: 'nginx' }))).toBeNull();
  });
});
