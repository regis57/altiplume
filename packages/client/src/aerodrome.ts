/**
 * La page de l'aérodrome : fonder la compagnie, puis la regarder vivre.
 *
 * Tout l'état vient du serveur (`/v1/company`) ; le catalogue du monde vient de
 * `/v1/world` dans la langue courante. Cette page ne calcule rien de ce qui a une
 * valeur : elle affiche.
 */
import { formatDate, getLocale, placeAfter, t, translatePage } from './i18n.ts';
import { convoyState } from './convoi.ts';
import { formatRemaining } from './time.ts';
import { musicIsOn, resumeMusicOnGesture, toggleMusic } from './music.ts';
import { setupInstall, setupNotifications } from './notifications.ts';
import { setupPasskeyInvitation } from './passkeys.ts';

type Json = Record<string, unknown>;
interface ApiResult { readonly status: number; readonly body: Json }
type Api = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: Json) => Promise<ApiResult>;
type SetMessage = (id: string, keys: string | string[], kind?: 'ok' | 'error') => void;

interface WorldView {
  home: { name: string; address: string; description: string };
  regions: { id: string; name: string; tagline: string; description: string; route?: { requires: string; cost: number } }[];
  destinations: { id: string; region: string; name: string; distance: number; runway: string }[];
  planes: { id: string; name: string; description: string; capacity: number; speed: number; range: number; upkeep: number }[];
  seasons: { id: string; name: string; tagline: string; effects: { duration?: number; reward?: number } }[];
  cards: { kind: 'contract' | 'event' | 'opportunity'; id: string; title: string; text: string; standing?: true; heavy?: true; season?: string; destination?: string; bags?: number; reward?: number; softDeadlineHours?: number; bonus?: number; choices?: { id: string; label: string; outcome: string }[]; offer?: { type: string; price?: number; cost?: number } }[];
  traits: { id: string; name: string; description: string }[];
  pilots: { id: string; name: string; gender: 'f' | 'm'; origin: string; traits: string[]; portrait: string; greeting: string; storyTitle: string; scenes: number; age: number; wage: number }[];
  zones: { id: string; name: string; levels: { level: number; name: string; description: string; cost: number; maintenance?: number }[] }[];
  decorations: { id: string; name: string; description: string; cost: number; morale: number }[];
  stamps: { id: string; name: string; description: string }[];
}

interface Flight {
  id: string; card: string; destination: string; plane: string; pilot: string;
  departedAt: number; arrivesAt: number; busyUntil: number; deadlineAt: number; reward: number; bonus: number;
  status: 'en_route' | 'returning' | 'done'; progress: number; settled: boolean;
  /** Fret lourd : le second équipage du convoi. */
  wing?: { plane: string; pilot: string };
}
type News =
  | { kind: 'cards.drawn'; count: number }
  | { kind: 'flight.arrived'; destination: string; pilot: string; plane: string; francs: number; bonus: boolean; incident: boolean; wing?: { pilot: string; plane: string } }
  | { kind: 'stamp'; stamp: string };

interface CompanyView {
  name: string; francs: number; stamps: number; foundedAt: number; now: number;
  planes: { id: string; model: string; wear: number; busyUntil: number | null }[];
  pilots: { id: string; pilot: string; affinity: number; morale: number; fatigue: number; scenesSeen: number; restedAt: number | null; busyUntil: number | null }[];
  zones: Record<string, number>;
  regions: string[];
  season: { id: string; endsAt: number };
  decorations: string[];
  album: { id: string; earnedAt: number }[];
  hand: { card: string; drawnAt: number }[];
  pendingEvent: string | null;
  flights: Flight[];
  logbook: { at: number; kind: string; francs: number; ref: string | null }[];
  news: News[];
}

/** Décalage entre l'horloge du serveur et la nôtre, pour les comptes à rebours. */
let clockOffset = 0;

/**
 * Le minutage des vols.
 *
 * Les comptes à rebours battent **à la seconde, sans réseau** : seules la largeur
 * de la jauge et la ligne de texte sont retouchées. On ne redemande l'état au
 * serveur que lorsqu'il a quelque chose de neuf à dire — un vol qui se pose, un
 * avion qui rentre — ou en revenant sur l'onglet. Avant, la page ne bougeait
 * qu'une fois toutes les trente secondes : les minutes semblaient fausses parce
 * qu'elles étaient simplement figées.
 */
interface Minute { readonly flight: Flight; readonly fill: HTMLElement; readonly bar: HTMLElement; readonly status: HTMLElement }
let minutes: Minute[] = [];
let ticker: ReturnType<typeof setInterval> | null = null;
let resync: (() => void) | null = null;
let lastResync = 0;
/** Garde-fou : deux resynchronisations ne se suivent jamais de moins de cinq secondes. */
const RESYNC_GUARD_MS = 5_000;
/** Filet de sécurité : même sans jalon franchi, on revérifie toutes les deux minutes. */
const RESYNC_IDLE_MS = 120_000;

function paintMinute(m: Minute, now: number): void {
  const total = m.flight.busyUntil - m.flight.departedAt;
  const pct = Math.round(Math.min(1, Math.max(0, (now - m.flight.departedAt) / total)) * 100);
  m.fill.style.width = `${pct}%`;
  m.bar.setAttribute('aria-valuenow', String(pct));
  const landed = now >= m.flight.arrivesAt;
  m.status.textContent = landed
    ? `${t('flight.returning')} · ${t('flight.back')} ${formatRemaining(m.flight.busyUntil - now, getLocale())}`
    : `${t('flight.enRoute')} · ${t('flight.arrival')} ${formatRemaining(m.flight.arrivesAt - now, getLocale())} · ${t('flight.back')} ${formatRemaining(m.flight.busyUntil - now, getLocale())}`;
}

