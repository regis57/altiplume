/**
 * Les musiques d'Altiplume — une par saison, dans le même esprit 8 bits.
 *
 * Pas de fichier audio : chaque thème est écrit en notes et joué par le
 * navigateur (Web Audio), façon puce 2A03 — deux carrés, un triangle. Le thème
 * joué est celui de la saison en cours (règle du 14/10) : la valse de printemps
 * (le thème d'origine, voir `tools/music/compose_theme.py`), la ritournelle d'été,
 * la berceuse d'automne, le chant d'hiver. Chacun boucle sur seize mesures, ne
 * démarre que sur un geste de la personne, et reste coupé par défaut.
 */

export type SeasonId = 'printemps' | 'ete' | 'automne' | 'hiver';

/** Une partition : la mesure, le tempo, seize mesures d'accords, et la mélodie. */
export interface Score {
  readonly bpm: number;
  /** Temps par mesure : 3 pour une valse, 4 pour une marche. */
  readonly beats: number;
  /** Seize mesures : une basse et deux notes d'accord chacune. */
  readonly chords: readonly [string, readonly [string, string]][];
  /** La mélodie : une note (ou un silence) et sa durée en temps ; la somme fait seize mesures. */
  readonly lead: readonly [string | null, number][];
}

export const BARS = 16;

