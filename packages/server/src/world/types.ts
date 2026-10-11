/**
 * Le monde d'Altiplume : types des données de contenu.
 *
 * Tout le contenu est écrit dans le dépôt, en deux langues NATIVES — jamais une
 * traduction mot à mot. Un nom de village anglais est un nom de village anglais,
 * pas « Mist Valley » calqué sur « Vallées de Brume ». Les effets de jeu sont des
 * nombres, pas des textes : le serveur simule avec les nombres, et affiche les
 * textes dans la langue du joueur.
 */
import type { Locale } from '../auth/validation.ts';

/** Un texte dans chaque langue du jeu. */
export type Text = Readonly<Record<Locale, string>>;

export type RegionId = 'brume';

export interface Region {
  readonly id: RegionId;
  readonly name: Text;
  readonly tagline: Text;
  readonly description: Text;
  /** Palette dominante, pour l'écran : fond du ciel et de la terre. */
  readonly palette: { readonly sky: string; readonly ground: string; readonly accent: string };
}

export type Runway = 'short' | 'medium' | 'long';
export type Hazard = 'fog' | 'wind' | 'night' | 'ridge' | 'none';

export interface Destination {
  readonly id: string;
  readonly region: RegionId;
  readonly name: Text;
  readonly description: Text;
  /** Distance depuis l'aérodrome du joueur, en lieues (unité du monde inventé). */
  readonly distance: number;
  readonly runway: Runway;
  readonly hazard: Hazard;
  /** Ce que ce village envoie et reçoit d'habitude. */
  readonly mail: readonly CargoKind[];
  /** Cachets gagnés à la première livraison. */
  readonly firstDeliveryStamps: number;
}

export type CargoKind = 'letters' | 'parcels' | 'urgent' | 'fragile' | 'seeds' | 'parts' | 'medicine' | 'loveletters' | 'newspapers';

export interface PlaneModel {
  readonly id: string;
  readonly archetype: 'biplane' | 'monoplane' | 'trimotor';
  readonly name: Text;
  readonly description: Text;
  /** Portée en lieues, aller simple. */
  readonly range: number;
  /** Capacité en sacs de courrier. */
  readonly capacity: number;
  /** Vitesse en lieues par heure. */
  readonly speed: number;
  /** Fiabilité dans [0, 1] : probabilité qu'un vol se passe sans incident mécanique. */
  readonly reliability: number;
  /** Piste minimale pour atterrir. */
  readonly runway: Runway;
  readonly price: number;
  /** Entretien par vol, en francs. */
  readonly upkeep: number;
  /** Disponible dès l'ouverture de l'aérodrome. */
  readonly starter: boolean;
}

export type TraitId = 'nightowl' | 'thrifty' | 'daredevil' | 'weathersense' | 'goldenhands' | 'longhaul' | 'homeheart' | 'luckycharm';

export interface Trait {
  readonly id: TraitId;
  readonly name: Text;
  readonly description: Text;
  /** Modificateurs multiplicatifs appliqués par la simulation ; 1 = neutre. */
  readonly effects: Readonly<Partial<Record<'speed' | 'fuel' | 'reliability' | 'wear' | 'range' | 'fatigue' | 'fogRisk' | 'nightRisk' | 'luck', number>>>;
}

export type Gender = 'f' | 'm';

export interface StoryScene {
  /** Affinité (nombre de vols ensemble) qui débloque la scène. */
  readonly affinity: number;
  readonly title: Text;
  /** Répliques : qui parle (`pilot`, `you` ou `narrator`) et quoi. */
  readonly lines: readonly { readonly who: 'pilot' | 'you' | 'narrator'; readonly text: Text }[];
}

export interface PilotTemplate {
  readonly id: string;
  readonly name: Text;
  readonly gender: Gender;
  readonly age: number;
  /** Région d'origine ; les Vallées de Brume ne sont pas la seule. */
  readonly origin: Text;
  readonly traits: readonly [TraitId, TraitId];
  readonly portrait: Text;
  /** Phrase qu'il ou elle dit au café, avant l'embauche. */
  readonly greeting: Text;
  /** Salaire par vol, en francs. */
  readonly wage: number;
  /** Disponible dès l'ouverture de l'aérodrome (sinon : au café, plus tard). */
  readonly starter: boolean;
  readonly story: { readonly title: Text; readonly scenes: readonly StoryScene[] };
}

export type CardKind = 'contract' | 'event' | 'opportunity';

export interface ContractCard {
  readonly kind: 'contract';
  readonly id: string;
  readonly title: Text;
  readonly text: Text;
  readonly destination: string;
  readonly cargo: CargoKind;
  /** Sacs à emporter. */
  readonly bags: number;
  readonly reward: number;
  /** Délai souple en heures ; tenu → bonus. Jamais de pénalité. */
  readonly softDeadlineHours: number;
  readonly bonus: number;
  /** Rareté : poids dans le tirage (1 = commun, 3 = rare). */
  readonly weight: 1 | 2 | 3;
  /** Ligne régulière : jamais tirée, toujours disponible, sans bonus. */
  readonly standing?: true;
}

export interface EventChoice {
  readonly id: string;
  readonly label: Text;
  readonly outcome: Text;
  /** Effets : francs (peut être négatif), heures de retard, usure de l'avion, moral. */
  readonly effects: Readonly<Partial<Record<'francs' | 'delayHours' | 'wear' | 'morale' | 'stamps', number>>>;
}

export interface EventCard {
  readonly kind: 'event';
  readonly id: string;
  readonly title: Text;
  readonly text: Text;
  readonly choices: readonly EventChoice[];
  readonly weight: 1 | 2 | 3;
}

export interface OpportunityCard {
  readonly kind: 'opportunity';
  readonly id: string;
  readonly title: Text;
  readonly text: Text;
  readonly offer:
    | { readonly type: 'plane'; readonly model: string; readonly price: number }
    | { readonly type: 'pilot'; readonly pilot: string }
    | { readonly type: 'fete'; readonly morale: number; readonly cost: number }
    | { readonly type: 'map'; readonly stamps: number };
  readonly weight: 1 | 2 | 3;
}

export type Card = ContractCard | EventCard | OpportunityCard;

export type ZoneId = 'runway' | 'hangar';

export interface ZoneLevel {
  readonly level: number;
  readonly name: Text;
  readonly description: Text;
  readonly cost: number;
  /** Ce que ce niveau permet. */
  readonly runway?: Runway;
  readonly planes?: number;
  readonly maintenance?: number;
}

export interface Zone {
  readonly id: ZoneId;
  readonly name: Text;
  readonly levels: readonly ZoneLevel[];
}

export interface Decoration {
  readonly id: string;
  readonly name: Text;
  readonly description: Text;
  readonly cost: number;
  /** Léger bonus de moral des pilotes, en points. */
  readonly morale: number;
}

/** Une « première » qui vaut un cachet dans l'album. */
export interface Stamp {
  readonly id: string;
  readonly name: Text;
  readonly description: Text;
}

export interface World {
  readonly region: Region;
  readonly home: { readonly name: Text; readonly address: Text; readonly description: Text };
  readonly destinations: readonly Destination[];
  readonly planes: readonly PlaneModel[];
  readonly traits: readonly Trait[];
  readonly pilots: readonly PilotTemplate[];
  readonly cards: readonly Card[];
  readonly zones: readonly Zone[];
  readonly decorations: readonly Decoration[];
  readonly stamps: readonly Stamp[];
  /** Ce avec quoi on commence. */
  readonly start: { readonly francs: number; readonly stamps: number; readonly planes: readonly string[]; readonly pilots: readonly string[] };
}
