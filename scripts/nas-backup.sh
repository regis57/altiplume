#!/bin/sh
# Sauvegarde quotidienne de la base d'Altiplume, en tâche planifiée DSM (root).
#
# La base est en mode WAL : copier le fichier à chaud donnerait une sauvegarde
# incohérente. On demande donc à SQLite lui-même, DANS le conteneur, de produire
# une copie cohérente (API de sauvegarde en ligne), puis on la sort du conteneur.
# Les trente dernières sont gardées. Le jeu ne s'arrête pas.
set -eu

DOCKER=/usr/local/bin/docker
DEST=/volume1/docker/altiplume/sauvegardes
GARDER=30

mkdir -p "$DEST"
horodatage=$(date '+%Y%m%d-%H%M')
echo "== Altiplume : sauvegarde $horodatage"

$DOCKER exec altiplume-api node --no-warnings=ExperimentalWarning -e '
  const { DatabaseSync, backup } = require("node:sqlite");
  const db = new DatabaseSync("/data/altiplume.db", { readOnly: true });
  backup(db, "/tmp/sauvegarde.db").then((pages) => { console.log("pages copiées :", pages); db.close(); });
'
$DOCKER cp altiplume-api:/tmp/sauvegarde.db "$DEST/altiplume-$horodatage.db"
$DOCKER exec altiplume-api rm -f /tmp/sauvegarde.db

# Contrôle d'intégrité de la copie, hors conteneur, avec la même image Node.
$DOCKER run --rm -v "$DEST:/s:ro" ghcr.io/regis57/altiplume:latest node --no-warnings=ExperimentalWarning -e '
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(process.argv[1], { readOnly: true });
  const ok = db.prepare("PRAGMA integrity_check").get().integrity_check;
  const joueurs = db.prepare("SELECT count(*) AS n FROM players").get().n;
  console.log("intégrité :", ok, "— joueurs :", joueurs);
  if (ok !== "ok") process.exit(1);
' "/s/altiplume-$horodatage.db"

# Rotation.
ls -1t "$DEST"/altiplume-*.db | tail -n +$((GARDER + 1)) | while read -r vieux; do rm -f "$vieux"; echo "   supprimée : $vieux"; done
ls -lh "$DEST" | tail -n 3
echo "== OK — exit 0"
exit 0
