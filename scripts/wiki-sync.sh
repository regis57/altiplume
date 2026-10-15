#!/bin/sh
# Publie la documentation dans le wiki GitHub du dépôt. Appelé par la CI après
# chaque fusion sur main qui touche docs/ ; utilisable aussi à la main.
#
#   scripts/wiki-sync.sh <dossier-du-wiki-cloné>
#
# Le wiki est un second dépôt Git (altiplume.wiki.git). On y copie les documents
# sous des noms de page lisibles, on génère l'accueil, et on ne pousse que s'il y a
# un changement. Les pages du wiki sont une copie : la source reste docs/.
set -eu
WIKI="${1:?dossier du wiki}"

copy() { # <source> <page>
  {
    printf '%s\n\n' "> _Copie publiée automatiquement depuis [\`$1\`](https://github.com/regis57/altiplume/blob/main/$1) — modifier là-bas, pas ici._"
    cat "$1"
  } > "$WIKI/$2.md"
}

copy docs/LES-24-HEURES.md "Les-24-heures"
copy docs/JOUR-2.md     "Jour-2"
copy docs/JOUR-3.md     "Jour-3"
copy docs/JOUR-4.md     "Jour-4"
copy docs/JOUR-5.md     "Jour-5"
copy docs/JOURNAL.md    "Journal"
copy docs/COUTS.md      "Couts"
copy docs/MONDE.md      "Monde"
copy docs/CONCEPTION.md "Conception"
copy docs/DEMARRAGE.md  "Demarrage"
copy docs/DEPLOIEMENT.md "Deploiement"
copy docs/SECURITE.md   "Securite"
copy docs/legal/registre-traitements.md "Registre-des-traitements"

cat > "$WIKI/Home.md" <<'HOME'
# Altiplume — le wiki

Un petit aérodrome postal des années 1930, dans un monde inventé. Jeu web cozy,
gratuit, sans mot de passe. Le jeu : [altiplume.com](https://altiplume.com). Le code
(AGPL-3.0) : [github.com/regis57/altiplume](https://github.com/regis57/altiplume).

- **[Les 24 heures](Les-24-heures)** — le résumé : chronologie, décisions clefs, échanges structurants.
- **[Jour 2](Jour-2)** — le deuxième jour : faire grandir le jeu sans rien casser, puis tout passer au crible.
- **[Jour 3](Jour-3)** — le troisième jour : la sécurité, ce qui tient par construction et ce qui se vérifie sans cesse.
- **[Jour 4](Jour-4)** — le quatrième jour : les cartes disent vrai, ce que le jeu raconte est ce que le jeu fait.
- **[Jour 5](Jour-5)** — le cinquième jour : le jeu montre le chemin, la route la plus proche et ce qui en sépare.
- **[Journal](Journal)** — le récit de l'aventure, chapitre par chapitre.
- **[Coûts](Couts)** — ce que le projet coûte, euro par euro, et le temps passé.
- **[Monde](Monde)** — les Vallées de Brume, les pilotes, les avions, les cartes.
- **[Conception](Conception)** — le document de conception.
- **[Démarrage](Demarrage)** — comment le projet a été mis en route.
- **[Déploiement](Deploiement)** — le NAS, le tunnel, les tâches planifiées.
- **[Sécurité](Securite)** — vérifiée de l'extérieur (les notes A+) et de l'intérieur (Trivy, ZAP, Opengrep, Socket), ce qu'il reste à faire.
- **[Registre des traitements](Registre-des-traitements)** — RGPD.

_Ces pages sont des copies publiées automatiquement depuis le dossier `docs/` du
dépôt. Pour corriger, modifier là-bas : le wiki suivra à la prochaine fusion._
HOME

cat > "$WIKI/_Sidebar.md" <<'SIDE'
**Altiplume**
- [Accueil](Home)
- [Les 24 heures](Les-24-heures)
- [Jour 2](Jour-2)
- [Jour 3](Jour-3)
- [Jour 4](Jour-4)
- [Jour 5](Jour-5)
- [Journal](Journal)
- [Coûts](Couts)
- [Monde](Monde)
- [Conception](Conception)
- [Démarrage](Demarrage)
- [Déploiement](Deploiement)
- [Sécurité](Securite)
- [Registre RGPD](Registre-des-traitements)
SIDE
echo "wiki : $(ls "$WIKI"/*.md | wc -l) pages préparées"
