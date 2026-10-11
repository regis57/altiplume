"""Thème principal « Altiplume » — valse lumineuse 8 bits, 3/4, 96 BPM, ré majeur.

Synthèse façon puce 2A03, mais version matin clair :
  - lead carré 50 % (timbre plein et brillant) + doublure à l'octave
  - scintillement en croches dans l'aigu (arpège très discret)
  - basse triangle en um-pa-pa léger
  - écho court sur le lead pour l'air et l'altitude
Sortie : altiplume_theme.wav — boucle de 16 mesures (~30 s).
"""
import math, struct, wave, random

SR = 22050
BPM = 96
BEAT = 60 / BPM
BAR = 3 * BEAT
BARS = 16
TOTAL = BARS * BAR

# Demi-tons depuis A4
N = dict(E3=-17, F3=-15, G3=-14, A3=-12, B3=-10, D3=-19,
         Cs4=-8, D4=-7, E4=-5, Fs4=-3, G4=-2, Gs4=-1, A4=0, B4=2,
         Cs5=4, D5=5, E5=7, Fs5=9, G5=10, A5=12, B5=14, Cs6=16, D6=17)

def f(n):
    return 440.0 * 2 ** (n / 12)

# Ré majeur, progression ouverte et solaire
CHORDS = [
    ("D3", ["Fs4", "A4"]), ("D3", ["Fs4", "A4"]), ("B3", ["D4", "Fs4"]), ("B3", ["D4", "Fs4"]),
    ("G3", ["B4", "D5"]),  ("A3", ["Cs5", "E5"]), ("D3", ["Fs4", "A4"]), ("A3", ["Cs5", "E5"]),
    ("G3", ["B4", "D5"]),  ("G3", ["B4", "D5"]),  ("F3", ["A4", "Cs5"]), ("B3", ["D4", "Fs4"]),
    ("E3", ["Gs4", "B4"]), ("A3", ["Cs5", "E5"]), ("D3", ["Fs4", "A4"]), ("D3", ["Fs4", "A4"]),
]

# Mélodie : lignes montantes, registre haut, 48 temps
LEAD = [
    ("Fs5", 2), ("G5", 1), ("A5", 2), ("Fs5", 1), ("D5", 3), ("E5", 2), ("Fs5", 1),
    ("G5", 2), ("A5", 1), ("B5", 3), ("A5", 2), ("Fs5", 1), ("E5", 3),
    ("D6", 2), ("Cs6", 1), ("B5", 2), ("A5", 1), ("G5", 3), ("Fs5", 2), ("G5", 1),
    ("A5", 2), ("B5", 1), ("Cs6", 3), ("D6", 2), ("A5", 1), ("Fs5", 2), (None, 1),
]

def square(t, fr, duty=0.5):
    return 1.0 if (t * fr) % 1.0 < duty else -1.0

def triangle(t, fr):
    x = (t * fr) % 1.0
    return 4 * abs(x - 0.5) - 1

def env(t, dur, a=0.004, r=0.05):
    if t < a: return t / a
    if t > dur - r: return max(0.0, (dur - t) / r)
    return 1.0

buf = [0.0] * int(TOTAL * SR + SR)      # marge pour l'écho
lead_buf = [0.0] * len(buf)             # bus séparé, pour l'écho

def add(dest, start, dur, fr, osc, vol, **kw):
    s0 = int(start * SR); n = int(dur * SR)
    for i in range(n):
        if s0 + i >= len(dest): break
        t = i / SR
        dest[s0 + i] += osc(t, fr, **kw) * env(t, dur) * vol

# --- Basse et accompagnement : léger, rebondissant
for b, (bass, chord) in enumerate(CHORDS):
    t0 = b * BAR
    add(buf, t0, BEAT * 0.8, f(N[bass]), triangle, 0.20)
    for k, note in enumerate(chord):
        add(buf, t0 + (1 + k) * BEAT, BEAT * 0.45, f(N[note]), square, 0.055, duty=0.25)

# --- Scintillement : croches dans l'aigu, deux octaves au-dessus de l'accord
for b, (_, chord) in enumerate(CHORDS):
    t0 = b * BAR
    seq = [chord[0], chord[1], chord[0]]
    for step in range(6):
        note = seq[step % 3]
        add(buf, t0 + step * BEAT / 2, BEAT * 0.22,
            f(N[note]) * 2, square, 0.022, duty=0.5)

# --- Mélodie : carré 50 % plein, doublure octave, vibrato très léger
def lead_osc(t, fr, duty=0.5):
    return square(t, fr * (1 + 0.003 * math.sin(2 * math.pi * 5.0 * t)), duty)

t = 0.0
for note, beats in LEAD:
    dur = beats * BEAT
    if note:
        add(lead_buf, t, dur * 0.92, f(N[note]), lead_osc, 0.17)
        add(lead_buf, t, dur * 0.92, f(N[note]) * 2, lead_osc, 0.035, duty=0.25)
    t += dur

# Écho une croche plus tard, deux renvois : donne l'impression d'espace ouvert
delay = int(BEAT * 0.5 * SR)
for rep, gain in ((1, 0.30), (2, 0.10)):
    off = delay * rep
    for i in range(len(lead_buf) - off):
        buf[i + off] += lead_buf[i] * gain
for i in range(len(lead_buf)):
    buf[i] += lead_buf[i]

# --- Souffle discret sur le premier temps seulement (bien plus léger qu'avant)
random.seed(11)
for b in range(BARS):
    s0 = int(b * BAR * SR); n = int(0.03 * SR)
    for i in range(n):
        buf[s0 + i] += (random.random() * 2 - 1) * 0.012 * (1 - i / n)

peak = max(abs(x) for x in buf) or 1.0
with wave.open("altiplume_theme.wav", "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(x / peak * 31000)) for x in buf))
print("ok", round(len(buf) / SR, 1), "s")
