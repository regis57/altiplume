# Altiplume

> Un petit aérodrome postal des années 1930, dans un monde inventé.
> A small 1930s airmail aerodrome, in an invented world.

Jeu web cozy en pixel art 8 bits, jouable au doigt sur téléphone comme à la souris
sur PC. On hérite d'un aérodrome en herbe à moitié ruiné, on le restaure, on recrute
des pilotes qui ont chacun leur caractère, et on ouvre des lignes de courrier vers
des régions lointaines. Les vols durent du temps réel : on joue cinq minutes le
matin, on revient le soir voir si le courrier est arrivé.

**Rien ne se perd si vous ne vous connectez pas.** C'est une règle du jeu, pas une
promesse marketing.

## État du projet

Pré-alpha. Le socle technique se met en place ; il n'y a pas encore de jeu jouable.
La conception complète est dans [docs/CONCEPTION.md](docs/CONCEPTION.md), le
journal de bord dans [docs/JOURNAL.md](docs/JOURNAL.md).

## Principes

- **Serveur autoritatif.** Le navigateur envoie des intentions, jamais des résultats.
- **Pas de mot de passe.** Lien magique et passkey. On stocke un email, un pseudonyme
  et une clé publique — rien d'autre.
- **Accessible.** Objectif WCAG 2.2 niveau AA, interface en DOM plutôt qu'en canvas.
- **Sobre.** Tourne sur un NAS domestique. Pas de tâche de fond : l'état se calcule
  à la lecture, à partir des horodatages.
- **Sans piège.** Pas de coffre aléatoire, pas d'achat d'avantage, pas de minuterie
  à racheter.

## Démarrer

```bash
nvm use            # Node 22
npm ci
npm run check      # lint + typecheck + tests + audit + licences
npm run dev        # API sur http://localhost:3000
```

## Déployer

L'image de l'API est publiée sur `ghcr.io/regis57/altiplume` à chaque fusion sur
`main`, avec une attestation de provenance vérifiable par `gh attestation verify`.
Le déploiement sur un NAS Synology, sans ligne de commande, est décrit dans
[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

## Licence

Deux régimes distincts, et la distinction compte :

- **Le code** est sous [AGPL-3.0](LICENSE). Vous pouvez le réutiliser, mais si vous
  en exploitez une version modifiée sur un service en ligne, vous devez en publier
  les sources.
- **Les ressources** — graphismes, musiques, textes, histoire, noms de lieux et de
  personnages, ainsi que le nom « Altiplume » lui-même — sont **tous droits
  réservés**. Voir [ASSETS-LICENSE.md](ASSETS-LICENSE.md).

Autrement dit : servez-vous du moteur, écrivez votre propre monde.
