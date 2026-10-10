# Marche à suivre — démarrage du projet

Ordre recommandé. Chaque étape est courte ; rien n'est irréversible sauf l'achat du domaine (10 €).

## 0. Choisir et verrouiller le nom (toi)

1. Choisir le nom final parmi les candidats (voir réponse du 10/10).
2. Vérifier la marque toi-même (5 min chacune, gratuit) :
   - INPI : https://data.inpi.fr → « Marques » → taper le nom.
   - EUIPO : https://euipo.europa.eu/eSearch → taper le nom.
   - Steam / itch.io / App Store : chercher le nom pour éviter un jeu homonyme.
3. Si rien de gênant dans les classes 9 (logiciels/jeux) et 41 (divertissement), le nom est bon.

## 1. Acheter le domaine (toi, 10 min, ~10 €)

1. Créer un compte Cloudflare (gratuit) avec un mot de passe unique + 2FA.
2. Domain Registration → Register → acheter le `.com` (le `.fr` en plus est facultatif, ~8 €).
3. Laisser le plan **Free** sur le site. Ne rien configurer d'autre pour l'instant.

Pourquoi Cloudflare : le tunnel vers le NAS exige que les DNS soient chez eux, et le domaine y est vendu au prix coûtant.

## 2. GitHub (toi, 20 min) — dépôt PUBLIC, plan Free, 0 €

Décision du 10/10 : public dès le départ. Sur le plan Free, les branches protégées,
CodeQL, le secret scanning et les minutes d'Actions illimitées ne sont offerts QUE sur
les dépôts publics. C'est aussi cohérent avec l'AGPL et ça ouvre le wiki tout de suite.

### 2.1 Création
- Owner : `regis57`
- Repository name : `altiplume`
- Description : `Altiplume — cozy 1930s airmail aerodrome game. Web, 8-bit, responsive.`
- Visibilité : **Public**
- Add a README file : **coché**
- Add .gitignore : **Node**
- Choose a license : **GNU Affero General Public License v3.0**

### 2.2 Settings → General
- Default branch : `main`
- Features : garder **Wikis** (le récit y vivra) et **Issues**. Discussions : plus tard.
- Pull Requests : cocher **Allow squash merging** uniquement ; décocher merge commits et rebase.
- Cocher **Automatically delete head branches** → les branches de travail disparaissent
  après fusion, `main` reste protégée. (C'est la réponse à « privé sans effacement de branche ».)

### 2.3 Settings → Rules → Rulesets → New branch ruleset
- Name : `protect-main`
- Enforcement status : **Active**
- Bypass list : **vide**
- Target branches : **Include default branch**
- Règles à cocher :
  - **Restrict deletions**
  - **Block force pushes**
  - **Require linear history**
  - **Require a pull request before merging**
    - Required approvals : **0** ← impératif. GitHub interdit d'approuver sa propre PR ;
      à 1, tu serais bloqué sur chacune de tes fusions.
    - **Require conversation resolution before merging** : coché
  - **Require status checks to pass** : à activer plus tard (voir 2.6)

### 2.4 Settings → Code security  (tout est gratuit en public)
- Dependabot alerts : **ON**
- Dependabot security updates : **ON**
- Secret scanning : **ON**
- Secret scanning **push protection** : **ON** ← bloque un commit contenant une clé
- Code scanning (CodeQL) : **Set up → Default**
- Private vulnerability reporting : **ON**

### 2.5 Settings → Actions → General
- Workflow permissions : **Read repository contents and packages permissions**
- Décocher **Allow GitHub Actions to create and approve pull requests**
- Fork pull request workflows : **Require approval for all external contributors**

### 2.6 Après la première PR
Les « status checks » n'apparaissent dans la liste qu'une fois le workflow exécuté au
moins une fois. Donc : tu crées le dépôt, je pousse la première PR avec la CI, elle
tourne, puis tu reviens dans le ruleset `protect-main` et tu ajoutes les checks
(`lint`, `test`, `audit`, `licenses`, `secrets`) comme requis.

### 2.7 Facultatif, utile
- About → Topics : `game`, `html5-game`, `phaser`, `pixel-art`, `cozy-game`, `pwa`,
  `typescript`, `agpl`, `accessibility`
- Ne pas activer GitHub Pages pour l'instant (le jeu sera servi par le NAS).
- Si des robots viennent : Settings → Moderation → Interaction limits.

## 3. Synology DS218+ (toi, 30 min)

1. DSM : Panneau de configuration → Mise à jour → installer les dernières mises à jour.
2. Sécurité : activer le pare-feu, l'auto-blocage, la 2FA sur ton compte admin ; désactiver le compte `admin` par défaut si ce n'est pas déjà fait.
3. Centre de paquets → installer **Container Manager**.
4. Créer un dossier partagé `docker` et dedans un sous-dossier `courrier` (il recevra `docker-compose.yml` et les données).
5. Créer un utilisateur DSM dédié `courrier` sans droits admin, propriétaire de ce dossier.
6. **Ne pas** ouvrir de port sur la box, **ne pas** activer QuickConnect pour le jeu.
7. Cloudflare → Zero Trust → Networks → Tunnels → créer un tunnel « nas-courrier ». Cloudflare te donne une commande `cloudflared` avec un token : tu la colleras dans Container Manager (je fournis le compose exact). Le token est un secret : ne le mets jamais dans le repo.
8. Public hostname du tunnel : `jeu.<ton-domaine>` → service `http://api:3000` (nom du conteneur, pas d'IP).

## 4. Brevo (toi, 10 min)

1. Créer le compte gratuit.
2. Senders & IP → Domains → ajouter ton domaine et copier les enregistrements DNS (DKIM, DMARC) dans Cloudflare.
3. SMTP & API → créer une clé API « courrier-nas ». C'est un secret : elle ira dans le fichier `.env` du NAS, jamais dans le repo.

## 5. Première PR (moi)

Dès que le repo existe, je pousse une branche `chore/bootstrap` avec tout le socle. Tu lis, tu testes la préprod sur le NAS, tu fusionnes.

## Règles permanentes

- Aucun secret dans Git. Le pipeline refuse le commit s'il en détecte un.
- `main` = production. Tout passe par une PR + tests verts + ton approbation.
- Conteneurs en lecture seule, utilisateur non-root, image signée et vérifiée avant démarrage.
- Sauvegarde Hyper Backup quotidienne du dossier `courrier` (base SQLite incluse).
