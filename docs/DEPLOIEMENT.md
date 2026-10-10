# Déploiement sur le NAS

Mode d'emploi du premier déploiement et des mises à jour, sur un Synology DS218+ sous
DSM 7.2 ou plus, avec Container Manager. Aucune ligne de commande n'est nécessaire.

## Ce qui est déjà en place (10 octobre 2026)

- DSM à jour, vérification en deux étapes, blocage automatique.
- Container Manager installé ; dossier partagé `docker` avec un sous-dossier `altiplume`.
- Tunnel Cloudflare `nas-altiplume` créé, **connecté et sain**, avec une route publiée
  `altiplume.com → http://api:3000`.
- Un conteneur **temporaire** `altiplume-tunnel`, créé à la main pour amorcer le tunnel.
  Il sera remplacé par celui du projet (étape 4) — ne pas en avoir deux en même temps.

## 1. Vérifier que l'image est publique

Le paquet `altiplume` hérite de la visibilité du dépôt : comme le dépôt est public,
l'image l'est aussi, sans rien faire. Pour s'en assurer : GitHub → ton profil →
**Packages** → `altiplume` → *Package settings* → la *Danger Zone* indique
« This package is currently public ». (Vérifié le 10/10/2026.)

## 2. Préparer le fichier de secrets

Sur ton ordinateur, ouvre le Bloc-notes et colle ceci, en remplaçant le jeton :

```
TUNNEL_TOKEN=eyJ...le jeton du tunnel, en entier, sans espace...
PUBLIC_ORIGIN=https://altiplume.com
```

C'est tout pour le premier déploiement : l'API n'a encore ni base de données ni
authentification. `SESSION_SECRET` et `MAIL_API_KEY` seront ajoutés quand la pull
request qui les utilise arrivera — le mode d'emploi sera mis à jour à ce moment-là.

Enregistre le fichier sous le nom **`.env`** — avec les guillemets dans la boîte de
dialogue du Bloc-notes, `".env"`, sinon Windows ajoute `.txt`. Puis dans **File
Station**, va dans `docker/altiplume` et **téléverse** ce fichier. Il est invisible
dans la liste tant que l'affichage des fichiers cachés n'est pas activé : c'est normal.

Ce fichier ne quitte jamais le NAS.

## 3. Supprimer le conteneur temporaire — AVANT de créer le projet

**Container Manager → Conteneur** : sélectionne `altiplume-tunnel`, **Action →
Arrêter**, puis **Action → Supprimer**. Le projet va créer un conteneur du même nom ;
tant que l'ancien existe, Docker refusera de créer le nouveau (*name already in use*).
Pendant une minute, `altiplume.com` répondra une erreur de tunnel : c'est attendu.

## 4. Créer le projet

**Container Manager → Projet → Créer.**

- Nom du projet : `altiplume`
- Chemin : `/docker/altiplume`
- Source : *Créer docker-compose.yml*, puis colle le contenu de
  https://raw.githubusercontent.com/regis57/altiplume/main/docker-compose.yml
  (ouvre l'adresse, tout sélectionner, copier).
- Portail web : **ne rien configurer**.

Valide. Container Manager télécharge les deux images et démarre les deux conteneurs.

## 5. Vérifier

Dans un navigateur : `https://altiplume.com/healthz` doit afficher `{"status":"ok"}`.

Sur la page du tunnel chez Cloudflare : **Active replicas : 1**, statut **Healthy**.

Dans Container Manager, les deux conteneurs sont verts. Le journal de `altiplume-api`
affiche *Server listening*.

## Mettre à jour

Chaque fusion sur `main` publie une nouvelle image `latest`. Pour l'appliquer :

**Container Manager → Projet → altiplume → Action → Arrêter**, puis **Action →
Nettoyer** (supprime les conteneurs, pas les données), puis **Action → Construire**.
Container Manager retélécharge `latest` et redémarre. Les données restent dans le
volume `altiplume-data`.

Pour automatiser : **Panneau de configuration → Planificateur de tâches → Créer →
Tâche planifiée → Script défini par l'utilisateur**, utilisateur `root`, tous les
jours à 5 h, script :

```
cd /volume1/docker/altiplume && docker compose pull --quiet && docker compose up -d --remove-orphans
```

À n'activer qu'une fois le premier déploiement validé à la main.

## Revenir en arrière

Chaque image porte aussi une étiquette `sha-xxxxxxxxxxxx` correspondant au commit.
Pour revenir à une version précise : dans le `docker-compose.yml` du projet, remplace
`:latest` par `:sha-...` (visible dans l'onglet *Actions* du dépôt, résumé du
workflow *Release*), puis Arrêter → Nettoyer → Construire.

## Vérifier la provenance d'une image

Depuis n'importe quel ordinateur disposant de l'outil `gh` de GitHub :

```
gh attestation verify oci://ghcr.io/regis57/altiplume:latest --owner regis57
```

La commande confirme que l'image a été construite par le workflow *Release* de ce
dépôt, à partir d'un commit précis, et n'a pas été modifiée depuis. Le NAS lui-même ne
fait pas encore cette vérification au démarrage : c'est une amélioration prévue.

## Sauvegarde

La base SQLite vit dans le volume `altiplume-data`. Tant qu'elle n'existe pas encore
(il n'y a pas d'authentification ni de partie sauvegardée), il n'y a rien à
sauvegarder. La procédure — copie cohérente de la base vers `docker/altiplume/backups`
puis Hyper Backup — sera ajoutée avec la pull request qui introduit la base.

## En cas de problème

- `altiplume.com` répond **502** : le conteneur `api` ne tourne pas, ou le tunnel du
  projet ne le voit pas. Vérifie que les deux conteneurs sont dans le même projet.
- `altiplume.com` répond **530** ou *Tunnel error* : aucun connecteur n'est relié.
  Regarde le journal du conteneur `altiplume-tunnel`.
- Le conteneur `api` redémarre en boucle : son journal dit pourquoi. Le plus souvent,
  une variable manquante dans `.env`.
- Le téléchargement de l'image échoue avec *denied* ou *unauthorized* : l'image est
  restée privée. Retour à l'étape 1.
