#!/usr/bin/env node
/**
 * La scène de l'aérodrome, dessinée pixel par pixel.
 *
 * Chaque élément est un petit dessin en texte : une lettre par pixel, une
 * légende qui dit quelle classe CSS porte chaque lettre (les couleurs vivent
 * dans styles.css, pour suivre l'heure et le mode nuit). Ce script fusionne
 * les pixels voisins de même classe en rectangles et écrit le SVG dans
 * packages/client/src/pages/aerodrome.html entre les deux repères.
 *
 *   node scripts/scene-build.mjs
 *
 * La scène fait 320 × 144 : deux fois plus fine que la première version.
 * Les identifiants (scene-piste, scene-hangar, scene-avion-vol…) sont ceux que
 * aerodrome.ts manipule ; ne pas les renommer sans lui.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const page = join(root, 'packages/client/src/pages/aerodrome.html');
const W = 320; const H = 144;

/** Un dessin texte → rectangles. `.` et espace sont transparents. */
function sprite(x0, y0, legend, art) {
  const rows = art.split('\n').filter((r) => r.length > 0);
  const out = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') { x += 1; continue; }
      let w = 1;
      while (row[x + w] === ch) w += 1;
      const cls = legend[ch];
      if (!cls) throw new Error(`lettre inconnue « ${ch} »`);
      out.push(`<rect x="${x0 + x}" y="${y0 + y}" width="${w}" height="1"${cls ? ` class="${cls}"` : ''}/>`);
      x += w;
    }
  });
  return out.join('');
}
const g = (attrs, inner) => `<g ${attrs}>${inner}</g>`;
const rect = (x, y, w, h, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;

// ---- Le ciel : trois bandes, des étoiles, des nuages ----
// Entre deux bandes, trois lignes tramées de plus en plus denses : le dégradé à la façon des vieilles consoles.
const dither = (yBand, cls) => sprite(0, yBand - 3, { d: cls }, ['d...', '.d.d', 'ddd.'].map((m) => m.repeat(W / 4)).join('\n'));
const sky = rect(0, 0, W, 50, 'ciel ciel-haut') + rect(0, 50, W, 24, 'ciel ciel-milieu') + rect(0, 74, W, 14, 'ciel ciel-bas')
  + dither(50, 'ciel-milieu') + dither(74, 'ciel-bas');
const stars = [[12, 6], [40, 14], [71, 4], [96, 22], [128, 9], [150, 30], [183, 12], [207, 26], [236, 7], [262, 18], [291, 11], [310, 28], [58, 36], [172, 40], [246, 38], [20, 44]]
  .map(([x, y]) => rect(x, y, 1, 1, 'etoile')).join('');
const cloud = (x, y) => sprite(x, y, { c: 'nuage', o: 'nuage-ombre' }, `
.......cccccc.......
....cccccccccccc....
..cccccccccccccccc..
.cccccccccccccccccc.
cccccccccccccccccccc
.ooooooooooooooooo..
...oooooooooooo.....
`);
const cloudSmall = (x, y) => sprite(x, y, { c: 'nuage', o: 'nuage-ombre' }, `
.....cccc....
..cccccccccc.
.ccccccccccc.
.ooooooooooo.
...oooooo....
`);
const clouds = g('class="nuages"', g('class="nuage-lent"', cloud(30, 14) + cloudSmall(120, 30)) + g('class="nuage-lent nuage-lent-2"', cloud(196, 8) + cloudSmall(270, 26)));

// Le soleil, ou la lune : un disque de dix pixels.
const astre = g('class="astre"', sprite(230, 20, { s: 'astre-disque', r: 'astre-halo' }, `
...rrrr...
.rssssssr.
rssssssssr
rssssssssr
rssssssssr
rssssssssr
rssssssssr
rssssssssr
.rssssssr.
...rrrr...
`));

// ---- L'horizon : collines lointaines et leur ligne d'arbres ----
const farHills = rect(0, 80, W, 14, 'colline-loin')
  + sprite(0, 74, { h: 'colline-loin' }, `
..........hhhhhhhhhhhhhh....................................hhhhhhhhhhhhhhhhhhhhhh.........................................hhhhhhhhhhhhhhhh.....................................hhhhhhhhhhhhhhhhhhhhhhhhhh......................................hhhhhhhhhhhhhhh...............
......hhhhhhhhhhhhhhhhhhhhhh.........................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.............................hhhhhhhhhhhhhhhhhhhhhhhhhh.........................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh...........................hhhhhhhhhhhhhhhhhhhhhhhhhhh.........
..hhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh....................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh..................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.....................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh...
hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.......hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh..........hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh............hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.............hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
`);
// Une ligne de sapins et de feuillus sur la crête lointaine.
const farTree = (x, y, kind) => (kind === 'sapin'
  ? sprite(x, y, { a: 'arbre-loin' }, '..a..\n.aaa.\n.aaa.\naaaaa\n..a..')
  : sprite(x, y, { a: 'arbre-loin' }, '.aaa.\naaaaa\naaaaa\n.aaa.\n..a..'));
const farTrees = g('class="arbres-loin"', [4, 11, 17, 26, 33, 52, 58, 64, 71, 79, 86, 110, 116, 123, 131, 140, 147, 155, 170, 176, 184, 192, 199, 207, 214, 235, 243, 250, 256, 263, 271, 279, 300, 306, 313]
  .map((x, i) => farTree(x, 78 - (i % 3), i % 4 === 0 ? 'feuillu' : 'sapin')).join(''));

// Les collines proches, avec des buissons et quelques vrais arbres.
const hills = rect(0, 92, W, 14, 'colline')
  + sprite(0, 86, { h: 'colline' }, `
........................................hhhhhhhhhhhhhhhh.......................................................................................................hhhhhhhhhhhhhhhhhhhhhhhhh...........................................................................................................
..............................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.........................................................................................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh..............................................................hhhhhhhhhhhhhhhhhhhhhhh....
....................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh..............................................................................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.........................................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
..........hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.........................................................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh...........................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh......................hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.............hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
`);
const bush = (x, y) => sprite(x, y, { b: 'buisson', c: 'buisson-clair' }, `
..cbb..
.cbbbb.
bbbbbbb
`);
const tree = (x, y) => sprite(x, y, { f: 'feuillage', c: 'feuillage-clair', t: 'tronc' }, `
....ccc....
..cccfffc..
.ccffffffc.
cffffffffff
cfffffffff.
.ffffffff..
..ffffff...
....tt.....
....tt.....
....tt.....
`);
const fir = (x, y) => sprite(x, y, { f: 'feuillage-sombre', t: 'tronc' }, `
....f....
...fff...
..fffff..
...fff...
..fffff..
.fffffff.
..fffff..
.fffffff.
fffffffff
....t....
....t....
`);
const vegetation = g('class="vegetation"', tree(6, 90) + fir(26, 92) + bush(44, 103) + bush(96, 104) + tree(118, 92) + bush(140, 103) + fir(300, 90) + bush(290, 104) + bush(190, 104) + fir(206, 94));

// ---- Le sol, la piste, le chemin, la croix ----
const ground = rect(0, 106, W, 38, 'sol');
const grass = g('class="herbes"', [10, 30, 58, 74, 102, 126, 150, 178, 196, 214, 240, 262, 288, 306, 18, 88, 164, 230, 274, 314]
  .map((x, i) => sprite(x, i % 2 ? 110 : 114, { v: 'herbe' }, 'v.v\n.v.')).join(''));
// La piste : herbe fauchée au niveau 1, roulée au 2, allongée au 3 ; des pierres blanches la balisent.
const runwayStones = [56, 86, 116, 146, 176, 206, 236, 266].map((x) => rect(x, 125, 3, 2, 'pierre')).join('');
const runway = g('class="piste" id="scene-piste"', rect(48, 120, 236, 12, 'piste-sol') + rect(48, 120, 236, 1, 'piste-bord') + rect(48, 131, 236, 1, 'piste-bord') + runwayStones);
const runwayLong = g('class="piste piste-longue cache" id="scene-piste-longue"', rect(284, 120, 30, 12, 'piste-sol') + rect(284, 120, 30, 1, 'piste-bord') + rect(284, 131, 30, 1, 'piste-bord') + rect(300, 125, 3, 2, 'pierre'));
const path = sprite(0, 112, { c: 'chemin', o: 'chemin-ombre' }, `
cccccccccccccccccccccccccccccccccccc
ccccccccccccccccccccccccccccccccccccc
cccccccccccccccccccccccccccccccccccccc
ooooooooooooooooooooooooooooooooooooo
`);
const cross = sprite(10, 92, { p: 'croix', o: 'croix-ombre', s: 'socle' }, `
...pp...
...pp...
.pppppp.
.pppppp.
...pp...
...pp...
...pp...
...pp...
...po...
...po...
...po...
...po...
..ssss..
.ssssss.
`);

// ---- Le hangar : tôle ondulée, grande porte, fenêtre, cheminée ----
const HANGAR_ART = `
................................cc.........................................
................................cc.........................................
..............................RRRRRRRRRRRRRRRRR............................
...........................RRRrrrrrrrrrrrrrrrrrRRR.........................
........................RRRrrrrRrrrrRrrrrRrrrrRrrrRRR......................
.....................RRRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRRR...................
..................RRRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRRR.................
...............RRRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRRR...............
............RRRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRRR.............
.........RRRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRRR...........
......RRRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRrrrrRRR.........
...RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.......
...rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr.......
....wwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWww.......
....wwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWww.......
....wwWwwvvvvvWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWwwwwWww.......
....wwWwwvvvvvWwwwwWwwwwWwwwwWddddddddddddddddddddddddddddWwwwwWww.......
....wwWwwvvvvvWwwwwWwwwwWwwwwWdDDDDDDDDDDDDDdDDDDDDDDDDDDDdWwwwwWww.......
....wwWwwvvvvvWwwwwWwwwwWwwwwWdDbbbbbbbbbbbDdDbbbbbbbbbbbDdWwwwwWww.......
....wwWwwwwWwwwwWwwwwWwwwwWwwwwWdDbDDDDDDDDDbDdDbDDDDDDDDDbDdWwwwwWww.......
....wwWwwwwWwwwwWwwwwWwwwwWwwwwWdDbDbbbbbbbDbDdDbDbbbbbbbDbDdWwwwwWww.......
....wwWwwwwWwwwwWwwwwWwwwwWwwwwWdDbDbDDDDDbDbDdDbDbDDDDDbDbDdWwwwwWww.......
....wwWwwwwWwwwwWwwwwWwwwwWwwwwWdDbDbbbbbbbDbDdDbDbbbbbbbDbDdWwwwwWww.......
....wwWwwwwWwwwwWwwwwWwwwwWwwwwWdDbDDDDDDDDDbDdDbDDDDDDDDDbDdWwwwwWww.......
....wwWwwwwWwwwwWwwwwWwwwwWwwwwWdDbbbbbbbbbbbDdDbbbbbbbbbbbDdWwwwwWww.......
....wwWwwwwWwwwwWwwwwWwwwwWwwwwWdDDDDDDDDDDDDDdDDDDDDDDDDDDDdWwwwwWww.......
....wwWwwwwWwwwwWwwwwWwwwwWwwwwWddddddddddddddddddddddddddddWwwwwWww.......
....ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss.......
`;
const hangar = g('class="hangar" id="scene-hangar"', sprite(222, 70, {
  r: 'toit', R: 'toit-clair', w: 'mur', W: 'mur-clair', d: 'porte', D: 'porte-clair', v: 'vitre', c: 'cheminee', b: 'bardage', s: 'seuil',
}, HANGAR_ART));

// L'enseigne : une planche au-dessus de la porte, le nom peint dessus.
const sign = g('class="enseigne cache" id="scene-enseigne"',
  rect(250, 82, 40, 7, 'planche') + rect(250, 82, 40, 1, 'planche-bord') + rect(250, 88, 40, 1, 'planche-bord')
  + `<text x="270" y="87.3" text-anchor="middle" font-size="4.2" textLength="36" lengthAdjust="spacingAndGlyphs" id="scene-enseigne-texte"></text>`);

// La manche à air : le mât, la toile, et la rayure blanche de la décoration (groupe à part, affiché à la pose).
const windsock = g('class="manche" id="scene-manche"', rect(160, 88, 1, 30, 'mat') + sprite(161, 89, { t: 'toile' }, `
tttttttt
tttttttt
ttttttt.
ttttttt.
`) + g('class="cache" id="scene-manche-raie"', rect(164, 90, 2, 2, 'toile-raie')));

// Le biplan : deux ailes, des haubans, deux roues, l'hélice.
const BIPLANE = `
.....aaaaaaaaaaaaaaaaaa......
.....a..b..b..b..b..a........
...ffffffffffffffffffff.ee...
..fffffffffffffffffffffffpp..
..ff..aaaaaaaaaaaaaaaa..f.pp.
.......r.........r......f.pp.
......rrr.......rrr.....f....
`;
const PLANE_LEGEND = { a: 'aile', b: 'hauban', f: 'fuselage', e: 'empennage', p: 'helice', r: 'roue' };
const parked = g('class="avion"', sprite(186, 110, PLANE_LEGEND, BIPLANE));
const flying = g('class="avion avion-vol cache" id="scene-avion-vol"', sprite(0, 0, PLANE_LEGEND, BIPLANE));

// ---- La rivière, le ponton, la Sterne ----
const river = g('class="riviere"', rect(0, 134, W, 10, 'eau') + rect(0, 134, W, 1, 'eau-bord')
  + [[14, 137, 10], [52, 140, 8], [96, 138, 12], [150, 141, 7], [204, 137, 10], [250, 140, 9], [296, 138, 8]].map(([x, y, w]) => rect(x, y, w, 1, 'reflet')).join(''));
const pontoon = g('class="ponton cache" id="scene-ponton"', sprite(0, 130, { p: 'planches', P: 'planches-clair', l: 'pilotis', b: 'bollard' }, `
..............b...
..............b...
pPpPpPpPpPpPpPpPp.
pppppppppppppppp..
..l.....l.....l...
..l.....l.....l...
..l.....l.....l...
`));
const seaplane = g('class="hydravion cache" id="scene-hydravion"', sprite(20, 131, { a: 'aile', f: 'fuselage', e: 'empennage', p: 'helice', s: 'flotteur', h: 'hauban' }, `
......aaaaaaaaaaaaaa......
......h....h....h...ee....
...ffffffffffffffffffff.pp
...fffffffffffffffffffffpp
.....h.......h........f.pp
...ssssssss..sssssssss....
`));

// ---- Les décorations ----
const flowers = g('class="fleurs cache" id="scene-fleurs"', sprite(226, 92, { r: 'fleur', j: 'fleur2', v: 'feuilles', b: 'bac' }, `
r.j.r.j.r.j
vvvvvvvvvvv
bbbbbbbbbbb
`) + sprite(292, 92, { r: 'fleur', j: 'fleur2', v: 'feuilles', b: 'bac' }, `
j.r.j
vvvvv
bbbbb
`));
const bench = g('class="banc cache" id="scene-banc"', sprite(116, 108, { b: 'bois', p: 'pied' }, `
bbbbbbbbbbbbbb
p............p
bbbbbbbbbbbbbb
.p..........p.
.p..........p.
`));
const letterbox = g('class="boite cache" id="scene-boite"', sprite(28, 100, { b: 'boite-corps', f: 'fente', p: 'pied' }, `
.bbbb.
bbbbbb
bffffb
bbbbbb
..pp..
..pp..
..pp..
..pp..
`));
const lantern = g('class="lanterne cache" id="scene-lanterne"', sprite(30, 90, { m: 'mat', f: 'flamme', c: 'cage', h: 'halo' }, `
...hhhh...
..hccccch.
.hhcffffch
.hhcffffch
..hccccch.
...hmmh...
....mm....
....mm....
....mm....
....mm....
....mm....
....mm....
....mm....
....mm....
....mm....
....mm....
...mmmm...
`));
const appleTree = g('class="pommier cache" id="scene-pommier"', sprite(136, 84, { f: 'feuillage', c: 'feuillage-clair', p: 'pomme', t: 'tronc' }, `
.....cccc.....
...ccffffcc...
..cfffpffffc..
.cffffffffffc.
cffffffffpffff
cfffpfffffffff
.fffffffffff..
..fffpfffff...
....fffff.....
......tt......
......tt......
......tt......
......tt......
......tt......
`));
const flag = g('class="drapeau cache" id="scene-drapeau"', sprite(204, 80, { m: 'mat', v: 'vert', b: 'bleu', p: 'plume' }, `
mvvvvvvvvvvv
mvvvvvpvvvvv
mvvvvppvvvvv
mbbbbpbbbbbb
mbbbbbbbbbbb
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
m...........
`));
const cafe = g('class="cafe cache" id="scene-cafe"', sprite(60, 100, { u: 'parasol', U: 'parasol-clair', m: 'mat', t: 'table', p: 'pied', c: 'chaise' }, `
.....UUuuUUuuUU.....
...UUuuUUuuUUuuUU...
.........mm.........
.........mm.........
.........mm.........
.cc...tttttttt...cc.
.cc...tttttttt...cc.
.c......pppp......c.
.c......pppp......c.
`));

// ---- Les saisons : ce qui n'apparaît qu'en leur temps (data-saison sur la page) ----
// La neige sur le toit du hangar : la pente entière, tirée du dessin même du toit
// (lignes 2 à 10), avec une colonne d'ombre toutes les cinq.
const snowRoof = g('class="saisonnier hiver-seul"', sprite(222, 70, { n: 'neige', N: 'neige-ombre' },
  HANGAR_ART.split('\n').map((line, i) => (i >= 3 && i <= 11 ? line.replace(/[Rr]/g, (_, x) => (x % 5 === 0 ? 'N' : 'n')) : line.replace(/[^.]/g, '.'))).join('\n')));
// Des flocons, en deux nappes qui ne tombent pas à la même vitesse.
const flake = (x, y) => rect(x, y, 1, 1, 'flocon');
const flakes = g('class="saisonnier hiver-seul flocons"',
  g('class="flocons-1"', [[12, 8], [40, 30], [66, 14], [93, 44], [121, 22], [148, 6], [175, 36], [203, 18], [231, 48], [258, 10], [286, 32], [312, 20], [28, 60], [84, 70], [140, 58], [196, 66], [252, 62], [304, 72]].map(([x, y]) => flake(x, y)).join(''))
  + g('class="flocons-2"', [[20, 20], [55, 50], [80, 4], [108, 36], [134, 12], [162, 52], [190, 28], [218, 6], [244, 40], [272, 16], [298, 54], [8, 42], [116, 66], [228, 74], [168, 78]].map(([x, y]) => flake(x, y)).join('')));
// Des feuilles rousses qui tombent des arbres, à l'automne.
const leaf = (x, y, c) => rect(x, y, 2, 1, c);
const leaves = g('class="saisonnier automne-seul feuilles-tombantes"',
  [[10, 100, 'feuille-a'], [24, 96, 'feuille-b'], [122, 101, 'feuille-a'], [130, 97, 'feuille-b'], [140, 103, 'feuille-a'], [16, 106, 'feuille-b'], [126, 108, 'feuille-a'], [60, 112, 'feuille-b'], [200, 115, 'feuille-a'], [96, 117, 'feuille-b']]
    .map(([x, y, c]) => leaf(x, y, c)).join(''));
// Les vergers en fleur, au printemps : des pétales sur les deux feuillus du premier plan.
const blossom = (x0, y0) => [[2, 1], [5, 0], [8, 2], [1, 3], [4, 2], [7, 4], [9, 3], [3, 5], [6, 5], [5, 3]].map(([x, y], i) => rect(x0 + x, y0 + y, 1, 1, i % 3 ? 'petale' : 'petale-clair')).join('');
const blossoms = g('class="saisonnier printemps-seul"', blossom(6, 90) + blossom(118, 92));
// L'été : des boutons d'or dans le pré.
const buttercups = g('class="saisonnier ete-seul"', [[14, 109], [37, 113], [69, 108], [107, 112], [153, 109], [182, 114], [221, 110], [246, 113], [279, 108], [301, 112]].map(([x, y]) => rect(x, y, 1, 1, 'bouton-or')).join(''));

const svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">
${sky}
<g class="etoiles">${stars}</g>
${astre}
${clouds}
${farHills}
${farTrees}
${hills}
${vegetation}
${blossoms}
${ground}
${buttercups}
${grass}
${path}
${cross}
${runway}
${runwayLong}
${hangar}
${snowRoof}
${sign}
${flowers}
${flag}
${windsock}
${appleTree}
${lantern}
${letterbox}
${bench}
${cafe}
${parked}
${river}
${pontoon}
${seaplane}
${leaves}
${flakes}
${flying}
</svg>`;


// ---- Les vignettes des régions : 160 × 48, une par route, dans la section « Les routes » ----
const VW = 160; const VH = 48;
function vignette(id, inner) {
  return `<template id="vignette-${id}"><svg class="vignette vignette-${id}" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true">${inner}</svg></template>`;
}
// Vallées de Brume : collines douces, brume basse, un village, la croix.
const vBrume = vignette('brume',
  rect(0, 0, VW, 30, 'v-ciel') + rect(0, 22, VW, 8, 'v-brume')
  + sprite(0, 14, { h: 'v-colline-loin' }, '......hhhhhhhhhhhhhhhh..............hhhhhhhhhhhhhhhhhhhhhhhhhh....................hhhhhhhhhhhhhhhhhhhhhhhhh.........................hhhhhhhhhhhhhhhh\n..hhhhhhhhhhhhhhhhhhhhhhhhhh....hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh........hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh..........hhhhhhhhhhhhhhhhhhhhhhhhhhhh\nhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh')
  + rect(0, 30, VW, 18, 'v-sol')
  + sprite(100, 20, { m: 'v-mur', t: 'v-toit', f: 'v-fenetre' }, '...tttttt...\n..tttttttt..\n.tttttttttt.\n.mmmmmmmmmm.\n.mmfmmmmfmm.\n.mmmmmmmmmm.\n.mmmmmmmmmm.')
  + sprite(118, 24, { m: 'v-mur', t: 'v-toit' }, '.ttttt.\nttttttt\n.mmmmm.\n.mmmmm.\n.mmmmm.')
  + sprite(20, 24, { f: 'feuillage', c: 'feuillage-clair', t: 'tronc' }, '..cc..\n.cffc.\ncfffff\n.ffff.\n..tt..\n..tt..')
  + sprite(42, 26, { f: 'feuillage', t: 'tronc' }, '.ff.\nffff\n.tt.')
  + sprite(70, 30, { c: 'v-croix' }, '.c.\nccc\n.c.\n.c.\n.c.')
  + [8, 56, 88, 134, 150].map((x) => rect(x, 36 + (x % 3), 2, 1, 'herbe')).join(''));
