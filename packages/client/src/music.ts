/**
 * Le thème d'Altiplume — valse lumineuse 8 bits, 3/4, 96 BPM, ré majeur.
 *
 * Pas de fichier audio : la musique est écrite en notes et jouée par le
 * navigateur (Web Audio), façon puce 2A03 — deux carrés, un triangle. Même
 * partition que `tools/music/compose_theme.py`, qui l'a composée. Elle boucle
 * sur seize mesures, ne démarre que sur un geste de la personne, et reste coupée
 * par défaut.
 */

const BPM = 96;
const BEAT = 60 / BPM;
const BAR = 3 * BEAT;
const BARS = 16;
export const LOOP_S = BARS * BAR;

const N: Record<string, number> = {
  E3: -17, F3: -15, G3: -14, A3: -12, B3: -10, D3: -19,
  Cs4: -8, D4: -7, E4: -5, Fs4: -3, G4: -2, Gs4: -1, A4: 0, B4: 2,
  Cs5: 4, D5: 5, E5: 7, Fs5: 9, G5: 10, A5: 12, B5: 14, Cs6: 16, D6: 17,
};
const freq = (n: string): number => 440 * 2 ** ((N[n] ?? 0) / 12);

const CHORDS: readonly [string, readonly [string, string]][] = [
  ['D3', ['Fs4', 'A4']], ['D3', ['Fs4', 'A4']], ['B3', ['D4', 'Fs4']], ['B3', ['D4', 'Fs4']],
  ['G3', ['B4', 'D5']], ['A3', ['Cs5', 'E5']], ['D3', ['Fs4', 'A4']], ['A3', ['Cs5', 'E5']],
  ['G3', ['B4', 'D5']], ['G3', ['B4', 'D5']], ['F3', ['A4', 'Cs5']], ['B3', ['D4', 'Fs4']],
  ['E3', ['Gs4', 'B4']], ['A3', ['Cs5', 'E5']], ['D3', ['Fs4', 'A4']], ['D3', ['Fs4', 'A4']],
];

const LEAD: readonly [string | null, number][] = [
  ['Fs5', 2], ['G5', 1], ['A5', 2], ['Fs5', 1], ['D5', 3], ['E5', 2], ['Fs5', 1],
  ['G5', 2], ['A5', 1], ['B5', 3], ['A5', 2], ['Fs5', 1], ['E5', 3],
  ['D6', 2], ['Cs6', 1], ['B5', 2], ['A5', 1], ['G5', 3], ['Fs5', 2], ['G5', 1],
  ['A5', 2], ['B5', 1], ['Cs6', 3], ['D6', 2], ['A5', 1], ['Fs5', 2], [null, 1],
];

type Timbre = 'square' | 'pulse25' | 'triangle';

class Theme {
  private readonly ctx: AudioContext;
  private readonly master: GainNode;
  private readonly echo: DelayNode;
  private readonly pulse25: PeriodicWave;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextLoopAt = 0;

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    // Écho une croche plus tard, deux renvois : l'air et l'altitude.
    this.echo = this.ctx.createDelay(1);
    this.echo.delayTime.value = BEAT * 0.5;
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
    CHORDS.forEach(([bass, chord], b) => {
      const start = t0 + b * BAR;
      this.note(start, BEAT * 0.8, freq(bass), 'triangle', 0.2);
      chord.forEach((n, k) => this.note(start + (1 + k) * BEAT, BEAT * 0.45, freq(n), 'pulse25', 0.055));
      const seq = [chord[0], chord[1], chord[0]];
      for (let step = 0; step < 6; step += 1) {
        this.note(start + step * BEAT / 2, BEAT * 0.22, freq(seq[step % 3] as string) * 2, 'square', 0.022);
      }
    });
    let t = t0;
    for (const [n, beats] of LEAD) {
      const dur = beats * BEAT;
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
      while (this.nextLoopAt < this.ctx.currentTime + LOOP_S) {
        this.scheduleLoop(this.nextLoopAt);
        this.nextLoopAt += LOOP_S;
      }
      this.timer = setTimeout(tick, (LOOP_S / 2) * 1000);
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
const PREF_KEY = 'altiplume.musique';

export function musicIsOn(): boolean { return playing !== null; }

export async function toggleMusic(): Promise<boolean> {
  if (playing) {
    const p = playing; playing = null;
    await p.stop();
    try { localStorage.setItem(PREF_KEY, 'off'); } catch { /* sans importance */ }
    return false;
  }
  if (typeof AudioContext === 'undefined') return false;
  playing = new Theme();
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
