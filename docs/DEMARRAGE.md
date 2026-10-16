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
La suite chez Cloudflare (réglages de la zone, DNSSEC, tunnel, courrier, second projet) : [Sécurité → Cloudflare, pas à pas](Securite#cloudflare-pas-à-pas).

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

## 3. Synology DS218+ — FAIT le 10/10/2026

Réalisé : DSM 7.3.2 à jour, vérification en deux étapes, blocage automatique
(10 tentatives / 5 min), Container Manager installé, dossier `docker/altiplume` créé,
tunnel Cloudflare `nas-altiplume` connecté et sain, route `altiplume.com → http://api:3000`.

Abandonné : l'utilisateur DSM dédié. L'isolation vient du conteneur (non-root, lecture
seule, sans capacité), pas d'un compte Synology ; l'étape ajoutait de la complexité sans
protection supplémentaire.

Observé, non modifié : une redirection de port créée par QuickConnect (6690 → 58063)
expose Synology Drive directement sur Internet. Sans rapport avec le jeu ; à fermer un
jour dans QuickConnect → Avancé si l'on n'en a pas l'usage.

Reste un conteneur `altiplume-tunnel` créé à la main pour amorcer le tunnel : il sera
supprimé au premier déploiement du projet (voir DEPLOIEMENT.md, étape 4).

La suite — déployer réellement — est dans **DEPLOIEMENT.md**.

## 4. Brevo (toi, 15 min) — nécessaire avant de déployer la version « comptes »

1. Créer le compte gratuit sur brevo.com (300 emails par jour, sans carte bancaire).
2. **Expéditeurs et IP → Domaines → Ajouter un domaine** : `altiplume.com`. Brevo donne
   deux ou trois enregistrements DNS (DKIM, et un enregistrement de vérification).
3. Dans Cloudflare → ton domaine → **DNS**, ajouter ces enregistrements tels quels
   (type TXT ou CNAME, nom et valeur copiés). Revenir sur Brevo et cliquer *Vérifier*.
4. Ajouter aussi, dans Cloudflare, un enregistrement **DMARC** : type TXT, nom `_dmarc`,
   valeur `v=DMARC1; p=quarantine; adkim=s; aspf=s`. Cela protège le domaine contre
   l'usurpation d'expéditeur.
5. **SMTP et API → Clés API → Créer une clé** nommée `altiplume-nas`. La copier une fois
   : elle ne sera plus affichée. C'est un secret : elle va dans le `.env` du NAS, jamais
   dans le dépôt.
6. **Expéditeurs** : ajouter `courrier@altiplume.com` comme expéditeur (le domaine étant
   vérifié, pas de confirmation par email nécessaire).

## 5. Première PR — FAIT le 10/10/2026 (PR #1 fusionnée)

Dès que le repo existe, je pousse une branche `chore/bootstrap` avec tout le socle. Tu lis, tu testes la préprod sur le NAS, tu fusionnes.

## Règles permanentes

- Aucun secret dans Git. Le pipeline refuse le commit s'il en détecte un.
- `main` = production. Tout passe par une PR + tests verts + ton approbation.
- Conteneurs en lecture seule, utilisateur non-root, image signée et vérifiée avant démarrage.
- Sauvegarde Hyper Backup quotidienne du dossier `courrier` (base SQLite incluse).