/** La fréquence d'une note écrite « Fs5 », « Bb3 »… ; A4 = 440 Hz. */
const SEMITONE: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
export function freq(name: string): number {
  const m = /^([A-G])(s|b)?(\d)$/.exec(name);
  if (!m) throw new RangeError(`note inconnue : ${name}`);
  const semis = (SEMITONE[m[1] as string] as number) + (m[2] === 's' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (semis / 12);
}

/** Printemps — valse lumineuse, 3/4, 96 BPM, ré majeur : le thème d'origine. */
const PRINTEMPS: Score = {
  bpm: 96, beats: 3,
  chords: [
    ['D3', ['Fs4', 'A4']], ['D3', ['Fs4', 'A4']], ['B3', ['D4', 'Fs4']], ['B3', ['D4', 'Fs4']],
    ['G3', ['B4', 'D5']], ['A3', ['Cs5', 'E5']], ['D3', ['Fs4', 'A4']], ['A3', ['Cs5', 'E5']],
    ['G3', ['B4', 'D5']], ['G3', ['B4', 'D5']], ['F3', ['A4', 'Cs5']], ['B3', ['D4', 'Fs4']],
    ['E3', ['Gs4', 'B4']], ['A3', ['Cs5', 'E5']], ['D3', ['Fs4', 'A4']], ['D3', ['Fs4', 'A4']],
  ],
  lead: [
    ['Fs5', 2], ['G5', 1], ['A5', 2], ['Fs5', 1], ['D5', 3], ['E5', 2], ['Fs5', 1],
    ['G5', 2], ['A5', 1], ['B5', 3], ['A5', 2], ['Fs5', 1], ['E5', 3],
    ['D6', 2], ['Cs6', 1], ['B5', 2], ['A5', 1], ['G5', 3], ['Fs5', 2], ['G5', 1],
    ['A5', 2], ['B5', 1], ['Cs6', 3], ['D6', 2], ['A5', 1], ['Fs5', 2], [null, 1],
  ],
};

/** Été — ritournelle de plein jour, 4/4, 112 BPM, sol majeur : les jours longs. */
const ETE: Score = {
  bpm: 112, beats: 4,
  chords: [
    ['G3', ['B4', 'D5']], ['G3', ['B4', 'D5']], ['C4', ['E4', 'G4']], ['D3', ['Fs4', 'A4']],
    ['G3', ['B4', 'D5']], ['E3', ['G4', 'B4']], ['C4', ['E4', 'G4']], ['D3', ['Fs4', 'A4']],
    ['G3', ['B4', 'D5']], ['G3', ['B4', 'D5']], ['C4', ['E4', 'G4']], ['D3', ['Fs4', 'A4']],
    ['E3', ['G4', 'B4']], ['C4', ['E4', 'G4']], ['D3', ['Fs4', 'A4']], ['G3', ['B4', 'D5']],
  ],
  lead: [
    ['B4', 1], ['D5', 1], ['G5', 2], ['A5', 1], ['G5', 1], ['D5', 2], ['E5', 1], ['D5', 1], ['B4', 2], ['A4', 1], ['B4', 1], ['D5', 2],
    ['G5', 1], ['A5', 1], ['B5', 2], ['A5', 1], ['G5', 1], ['E5', 2], ['D5', 1], ['E5', 1], ['G5', 2], ['A5', 2], ['B5', 2],
    ['D6', 2], ['B5', 1], ['G5', 1], ['A5', 2], ['Fs5', 1], ['D5', 1], ['E5', 2], ['G5', 1], ['E5', 1], ['D5', 2], ['B4', 2],
    ['C5', 1], ['D5', 1], ['E5', 2], ['G5', 1], ['A5', 1], ['B5', 2], ['A5', 1], ['G5', 1], ['D5', 2], ['G5', 3], [null, 1],
  ],
};

/** Automne — berceuse des feuilles, 3/4, 84 BPM, la mineur : la brume revient. */
const AUTOMNE: Score = {
  bpm: 84, beats: 3,
  chords: [
    ['A3', ['C4', 'E4']], ['A3', ['C4', 'E4']], ['F3', ['A4', 'C5']], ['G3', ['B4', 'D5']],
    ['A3', ['C4', 'E4']], ['E3', ['G4', 'B4']], ['F3', ['A4', 'C5']], ['G3', ['B4', 'D5']],
    ['D3', ['F4', 'A4']], ['A3', ['C4', 'E4']], ['F3', ['A4', 'C5']], ['G3', ['B4', 'D5']],
    ['E3', ['G4', 'B4']], ['A3', ['C4', 'E4']], ['E3', ['G4', 'B4']], ['A3', ['C4', 'E4']],
  ],
  lead: [
    ['E5', 2], ['D5', 1], ['C5', 2], ['B4', 1], ['A4', 3], ['C5', 2], ['B4', 1],
    ['A4', 2], ['B4', 1], ['C5', 3], ['D5', 2], ['E5', 1], ['D5', 3],
    ['C5', 2], ['B4', 1], ['A4', 2], ['G4', 1], ['E4', 3], ['G4', 2], ['A4', 1],
    ['B4', 2], ['C5', 1], ['D5', 3], ['C5', 2], ['B4', 1], ['A4', 2], [null, 1],
  ],
};

/** Hiver — chant de la neige, 4/4, 72 BPM, mi mineur : des notes longues, de l'air entre elles. */
const HIVER: Score = {
  bpm: 72, beats: 4,
  chords: [
    ['E3', ['G4', 'B4']], ['E3', ['G4', 'B4']], ['C3', ['E4', 'G4']], ['G3', ['B4', 'D5']],
    ['D3', ['Fs4', 'A4']], ['E3', ['G4', 'B4']], ['C3', ['E4', 'G4']], ['B3', ['Ds5', 'Fs5']],
    ['E3', ['G4', 'B4']], ['G3', ['B4', 'D5']], ['C3', ['E4', 'G4']], ['D3', ['Fs4', 'A4']],
    ['A3', ['C5', 'E5']], ['E3', ['G4', 'B4']], ['B3', ['Ds5', 'Fs5']], ['E3', ['G4', 'B4']],
  ],
  lead: [
    ['B4', 3], ['E5', 1], ['G5', 4], ['Fs5', 2], ['E5', 2], ['D5', 4],
    ['E5', 2], ['G5', 2], ['B5', 4], ['A5', 2], ['G5', 2], ['Fs5', 4],
    ['G5', 3], ['Fs5', 1], ['E5', 4], ['D5', 2], ['B4', 2], ['C5', 4],
    ['D5', 2], ['E5', 2], ['Fs5', 4], ['G5', 2], ['E5', 2], ['B4', 3], [null, 1],
  ],
};

export const SCORES: Readonly<Record<SeasonId, Score>> = { printemps: PRINTEMPS, ete: ETE, automne: AUTOMNE, hiver: HIVER };

/** La durée d'une boucle, en secondes. */
export function loopSeconds(score: Score): number { return BARS * score.beats * (60 / score.bpm); }

type Timbre = 'square' | 'pulse25' | 'triangle';

class Theme {
  private readonly ctx: AudioContext;
  private readonly master: GainNode;
  private readonly echo: DelayNode;
  private readonly pulse25: PeriodicWave;
  private readonly beat: number;
  private readonly bar: number;
  private readonly loop: number;
  private readonly score: Score;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextLoopAt = 0;

  constructor(score: Score) {
    this.score = score;
    this.beat = 60 / score.bpm;
    this.bar = score.beats * this.beat;
    this.loop = loopSeconds(score);
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    // Écho une croche plus tard, deux renvois : l'air et l'altitude.
    this.echo = this.ctx.createDelay(1);
    this.echo.delayTime.value = this.beat * 0.5;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3;
    this.echo.connect(feedback);
    feedback.connect(this.echo);
    this.echo.connect(this.master);
    // Onde carrée à 25 % : série de Fourier d'une impulsion.
    const harmonics = 32;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    for (let n = 1; n < harmonics; n += 1) {
      real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
      imag[n] = (2 / (n * Math.PI)) * (1 - Math.cos(n * Math.PI * 0.25));
    }
    this.pulse25 = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  private note(at: number, dur: number, hz: number, timbre: Timbre, vol: number, toEcho = false, vibrato = false): void {
    const osc = this.ctx.createOscillator();
    if (timbre === 'pulse25') osc.setPeriodicWave(this.pulse25); else osc.type = timbre;
    osc.frequency.value = hz;
    if (vibrato) {
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 5;
      const depth = this.ctx.createGain();
      depth.gain.value = 5; // cents
      lfo.connect(depth);
      depth.connect(osc.detune);
      lfo.start(at); lfo.stop(at + dur + 0.05);
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(vol, at + 0.004);
    gain.gain.setValueAtTime(vol, Math.max(at + 0.004, at + dur - 0.05));
    gain.gain.linearRampToValueAtTime(0, at + dur);
    osc.connect(gain);
    gain.connect(toEcho ? this.echo : this.master);
    if (toEcho) gain.connect(this.master);
    osc.start(at);
    osc.stop(at + dur + 0.01);
  }

  /** Une boucle complète, à partir de l'instant audio `t0`. */
  private scheduleLoop(t0: number): void {
    const { beat } = this;
    this.score.chords.forEach(([bass, chord], b) => {
      const start = t0 + b * this.bar;
      this.note(start, beat * 0.8, freq(bass), 'triangle', 0.2);
      chord.forEach((n, k) => this.note(start + (1 + k) * beat, beat * 0.45, freq(n), 'pulse25', 0.055));
      // L'arpège, à la croche, sur toute la mesure.
      const seq = [chord[0], chord[1], chord[0]];
      for (let step = 0; step < this.score.beats * 2; step += 1) {
        this.note(start + step * beat / 2, beat * 0.22, freq(seq[step % 3] as string) * 2, 'square', 0.022);
      }
    });
    let t = t0;
    for (const [n, beats] of this.score.lead) {
      const dur = beats * beat;
      if (n) {
        this.note(t, dur * 0.92, freq(n), 'square', 0.17, true, true);
        this.note(t, dur * 0.92, freq(n) * 2, 'pulse25', 0.035, true, true);
      }
      t += dur;
    }
  }

  async start(): Promise<void> {
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.nextLoopAt = this.ctx.currentTime + 0.1;
    const tick = () => {
      // On garde toujours une boucle d'avance, planifiée un peu avant la fin de la précédente.
      while (this.nextLoopAt < this.ctx.currentTime + this.loop) {
        this.scheduleLoop(this.nextLoopAt);
        this.nextLoopAt += this.loop;
      }
      this.timer = setTimeout(tick, (this.loop / 2) * 1000);
    };
    tick();
  }

  async stop(): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    await new Promise((r) => setTimeout(r, 350));
    await this.ctx.close();
  }
}

let playing: Theme | null = null;
let season: SeasonId = 'printemps';
const PREF_KEY = 'altiplume.musique';

/** La saison du jour, donnée par l'aérodrome : c'est elle qui choisit le thème. */
export function setMusicSeason(id: string): void {
  if (id in SCORES) season = id as SeasonId;
}

export function musicIsOn(): boolean { return playing !== null; }

export async function toggleMusic(): Promise<boolean> {
  if (playing) {
    const p = playing; playing = null;
    await p.stop();
    try { localStorage.setItem(PREF_KEY, 'off'); } catch { /* sans importance */ }
    return false;
  }
  if (typeof AudioContext === 'undefined') return false;
  playing = new Theme(SCORES[season]);
  await playing.start();
  try { localStorage.setItem(PREF_KEY, 'on'); } catch { /* sans importance */ }
  return true;
}

/** La personne avait laissé la musique : on la relance à son premier geste, pas avant. */
export function resumeMusicOnGesture(onStarted: () => void): void {
  let pref: string | null = null;
  try { pref = localStorage.getItem(PREF_KEY); } catch { /* rien */ }
  if (pref !== 'on' || typeof AudioContext === 'undefined') return;
  const once = async () => {
    document.removeEventListener('pointerdown', once);
    document.removeEventListener('keydown', once);
    if (!playing) { await toggleMusic(); onStarted(); }
  };
  document.addEventListener('pointerdown', once, { once: true });
  document.addEventListener('keydown', once, { once: true });
}
