import { beforeAll, describe, expect, it } from 'vitest';

// i18n.ts lit la langue au chargement : un navigateur minimal suffit.
let placeAfter: (phrase: string, name: string) => string;
let setLocale: (l: 'fr' | 'en') => void;
beforeAll(async () => {
  const g = globalThis as Record<string, unknown>;
  g['location'] = { search: '', href: 'https://altiplume.test/' };
  g['localStorage'] = { getItem: () => 'fr', setItem: () => undefined };
  ({ placeAfter, setLocale } = await import('../src/i18n.ts'));
});

describe('les noms de lieux après une préposition', () => {
  it('contracte comme on parle', () => {
    setLocale('fr');
    expect(placeAfter('est rentré de', 'Les Tilleuls')).toBe('est rentré des Tilleuls');
    expect(placeAfter('sont rentrées de', 'Le Hêtre-Roi')).toBe('sont rentrées du Hêtre-Roi');
    expect(placeAfter('Arrivée à', 'Les Œillets')).toBe('Arrivée aux Œillets');
    expect(placeAfter('Arrivée à', 'Le Rocher-Noir')).toBe('Arrivée au Rocher-Noir');
    expect(placeAfter('Départ pour', 'Les Scieries')).toBe('Départ pour les Scieries');
    // Sans article, rien ne bouge — même quand le nom commence comme un article.
    expect(placeAfter('est rentré de', 'Pont-de-Brume')).toBe('est rentré de Pont-de-Brume');
    expect(placeAfter('Arrivée à', 'Lanterne-du-Val')).toBe('Arrivée à Lanterne-du-Val');
    // L'article qu'on dit sans l'écrire.
    expect(placeAfter('est rentrée de', 'Île-du-Bout')).toBe("est rentrée de l'Île-du-Bout");
    expect(placeAfter('Arrivée à', 'Anse-des-Lanternes')).toBe("Arrivée à l'Anse-des-Lanternes");
    expect(placeAfter('est rentré de', 'Phare de Brisant')).toBe('est rentré du Phare de Brisant');
    expect(placeAfter('Arrivée à', 'Port-Sel')).toBe('Arrivée à Port-Sel');
  });

  it("ne touche à rien en anglais", () => {
    setLocale('en');
    expect(placeAfter('is back from', 'Charwood')).toBe('is back from Charwood');
    setLocale('fr');
  });
});
