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

## Ce que la CI vérifie

`lint` (ESLint), `typecheck` (TypeScript strict), `test` (Vitest), `audit`
(vulnérabilités des dépendances), `licenses` (licences autorisées uniquement).

En plus, et à la main : `npm run e2e` joue dans un vrai Chromium le parcours complet
des passkeys et de la connexion par QR (avec un authenticateur virtuel), celui du
courrier, et celui de la Côte de Saline (route, ponton, Sterne, amerrissage). Il faut un
Chromium (`CHROMIUM_PATH=/chemin/vers/chromium`, ou `npx playwright install chromium`).
Lancez-le avant toute PR qui touche à l'authentification ou au client.

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