function tick(): void {
  if (minutes.length === 0) return;
  const now = Date.now() + clockOffset;
  for (const m of minutes) paintMinute(m, now);
  // Un jalon franchi (atterrissage ou retour) : le serveur a du neuf — nouvelles, francs, cachets.
  const milestone = minutes.some((m) => (now >= m.flight.arrivesAt && !m.flight.settled) || now >= m.flight.busyUntil);
  const idle = now - lastResync > RESYNC_IDLE_MS;
  if ((milestone || idle) && now - lastResync > RESYNC_GUARD_MS && resync) {
    lastResync = now;
    resync();
  }
}

/** Revenir sur l'onglet après une mise en veille : les minuteurs ont été gelés, on resynchronise. */
function watchVisibility(): void {
  if (document.body.dataset['visibilite']) return;
  document.body.dataset['visibilite'] = '1';
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    tick();
    const now = Date.now() + clockOffset;
    if (minutes.length > 0 && now - lastResync > RESYNC_GUARD_MS && resync) { lastResync = now; resync(); }
  });
}

const SCENE_AFFINITY = [3, 7, 12];

function $(id: string): HTMLElement | null { return document.getElementById(id); }

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Le moment de la journée, pour la couleur du ciel : celui de la personne, pas du serveur. */
export function momentOfDay(hour: number): 'aube' | 'jour' | 'crepuscule' | 'nuit' {
  if (hour >= 6 && hour < 8) return 'aube';
  if (hour >= 8 && hour < 19) return 'jour';
  if (hour >= 19 && hour < 21) return 'crepuscule';
  return 'nuit';
}

export async function pageAerodrome(api: Api, setMessage: SetMessage): Promise<void> {
  const me = await api('GET', '/v1/account');
  if (me.status !== 200) { location.replace('/connexion'); return; }
  document.querySelectorAll('[data-when=anonymous]').forEach((e) => e.classList.add('cache'));
  document.querySelectorAll('[data-when=player]').forEach((e) => e.classList.remove('cache'));

  const worldRes = await api('GET', `/v1/world?locale=${getLocale()}`);
  if (worldRes.status !== 200) { setMessage('jeu-message', 'error.server_error'); return; }
  const world = worldRes.body as unknown as WorldView;

  const company = await api('GET', '/v1/company');
  if (company.status === 404) { await founding(api, setMessage, world); return; }
  if (company.status !== 200) { setMessage('jeu-message', 'error.server_error'); return; }
  render(api, setMessage, world, company.body as unknown as CompanyView);
}

// ---- Fondation ----

async function founding(api: Api, setMessage: SetMessage, world: WorldView): Promise<void> {
  const section = $('fondation');
  const form = $('fonder') as HTMLFormElement | null;
  const box = $('choix-noms');
  if (!section || !form || !box) return;
  section.classList.remove('cache');
  let draw = 0;
  let chosen = '';

  async function loadNames(): Promise<void> {
    const r = await api('GET', `/v1/company/names?locale=${getLocale()}&draw=${draw}`);
    const names = (r.body['names'] as string[] | undefined) ?? [];
    box!.replaceChildren();
    names.forEach((name, i) => {
      const label = el('label', 'choix-nom');
      const input = el('input');
      input.type = 'radio'; input.name = 'suggestion'; input.value = name; input.id = `nom-${i}`;
      input.addEventListener('change', () => { chosen = name; const perso = $('nom-perso') as HTMLInputElement | null; if (perso) perso.value = ''; });
      label.append(input, el('span', undefined, name));
      box!.append(label);
    });
    chosen = '';
  }
  await loadNames();

  document.querySelector('[data-action=autres-noms]')?.addEventListener('click', async () => {
    draw = (draw + 1) % 10;
    await loadNames();
  });
  ($('nom-perso') as HTMLInputElement | null)?.addEventListener('input', () => {
    box.querySelectorAll<HTMLInputElement>('input[type=radio]').forEach((r) => { r.checked = false; });
    chosen = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const perso = (($('nom-perso') as HTMLInputElement | null)?.value ?? '').trim();
    const name = perso || chosen;
    const err = $('nom-perso-erreur');
    if (err) err.textContent = '';
    if (!name) { if (err) { err.dataset['i18n'] = 'error.company_name_missing'; err.textContent = t('error.company_name_missing'); } return; }
    const button = form.querySelector('button[type=submit]') as HTMLButtonElement | null;
    if (button) button.disabled = true;
    try {
      const r = await api('POST', '/v1/company', { name });
      if (r.status === 201) {
        section.classList.add('cache');
        setMessage('jeu-message', 'found.done', 'ok');
        render(api, setMessage, world, r.body as unknown as CompanyView);
        return;
      }
      if (err) { err.dataset['i18n'] = 'error.company_name_invalid'; err.textContent = t('error.company_name_invalid'); }
    } catch {
      setMessage('jeu-message', 'error.network');
    } finally {
      if (button) button.disabled = false;
    }
  });
}

// ---- L'aérodrome ----

