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

**Jouable** sur [altiplume.com](https://altiplume.com) depuis le 11 octobre 2026,
au terme d'un défi : un vendredi soir, un dossier vide ; le lendemain après-midi, un
jeu installable sur téléphone, sans mot de passe, conforme au RGPD, hébergé sur un
NAS domestique sans aucun port ouvert, et une notification « ton courrier est
arrivé » reçue sur un iPhone à 14 h 23. Le récit complet, chapitre par chapitre,
est le [Journal](https://github.com/regis57/altiplume/wiki/Journal) du wiki ; les
coûts (un nom de domaine, environ dix euros) sont dans
[Coûts](https://github.com/regis57/altiplume/wiki/Couts).

- **v0.1** (livrée) — les Vallées de Brume : six villages, trois avions, quatre
  pilotes et leurs histoires, les cartes du jour, la ligne régulière, l'album de
  cachets, l'aérodrome à restaurer et décorer, le mode nuit, l'installation sur
  l'écran d'accueil et les notifications.
- **v0.2** (en cours) — la Côte de Saline (six escales dont trois sur l'eau,
  l'hydravion Sterne, le ponton, la route qui s'ouvre contre des cachets) est
  fusionnée ; la scène redessinée en 320 × 144 avec chaque décoration visible ;
  l'Archipel des Lanternes vient ensuite.
- **Sécurité, vérifiée de l'extérieur** le 11 octobre : Observatory A+,
  securityheaders A+, SSL Labs A+, SPF/DKIM/DMARC ; le détail, l'avant/après et ce
  qui reste à faire sont dans [Sécurité](https://github.com/regis57/altiplume/wiki/Securite),
  contrôlés chaque semaine.

Connexion par lien magique, passkey ou QR code ; export et suppression de ses
données en un clic. La conception complète est dans
[docs/CONCEPTION.md](docs/CONCEPTION.md), le monde dans [docs/MONDE.md](docs/MONDE.md).

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
npm run check      # lint + typecheck + build + tests + audit + licences
npm run dev        # API et client sur http://localhost:3000 ; les liens de connexion
                   # s'affichent dans la console tant que MAIL_API_KEY est vide
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
