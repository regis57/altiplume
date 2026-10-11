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

Depuis la version « comptes », l'API envoie des emails de connexion : il faut un
compte **Brevo** (gratuit, 300 emails/jour) **avant** de déployer. Sans clé, le serveur
refuse de démarrer — c'est voulu : un jeu où personne ne peut s'inscrire n'a pas à
tourner. Voir DEMARRAGE.md, section Brevo, pour obtenir la clé et faire reconnaître
le domaine `altiplume.com` comme expéditeur (DKIM).

Sur ton ordinateur, ouvre le Bloc-notes et colle ceci, en remplaçant les valeurs :

```
TUNNEL_TOKEN=eyJ...le jeton du tunnel, en entier, sans espace...
PUBLIC_ORIGIN=https://altiplume.com
MAIL_API_KEY=xkeysib-...la clé d'API Brevo...
MAIL_FROM=courrier@altiplume.com
```

`MAIL_FROM` doit être une adresse du domaine déclaré chez Brevo.

Enregistre le fichier sous le nom **`.env`** — avec les guillemets dans la boîte de
dialogue du Bloc-notes, `".env"`, sinon Windows ajoute `.txt`. Puis dans **File
Station**, va dans `docker/altiplume` et **téléverse** ce fichier (remplace l'ancien
s'il existe). Il est invisible dans la liste tant que l'affichage des fichiers cachés
n'est pas activé : c'est normal.

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

Dans un navigateur : `https://altiplume.com/healthz` doit afficher `{"status":"ok"}`, et
`https://altiplume.com/` la page d'accueil avec l'enveloppe d'inscription. Inscris-toi
avec ta propre adresse : le lien doit arriver en moins d'une minute.

Sur la page du tunnel chez Cloudflare : **Active replicas : 1**, statut **Healthy**.

Dans Container Manager, les deux conteneurs sont verts. Le journal de `altiplume-api`
affiche *Server listening*.

## Mettre à jour

Chaque fusion sur `main` publie une nouvelle image `latest`. Le NAS ne se met pas à
jour tout seul ; c'est voulu tant que le projet est jeune.

Procédure constatée sur DSM 7.3 (il n'y a pas de bouton « Construire » dans cette
version ; la méthode fiable est de repartir de l'image) :

1. **Projet → `altiplume` → Action → Arrêt**, puis **Action → Nettoyer** (supprime les
   conteneurs, pas le volume de données).
2. **Image →** sélectionner `ghcr.io/regis57/altiplume` **→ Supprimer**.
3. **Projet → `altiplume` → Action → Supprimer** (le dossier, le `.env` et le volume
   restent en place).
4. **Projet → Créer** : nom `altiplume`, chemin `/docker/altiplume`, source **Utiliser un
   docker-compose.yml existant**, pas de portail web. Container Manager retélécharge
   l'image et recrée les conteneurs.
5. Vérifier `https://altiplume.com/healthz`.

Interruption de service : environ une minute. Validé le 11/10/2026 à 00 h 02.

La base de données se met à jour toute seule au démarrage (migrations versionnées) :
la version « passkeys » ajoute ses tables sans toucher aux comptes existants.

### Vérifier la version « passkeys »

1. Sur le **téléphone**, connecté : **Mon compte → Passkeys → Ajouter une passkey sur
   cet appareil**. Le téléphone demande l'empreinte ou le visage ; la clé apparaît
   dans la liste, avec un nom modifiable.
2. **Mon compte → Se déconnecter**, puis **Se connecter → Se connecter avec une
   passkey** : le téléphone demande un geste, et le compte s'ouvre sans email.
3. Sur le **PC**, page **Se connecter → Afficher un QR code pour mon téléphone**. Lire
   le QR avec l'appareil photo du téléphone (connecté) : la page « Connecter cet
   écran ? » montre les mêmes six chiffres. **Oui, c'est mon écran** : le PC passe
   sur « Mon compte » tout seul.

Les passkeys sont liées au domaine `altiplume.com` : une clé créée sur le site
public ne fonctionne pas en local, et inversement. C'est une protection contre le
hameçonnage, pas un défaut.

### En un clic : la tâche planifiée (recommandé depuis le 11/10)

La même procédure, exécutée par le NAS lui-même. À faire une fois :

1. **Panneau de configuration → Planificateur de tâches → Créer → Tâche planifiée →
   Script défini par l'utilisateur.**
2. Onglet *Général* : nom `Altiplume - redéployer`, utilisateur **root**, décocher
   *Activé* (on ne veut pas qu'elle tourne toute seule ; on la lancera à la main).
3. Onglet *Paramètres de tâche* : cocher **Enregistrer les résultats de sortie** et
   choisir un dossier (par exemple `docker/altiplume/journal`) — c'est là qu'on lira le
   `exit 0`. Optionnel : *Envoyer les détails d'exécution par e-mail*.
4. Dans **Exécuter la commande**, coller le contenu de `scripts/nas-redeploy.sh`
   (fichier du dépôt) tel quel.
5. OK. DSM prévient que le script tourne en root : c'est nécessaire pour parler à
   Docker ; accepter.

Ensuite, à chaque fusion sur `main` : **Planificateur de tâches → sélectionner la
tâche → Exécuter → Oui**. Une minute plus tard, le fichier de sortie se termine par :

```
== OK — exit 0
```

Ce que fait le script, dans l'ordre : arrêt et nettoyage du projet ; suppression des
images `ghcr.io/regis57/altiplume` et `cloudflare/cloudflared` ; nouveau téléchargement
et recréation des conteneurs depuis `docker/altiplume` (le `.env` et le volume de
données ne sont pas touchés) ; attente que le conteneur se déclare sain ; appel de
`/healthz` depuis l'intérieur du conteneur — aucun port n'est ouvert, donc c'est le seul
endroit d'où on peut le joindre. S'il échoue, il affiche les quarante dernières lignes du
journal du conteneur et finit en `exit 1`.

Si DSM ne trouve pas `/usr/local/bin/docker-compose`, remplacer dans le script
`COMPOSE="/usr/local/bin/docker-compose -p altiplume"` par
`COMPOSE="/usr/local/bin/docker compose -p altiplume"`.

### Activer les notifications « ton courrier est arrivé » (une fois)

Le jeu peut prévenir le téléphone quand un vol se pose. Il lui faut une paire de clés
(VAPID) qui l'identifie auprès des services de notification. On la génère **sur le
NAS**, sans rien installer :

1. **Planificateur de tâches → Créer → Script défini par l'utilisateur** : nom
   `Altiplume - clés VAPID`, root, *Activé* décoché, *Enregistrer les résultats de
   sortie* dans `docker/altiplume/journal`, script = contenu de `scripts/nas-vapid.sh`.
2. **Exécuter** une fois. Le fichier de sortie contient deux lignes
   `VAPID_PUBLIC_KEY=…` et `VAPID_PRIVATE_KEY=…`.
3. Ouvrir `docker/altiplume/.env` (File Station → clic droit → Modifier), coller les
   deux lignes à la fin, enregistrer. La clé privée est un secret : nulle part ailleurs.
4. Supprimer la tâche et le fichier de sortie (la clé privée y figure).
5. Lancer **Altiplume - redéployer**.

Ensuite, sur l'aérodrome, le bouton **🔔 Me prévenir à l'arrivée** apparaît. Sur
iPhone et iPad, il faut d'abord installer Altiplume sur l'écran d'accueil (Partager →
« Sur l'écran d'accueil ») : c'est une règle d'Apple, pas la nôtre.

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

La base SQLite (comptes, compagnies, vols — tout) vit dans le volume `altiplume-data`.
Depuis le 11/10, il y a de vraies données dedans : on la sauvegarde **chaque nuit**.

### La tâche planifiée (à créer une fois)

Comme pour le redéploiement : **Planificateur de tâches → Créer → Tâche planifiée →
Script défini par l'utilisateur**.

- *Général* : nom `Altiplume - sauvegarde`, utilisateur **root**, **Activé** coché.
- *Programmer* : tous les jours, **03:00**.
- *Paramètres de tâche* : *Envoyer les détails par e-mail uniquement en cas d'anomalie* ;
  *Enregistrer les résultats de sortie* dans `docker/altiplume/journal`.
- *Exécuter la commande* : le contenu de `scripts/nas-backup.sh`.

Lancer-la une fois à la main (*Exécuter*) : le dossier `docker/altiplume/sauvegardes`
doit contenir `altiplume-AAAAMMJJ-HHMM.db`, et la sortie se terminer par `== OK — exit 0`.

Ce que fait le script : il demande à SQLite, *dans* le conteneur, une copie cohérente
de la base (la base est en mode WAL ; copier le fichier à chaud serait incohérent), la
sort du conteneur, vérifie son intégrité avec la même image Node, et garde les trente
dernières. Le jeu ne s'arrête pas.

### Hors du NAS

Un disque qui meurt emporte le volume *et* le dossier de sauvegardes. Dans **Hyper
Backup**, ajouter le dossier `docker/altiplume/sauvegardes` à une tâche vers un
support externe (disque USB, autre NAS, ou un stockage distant). La tâche Hyper Backup
se planifie *après* 03:00, par exemple 04:00. Les sauvegardes font quelques centaines
de kilo-octets : n'importe quel support convient.

### Restaurer

1. Planificateur de tâches → arrêter le jeu : dans Container Manager, **Projet →
   `altiplume` → Arrêt**.
2. Dans DSM → Terminal (SSH activé le temps de l'opération, désactivé après) :
   ```
   sudo docker run --rm -v altiplume_altiplume-data:/data -v /volume1/docker/altiplume/sauvegardes:/s:ro alpine \
     sh -c 'rm -f /data/altiplume.db-wal /data/altiplume.db-shm && cp /s/altiplume-AAAAMMJJ-HHMM.db /data/altiplume.db && chown 1000:1000 /data/altiplume.db'
   ```
3. **Projet → Démarrer**, puis `https://altiplume.com/healthz`.

À tester une fois par trimestre, sur une copie, pour être sûr que ça marche le jour
où on en aura besoin. Noter la date du test ici : —

## En cas de problème

- `altiplume.com` répond **502** : le conteneur `api` ne tourne pas, ou le tunnel du
  projet ne le voit pas. Vérifie que les deux conteneurs sont dans le même projet.
- `altiplume.com` répond **530** ou *Tunnel error* : aucun connecteur n'est relié.
  Regarde le journal du conteneur `altiplume-tunnel`.
- Le conteneur `api` redémarre en boucle : son journal dit pourquoi. Le plus souvent,
  une variable manquante dans `.env`.
- Le téléchargement de l'image échoue avec *denied* ou *unauthorized* : l'image est
  restée privée. Retour à l'étape 1.