function render(api: Api, setMessage: SetMessage, world: WorldView, c: CompanyView): void {
  const section = $('aerodrome');
  if (!section) return;
  section.classList.remove('cache');
  const root = $('jeu');
  if (root) { root.dataset['moment'] = momentOfDay(new Date().getHours()); root.dataset['saison'] = c.season.id; }
  document.documentElement.dataset['titleFr'] = c.name;
  document.documentElement.dataset['titleEn'] = c.name;
  document.title = `${c.name} — Altiplume`;

  const name = $('t-compagnie'); if (name) name.textContent = c.name;
  const address = $('adresse'); if (address) address.textContent = world.home.address;
  // La saison du calendrier : son nom, jusqu'à quand, et ce qu'elle change.
  const season = world.seasons.find((x) => x.id === c.season.id);
  const saison = $('saison');
  if (saison && season) {
    saison.textContent = `${season.name} · ${t('season.until')} ${formatDate(c.season.endsAt - 86_400_000)} — ${season.tagline}`;
  }
  const francs = $('francs'); if (francs) francs.textContent = String(c.francs);
  const cachets = $('cachets'); if (cachets) cachets.textContent = String(c.stamps);
  renderScene(c);
  animateScene(c);
  musicButton();
  setupInstall();
  // Le premier vol : trois gestes, tant qu'aucun sac n'est revenu.
  $('fiche-premier-vol')?.classList.toggle('cache', c.logbook.some((l) => l.kind === 'flight.arrived'));
  void setupPasskeyInvitation(api, setMessage);
  void setupNotifications(api, setMessage);
  clockOffset = c.now - Date.now();

  renderNews(world, c);
  renderFlights(api, setMessage, world, c);
  renderHand(api, setMessage, world, c);
  renderLogbook(world, c);
  // Les vols avancent sans nous : l'horloge locale bat à la seconde, et ne redemande
  // l'état au serveur qu'à un atterrissage, un retour, ou en revenant sur l'onglet.
  resync = () => { void refresh(api, setMessage, world); };
  watchVisibility();
  if (ticker === null) ticker = setInterval(tick, 1_000);

  // Pilotes
  const pilots = $('pilotes');
  if (pilots) {
    pilots.replaceChildren();
    for (const hired of c.pilots) {
      const p = world.pilots.find((x) => x.id === hired.pilot);
      if (!p) continue;
      const li = el('li', 'fiche-pilote');
      li.append(el('h3', undefined, p.name));
      const meta = el('p', 'aide');
      meta.append(`${p.age} ${t('game.years')} · ${p.origin}`);
      li.append(meta);
      const traits = el('p', 'traits');
      for (const id of p.traits) {
        const tr = world.traits.find((x) => x.id === id);
        if (!tr) continue;
        const tag = el('span', 'trait', tr.name);
        tag.title = tr.description;
        traits.append(tag);
      }
      li.append(traits);
      li.append(el('p', 'portrait', p.portrait));
      const aff = el('p', 'aide');
      aff.append(`${hired.affinity} ${t(hired.affinity === 1 ? 'game.flightTogether' : 'game.flightsTogether')} · ${t('game.morale')} ${hired.morale}/20`);
      li.append(aff);
      // Histoire : une entrée par scène ; verrouillée tant que l'affinité n'y est pas.
      const story = el('div', 'actions');
      SCENE_AFFINITY.slice(0, p.scenes).forEach((needed, i) => {
        const b = el('button', 'bouton secondaire');
        b.type = 'button';
        const unlocked = hired.affinity >= needed;
        b.textContent = unlocked ? `${p.storyTitle} · ${i + 1}` : `${t('story.locked')} ${needed}`;
        b.disabled = !unlocked;
        b.addEventListener('click', () => void openScene(api, setMessage, p.id, i, p.name));
        story.append(b);
      });
      li.append(story);
      pilots.append(li);
    }
  }

  // Hangar
  const planes = $('avions');
  if (planes) {
    planes.replaceChildren();
    for (const owned of c.planes) {
      const m = world.planes.find((x) => x.id === owned.model);
      if (!m) continue;
      const li = el('li');
      li.append(el('h3', undefined, m.name));
      li.append(el('p', undefined, m.description));
      li.append(el('p', 'aide', `${m.capacity} ${t(m.capacity === 1 ? 'game.bag' : 'game.bags')} · ${m.speed} ${t('game.speedUnit')} · ${m.range} ${t('game.rangeUnit')} · ${t('game.wear')} ${owned.wear}/100`));
      planes.append(li);
    }
  }

  // Zones
  const zones = $('zones');
  if (zones) {
    zones.replaceChildren();
    for (const z of world.zones) {
      const level = c.zones[z.id] ?? 1;
      const current = z.levels.find((l) => l.level === level);
      const next = z.levels.find((l) => l.level === level + 1);
      const li = el('li');
      li.append(el('h3', undefined, `${z.name} — ${current?.name ?? ''}`));
      if (current) li.append(el('p', undefined, current.description));
      if (next) {
        li.append(el('p', 'aide', `${t('game.next')} ${next.name} — ${next.description}`));
        const b = el('button', 'bouton'); b.type = 'button';
        b.textContent = `${t('game.restore')} · ${next.cost} F`;
        b.disabled = c.francs < next.cost;
        if (b.disabled) b.title = t('error.not_enough_francs');
        b.addEventListener('click', () => void build(api, setMessage, world, `/v1/company/zones/${z.id}/upgrade`, b, 'game.restored'));
        const actions = el('div', 'actions'); actions.append(b); li.append(actions);
      } else {
        li.append(el('p', 'aide', t('game.zoneMax')));
      }
      zones.append(li);
    }
  }

  // Les routes : la région de départ, puis celles qui s'ouvrent contre des cachets.
  const routes = $('routes');
  if (routes) {
    routes.replaceChildren();
    for (const r of world.regions) {
      const stops = world.destinations.filter((d) => d.region === r.id);
      const water = stops.filter((d) => d.runway === 'water').length;
      const clearings = stops.filter((d) => d.runway === 'clearing').length;
      const open = c.regions.includes(r.id);
      const li = el('li', open ? 'route ouverte' : 'route');
      // La vignette de la région, dessinée par scripts/scene-build.mjs.
      const tpl = document.getElementById(`vignette-${r.id}`) as HTMLTemplateElement | null;
      if (tpl) li.append(tpl.content.cloneNode(true));
      li.append(el('h3', undefined, r.name));
      li.append(el('p', 'tagline', r.tagline));
      li.append(el('p', undefined, r.description));
      li.append(el('p', 'aide', `${stops.length} ${t('game.stops')}${water ? ` · ${water} ${t('game.onWater')}` : ''}${clearings ? ` · ${clearings} ${t('game.inClearing')}` : ''}`));
      if (!r.route) {
        li.append(el('p', 'aide', t('game.routeHome')));
      } else if (open) {
        li.append(el('p', 'aide', t('game.routeOpen')));
      } else {
        const hasPage = c.album.some((a) => a.id === r.route!.requires);
        const b = el('button', 'bouton'); b.type = 'button';
        b.textContent = `${t('game.openRoute')} · ${r.route.cost} ${t('game.stamps').toLowerCase()}`;
        b.disabled = !hasPage || c.stamps < r.route.cost;
        if (!hasPage) {
          b.title = t('error.route_requires');
          li.append(el('p', 'aide', `${t('game.routeNeeds')} « ${stampName(world, r.route.requires)} »`));
        } else if (c.stamps < r.route.cost) {
          b.title = t('error.not_enough_stamps');
        }
        b.addEventListener('click', () => void build(api, setMessage, world, `/v1/company/regions/${r.id}/open`, b, 'game.routeOpened'));
        const actions = el('div', 'actions'); actions.append(b); li.append(actions);
      }
      routes.append(li);
    }
  }

  // Décorations
  const decos = $('decorations');
  if (decos) {
    decos.replaceChildren();
    for (const d of world.decorations) {
      const li = el('li');
      li.append(el('h3', undefined, d.name));
      li.append(el('p', undefined, d.description));
      if (c.decorations.includes(d.id)) {
        li.classList.add('posee');
        li.append(el('p', 'aide', t('game.placed')));
      } else {
        li.append(el('p', 'aide', `${d.cost} F · ${t('game.morale')} +${d.morale}`));
        const b = el('button', 'bouton secondaire'); b.type = 'button';
        b.textContent = `${t('game.place')} · ${d.cost} F`;
        b.disabled = c.francs < d.cost;
        if (b.disabled) b.title = t('error.not_enough_francs');
        b.addEventListener('click', () => void build(api, setMessage, world, `/v1/company/decorations/${d.id}`, b, 'game.decorated'));
        const actions = el('div', 'actions'); actions.append(b); li.append(actions);
      }
      decos.append(li);
    }
  }

  // Album
  const album = $('album');
  if (album) {
    album.replaceChildren();
    for (const s of world.stamps) {
      const earned = c.album.find((x) => x.id === s.id);
      const li = el('li', earned ? 'page gagnee' : 'page');
      li.append(el('strong', undefined, s.name));
      li.append(el('span', 'aide', earned ? formatDate(earned.earnedAt, 'short') : s.description));
      if (earned) li.setAttribute('aria-label', `${s.name}, ${formatDate(earned.earnedAt, 'long')}`);
      album.append(li);
    }
  }
  translatePage();
}