// Côte de Saline : marais salants blancs, la mer, le phare.
const vSaline = vignette('saline',
  rect(0, 0, VW, 26, 'v-ciel-saline') + rect(0, 26, VW, 22, 'v-mer')
  + [[6, 30, 10], [40, 34, 8], [90, 29, 12], [130, 36, 9], [60, 42, 7], [150, 31, 6]].map(([x, y, w]) => rect(x, y, w, 1, 'v-reflet')).join('')
  + sprite(0, 20, { s: 'v-sel', d: 'v-digue', e: 'v-eau-sel' }, 'ssssssssssssssssssssssssssssssssssss....\nsdddddddddsdddddddddsdddddddddsddddd....\nsdeeeeeeedsdeeeeeeedsdeeeeeeedsdeeed....\nsdeeeeeeedsdeeeeeeedsdeeeeeeedsdeeed....\nsdddddddddsdddddddddsdddddddddsddddd....\nssssssssssssssssssssssssssssssssssss....\n..........................................\n..........................................')
  + sprite(120, 6, { p: 'v-phare', b: 'v-phare-bande', l: 'v-lumiere', r: 'v-rocher' }, '...ll...\n..llll..\n...pp...\n...bb...\n...pp...\n...bb...\n...pp...\n..pppp..\n.rrrrrr.\nrrrrrrrr')
  + sprite(70, 18, { a: 'aile', f: 'fuselage', s: 'flotteur' }, '..aaaaaa..\n.ffffffff.\n..s....s..')
  + sprite(28, 36, { b: 'v-barque' }, 'b....b\nbbbbbb\n.bbbb.'));
