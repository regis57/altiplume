#!/bin/sh
# Redéploiement d'Altiplume sur le Synology, en une tâche planifiée (DSM → Panneau de
# configuration → Planificateur de tâches → Script défini par l'utilisateur, en root).
#
# Fait exactement ce que la procédure manuelle faisait, sans clic :
#   1. arrête le projet et nettoie ses conteneurs ;
#   2. supprime les images ghcr.io/regis57/altiplume et cloudflare/cloudflared locales ;
#   3. retélécharge les images et recrée les conteneurs depuis docker/altiplume ;
#   4. vérifie /healthz DANS le conteneur (aucun port n'est publié) et finit en « exit 0 ».
#
# Le volume de données (altiplume-data) et le fichier .env ne sont jamais touchés.
set -eu

PROJET=/volume1/docker/altiplume
COMPOSE="/usr/local/bin/docker-compose -p altiplume"
DOCKER=/usr/local/bin/docker

echo "== Altiplume : redéploiement $(date '+%Y-%m-%d %H:%M:%S')"
cd "$PROJET"
[ -f .env ] || { echo "ERREUR : $PROJET/.env introuvable"; exit 1; }

echo "-- 1/4 arrêt et nettoyage du projet"
$COMPOSE down --remove-orphans

echo "-- 2/4 suppression des images locales"
for img in ghcr.io/regis57/altiplume:latest cloudflare/cloudflared:latest; do
  $DOCKER image rm -f "$img" >/dev/null 2>&1 && echo "   supprimée : $img" || echo "   absente   : $img"
done

echo "-- 3/4 téléchargement et recréation"
$COMPOSE pull --quiet
$COMPOSE up -d --force-recreate

echo "-- 4/4 vérification"
i=0
until [ "$($DOCKER inspect -f '{{.State.Health.Status}}' altiplume-api 2>/dev/null)" = "healthy" ]; do
  i=$((i + 1))
  if [ "$i" -gt 30 ]; then
    echo "ERREUR : altiplume-api n'est pas sain après 60 s. Journal :"
    $DOCKER logs --tail 40 altiplume-api
    exit 1
  fi
  sleep 2
done
$DOCKER exec altiplume-api wget -qO- http://127.0.0.1:3000/healthz; echo
$COMPOSE ps
$DOCKER image prune -f >/dev/null
echo "== OK — exit 0"
exit 0
