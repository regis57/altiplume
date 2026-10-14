# Musique

`compose_theme.py` compose le thème de printemps d'Altiplume — valse lumineuse 8 bits,
3/4, 96 BPM, ré majeur, le thème d'origine — en Python pur, façon puce 2A03, et écrit un fichier WAV
de trente et une secondes pour l'écouter.

Le jeu, lui, ne charge aucun fichier audio : `packages/client/src/music.ts` joue la
même partition dans le navigateur (Web Audio), avec les mêmes timbres — et, depuis le
14 octobre, **trois autres, une par saison** : la ritournelle d'été (4/4, sol majeur,
112), la berceuse d'automne (3/4, la mineur, 84), le chant d'hiver (4/4, mi mineur, 72).
Le thème joué est celui de la saison du calendrier. Les quatre partitions vivent dans
`music.ts` ; le script Python n'écrit que la valse, pour écouter vite.

    python3 compose_theme.py    # écrit altiplume_theme.wav

Le thème est une œuvre originale du projet (voir ASSETS-LICENSE.md).
