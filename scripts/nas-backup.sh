#!/bin/sh
# Sauvegarde quotidienne de la base d'Altiplume, en tâche planifiée DSM (root).
#
# La base est en mode WAL : copier le fichier à chaud donnerait une sauvegarde
# incohérente. On demande donc à SQLite lui-même, DANS le conteneur, de produire
# une copie cohérente (API de sauvegarde en ligne), puis on la sort du conteneur.
# Les trois dernières sont gardées. Le jeu ne s'arrête pas.
set -eu

DOCKER=/usr/local/bin/docker
DEST=/volume1/docker/altiplume/sauvegardes
GARDER=3

mkdir -p "$DEST"
horodatage=$(date '+%Y%m%d-%H%M')
echo "== Altiplume : sauvegarde $horodatage"

# 1. SQLite écrit la copie dans le volume de données (le /tmp du conteneur est un
#    tmpfs que `docker cp` ne voit pas — appris le 11/10).
$DOCKER exec altiplume-api node --no-warnings=ExperimentalWarning -e '
  const { DatabaseSync, backup } = require("node:sqlite");
  const db = new DatabaseSync("/data/altiplume.db", { readOnly: true });
  backup(db, "/data/.sauvegarde.db").then((pages) => { console.log("pages copiées :", pages); db.close(); });
'
# 2. On sort la copie du volume par un conteneur jetable qui monte le même volume.
VOLUME=$($DOCKER inspect altiplume-api -f '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}')
[ -n "$VOLUME" ] || { echo "ERREUR : volume de données introuvable"; exit 1; }
$DOCKER run --rm -v "$VOLUME:/data" -v "$DEST:/s" alpine \
  sh -c "mv /data/.sauvegarde.db /s/altiplume-$horodatage.db && chown 1000:1000 /s/altiplume-$horodatage.db && chmod 600 /s/altiplume-$horodatage.db"
echo "copie : $DEST/altiplume-$horodatage.db"

# Contrôle d'intégrité de la copie, avec la même image Node. La base est en mode WAL :
# même en lecture seule, SQLite veut écrire un fichier -shm à côté, donc on l'ouvre
# depuis une copie dans un dossier accessible en écriture, jamais depuis le dossier
# de sauvegardes (monté en lecture seule).
$DOCKER run --rm -v "$DEST:/s:ro" ghcr.io/regis57/altiplume:latest sh -c '
  cp "/s/$1" /tmp/controle.db && node --no-warnings=ExperimentalWarning -e "
    const { DatabaseSync } = require(\"node:sqlite\");
    const db = new DatabaseSync(\"/tmp/controle.db\");
    const ok = db.prepare(\"PRAGMA integrity_check\").get().integrity_check;
    const joueurs = db.prepare(\"SELECT count(*) AS n FROM players\").get().n;
    console.log(\"intégrité :\", ok, \"— joueurs :\", joueurs);
    if (ok !== \"ok\") process.exit(1);
  "
' -- "altiplume-$horodatage.db"

# Rotation.
ls -1t "$DEST"/altiplume-*.db | tail -n +$((GARDER + 1)) | while read -r vieux; do rm -f "$vieux"; echo "   supprimée : $vieux"; done
ls -lh "$DEST" | tail -n 3
echo "== OK — exit 0"
exit 0
