/**
 * Un avion à vendre : ce qu'il faut pour l'acheter, et pour qu'il vole.
 *
 * Le 16 octobre, la carte du Héron proposait « Acheter · 5600 F » à une compagnie
 * qui avait 818 F, un hangar plein et un pré fauché : on ne découvrait le refus
 * qu'après avoir cliqué. La carte dit maintenant, avant le clic, comme les routes :
 * le prix et ce qu'on a en caisse, la place au hangar (ou au ponton), et la piste
 * qu'il faut pour décoller. Les deux premiers bloquent l'achat (le serveur les
 * refuse) ; la piste avertit seulement : acheter un avion avant d'avoir fini sa
 * piste est une décision légitime, tant qu'on la prend en connaissance de cause.
 */

const RUNWAY_ORDER: Readonly<Record<string, number>> = { clearing: 0, short: 1, medium: 2, long: 3, water: 4 };

export interface OfferWorld {
  readonly planes: readonly { readonly id: string; readonly runway: string }[];
  readonly zones: readonly { readonly id: string; readonly levels: readonly { readonly level: number; readonly name: string; readonly runway?: string; readonly planes?: number; readonly seaplanes?: number }[] }[];
}

export interface OfferCompany {
  readonly francs: number;
  readonly planes: readonly { readonly model: string }[];
  readonly zones: Readonly<Record<string, number>>;
}

export interface PlaneOffer {
  readonly seaplane: boolean;
  readonly money: boolean;
  /** Une place libre au hangar, ou au ponton pour un hydravion. */
  readonly place: boolean;
  /** La piste de l'aérodrome suffit pour décoller ; toujours vrai pour un hydravion. */
  readonly runway: boolean;
  /** Le nom du niveau de piste qu'il faut ; `null` pour un hydravion. */
  readonly runwayName: string | null;
  /** L'achat est possible : l'argent et la place (la piste n'avertit que). */
  readonly canBuy: boolean;
}

export function planeOffer(world: OfferWorld, c: OfferCompany, modelId: string, price: number): PlaneOffer {
  const model = world.planes.find((p) => p.id === modelId);
  const seaplane = model?.runway === 'water';
  const zone = (id: string) => world.zones.find((z) => z.id === id);
  const level = (id: string) => zone(id)?.levels.find((l) => l.level === (c.zones[id] ?? 1));
  const sameKind = c.planes.filter((p) => (world.planes.find((m) => m.id === p.model)?.runway === 'water') === seaplane).length;
  const capacity = seaplane ? level('ponton')?.seaplanes ?? 0 : level('hangar')?.planes ?? 1;
  const money = c.francs >= price;
  const place = sameKind < capacity;
  let runway = true;
  let runwayName: string | null = null;
  if (model && !seaplane) {
    const home = level('runway')?.runway ?? 'short';
    runway = (RUNWAY_ORDER[model.runway] ?? 9) <= (RUNWAY_ORDER[home] ?? 0);
    // Le premier niveau de piste qui suffit à ce modèle.
    runwayName = zone('runway')?.levels.find((l) => (RUNWAY_ORDER[l.runway ?? 'short'] ?? 0) >= (RUNWAY_ORDER[model.runway] ?? 9))?.name ?? null;
  }
  return { seaplane, money, place, runway, runwayName, canBuy: money && place };
}

/**
 * Ce que le serveur refuse faute de francs, dit avant le clic : la fête (« Y aller · 15 F »)
 * quand la caisse n'a pas son prix, un choix d'imprévu payant quand la caisse passerait
 * sous zéro (`playCard`). Un gain ou un choix gratuit reste toujours ouvert.
 */
export function canAfford(francs: number, delta: number | undefined): boolean {
  return delta === undefined || delta >= 0 || francs + delta >= 0;
}
