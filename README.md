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
arrivé » reçue sur un iPhone à 14 h 23. Le résumé — chronologie, décisions clefs —
est [Les 24 heures](https://github.com/regis57/altiplume/wiki/Les-24-heures), et la
suite, [Jour 2](https://github.com/regis57/altiplume/wiki/Jour-2) et [Jour 3](https://github.com/regis57/altiplume/wiki/Jour-3) (la sécurité), [Jour 4](https://github.com/regis57/altiplume/wiki/Jour-4) (les cartes disent vrai), [Jour 5](https://github.com/regis57/altiplume/wiki/Jour-5) (le jeu montre le chemin), [Jour 6](https://github.com/regis57/altiplume/wiki/Jour-6) (un voisin sous le domaine), [Jour 7](https://github.com/regis57/altiplume/wiki/Jour-7) (la v0.3, et la fin du récit) ; le récit complet, le [Journal](https://github.com/regis57/altiplume/wiki/Journal) ; les
coûts (un nom de domaine, environ dix euros) sont dans
[Coûts](https://github.com/regis57/altiplume/wiki/Couts).

- **v0.1** (livrée) — les Vallées de Brume : six villages, trois avions, quatre
  pilotes et leurs histoires, les cartes du jour, la ligne régulière, l'album de
  cachets, l'aérodrome à restaurer et décorer, le mode nuit, l'installation sur
  l'écran d'accueil et les notifications.
- **v0.2** (livrée) — la Côte de Saline (six escales dont trois sur l'eau,
  l'hydravion Sterne, le ponton) et l'Archipel des Lanternes (six îles, les vols de
  nuit, le Goéland) ; la scène redessinée en 320 × 144 avec chaque décoration visible.
- **Vers la v0.3** (12 octobre) — la Forêt de Cuivre et une route qui bifurque, le
  Pic et ses clairières, les convois de fret lourd, les saisons du calendrier,
  l'aérodrome qui se voit grandir (hangar, tour, chaque avion à sa place) ; dix
  pilotes, cinq femmes et cinq hommes. Le 14 octobre, en rejouant : un album en
  timbres qui tient dans un écran, des routes fermées qui disent ce qui manque, et
  une escale jamais livrée qui « attend sa lettre ».
- **Sécurité, vérifiée de l'extérieur** le 11 octobre : Observatory A+,
  securityheaders A+, SSL Labs A+, SPF/DKIM/DMARC ; **et de l'intérieur** depuis le
  12 octobre, à chaque PR : Trivy sur l'image, OWASP ZAP sur l'application, Opengrep
  et CodeQL sur le code, Socket sur les dépendances. Le détail, l'avant/après et ce
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

La configuration chez Cloudflare (le domaine au prix coûtant, les réglages de la zone,
DNSSEC, le tunnel sans aucun port ouvert, le courrier, et la coexistence avec un second
projet sous un sous-domaine, avec ses points à vérifier) est décrite pas à pas, sans
aucune valeur secrète, dans
[Sécurité → Cloudflare, pas à pas](https://github.com/regis57/altiplume/wiki/Securite#cloudflare-pas-à-pas)
(source : [docs/SECURITE.md](docs/SECURITE.md)).

## Soutenir

Altiplume est gratuit, sans publicité et sans traqueur, et le restera : il coûte
une dizaine d'euros par an, le prix du nom de domaine. Si l'aventure vous plaît,
vous pouvez offrir une bière :

[![Offrir une bière — Buy me a beer](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20beer&emoji=%F0%9F%8D%BA&slug=regis57&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://buymeacoffee.com/regis57)

(ou simplement [buymeacoffee.com/regis57](https://buymeacoffee.com/regis57)).

Une bière ne donne rien dans le jeu — ni francs, ni cachets, ni raccourci. C'est
un merci, rien d'autre. Et le lien n'existe qu'ici, sur cette page : le jeu n'en
parle pas, et rien ne se charge depuis chez eux quand on y joue.

## Licence

Deux régimes distincts, et la distinction compte :

- **Le code** est sous [AGPL-3.0](LICENSE). Vous pouvez le réutiliser, mais si vous
  en exploitez une version modifiée sur un service en ligne, vous devez en publier
  les sources.
- **Les ressources** — graphismes, musiques, textes, histoire, noms de lieux et de
  personnages, ainsi que le nom « Altiplume » lui-même — sont **tous droits
  réservés**. Voir [ASSETS-LICENSE.md](ASSETS-LICENSE.md).

Autrement dit : servez-vous du moteur, écrivez votre propre monde.
