#!/bin/sh
# Génère la paire de clés VAPID des notifications, sur le NAS, sans rien installer :
# la même image Node que le jeu fait le calcul. À lancer UNE fois (tâche planifiée,
# root, non activée, « Enregistrer les résultats de sortie »), puis coller les deux
# lignes dans /volume1/docker/altiplume/.env et redéployer.
#
# La clé privée est un secret : ne la collez nulle part ailleurs que dans .env.
set -eu
/usr/local/bin/docker run --rm ghcr.io/regis57/altiplume:latest node --no-warnings=ExperimentalWarning -e '
  const { createECDH } = require("node:crypto");
  const ecdh = createECDH("prime256v1"); ecdh.generateKeys();
  console.log("VAPID_PUBLIC_KEY=" + ecdh.getPublicKey().toString("base64url"));
  console.log("VAPID_PRIVATE_KEY=" + ecdh.getPrivateKey().toString("base64url"));
'
echo "== OK — exit 0"