// Archipel des Lanternes : nuit, îles basses, lanternes et leurs reflets.
const vArchipel = vignette('archipel',
  rect(0, 0, VW, 28, 'v-nuit') + rect(0, 28, VW, 20, 'v-mer-nuit')
  + [[10, 4], [27, 9], [48, 3], [70, 7], [95, 5], [118, 10], [140, 4], [155, 8], [33, 15], [84, 13], [128, 16]].map(([x, y]) => rect(x, y, 1, 1, 'etoile-vignette')).join('')
  + sprite(134, 4, { m: 'v-lune' }, '.mmmm.\nmmmmmm\nmmmmmm\n.mmmm.')
  + sprite(0, 24, { i: 'v-ile' }, '....iiiiiiii................iiiiiiiiiiiiii..........................iiiiiiiiii.................iiiiiiiiiiiiiiii..........\n..iiiiiiiiiiii............iiiiiiiiiiiiiiiiii......................iiiiiiiiiiiiii..............iiiiiiiiiiiiiiiiiiii......\niiiiiiiiiiiiiiii........iiiiiiiiiiiiiiiiiiiiii..................iiiiiiiiiiiiiiiiii..........iiiiiiiiiiiiiiiiiiiiiiii....')
  + [[12, 20], [36, 18], [52, 21], [76, 20], [104, 18], [122, 21], [144, 19]].map(([x, y]) => sprite(x, y, { l: 'v-lanterne', h: 'v-halo', p: 'v-piquet' }, '.h.\nhlh\n.h.\n.p.\n.p.\n.p.') + rect(x + 1, 29, 1, 3, 'v-reflet-lanterne')).join('')
  + sprite(60, 8, { a: 'aile', f: 'fuselage', s: 'flotteur' }, '..aaaaaa..\n.ffffffff.\n..s....s..'));
