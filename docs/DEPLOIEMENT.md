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

## 1. Rendre l'image publique (une seule fois)

Après la première exécution du workflow *Release* sur `main`, l'image existe sur le
registre GitHub mais elle est **privée par défaut**, et le NAS ne pourrait pas la
télécharger.

GitHub → ton profil → **Packages** → `altiplume` → **Package settings** (en bas à
droite) → *Danger Zone* → **Change visibility** → **Public**.

Il n'y a rien de secret dans l'image : c'est le même code que le dépôt, déjà public.

## 2. Préparer le fichier de secrets

Sur ton ordinateur, ouvre le Bloc-notes et colle ceci, en remplaçant les valeurs :

```
TUNNEL_TOKEN=eyJ...le jeton du tunnel, en entier...
SESSION_SECRET=...64 caractères hexadécimaux, voir ci-dessous...
MAIL_API_KEY=
MAIL_FROM=courrier@altiplume.com
PUBLIC_ORIGIN=https://altiplume.com
```

Pour `SESSION_SECRET`, un générateur de mots de passe réglé sur 64 caractères
hexadécimaux convient ; sinon, demande-le-moi et je t'en produis un que tu colleras.
`MAIL_API_KEY` reste vide tant que Brevo n'est pas branché.

Enregistre le fichier sous le nom **`.env`** — avec les guillemets dans la boîte de
dialogue du Bloc-notes, `".env"`, sinon Windows ajoute `.txt`. Puis dans **File
Station**, va dans `docker/altiplume` et **téléverse** ce fichier. Il est invisible
dans la liste tant que l'affichage des fichiers cachés n'est pas activé : c'est normal.

Ce fichier ne quitte jamais le NAS.

## 3. Créer le projet

**Container Manager → Projet → Créer.**

- Nom du projet : `altiplume`
- Chemin : `/docker/altiplume`
- Source : *Créer docker-compose.yml*, puis colle le contenu du fichier
  `docker-compose.yml` du dépôt (copie-le depuis GitHub, bouton *Raw*).
- Portail web : **ne rien configurer**.

Valide. Container Manager télécharge les deux images et démarre les deux conteneurs.

## 4. Supprimer le conteneur temporaire

**Container Manager → Conteneur** : arrête puis supprime l'ancien `altiplume-tunnel`
créé à la main, s'il existe encore avec ce nom hors du projet. Le projet en contient
un nouveau avec le même jeton ; en garder deux ferait échouer une requête sur deux,
car l'ancien ne connaît pas le conteneur `api`.

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
