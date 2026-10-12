# Sécurité — le protocole de vérification externe

Ce qu'une personne extérieure peut vérifier sur altiplume.com avec des outils
gratuits, ce que la conception attend, ce qui a été mesuré, et quoi faire quand
l'écart existe. Rien ici ne demande un secret ni un accès au NAS : tout se lit
depuis Internet. C'est voulu — « secured by design » doit pouvoir se constater
de l'extérieur.

La partie automatisable tourne chaque semaine (`.github/workflows/securite.yml`,
`node scripts/securite-check.mjs altiplume.com --strict`) et à la demande ; le
tableau ci-dessous est la référence humaine, mise à jour à chaque interlude.
Depuis le 12 octobre, quatre contrôleurs regardent aussi **de l'intérieur** — l'image,
l'application démarrée, le code, les dépendances — à chaque PR : voir
[Les contrôles automatiques](#les-contrôles-automatiques-12-octobre-2026).

## Secure by design, puis vérifié de l'extérieur

Le jeu a été conçu avec ses garanties (pas de mot de passe, aucun port ouvert,
CSP sans inline, rien de tiers — voir en bas de page). Mais une garantie qu'on
ne mesure pas n'est qu'une intention. Ce tableau est la mesure : ce que les
plateformes ont vu **avant** l'interlude du 11 octobre, ce qui a été changé, et
ce qu'elles ont vu **après**. Chaque résultat « après » a été lu réellement, à
l'heure indiquée ; ce qui n'a pas été lancé est marqué **non effectué**, sans
fard. C'est un effort continu : le tableau se remet à jour à chaque interlude,
et le contrôle hebdomadaire sonne quand un point redescend.

### Les résultats (11 octobre 2026)

| Domaine | Outil | Ce qu'il vérifie | Attendu | Avant (16 h 30) | Ce qui a été fait | Après (17 h 10) | Statut |
|---|---|---|---|---|---|---|---|
| En-têtes HTTP | [Mozilla HTTP Observatory](https://developer.mozilla.org/en-US/observatory/analyze?host=altiplume.com) | CSP, HSTS, cookies, Referrer-Policy, X-Content-Type-Options, COOP/CORP, redirection | A ou A+ | **B+ (80/100)**, 11 tests sur 12 : `http://altiplume.com` répondait 200 au lieu de rediriger (−20) | Cloudflare « Always Use HTTPS » ; le serveur redirige aussi en 301 ; CSP `default-src 'none'`, COEP | **A+ (140/100)**, 12 tests sur 12 | ✅ vérifié |
| En-têtes HTTP | [securityheaders.com](https://securityheaders.com/?q=altiplume.com&followRedirects=on) | Même famille, grille différente | A ou A+ | **A**, « plafonné : servi en HTTP sans redirection » | Idem | **A+**, six en-têtes reconnus, aucun avertissement | ✅ vérifié |
| CSP | [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/) | Faiblesses de la politique | Aucune alerte haute | Aucune alerte haute ; deux remarques : `script-src 'self'` et Trusted Types absents | `default-src 'none'`, `worker-src`, `require-trusted-types-for 'script'` + politique unique « altiplume » côté client, vérifiée dans Chromium par le parcours de bout en bout | **Quatorze directives vertes** (lu le 11/10 à 19 h, après redéploiement) ; une seule remarque, informative : `script-src 'self'` « peut poser problème si vous hébergez du JSONP, AngularJS ou des fichiers déposés par les utilisateurs » — rien de cela n'existe dans le jeu | ✅ vérifié
| TLS | [Qualys SSL Labs](https://www.ssllabs.com/ssltest/analyze.html?d=altiplume.com) | Protocoles, suites, chaîne, HSTS | A ou A+ | **B** sur les quatre adresses : TLS 1.0 et 1.1 acceptés par Cloudflare (défaut) | Cloudflare « Minimum TLS Version : 1.2 » | **A+ sur les quatre adresses** (IPv4 et IPv6), TLS 1.2 et 1.3 seulement, HSTS présent | ✅ vérifié |
| Email | [MXToolbox](https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3aaltiplume.com) / DNS | SPF, DKIM, DMARC | SPF `-all`, DKIM, DMARC ≥ quarantine, **un seul** enregistrement SPF | DKIM Brevo publié ; **SPF absent** ; DMARC `p=none` | Deux enregistrements DNS. Le 11/10 au soir, ajout de `include:_spf.mx.cloudflare.net` **dans le même** enregistrement SPF : deux SPF sur un nom seraient invalides et feraient tomber les liens de connexion | SPF `v=spf1 include:spf.brevo.com include:_spf.mx.cloudflare.net -all` ; DKIM `brevo1`/`brevo2` ; DMARC `p=quarantine` | ✅ vérifié |
| Certificats | DNS CAA | Quelles autorités peuvent émettre pour le domaine | Celles de Cloudflare seulement | Aucun CAA | Enregistrements CAA | Présents (contrôle externe vert) | ✅ vérifié |
| HTTP → HTTPS | contrôle externe (`scripts/securite-check.mjs`) | Premier saut en clair | 301 vers https | 200 sans redirection | Cloudflare + serveur | 301 vers `https://altiplume.com/` ; aucun cookie avant connexion | ✅ vérifié |
| Courrier entrant | DNS (MX), test depuis une boîte externe | Que `@altiplume.com` reçoive, et par Cloudflare seulement | Aucun serveur de courrier attendu | Pas de MX : le domaine ne recevait rien | Cloudflare Email Routing (gratuit) : `bonjour@altiplume.com` redirigé vers la boîte de l'éditeur ; le contrôle hebdomadaire n'accepte que les MX `*.mx.cloudflare.net` et alerte sur tout autre | Trois MX Cloudflare ; message de test envoyé depuis une adresse externe et bien reçu (11/10) | ✅ vérifié |
| Surface réseau | DNS ; [Shodan](https://www.shodan.io/) ou `nmap` sur l'adresse domestique | Ports ouverts chez l'auteur | Aucun service exposé | `altiplume.com` → Cloudflare seulement, pas de MX ; adresse domestique non publiée | — | DNS vérifié ; `nmap`/Shodan depuis l'extérieur | ❌ non effectué (nmap/Shodan) |
| Application web | [OWASP ZAP](https://www.zaproxy.org/) 2.17.0, passif | Injections évidentes, cookies, en-têtes, fuites, contenus réfléchis | Zéro alerte haute | — | 12/10 : ZAP en CI (`zap.yml`) sur l'image démarrée en production, à chaque PR, à chaque fusion et chaque lundi ; échec sur toute alerte moyenne ou haute non examinée | **0 haute, 0 moyenne réelle** sur 58 adresses (12/10, en local puis CI verte sur la PR #59 et sur `main`) ; 2 faux positifs justifiés, 2 informations | ✅ vérifié (CI) ; contre le site public : ❌ non effectué |
| Authentification | [webauthn.io](https://webauthn.io/), lecteur de passkeys du navigateur | Passkey liée à altiplume.com, découvrable, refuse un autre domaine | Clé liée au domaine | Tests de bout en bout (authenticateur virtuel) : `rpId`, seconde clé USB, refus d'un autre domaine — à chaque PR | — | Idem (CI) ; vérification manuelle sur un vrai appareil | ❌ non effectué (manuel) |
| Dépendances | `npm audit`, licences (CI) ; [Socket](https://socket.dev/), [OSV-Scanner](https://google.github.io/osv-scanner/) | Vulnérabilités connues, paquets suspects, licences | 0 vulnérabilité | 0 (CI, à chaque PR) | 12/10 : application GitHub Socket installée sur ce seul dépôt, `socket.yml` | 0 (CI du 12/10) ; Socket : rapport de projet ✅ sur `main` (12/10, 21 h 04) | ✅ vérifié (CI, Socket) ; OSV ❌ non effectué |
| Image Docker | [Trivy](https://trivy.dev/) 0.69.3 ; `gh attestation verify` | Vulnérabilités de l'image, secrets, provenance | 0 critique ; attestation valide | Attestation signée à chaque publication (CI) | 12/10 : Trivy avant chaque publication (`release.yml`) et chaque lundi sur l'image publiée ; npm, npx, corepack et yarn retirés de l'image | **0 critique corrigeable** : verdict vert sur la PR #58 et à la publication du 12/10 (21 h 05) ; élevées listées dans le résumé du job *Release* | ✅ vérifié (CI) |
| Code | CodeQL (GitHub) ; [Opengrep](https://github.com/opengrep/opengrep) (reprise libre de Semgrep) | Injections, HTML non échappé, cryptographie faible, secrets, Dockerfile, workflows | Aucune alerte ouverte ; 0 ERROR | CodeQL : 3 analyses vertes par PR, 0 alerte ouverte | 12/10 : Opengrep v1.30.1 en CI (`opengrep.yml`) à chaque PR ; trois familles de règles hors sujet écartées avec leur raison ; la seule écriture HTML du client annotée | CodeQL : 0 alerte ; Opengrep : **0 ERROR**, 28 avertissements lus, aucun réel (12/10) | ✅ vérifié (CI) |
| Accessibilité | Lighthouse, [WAVE](https://wave.webaim.org/), [axe DevTools](https://www.deque.com/axe/devtools/) | Contrastes, sémantique, étiquettes, focus | ≥ 95 ; zéro erreur WAVE | — | — | — | ❌ non effectué |
| PWA et performance | Lighthouse, [WebPageTest](https://www.webpagetest.org/) | Manifeste, service worker, icônes, chargement | Installable ; ≥ 90 | Installée et notifiant sur iPhone, Android, PC (constaté le 11/10) ; score non mesuré | — | — | ❌ non effectué (score) |
| Vie privée | [Blacklight](https://themarkup.org/blacklight), [webbkoll](https://webbkoll.dataskydd.net/) | Traqueurs, cookies tiers, requêtes sortantes | Aucun traqueur, un seul cookie | Par construction (`connect-src 'self'`, aucune ressource tierce) ; Observatory : « cookies not found » | — | — | ❌ non effectué (Blacklight) |
| Confidentialité du compte | [Have I Been Pwned](https://haveibeenpwned.com/DomainSearch) (domaine) | Fuite associée au domaine | Néant | — | Mode opératoire ci-dessous | — | ❌ non effectué |

**Bilan du 11 octobre** : les mesures externes qui notaient le site sont
passées de B+ / A / B à **A+ / A+ / A+**, l'évaluateur CSP n'a plus qu'une remarque informative, le courrier est authentifié de bout en
bout (SPF, DKIM, DMARC), et le contrôle hebdomadaire est vert.

**Bilan du 12 octobre** : ZAP, Trivy, Opengrep et Socket sont passés de « non
effectué » à **vérifié, et revérifié à chaque PR** : aucune alerte haute ni
moyenne réelle sur l'application, aucune faille critique corrigeable dans
l'image, aucune trouvaille bloquante dans le code, rapport Socket vert. Restent
« non effectué », dans cet ordre proposé : Lighthouse/WAVE (accessibilité,
promise depuis la conception — mesurée avec les personnes concernées),
Blacklight, nmap depuis l'extérieur, HIBP, OSV-Scanner, ZAP contre le site
public, passkey sur un vrai appareil.

### Les contrôles automatiques (12 octobre 2026)

Le tableau du haut regarde le site **de l'extérieur**. Ceux-ci regardent **de
l'intérieur** : l'image, l'application démarrée, le code, les dépendances. Tous
gratuits, tous dans GitHub Actions ou une application GitHub, aucun secret.

| Contrôleur | Où | Quand | Ce qui bloque | Mesuré le 12/10 |
|---|---|---|---|---|
| **Trivy** 0.69.3 | `release.yml` (job *docker*) ; `securite.yml` (job *image publiée*) | Avant chaque publication d'image, PR comprises ; chaque lundi sur `latest` | Une faille **critique** déjà corrigée en amont, ou un secret dans l'image : **l'image n'est pas publiée** | 0 critique corrigeable ; vert sur la PR #58 et sur `main` |
| **OWASP ZAP** 2.17.0, passif | `zap.yml` ; plan `.github/zap/plan.yaml` | Chaque PR qui touche l'appli, chaque fusion, chaque lundi | Une alerte **moyenne ou haute** non déclarée faux positif (avec sa raison) dans le plan | 58 adresses ; 0 haute ; 0 moyenne réelle ; vert sur la PR #59 et sur `main` |
| **Opengrep** v1.30.1 | `opengrep.yml` | Chaque PR, chaque fusion | Une trouvaille de niveau **ERROR** | 0 ERROR, 28 avertissements lus ; vert sur la PR #60 et sur `main` |
| **Socket** | Application GitHub, réglée par `socket.yml` | Chaque PR qui touche une dépendance ; rapport à chaque fusion | Contrôle « Socket Security » sur la PR (paquet malveillant, script d'installation, accès réseau inattendu, nom imité…) | Rapport de projet vert sur `main` (12/10) |
| CodeQL | Configuration par défaut de GitHub | Chaque PR | Une alerte | 0 alerte ouverte |
| `npm audit`, licences | `ci.yml` | Chaque PR | Une faille élevée ; une licence hors liste | 0 ; licences conformes |

**Ce que ZAP a relevé, et pourquoi ce n'est pas un défaut :**

| Alerte | Niveau | Verdict |
|---|---|---|
| Absence de jeton anti-CSRF (`/aerodrome`) | Moyen | Faux positif : c'est un `<form method="dialog">`, qui ferme une boîte de dialogue dans la page et n'envoie rien. Les vrais envois passent par l'API, qui n'accepte que du JSON, avec un cookie `SameSite=Lax`. |
| Message d'erreur de débogage (`/cgu`) | Faible | Faux positif : « still under construction » est une phrase des CGU anglaises (le jeu est en essai). |
| Attribut HTML contrôlable (`/aide?lang=en`) | Info | Vérifié : seul `en` est accepté ; `?lang="zz` donne `lang="fr"`, rien n'est recopié. |
| Commentaire « suspect » dans le JavaScript | Info | Le mot « User » dans le code minifié. |

Contre-épreuve : sans les deux déclarations de faux positifs, le plan échoue
bien. Le garde-fou mord.

**Ce qu'Opengrep a relevé.** Premier passage, toutes règles : 150 trouvailles,
dont 2 ERROR. 105 venaient de trois familles de règles qui ne concernent pas ce
code, écartées dans le workflow avec leur raison : jQuery (il n'y en a pas : `$`
y est un raccourci pour `getElementById`), React/i18next (le dictionnaire est
maison), `replaceAll` « non portable » (Node 22 et les navigateurs actuels
l'ont). Les 2 ERROR étaient une seule ligne : `i18n.ts`, l'unique écriture HTML
du client, depuis le dictionnaire embarqué et par la politique Trusted Types —
voulue, annotée. Les 28 restantes ont été lues : gabarits d'e-mails (chaque
valeur échappée), gabarits de construction, images Docker non épinglées par
empreinte (suivi par Dependabot ; épinglage prévu).

**La chaîne d'approvisionnement des contrôleurs eux-mêmes.** En mars 2026, l'action
GitHub de Trivy a été compromise (étiquettes réécrites) et le binaire 0.69.4
piégé. D'où la règle suivie ici, pour les quatre : aucune action tierce ; le
binaire officiel, pris dans la release du projet, **d'une version qui a quelques
semaines de recul**, et son **empreinte SHA-256** inscrite dans le workflow et
vérifiée à chaque exécution (Trivy : fichier de sommes de la release ; ZAP :
`ZapVersions.xml` du projet ; Opengrep : signature Sigstore vérifiée avant
épinglage). Les règles d'Opengrep sont épinglées par commit. Dependabot ne met
pas ces versions à jour : on les change à la main, avec la même vérification.

### Ce que le contrôle hebdomadaire vérifie tout seul

`.github/workflows/securite.yml` (lundi 07 h 17 à Paris, et à la demande dans
l'onglet Actions) lance `node scripts/securite-check.mjs altiplume.com --strict` :
Observatory (note et tests échoués), SSL Labs (note, protocoles), DNS (SPF,
DKIM, DMARC, CAA, adresses, MX), les en-têtes réellement servis, la redirection
HTTP → HTTPS, l'absence de cookie à l'accueil. Il échoue tant qu'un point est
sous l'attendu — premier passage le 11 octobre à 17 h 03 : **vert**.
securityheaders.com et l'évaluateur CSP n'ont pas d'API : ils se relancent à la
main.

### Les réglages faits à la main le 11 octobre (Cloudflare, gratuits)

Pour mémoire, et pour les refaire sur un autre domaine un jour :

1. SSL/TLS → Edge Certificates → **Always Use HTTPS : On**.
2. SSL/TLS → Edge Certificates → **Minimum TLS Version : TLS 1.2**.
3. DNS → TXT `altiplume.com` : `v=spf1 include:spf.brevo.com -all` ;
   TXT `_dmarc.altiplume.com` : `v=DMARC1; p=quarantine; rua=mailto:rua@dmarc.brevo.com`
   (passer à `p=reject` après une semaine sans rejet légitime dans les rapports
   Brevo) ; CAA : `0 issue` pour `letsencrypt.org`, `pki.goog`, `digicert.com`,
   `comodoca.com`, `ssl.com`.

## Modes opératoires (à la main, hors CI)

**Relancer un contrôle automatique.** Onglet *Actions* du dépôt → *ZAP*,
*Opengrep* ou *Sécurité* → *Run workflow*. Le rapport est dans le résumé du
job (et, pour ZAP, en pièce jointe : Markdown et JSON, gardés 30 jours).

**ZAP contre le site public (passif, sans attaque).** Depuis un poste avec Docker :
```
docker run --rm -t ghcr.io/zaproxy/zaproxy:2.17.0 zap-baseline.py -t https://altiplume.com -I
```
`-I` : ne pas échouer sur les avertissements. Lire la liste ; une alerte
« haute » se corrige avant toute autre chose ; les « informatives » se notent
ici avec leur justification. Version fixée, jamais `stable` ni `latest`.

**Trivy sur l'image, à la main.** Version fixée — surtout pas `latest`, qui a
servi le binaire piégé en mars 2026 :
```
docker run --rm aquasec/trivy:0.69.3 image --severity HIGH,CRITICAL ghcr.io/regis57/altiplume:latest
```
Puis `gh attestation verify oci://ghcr.io/regis57/altiplume:latest --owner regis57`
pour vérifier que l'image vient bien du dépôt (SLSA, signé par GitHub).

**Surface réseau, depuis l'extérieur** (téléphone en 4G, pas le Wi-Fi) :
`nmap -Pn <adresse IP publique de la maison>` doit rendre tous les ports
« filtered ». Shodan : chercher l'adresse ; aucun service ne doit apparaître.

**HIBP domaine.** Ajouter `altiplume.com` dans « Domain search » (vérification
par TXT DNS ou par email), puis vérifier qu'aucune adresse n'y est associée.
Rappel : même en cas de fuite, le jeu ne stocke aucun mot de passe, et les
jetons sont des empreintes SHA-256 inutilisables telles quelles.

**Socket.** Le tableau de bord du projet est sur [socket.dev](https://socket.dev/dashboard)
(connexion avec GitHub). L'accès se retire à tout moment : GitHub → *Settings* →
*Applications* → *Installed GitHub Apps* → *Socket Security* → *Configure*.

## Ce que le code garantit, indépendamment des outils

- Aucun port ouvert : le NAS sort vers Cloudflare par un tunnel ; rien n'entre.
- Pas de mot de passe ; jetons stockés en empreinte ; sessions `HttpOnly`,
  `Secure`, `SameSite=Lax`, et les écritures n'acceptent que du JSON (anti-CSRF).
- CSP `default-src 'none'` sans inline, Trusted Types exigés : une XSS n'aurait
  ni script à exécuter ni puits d'injection à atteindre.
- COOP/COEP/CORP : le document est isolé des autres origines ; aucune ressource
  tierce, donc aucune requête tierce (vie privée par construction).
- Schémas AJV stricts sur chaque entrée, limitation de débit sur chaque action —
  deux compteurs par personne depuis le 12/10 : 120 requêtes par minute sur l'API,
  600 sur les pages et leurs fichiers ; la clé est une empreinte de l'adresse, salée
  au démarrage, gardée en mémoire seulement —, journal d'audit sans donnée personnelle.
- Le formulaire de contact n'est pas un relais : le destinataire vient de la
  configuration du serveur, jamais du navigateur ; rien n'est écrit en base (donc
  aucune injection SQL possible — il n'y a pas de requête) ; sujet et adresse sont
  nettoyés de tout caractère de contrôle, le message est échappé dans la version
  HTML du courriel ; champ-piège, délai minimum de rédaction et trois envois par
  heure et par adresse IP tiennent les robots à distance, sans captcha ni tiers.
- Dépendances auditées (npm audit, Socket), licences contrôlées, code relu
  (CodeQL, Opengrep), application visitée (ZAP), image scannée (Trivy) et
  attestée : à chaque PR. L'image finale n'embarque ni npm ni aucun autre
  gestionnaire de paquets, et ne publie pas si Trivy y trouve une faille
  critique corrigeable.
