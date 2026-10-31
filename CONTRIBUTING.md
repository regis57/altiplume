# Contribuer à Altiplume

Merci de l'intérêt. Ce projet est mené par une personne qui ne code pas elle-même :
les propositions sont les bienvenues, mais la fusion est toujours un acte humain et
délibéré.

## Avant d'écrire du code

Ouvrez une issue d'abord. Une pull request qui arrive sans discussion préalable a
toutes les chances d'être refusée, non par principe mais parce que le projet suit
une conception écrite ([docs/CONCEPTION.md](docs/CONCEPTION.md)) et un périmètre
volontairement étroit.

## Règles de base

- **Branche** depuis `main`, nommée `type/sujet-court` : `feat/`, `fix/`, `chore/`,
  `docs/`, `refactor/`, `test/`.
- **Commits** au format [Conventional Commits](https://www.conventionalcommits.org/) :
  `feat(server): résout les vols à la lecture`.
- **`npm run check` doit passer** avant d'ouvrir la pull request. C'est exactement ce
  que la CI exécutera.
- **Un sujet par pull request.** Une PR qui corrige un bug *et* renomme trois fichiers
  est une PR qu'on ne peut pas relire.
- **Jamais de secret** dans un commit, même temporaire, même dans un fichier d'exemple.
- **Description de la PR** : écrite par l'auteur, rien d'autre. Le contrôle « Description des PR » (`.github/workflows/description-pr.yml`) retire toute signature d'outil collée en bas du texte.

## Ce que la CI vérifie

Le workflow CI (`.github/workflows/ci.yml`) a neuf jobs, lancés à chaque PR : `lint`
(ESLint), `typecheck` (TypeScript strict), `build`, `test` (Vitest), `audit`
(vulnérabilités des dépendances), `licenses` (licences autorisées uniquement), et trois
parcours dans un vrai Chromium : *aucune requête tierce* (`scripts/e2e-tiers.mjs`),
*mise en page* (`scripts/e2e-mise-en-page.mjs`) et *accessibilité*
(`scripts/e2e-accessibilite.mjs`, axe-core).

`npm run e2e` joue les sept parcours de bout en bout : les trois de la CI, et quatre
qui ne tournent qu'à la main — celui des passkeys et de la connexion par QR (avec un
authenticateur virtuel), celui du courrier, celui de la Côte de Saline (route, ponton,
Sterne, amerrissage) et celui du convoi de fret lourd. Il faut un Chromium
(`CHROMIUM_PATH=/chemin/vers/chromium`, ou `npx playwright install chromium`).
Lancez-le avant toute PR qui touche au client ou au serveur.

## La scène

La scène de l'aérodrome est dessinée pixel par pixel dans `scripts/scene-build.mjs` :
chaque élément est un petit dessin en texte, une lettre par pixel, et une légende
qui dit quelle classe CSS porte chaque lettre. `node scripts/scene-build.mjs`
régénère le SVG dans `aerodrome.html` (entre les repères `scene:start` et
`scene:end`) ; ne pas modifier le SVG à la main. Les couleurs — jour, aube,
crépuscule, nuit — vivent dans `styles.css`. Pour juger avant de pousser :
`node scripts/scene-preview.mjs dossier` écrit huit aperçus (nu / tout posé × quatre
moments).

## Les chiffres de l'économie

Les chiffres du § 4.5 de la [Conception](docs/CONCEPTION.md) se rejouent avec
`scripts/simulation.mjs` : des joueurs fictifs passent par le code du serveur (tirage,
vols, imprévus, achats, chantiers, routes), chacun dans sa base en mémoire. Le tableau
du § 4.4 (le hangar attend son pilote), lui, a été mesuré avant que chaque contrat paie
un quart de plus, avec l'outil de l'étude dont celui-ci est tiré : l'outil du dépôt ne
le rejoue pas au chiffre près.

```
npm run simulation -- --liste
npm run simulation -- --profil une-heure --scenario neuf --joueurs 60 --jours 45
```

`--profil` dit quand le joueur passe, aux heures de Paris (`une-heure`, `deux-passages`,
`realiste`…), `--scenario` d'où part la compagnie (`neuf`, ou une flotte figée : ni
achat, ni embauche, ni chantier, ni route nouvelle), `--politique` ce qu'il achète,
`--graine` quelle série de joueurs (le même nom rend le même résultat, au chiffre près).
Le résultat est un JSON en français. Le robot joue sans jamais se tromper : **ses
chiffres sont un plafond**, pas ceux d'un joueur ; seuls les écarts entre deux mesures
se transposent. Une mesure de 60 joueurs prend de moins d'une minute (une Grive sur
30 jours : 34 s) à plus de cinq minutes (60 jours, une flotte qui grandit : 5 min 24 s) :
le temps croît avec les jours, la flotte et la longueur des passages (mesuré le 31 octobre
2026 sur quatre cœurs, deux mesures à la fois). N'en lancez pas plus de deux à la fois
sur une petite machine.

`scripts/simulation.test.mjs` fige un résultat court (trois joueurs neufs, sept jours).
S'il casse, une règle de l'économie a changé : re-mesurez les chiffres de la Conception
avec l'outil, puis mettez à jour le test, dans la même pull request. L'inverse ne vaut
pas : le test ne voit que ce qui joue dans la première semaine. Une règle qui joue plus
tard (le prix du Pic, l'atelier, l'Archipel, l'hiver) ne le fait pas casser : après
elle, re-mesurez le § 4.5 avec l'outil sans attendre le test.

## Licences des dépendances

Seules MIT, BSD-2/3, Apache-2.0, ISC, 0BSD, CC0 et OFL sont acceptées. Une dépendance
sous GPL, LGPL, SSPL, BUSL ou sans licence claire sera refusée par la CI. Si votre
contribution en nécessite une, expliquez pourquoi dans l'issue avant d'écrire le code.

## Ressources créatives

Les graphismes, musiques et textes sont sous droits réservés (voir
[ASSETS-LICENSE.md](ASSETS-LICENSE.md)). N'ajoutez aucune ressource dont vous n'êtes
pas l'auteur, et ne soumettez pas de ressource générée à partir d'une œuvre existante.

## Traductions

Les fichiers de langue sont les bienvenus. Traduisez depuis le français ou l'anglais,
et n'inventez pas de noms de compagnies ou de lieux par traduction littérale : chaque
langue a sa propre banque de mots, native.

## Code de conduite

Voir [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Le wiki

Le wiki GitHub est une **copie** du dossier `docs/`, publiée automatiquement par le
workflow `Wiki` après chaque fusion sur `main` qui touche la documentation. On ne
modifie jamais le wiki à la main : on modifie `docs/`, et le wiki suit. Une seule
condition, une fois : le wiki doit exister (GitHub → onglet *Wiki* → *Create the
first page* → enregistrer n'importe quoi ; la synchronisation l'écrasera).
