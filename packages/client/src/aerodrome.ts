/**
 * La page de l'aérodrome : fonder la compagnie, puis la regarder vivre.
 *
 * Tout l'état vient du serveur (`/v1/company`) ; le catalogue du monde vient de
 * `/v1/world` dans la langue courante. Cette page ne calcule rien de ce qui a une
 * valeur : elle affiche.
 */
import { formatDate, getLocale, t, translatePage } from './i18n.ts';

type Json = Record<string, unknown>;
interface ApiResult { readonly status: number; readonly body: Json }
type Api = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: Json) => Promise<ApiResult>;
type SetMessage = (id: string, keys: string | string[], kind?: 'ok' | 'error') => void;

interface WorldView {
  home: { name: string; address: string; description: string };
  destinations: { id: string; name: string }[];
  planes: { id: string; name: string; description: string; capacity: number; speed: number; range: number }[];
  traits: { id: string; name: string; description: string }[];
  pilots: { id: string; name: string; origin: string; traits: string[]; portrait: string; greeting: string; storyTitle: string; scenes: number; age: number }[];
  zones: { id: string; name: string; levels: { level: number; name: string; description: string; cost: number }[] }[];
  decorations: { id: string; name: string }[];
  stamps: { id: string; name: string; description: string }[];
}

interface CompanyView {
  name: string; francs: number; stamps: number; foundedAt: number;
  planes: { id: string; model: string; wear: number }[];
  pilots: { id: string; pilot: string; affinity: number; morale: number; fatigue: number; scenesSeen: number }[];
  zones: Record<string, number>;
  decorations: string[];
  album: { id: string; earnedAt: number }[];
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
  if (root) root.dataset['moment'] = momentOfDay(new Date().getHours());
  document.title = `${c.name} — Altiplume`;

  const name = $('t-compagnie'); if (name) name.textContent = c.name;
  const address = $('adresse'); if (address) address.textContent = world.home.address;
  const francs = $('francs'); if (francs) francs.textContent = String(c.francs);
  const cachets = $('cachets'); if (cachets) cachets.textContent = String(c.stamps);
  $('scene-lanterne')?.classList.toggle('cache', !c.decorations.includes('d-lanterne'));

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
      li.append(el('p', 'aide', `${m.capacity} ${t('game.bags')} · ${m.speed} ${t('game.speedUnit')} · ${m.range} ${t('game.rangeUnit')} · ${t('game.wear')} ${owned.wear}/100`));
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
      if (next) li.append(el('p', 'aide', `${t('game.next')} ${next.name} · ${next.cost} F`));
      zones.append(li);
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

async function openScene(api: Api, setMessage: SetMessage, pilot: string, index: number, pilotName: string): Promise<void> {
  const dialog = $('histoire') as HTMLDialogElement | null;
  if (!dialog) return;
  const r = await api('GET', `/v1/company/pilots/${encodeURIComponent(pilot)}/story/${index}`);
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
