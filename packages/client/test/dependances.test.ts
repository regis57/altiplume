import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Ce que le navigateur des joueurs reçoit est du code de production, même s'il n'entre
 * pas dans l'image tel quel : esbuild le met dans app.js, les polices partent dans dist.
 * Rangé en dépendance de développement, il échappait à `npm audit --omit=dev` et à la
 * liste stricte des licences (revue du 18/10).
 */
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function bareImports(): Set<string> {
  const found = new Set<string>();
  const dir = new URL('../src/', import.meta.url);
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.ts'))) {
    const text = readFileSync(new URL(name, dir), 'utf8');
    for (const m of text.matchAll(/(?:from|import)\s+'((?:@[^/'.]+\/)?[^/'.][^/']*)/g)) {
      if (!m[1]!.startsWith('node:')) found.add(m[1]!);
    }
  }
  // Les polices : build.mjs les copie depuis node_modules dans dist.
  const build = readFileSync(new URL('../build.mjs', import.meta.url), 'utf8');
  for (const m of build.matchAll(/'(@fontsource\/[^/']+)/g)) found.add(m[1]!);
  return found;
}

describe('les dépendances du client', () => {
  it('tout ce qui part chez le joueur est une dépendance de production', () => {
    const shipped = bareImports();
    expect([...shipped].sort()).toEqual(['@fontsource/atkinson-hyperlegible', '@fontsource/pixelify-sans', '@simplewebauthn/browser', 'qrcode']);
    for (const name of shipped) {
      expect(pkg.dependencies?.[name], `${name} doit être dans « dependencies »`).toBeDefined();
      expect(pkg.devDependencies?.[name], `${name} ne doit pas être dans « devDependencies »`).toBeUndefined();
    }
  });
});