async function refresh(api: Api, setMessage: SetMessage, world: WorldView): Promise<void> {
  const r = await api('GET', '/v1/company').catch(() => null);
  if (r && r.status === 200) render(api, setMessage, world, r.body as unknown as CompanyView);
}

function destName(world: WorldView, id: string): string { return world.destinations.find((d) => d.id === id)?.name ?? id; }
function pilotName(world: WorldView, c: CompanyView, hiredId: string): string {
  const hired = c.pilots.find((p) => p.id === hiredId);
  return world.pilots.find((p) => p.id === hired?.pilot)?.name ?? '';
}
function pilotTemplateName(world: WorldView, id: string): string { return world.pilots.find((p) => p.id === id)?.name ?? id; }
function planeName(world: WorldView, c: CompanyView, ownedId: string): string {
  const owned = c.planes.find((p) => p.id === ownedId);
  return world.planes.find((p) => p.id === owned?.model)?.name ?? '';
}
function stampName(world: WorldView, id: string): string { return world.stamps.find((s) => s.id === id)?.name ?? id; }

/** Les nouvelles depuis la dernière visite : ce qu'on trouve en revenant. */
function renderNews(world: WorldView, c: CompanyView): void {
  const box = $('nouvelles');
  if (!box) return;
  box.replaceChildren();
  for (const n of c.news) {
    const li = el('li', 'nouvelle');
    if (n.kind === 'cards.drawn') li.textContent = `${t('news.cards')} ${n.count}`;
    else if (n.kind === 'flight.arrived') {
      // L'accord suit le genre : « est rentré », « est rentrée » ; pour un convoi, « sont rentrés »,
      // ou « sont rentrées » si ce sont deux pilotes femmes.
      const tpl = world.pilots.find((x) => x.id === n.pilot);
      const wingTpl = n.wing ? world.pilots.find((x) => x.id === n.wing!.pilot) : undefined;
      const arrived = n.wing
        ? t(tpl?.gender === 'f' && wingTpl?.gender === 'f' ? 'news.arrivedPlF' : 'news.arrivedPl')
        : t(tpl?.gender === 'f' ? 'news.arrivedF' : 'news.arrived');
      const who = n.wing ? `${pilotTemplateName(world, n.pilot)} ${t('game.and')} ${pilotTemplateName(world, n.wing.pilot)}` : pilotTemplateName(world, n.pilot);
      li.textContent = `${who} ${placeAfter(arrived, destName(world, n.destination))} · +${n.francs} F` +
        (n.bonus ? ` · ${t('news.onTime')}` : '') + (n.incident ? ` · ${t('news.incident')}` : '');
      li.classList.add('bonne');
    } else { li.textContent = `${t('news.stamp')} ${stampName(world, n.stamp)}`; li.classList.add('cachet-nouveau'); }
    box.append(li);
  }
}

