#!/usr/bin/env bash
# Vérifie une image de l'API, telle qu'elle sera servie : elle démarre et répond,
# n'embarque aucun gestionnaire de paquets, n'a aucune faille critique déjà corrigée
# en amont, et aucun secret, quelle que soit sa gravité.
#
# Appelé deux fois par .github/workflows/release.yml : sur l'image construite
# localement (toute PR, tout commit), puis, sur `main`, sur l'image PUBLIÉE, prise
# par son empreinte, avant qu'elle ne reçoive l'étiquette `latest` que le NAS
# télécharge. Une seconde construction n'est jamais tout à fait la première : c'est
# celle qui part qu'on vérifie.
#
# Usage : scripts/verifier-image.sh <image> <chemin de trivy>
set -euo pipefail

image="$1"
trivy="$2"

echo "== L'image démarre et répond : ${image}"
id=$(docker run -d --read-only --tmpfs /tmp -p 3000:3000 \
  -e PUBLIC_ORIGIN=https://altiplume.test -e MAIL_API_KEY=factice-pour-le-test \
  "$image")
ok=0
for _ in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:3000/healthz; then ok=1; break; fi
  sleep 1
done
echo
docker logs "$id"
docker rm -f "$id" >/dev/null
[ "$ok" = "1" ] || { echo "L'image ne répond pas sur /healthz."; exit 1; }

echo "== Aucun gestionnaire de paquets"
docker run --rm --entrypoint sh "$image" -c \
  'for c in npm npx corepack yarn; do if command -v "$c"; then echo "$c est encore là"; exit 1; fi; done'

echo "== Trivy : aucune faille critique corrigée en amont"
"$trivy" image --quiet --timeout 10m \
  --scanners vuln --severity CRITICAL --ignore-unfixed \
  --exit-code 1 "$image"

# Un secret bloque quelle que soit sa gravité. Sous le filtre « critique », Trivy
# laissait passer une clé privée (classée « élevée ») et une clé Brevo (« basse »).
echo "== Trivy : aucun secret, quelle que soit sa gravité"
"$trivy" image --quiet --timeout 10m \
  --skip-db-update \
  --scanners secret \
  --exit-code 1 "$image"
