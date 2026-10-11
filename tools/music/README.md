# Musique

`compose_theme.py` compose le thème principal d'Altiplume — valse lumineuse 8 bits,
3/4, 96 BPM, ré majeur — en Python pur, façon puce 2A03, et écrit un fichier WAV
de trente et une secondes pour l'écouter.

Le jeu, lui, ne charge aucun fichier audio : `packages/client/src/music.ts` joue la
même partition dans le navigateur (Web Audio), avec les mêmes timbres. Pour changer
une note, on la change aux deux endroits ; le script sert à écouter vite.

    python3 compose_theme.py    # écrit altiplume_theme.wav

Le thème est une œuvre originale du projet (voir ASSETS-LICENSE.md).
