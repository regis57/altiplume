# syntax=docker/dockerfile:1

# Image de l'API et du client. Construite pour tourner sur un NAS : petite, non-root,
# compatible avec un système de fichiers en lecture seule.
#
# Les étiquettes seront remplacées par des empreintes (sha256:...) une fois la
# chaîne de publication en place ; Dependabot suit déjà ce fichier.

# --- Étape 1 : construire le client (a besoin des dépendances de développement)
FROM node:22.22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN npm ci --ignore-scripts
COPY packages/client ./packages/client
RUN npm run build

# --- Étape 2 : dépendances de production seulement
FROM node:22.22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN npm ci --omit=dev --ignore-scripts

# --- Étape 3 : image finale
FROM node:22.22-alpine AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/data/altiplume.db
WORKDIR /app

# L'utilisateur « node » existe déjà dans l'image officielle : on ne tourne pas en root.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node packages/server ./packages/server
COPY --from=build --chown=node:node /app/packages/client/dist ./packages/client/dist

# Répertoire de données, seul endroit accessible en écriture (monté en volume).
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# node:sqlite est marqué expérimental par Node 22 bien que son API soit figée :
# on neutralise l'avertissement, et rien d'autre.
CMD ["node", "--no-warnings=ExperimentalWarning", "packages/server/src/server.ts"]