function renderFlights(api: Api, setMessage: SetMessage, world: WorldView, c: CompanyView): void {
  const list = $('vols');
  if (!list) return;
  list.replaceChildren();
  const active = c.flights.filter((f) => f.status !== 'done');
  $('vols-vide')?.classList.toggle('cache', active.length > 0);
  const now = Date.now() + clockOffset;
  minutes = [];
  for (const f of active) {
    const li = el('li', 'vol');
    const card = world.cards.find((x) => x.id === f.card);
    li.append(el('h3', undefined, `${card?.title ?? ''} → ${destName(world, f.destination)}`));
    li.append(el('p', 'aide', f.wing
      ? `${t('flight.convoy')} · ${pilotName(world, c, f.pilot)} ${t('game.and')} ${pilotName(world, c, f.wing.pilot)} · ${planeName(world, c, f.plane)} ${t('game.and')} ${planeName(world, c, f.wing.plane)}`
      : `${pilotName(world, c, f.pilot)} · ${planeName(world, c, f.plane)}`));
    const bar = el('div', 'jauge');
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100');
    const fill = el('div', 'jauge-remplie');
    bar.append(fill);
    li.append(bar);
    const status = el('p', 'aide');
    li.append(status);
    const m: Minute = { flight: f, fill, bar, status };
    paintMinute(m, now);
    minutes.push(m);
    list.append(li);
  }
}

function renderHand(api: Api, setMessage: SetMessage, world: WorldView, c: CompanyView): void {
  const list = $('main');
  if (!list) return;
  list.replaceChildren();
  $('main-vide')?.classList.toggle('cache', c.hand.length > 0);
  // La main, puis la ligne régulière — toujours là, jamais défaussée.
  const shown = [...c.hand.map((h) => h.card), ...world.cards.filter((x) => x.standing).map((x) => x.id)];
  for (const id of shown) {
    const card = world.cards.find((x) => x.id === id);
    if (!card) continue;
    const li = el('li', `carte ${card.kind}${card.standing ? ' reguliere' : ''}${card.heavy ? ' lourd' : ''}`);
    const seasonName = card.season ? world.seasons.find((x) => x.id === card.season)?.name.toLowerCase() : undefined;
    li.append(el('p', 'carte-genre', card.standing ? t('card.standing') : card.heavy ? t('card.heavy') : `${t(`card.${card.kind}`)}${seasonName ? ` · ${seasonName}` : ''}`));
    li.append(el('h3', undefined, card.title));
    li.append(el('p', undefined, card.text));
    const actions = el('div', 'actions');
    if (card.kind === 'contract') {
      // « 1 sac », pas « 1 sacs » ; et pas de « +0 F » : la ligne régulière n'a pas de prime.
      const bags = `${card.bags} ${t(card.bags === 1 ? 'game.bag' : 'game.bags')}`;
      const bonus = card.bonus ? ` · +${card.bonus} F ${t('card.ifWithin')} ${card.softDeadlineHours} h` : '';
      const advance = card.standing ? ` · ${t('card.advanced')}` : '';
      // L'hiver, la prime de froid s'ajoute au tarif : on affiche ce qui sera payé.
      const rewardFactor = world.seasons.find((x) => x.id === c.season.id)?.effects.reward ?? 1;
      const tariff = Math.round((card.reward ?? 0) * rewardFactor);
      const cold = rewardFactor > 1 ? ` (${t('card.coldBonus')})` : '';
      li.append(el('p', 'aide', `${destName(world, card.destination ?? '')} · ${bags} · ${tariff} F${cold}${bonus}${advance}`));
      const send = el('button', 'bouton'); send.type = 'button'; send.textContent = t('card.dispatch');
      if (c.pendingEvent) {
        // Une vache sur la piste : on tranche l'imprévu d'abord.
        send.disabled = true;
        send.title = t('card.runwayBlocked');
        li.append(el('p', 'aide bloque', t('card.runwayBlocked')));
      }
      send.addEventListener('click', () => dispatchForm(api, setMessage, world, c, card.id, li));
      actions.append(send);
    } else if (card.kind === 'event') {
      for (const choice of card.choices ?? []) {
        const b = el('button', 'bouton secondaire'); b.type = 'button'; b.textContent = choice.label;
        b.addEventListener('click', async () => {
          actions.querySelectorAll('button').forEach((x) => { x.disabled = true; });
          const r = await api('POST', `/v1/company/cards/${card.id}/play`, { choice: choice.id }).catch(() => null);
          if (r && r.status === 200) {
            const msg = $('jeu-message'); if (msg) { delete msg.dataset['i18nKeys']; msg.textContent = choice.outcome; msg.classList.add('ok'); }
            render(api, setMessage, world, r.body as unknown as CompanyView);
          } else { setMessage('jeu-message', r ? `error.${String(r.body['error'] ?? 'server_error')}` : 'error.network'); actions.querySelectorAll('button').forEach((x) => { x.disabled = false; }); }
        });
        actions.append(b);
      }
    } else {
      const take = el('button', 'bouton'); take.type = 'button'; take.textContent = t('card.take');
      const price = card.offer?.price ?? card.offer?.cost;
      if (price) take.textContent += ` · ${price} F`;
      take.addEventListener('click', async () => {
        take.disabled = true;
        const r = await api('POST', `/v1/company/cards/${card.id}/play`, {}).catch(() => null);
        if (r && r.status === 200) { setMessage('jeu-message', 'card.taken', 'ok'); render(api, setMessage, world, r.body as unknown as CompanyView); }
        else { setMessage('jeu-message', r ? `error.${String(r.body['error'] ?? 'server_error')}` : 'error.network'); take.disabled = false; }
      });
      actions.append(take);
    }
    if (!card.standing && card.kind !== 'event') {
      const discard = el('button', 'bouton secondaire'); discard.type = 'button'; discard.textContent = t('card.discard');
      discard.addEventListener('click', async () => {
        discard.disabled = true;
        const r = await api('DELETE', `/v1/company/cards/${card.id}`, {}).catch(() => null);
        if (r && r.status === 204) void refresh(api, setMessage, world); else discard.disabled = false;
      });
      actions.append(discard);
    }
    li.append(actions);
    list.append(li);
  }
}

