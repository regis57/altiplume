# Musique

Les thèmes sont **composés par programme**, en Python pur, sans bibliothèque ni
échantillon tiers. Chaque note est écrite dans le script : rien n'est emprunté, et
tout reste modifiable.

```bash
python3 compose_theme.py   # produit altiplume_theme.wav
```

`compose_theme.py` synthétise à la manière d'une puce 2A03 : deux voix carrées, une
triangle pour la basse, un souffle de bruit. Le thème principal est une valse en ré
majeur à 96 BPM.

Le script est sous AGPL-3.0 comme le reste du code. **Les enregistrements qu'il
produit ne le sont pas** : ils sont sous droits réservés, comme toutes les ressources
du jeu. Voir `../ASSETS-LICENSE.md`.

Les fichiers audio ne sont pas versionnés ici tant que la direction musicale n'est
pas arrêtée : ils seront ajoutés au moment de la première version jouable.
