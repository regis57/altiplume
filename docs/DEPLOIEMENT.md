# Déploiement sur le NAS

Mode d'emploi du premier déploiement et des mises à jour, sur un Synology DS218+ sous
DSM 7.2 ou plus, avec Container Manager. Aucune ligne de commande n'est nécessaire.

> **`<nom-de-domaine>`** : à remplacer partout par votre domaine. Pour l'instance de
> l'auteur, c'est `altiplume.com` (voir le [README](https://github.com/regis57/altiplume#readme)).
>
> **L'image et le dépôt sont ceux de l'auteur.** `ghcr.io/regis57/altiplume` est l'image
> publiée par ce dépôt-ci. Pour faire tourner votre propre version, faites votre copie du
> dépôt (*fork*) et activez-y les Actions : sa CI publiera l'image `ghcr.io/<votre-compte>/<votre-depot>` à chaque
> fusion sur `main`. Puis remplacez, partout dans cette page :
> - `ghcr.io/regis57/altiplume` par votre image, dans le `docker-compose.yml` (ligne
>   `image:` du service `api`) et dans Container Manager ;
> - l'adresse brute du `docker-compose.yml` (`raw.githubusercontent.com/regis57/altiplume/…`)
>   par celle de votre dépôt ;
> - `--owner regis57` par votre compte, pour vérifier la provenance de l'image ;
> - dans `packages/client/build.mjs`, la valeur par défaut `'https://altiplume.com'` (ligne
>   `const origin = …`) par `https://<nom-de-domaine>`. Cette adresse est écrite dans les
>   pages au moment où la CI construit l'image (adresse canonique, langues, aperçus des
>   liens partagés) ; le `PUBLIC_ORIGIN` du `.env` n'agit qu'au démarrage du serveur et
>   n'y change rien.

## Ce qui est déjà en place (10 octobre 2026)

- DSM à jour, vérification en deux étapes, blocage automatique.
- Container Manager installé ; dossier partagé `docker` avec un sous-dossier `altiplume`.
- Tunnel Cloudflare `nas-altiplume` créé, **connecté et sain**, avec une route publiée
  `<nom-de-domaine> → http://api:3000`.
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
le domaine `<nom-de-domaine>` comme expéditeur (DKIM).

Sur ton ordinateur, ouvre le Bloc-notes et colle ceci, en remplaçant les valeurs :

```
TUNNEL_TOKEN=eyJ...le jeton du tunnel, en entier, sans espace...
PUBLIC_ORIGIN=https://<nom-de-domaine>
MAIL_API_KEY=xkeysib-...la clé d'API Brevo...
MAIL_FROM=courrier@<nom-de-domaine>
MAIL_CONTACT=bonjour@<nom-de-domaine>
```

`MAIL_FROM` doit être une adresse du domaine déclaré chez Brevo. `MAIL_CONTACT` est
la boîte qui reçoit le formulaire de contact — par exemple `bonjour@<nom-de-domaine>`,
redirigée vers la boîte personnelle de l'éditeur par Cloudflare Email Routing.
Laissée vide, la page de contact se déclare simplement indisponible.

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
Pendant une minute, `<nom-de-domaine>` répondra une erreur de tunnel : c'est attendu.

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

Dans un navigateur : `https://<nom-de-domaine>/healthz` doit afficher `{"status":"ok"}`, et
`https://<nom-de-domaine>/` la page d'accueil avec l'enveloppe d'inscription. Inscris-toi
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
5. Vérifier `https://<nom-de-domaine>/healthz`.

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

Les passkeys sont liées au domaine `<nom-de-domaine>` : une clé créée sur le site
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

Chaque image porte aussi une étiquette `sha-xxxxxxxxxxxx` correspondant au commit
(visible dans l'onglet *Actions* du dépôt, résumé du workflow *Release* de cette
version). Pour revenir à une version précise :

1. **File Station →** `docker/altiplume` **→** `docker-compose.yml` **→ clic droit →
   Modifier.** Dans la ligne `image: ghcr.io/regis57/altiplume:latest`, remplacer
   `:latest` par `:sha-xxxxxxxxxxxx`, puis enregistrer.
2. **Planificateur de tâches →** sélectionner **Altiplume - redéployer → Exécuter →
   Oui.** La tâche retélécharge l'image nommée dans le fichier et recrée les
   conteneurs ; le fichier de sortie doit se terminer par `== OK — exit 0`.
3. Vérifier `https://<nom-de-domaine>/healthz`, puis `https://<nom-de-domaine>/v1/version` :
   son champ `revision` commence par les mêmes caractères que l'étiquette choisie.

Pour revenir ensuite à la dernière version : remettre `:latest` dans le fichier (étape 1),
puis relancer la tâche (étape 2).

Cette procédure n'a pas encore été essayée sur le NAS : reste à constater.

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
sort du conteneur, vérifie son intégrité avec la même image Node, et garde les trois
dernières (`GARDER=3`, décidé le 14 octobre : voir ci-dessous). Le jeu ne s'arrête pas.

### Combien de temps on garde (décidé le 14 octobre 2026)

**Trois copies sur le NAS, trois versions sur le disque USB.** Un compte effacé disparaît
donc des sauvegardes au plus tard 6 jours après (3 sur le NAS, puis 3 sur le disque) ; la
page de confidentialité et le registre le disent. Conséquence à connaître : on ne peut
revenir qu'à trois jours en arrière. Un mal découvert plus tard n'a plus de copie saine.
`GARDER=3` est dans `scripts/nas-backup.sh` ; **le script collé dans la tâche planifiée
du NAS ne change pas tout seul** : après chaque modification du fichier, recoller son
contenu dans la tâche « Altiplume - sauvegarde » (Planificateur de tâches → Modifier →
Paramètres de tâche), cliquer **OK**, puis **vérifier** : rouvrir la tâche, lire la ligne
`GARDER=`, et l'exécuter une fois (Exécuter) ; la sortie liste les copies supprimées.
Le 14 octobre, le recollage n'avait pas été enregistré, et personne ne l'a vu avant le 15.

### L'alarme de sauvegarde : prévue dans le script, **non activée**

À la toute fin de `nas-backup.sh`, une fois la copie faite et son intégrité vérifiée, le
script peut appeler une adresse de surveillance (un « check » chez un service comme
Healthchecks.io ; le moniteur Heartbeat d'UptimeRobot est payant). Si le signal manquait un
jour, le service enverrait un courriel. L'adresse est un secret : elle serait lue dans un
fichier du NAS, `/volume1/docker/altiplume/alarme-sauvegarde.url`, jamais dans le dépôt.

**Décision de l'auteur, le 15 octobre 2026 : on ne l'active pas.** Sans ce fichier, le script
n'envoie rien et le dit dans sa sortie ; le code reste là, inactif, et ne gêne pas la
sauvegarde. Les trois cas qu'il aurait couverts sont déjà vus autrement :

- la tâche qui échoue : DSM prévient l'auteur ;
- une coupure de courant : l'onduleur prévient l'auteur ;
- le site ou le NAS qui ne répond plus : UptimeRobot, de l'extérieur (voir [Sécurité](Securite)).

Reste un trou, minuscule : la tâche désactivée ou supprimée par erreur alors que le site
tourne. Le test de restauration trimestriel le révélerait au plus tard en trois mois, pour
une copie de trois jours. Pour l'activer un jour : créer le check, mettre son adresse en une
ligne dans le fichier (droits `600`), recoller le script dans la tâche, la lancer à la main
(la sortie finit par « alarme : signal envoyé »).

### Hors du NAS

Un disque qui meurt emporte le volume *et* le dossier de sauvegardes. Depuis le 14 octobre
2026, une tâche **Hyper Backup**, nommée `altiplume`, en fait chaque jour une copie
**chiffrée** sur un disque USB branché au NAS. Elle se lance à **03:05** : après la copie
du jeu (03:00), qui ne prend que quelques secondes. Les copies font quelques centaines de
kilo-octets : n'importe quel disque convient.

Pour la refaire (nouveau disque, nouveau NAS) :

1. Brancher le disque ; **Panneau de configuration → Périphérique externe** : il doit
   apparaître. Le formater (**ext4**) s'il est neuf ; le formatage efface tout.
2. **Hyper Backup → + → Tâche de sauvegarde de données →** destination dossier local /
   USB (le dossier partagé du disque, répertoire `altiplume`).
3. Dossiers : déplier `docker` → `altiplume` et ne cocher **que** `sauvegardes`. Ne jamais
   cocher `altiplume` ni `docker` en entier : le `.env` (jeton du tunnel, clé d'envoi des
   courriels, clés VAPID) ne doit pas quitter le NAS. Applications : aucune.
4. **Chiffrement côté client** coché, avec un mot de passe long, rangé dans le gestionnaire
   de mots de passe **avant** de continuer : sans lui, la copie est illisible, et il n'existe
   aucune récupération.
5. Planification : tous les jours à 03:05.
6. **Rotation : « depuis les versions les plus anciennes », 3 versions.** Pas « Smart
   Recycle » : chaque version contient déjà les trois copies de la base ; Smart Recycle
   en garderait des versions pendant des mois, alors que la page de confidentialité annonce
   6 jours au plus. Cette règle se relit contre la page de confidentialité à chaque changement.
7. Premier lancement, puis vérifier la taille (quelques kilo-octets, pas des gigaoctets :
   sinon trop de dossiers cochés) et la liste des versions (icône horloge).

À la création de la tâche, la rotation avait été laissée en Smart Recycle ; elle a été
corrigée le soir même (point 6), voir [Sécurité](Securite).

Les secrets ne sont pas dans cette copie, volontairement. Avec un NAS neuf : le jeton du
tunnel se récupère chez Cloudflare, la clé d'envoi des courriels se régénère chez Brevo,
les clés VAPID se refont avec `scripts/nas-vapid.sh`.

### Restaurer

**Il n'existe pas encore de procédure sans ligne de commande.** La base vit dans un
volume Docker, hors des dossiers partagés que File Station montre ; la seule
procédure écrite demande d'activer SSH le temps de l'opération et de taper une
commande. Reste à faire : un script collé dans une tâche planifiée, comme pour le
redéploiement, puis un essai sur une copie. En attendant, la procédure, pour qui a une
ligne de commande :

1. **Container Manager → Projet → `altiplume` → Action → Arrêt.**
2. Dans un terminal sur le NAS (SSH activé le temps de l'opération, désactivé après) :
   ```
   sudo docker run --rm -v altiplume_altiplume-data:/data -v /volume1/docker/altiplume/sauvegardes:/s:ro alpine \
     sh -c 'rm -f /data/altiplume.db-wal /data/altiplume.db-shm && cp /s/altiplume-AAAAMMJJ-HHMM.db /data/altiplume.db && chown 1000:1000 /data/altiplume.db'
   ```
3. **Projet → Démarrer**, puis `https://<nom-de-domaine>/healthz`.

À tester une fois par trimestre, sur une copie, pour être sûr que ça marche le jour
où on en aura besoin. Noter la date du test ici :

| Date | Ce qui a été essayé | Résultat |
|---|---|---|
| 14 octobre 2026 | Restauration d'essai depuis la tâche Hyper Backup `altiplume` (disque USB) | Réussi |
| 14 octobre 2026 | Lecture de la fenêtre de la tâche : dossiers copiés, rotation | Seul `sauvegardes` est coché ; rotation « versions les plus anciennes », 3 versions |

Une restauration réelle ramène aussi les comptes effacés depuis la copie : le jeu ne garde
volontairement aucune liste de comptes effacés, donc on ne sait pas lesquels reviendraient.
Avant de rouvrir le jeu après une restauration réelle, décider comment traiter ce point.

## En cas de problème

- `<nom-de-domaine>` répond **502** : le conteneur `api` ne tourne pas, ou le tunnel du
  projet ne le voit pas. Vérifie que les deux conteneurs sont dans le même projet.
- `<nom-de-domaine>` répond **530** ou *Tunnel error* : aucun connecteur n'est relié.
  Regarde le journal du conteneur `altiplume-tunnel`.
- Le conteneur `api` redémarre en boucle : son journal dit pourquoi. Le plus souvent,
  une variable manquante dans `.env`.
- Le téléchargement de l'image échoue avec *denied* ou *unauthorized* : l'image est
  restée privée. Retour à l'étape 1.