// Forêt de Cuivre : une hêtraie rousse, la fumée des charbonniers, le clocher de
// Sonnefeuille au toit vert-de-gris, et le Pic posé dans la clairière.
const CROWN = [
  '....cccccc....',
  '..cckkkkkkcc..',
  '.ckkkkkkkkkkc.',
  'ckkkkkkkkkkkkc',
  'kkkkkkkkkkkkks',
  'kkkkkkkkkkkkss',
  '.kkkkkkkkkksss',
  '..sskkkkkssss.',
  '....sssssss...',
].join('\n');
const crown = (x, y) => sprite(x, y, { c: 'v-cime-claire', k: 'v-cime', s: 'v-cime-sombre' }, CROWN) + rect(x + 6, y + 9, 2, 48 - y - 9, 'v-tronc');
const vCuivre = vignette('cuivre',
  rect(0, 0, VW, 24, 'v-ciel-cuivre') + rect(0, 16, VW, 8, 'v-brume-cuivre')
  + sprite(0, 18, { h: 'v-cime-loin' }, '...hhhh......hhhhhh....hhhh.....hhhhhh......hhhhh.....hhhh......hhhhhh.....hhhhh......hhhh....hhhhhh......hhhh.....hhhhhh.....hhhh......hhhhh....hhh\n.hhhhhhhh..hhhhhhhhhh.hhhhhhh.hhhhhhhhhh..hhhhhhhhh.hhhhhhhh..hhhhhhhhhh.hhhhhhhhh..hhhhhhh.hhhhhhhhhh..hhhhhhhh.hhhhhhhhhh.hhhhhhh...hhhhhhhhh.hhhhhhh\nhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh')
  + rect(0, 21, VW, 17, 'v-foret-fond')
  + sprite(0, 21, { d: 'v-foret-ombre' }, ['d.d.', '.d.d'].map((m) => m.repeat(VW / 4)).join('\n'))
  + [2, 15, 27, 41, 58, 70, 84, 96, 112, 125, 139, 151].map((x) => rect(x, 26 + (x % 5), 1, 12, 'v-tronc-loin')).join('')
  + sprite(128, 4, { g: 'v-toit-vert', s: 'v-clocher', b: 'v-baie' }, '...gg...\n..gggg..\n.gggggg.\ngggggggg\n.ssssss.\n.sbssbs.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.\n.ssssss.')
  + sprite(14, 2, { f: 'v-fumee' }, '.......ff.\n......f...\n.....ff...\n......ff..\n.......f..\n......ff..\n.....ff...\n.....f....\n......f...\n.....ff...\n....ff....\n.....f....\n....ff....\n....f.....\n.....f....\n....ff....\n....f.....\n....f.....\n...ff.....\n....f.....\n....f.....')
  + rect(0, 38, VW, 10, 'v-sous-bois') + rect(56, 36, 52, 12, 'v-clairiere') + rect(54, 38, 56, 10, 'v-clairiere')
  + [[-4, 24], [7, 21], [19, 25], [31, 22], [43, 26], [106, 25], [118, 21], [131, 24], [144, 22], [154, 26]].map(([x, y]) => crown(x, y)).join('')
  + [[60, 44], [66, 41], [71, 46], [89, 43], [97, 45], [102, 40], [84, 47], [63, 47]].map(([x, y]) => rect(x, y, 1, 1, 'v-feuille')).join('')
  + sprite(72, 33, { a: 'v-aile', h: 'v-hauban', f: 'v-fuselage', e: 'v-empennage', p: 'v-helice', r: 'v-roue' }, 'aaaaaaaaaaaaaa..\n...h......h.....\n...h......h.....\n.pfffffffffffe..\n..ffffffffff.ee.\n...r.......r....'));
const vignettes = vBrume + vSaline + vArchipel + vCuivre;

const html = readFileSync(page, 'utf8');
const start = html.indexOf('<!-- scene:start -->'); const end = html.indexOf('<!-- scene:end -->');
if (start < 0 || end < 0) throw new Error('repères scene:start / scene:end introuvables dans aerodrome.html');
const next = html.slice(0, start) + '<!-- scene:start -->\n      ' + svg.replace(/\n/g, '\n      ') + '\n      ' + vignettes + '\n      ' + html.slice(end);
writeFileSync(page, next);
process.stdout.write(`scène : ${(svg.match(/<rect/g) ?? []).length} rectangles\n`);