/**
 * Le petit formulaire d'expédition, dans la carte : avion, pilote, estimation, envoi.
 *
 * Fret lourd : quand l'avion choisi ne porte pas tous les sacs, un second équipage
 * apparaît — un avion d'escorte et son pilote — et l'estimation devient celle du
 * convoi : le plus lent des deux, les deux salaires, les deux entretiens. Tant
 * qu'aucun avion n'est choisi, ou qu'il n'y a pas de quoi former un second
 * équipage, on ne montre rien du convoi : voir convoi.ts.
 */
function dispatchForm(api: Api, setMessage: SetMessage, world: WorldView, c: CompanyView, cardId: string, host: HTMLElement): void {
  host.querySelector('.expedition')?.remove();
  const card = world.cards.find((x) => x.id === cardId);
  const dest = world.destinations.find((d) => d.id === card?.destination);
  if (!card || !dest) return;
  const bags = card.bags ?? 1;
  const form = el('form', 'expedition');
  form.noValidate = true;
  const modelOf = (planeId: string) => world.planes.find((x) => x.id === c.planes.find((p) => p.id === planeId)?.model);

  const planeOptions = (select: HTMLSelectElement, exclude?: string) => {
    const keep = select.value;
    select.replaceChildren();
    for (const p of c.planes) {
      if (p.id === exclude) continue;
      const m = world.planes.find((x) => x.id === p.model);
      const o = el('option', undefined, `${m?.name ?? p.model} · ${m?.capacity ?? 0} ${t((m?.capacity ?? 0) === 1 ? 'game.bag' : 'game.bags')}${p.busyUntil ? ` — ${t('card.busy')}` : ''}`);
      o.value = p.id; o.disabled = p.busyUntil !== null;
      select.append(o);
    }
    if ([...select.options].some((o) => o.value === keep && !o.disabled)) select.value = keep;
    else select.value = [...select.options].find((o) => !o.disabled)?.value ?? '';
  };
  const pilotOptions = (select: HTMLSelectElement, exclude?: string) => {
    const keep = select.value;
    select.replaceChildren();
    for (const p of c.pilots) {
      if (p.id === exclude) continue;
      const tpl = world.pilots.find((x) => x.id === p.pilot);
      // Fatigué : l'accord suit le genre du pilote, et on dit dans combien de temps il repart.
      const tired = p.restedAt !== null;
      const rest = tired
        ? ` — ${t(tpl?.gender === 'f' ? 'card.tiredF' : 'card.tired')} · ${t('card.restedIn')} ${formatRemaining((p.restedAt ?? 0) - Date.now(), getLocale())}`
        : '';
      const o = el('option', undefined, `${tpl?.name ?? p.pilot}${p.busyUntil ? ` — ${t('card.busy')}` : rest}`);
      o.value = p.id; o.disabled = p.busyUntil !== null || tired;
      select.append(o);
    }
    if ([...select.options].some((o) => o.value === keep && !o.disabled)) select.value = keep;
    else select.value = [...select.options].find((o) => !o.disabled)?.value ?? '';
  };
  const field = (label: string, id: string, select: HTMLSelectElement) => {
    const f = el('div', 'champ');
    const l = el('label', undefined, label); l.htmlFor = id; select.id = id;
    f.append(l, select);
    return f;
  };

  const planeSelect = el('select'); planeSelect.name = 'plane';
  const pilotSelect = el('select'); pilotSelect.name = 'pilot';
  planeOptions(planeSelect); pilotOptions(pilotSelect);
  // Le convoi : caché tant qu'un seul avion suffit, et tant qu'aucun avion n'est choisi.
  const convoy = el('fieldset', 'convoi cache');
  const legend = el('legend', undefined, t('card.convoy'));
  const wingPlane = el('select'); wingPlane.name = 'wingPlane';
  const wingPilot = el('select'); wingPilot.name = 'wingPilot';
  convoy.append(legend, field(t('card.wingPlane'), `escorte-${cardId}`, wingPlane), field(t('card.wingPilot'), `second-${cardId}`, wingPilot));
  const estimate = el('p', 'aide');
  const actions = el('div', 'actions');
  const go = el('button', 'bouton'); go.type = 'submit'; go.textContent = t('card.send');
  const cancel = el('button', 'bouton secondaire'); cancel.type = 'button'; cancel.textContent = t('card.cancel');
  cancel.addEventListener('click', () => form.remove());
  actions.append(go, cancel);

  /** Ce que vaut la flotte à cet instant : au sol, libre, et pour les pilotes, reposée. */
  const state = () => convoyState({
    capacity: planeSelect.value ? modelOf(planeSelect.value)?.capacity ?? null : null,
    bags,
    freePlanes: c.planes.filter((p) => p.busyUntil === null).length,
    freePilots: c.pilots.filter((p) => p.busyUntil === null && p.restedAt === null).length,
  });
  const needsWing = () => state() === 'ask';
  const crewCost = (planeId: string, pilotId: string) => {
    const m = modelOf(planeId);
    const tpl = world.pilots.find((x) => x.id === c.pilots.find((p) => p.id === pilotId)?.pilot);
    if (!m || !tpl) return null;
    // Le même calcul que le serveur : un hangar équipé divise l'entretien.
    const hangar = world.zones.find((z) => z.id === 'hangar')?.levels.find((l) => l.level === (c.zones['hangar'] ?? 1));
    // L'hiver rallonge les vols : le même facteur que le serveur.
    const slower = world.seasons.find((x) => x.id === c.season.id)?.effects.duration ?? 1;
    return { minutes: Math.round((dest.distance / m.speed) * 60 * slower), cost: Math.round(tpl.wage + m.upkeep / (hangar?.maintenance ?? 1)), capacity: m.capacity };
  };
  const update = () => {
    const wing = needsWing();
    convoy.classList.toggle('cache', !wing);
    if (wing) { planeOptions(wingPlane, planeSelect.value); pilotOptions(wingPilot, pilotSelect.value); }
    // Rien ne peut partir : on le dit, et on ferme le bouton plutôt que de laisser
    // le joueur buter sur une erreur du serveur.
    const nothing = !planeSelect.value ? 'card.noPlane' : !pilotSelect.value ? 'card.noPilot' : state() === 'impossible' ? 'card.convoyNone' : null;
    go.disabled = nothing !== null;
    if (nothing) { estimate.textContent = t(nothing); return; }
    const lead = crewCost(planeSelect.value, pilotSelect.value);
    const second = wing ? crewCost(wingPlane.value, wingPilot.value) : null;
    if (!lead || (wing && !second)) { estimate.textContent = wing ? t('card.convoyNone') : ''; return; }
    const minutes = Math.max(lead.minutes, second?.minutes ?? 0);
    const cost = lead.cost + (second?.cost ?? 0);
    // La ligne régulière : rien à payer maintenant, le tarif moins l'avance à l'arrivée.
    const money = card.standing
      ? `${t('card.postAdvances')} · ${t('card.net')} ≈ +${Math.max(0, Math.round((card.reward ?? 0) * (world.seasons.find((x) => x.id === c.season.id)?.effects.reward ?? 1)) - cost)} F`
      : `${t('card.cost')} ≈ ${cost} F`;
    const carried = lead.capacity + (second?.capacity ?? 0);
    const short = carried < bags ? ` · ${t('card.convoyShort').replace('{a}', String(carried)).replace('{b}', String(bags))}` : '';
    estimate.textContent = `${wing ? `${t('flight.convoy')} · ` : ''}≈ ${formatRemaining(minutes * 60_000, getLocale())} ${t('card.oneWay')} · ${money}${short}`;
  };
  for (const s of [planeSelect, pilotSelect, wingPlane, wingPilot]) s.addEventListener('change', update);

  form.append(field(t('card.plane'), `avion-${cardId}`, planeSelect), field(t('card.pilot'), `pilote-${cardId}`, pilotSelect), convoy, estimate, actions);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    go.disabled = true;
    const body: Record<string, string> = { card: cardId, plane: planeSelect.value, pilot: pilotSelect.value };
    if (needsWing()) { body['wingPlane'] = wingPlane.value; body['wingPilot'] = wingPilot.value; }
    const r = await api('POST', '/v1/company/flights', body).catch(() => null);
    if (r && r.status === 201) { setMessage('jeu-message', 'card.sent', 'ok'); render(api, setMessage, world, r.body as unknown as CompanyView); }
    else { setMessage('jeu-message', r ? `error.${String(r.body['error'] ?? 'server_error')}` : 'error.network'); go.disabled = false; }
  });
  host.append(form);
  update();
  planeSelect.focus();
}

function renderLogbook(world: WorldView, c: CompanyView): void {
  const list = $('bord');
  if (!list) return;
  list.replaceChildren();
  for (const e of c.logbook) {
    const li = el('li');
    const when = el('span', 'aide', formatDate(e.at, 'short') + ' ' + new Date(e.at).toLocaleTimeString(getLocale() === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' }));
    let what: string;
    if (e.kind === 'flight.departed') what = placeAfter(t('log.departed'), destName(world, e.ref ?? ''));
    else if (e.kind === 'flight.arrived') what = placeAfter(t('log.arrived'), destName(world, e.ref ?? ''));
    else if (e.kind === 'purchase.plane') what = `${t('log.bought')} ${world.planes.find((p) => p.id === e.ref)?.name ?? ''}`;
    else if (e.kind === 'hire.pilot') what = `${t('log.hired')} ${pilotTemplateName(world, e.ref ?? '')}`;
    else if (e.kind === 'route.opened') what = `${t('log.route')} ${world.regions.find((r) => r.id === e.ref)?.name ?? ''}`;
    else if (e.kind === 'build.zone') what = `${t('log.built')} ${world.zones.find((z) => z.id === (e.ref ?? '').split(':')[0])?.name ?? ''}`;
    else if (e.kind === 'build.decoration') what = `${t('log.decorated')} ${world.decorations.find((d) => d.id === e.ref)?.name ?? ''}`;
    else what = `${t('log.card')} ${world.cards.find((x) => x.id === (e.ref ?? '').split(':')[0])?.title ?? ''}`;
    const amount = el('span', e.francs >= 0 ? 'montant plus' : 'montant moins', e.francs === 0 ? '' : `${e.francs > 0 ? '+' : ''}${e.francs} F`);
    li.append(when, ' · ', what, ' ', amount);
    list.append(li);
  }
}

/** Un achat de construction : même chemin pour une zone et une décoration. */
async function build(api: Api, setMessage: SetMessage, world: WorldView, path: string, button: HTMLButtonElement, doneKey: string): Promise<void> {
  button.disabled = true;
  const r = await api('POST', path, {}).catch(() => null);
  if (r && r.status === 200) { setMessage('jeu-message', doneKey, 'ok'); render(api, setMessage, world, r.body as unknown as CompanyView); }
  else { setMessage('jeu-message', r ? `error.${String(r.body['error'] ?? 'server_error')}` : 'error.network'); button.disabled = false; }
}

/** La scène reflète ce qu'on a construit et posé. */
function renderScene(c: CompanyView): void {
  const has = (id: string) => c.decorations.includes(id);
  const show = (id: string, on: boolean) => $(id)?.classList.toggle('cache', !on);
  show('scene-lanterne', has('d-lanterne'));
  show('scene-fleurs', has('d-fleurs'));
  show('scene-banc', has('d-banc'));
  show('scene-pommier', has('d-pommier'));
  show('scene-drapeau', has('d-drapeau'));
  show('scene-boite', has('d-boite'));
  show('scene-cafe', has('d-cafe'));
  show('scene-enseigne', has('d-enseigne'));
  show('scene-manche-raie', has('d-manche'));
  const sign = $('scene-enseigne-texte'); if (sign) sign.textContent = c.name;
  $('scene-hangar')?.classList.toggle('peint', has('d-peinture'));
  const runway = c.zones['runway'] ?? 1;
  const piste = $('scene-piste'); if (piste) piste.dataset['niveau'] = String(runway);
  show('scene-piste-longue', runway >= 3);
  const hangar = $('scene-hangar'); if (hangar) hangar.dataset['niveau'] = String(c.zones['hangar'] ?? 1);
  // Le ponton sur la rivière, et le second au niveau 3.
  show('scene-ponton', (c.zones['ponton'] ?? 1) >= 2);
  show('scene-ponton-2', (c.zones['ponton'] ?? 1) >= 3);
  // La tour grandit comme le hangar.
  const tour = $('scene-tour'); if (tour) tour.dataset['niveau'] = String(c.zones['tour'] ?? 1);
  show('scene-pigeonnier', has('d-pigeonnier'));
  show('scene-ruches', has('d-ruches'));
  // Chaque avion au repos a sa place, et son dessin : la Grive en biplan, le Héron en
  // trimoteur, le Pic avec ses pneus ballons ; les hydravions au ponton. Un avion en vol
  // laisse sa place vide.
  const home = c.planes.filter((p) => p.busyUntil === null);
  const water = ['sterne', 'goeland'];
  const fill = (ids: string[], planes: typeof home) => ids.forEach((id, i) => {
    const slot = $(id);
    if (!slot) return;
    const plane = planes[i];
    if (plane) slot.dataset['modele'] = plane.model; else delete slot.dataset['modele'];
  });
  fill(['place-a', 'place-b', 'place-c'], home.filter((p) => !water.includes(p.model)));
  fill(['place-eau-1', 'place-eau-2'], home.filter((p) => water.includes(p.model)));
}

let animation: number | null = null;

/** L'avion traverse la scène pendant le vol : à l'aller vers la droite, au retour vers la gauche. */
function animateScene(c: CompanyView): void {
  if (animation !== null) { cancelAnimationFrame(animation); animation = null; }
  const sprite = $('scene-avion-vol');
  if (!sprite) return;
  const flight = c.flights.find((f) => f.status !== 'done');
  // Le soleil (ou la lune) suit l'heure : à gauche le matin, à droite le soir.
  const astre = document.querySelector<SVGGElement>('.scene .astre');
  if (astre) {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    const day = h >= 6 && h < 21;
    const a = day ? (h - 6) / 15 : ((h + 3) % 24) / 9; // la nuit : de 21 h à 6 h
    astre.setAttribute('transform', `translate(${Math.round(-200 + a * 260)} ${Math.round(Math.sin(a * Math.PI) * -16)})`);
  }
  if (!flight) { sprite.classList.add('cache'); return; }
  sprite.classList.remove('cache');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const place = () => {
    const now = Date.now() + clockOffset;
    const p = Math.min(1, Math.max(0, (now - flight.departedAt) / (flight.busyUntil - flight.departedAt)));
    const out = p < 0.5;
    const leg = out ? p / 0.5 : (p - 0.5) / 0.5;
    // Le biplan fait 29 pixels de large ; au retour, on le retourne autour de son bord droit.
    const x = out ? 40 + leg * 232 : 272 - leg * 232;
    const y = 60 - Math.sin(leg * Math.PI) * 28;
    sprite.setAttribute('transform', out ? `translate(${x.toFixed(1)} ${y.toFixed(1)})` : `translate(${(x + 29).toFixed(1)} ${y.toFixed(1)}) scale(-1 1)`);
    if (!reduced && p < 1) animation = requestAnimationFrame(place);
  };
  place();
}

function musicButton(): void {
  const b = document.querySelector<HTMLButtonElement>('[data-action=toggle-music]');
  if (!b || b.dataset['ready']) return;
  b.dataset['ready'] = '1';
  const paint = () => {
    const on = musicIsOn();
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.dataset['i18n'] = on ? 'music.off' : 'music.on';
    b.textContent = t(on ? 'music.off' : 'music.on');
  };
  b.addEventListener('click', async () => { b.disabled = true; await toggleMusic(); paint(); b.disabled = false; });
  resumeMusicOnGesture(paint);
  paint();
}

async function openScene(api: Api, setMessage: SetMessage, pilot: string, index: number, pilotName: string): Promise<void> {
  const dialog = $('histoire') as HTMLDialogElement | null;
  if (!dialog) return;
  const r = await api('GET', `/v1/company/pilots/${encodeURIComponent(pilot)}/story/${index}?locale=${getLocale()}`);
  if (r.status !== 200) { setMessage('jeu-message', r.status === 403 ? 'story.locked' : 'error.server_error'); return; }
  const scene = r.body as unknown as { title: string; storyTitle: string; lines: { who: 'pilot' | 'you' | 'narrator'; text: string }[] };
  const serie = $('histoire-serie'); if (serie) serie.textContent = `${scene.storyTitle} · ${index + 1}`;
  const title = $('histoire-titre'); if (title) title.textContent = scene.title;
  const lines = $('histoire-lignes');
  if (lines) {
    lines.replaceChildren();
    for (const l of scene.lines) {
      const p = el('p', `replique ${l.who}`);
      if (l.who !== 'narrator') p.append(el('span', 'qui', l.who === 'pilot' ? pilotName : t('story.you')));
      p.append(el('span', undefined, l.text));
      lines.append(p);
    }
  }
  dialog.showModal();
  // Une nouvelle scène peut avoir collé un cachet : on rafraîchit l'album à la fermeture.
  dialog.addEventListener('close', () => { void pageAerodrome(api, setMessage); }, { once: true });
}
