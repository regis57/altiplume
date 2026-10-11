# Sécurité — le protocole de vérification externe

Ce qu'une personne extérieure peut vérifier sur altiplume.com avec des outils
gratuits, ce que la conception attend, ce qui a été mesuré, et quoi faire quand
l'écart existe. Rien ici ne demande un secret ni un accès au NAS : tout se lit
depuis Internet. C'est voulu — « secured by design » doit pouvoir se constater
de l'extérieur.

La partie automatisable tourne chaque semaine (`.github/workflows/securite.yml`,
`node scripts/securite-check.mjs altiplume.com --strict`) et à la demande ; le
tableau ci-dessous est la référence humaine, mise à jour à chaque interlude.

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
| Email | [MXToolbox](https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3aaltiplume.com) / DNS | SPF, DKIM, DMARC | SPF `-all`, DKIM, DMARC ≥ quarantine | DKIM Brevo publié ; **SPF absent** ; DMARC `p=none` | Deux enregistrements DNS | SPF `v=spf1 include:spf.brevo.com -all` ; DKIM `brevo1`/`brevo2` ; DMARC `p=quarantine` (export de zone du 11/10 15 h 00 UTC, puis contrôle externe) | ✅ vérifié |
| Certificats | DNS CAA | Quelles autorités peuvent émettre pour le domaine | Celles de Cloudflare seulement | Aucun CAA | Enregistrements CAA | Présents (contrôle externe vert) | ✅ vérifié |
| HTTP → HTTPS | contrôle externe (`scripts/securite-check.mjs`) | Premier saut en clair | 301 vers https | 200 sans redirection | Cloudflare + serveur | 301 vers `https://altiplume.com/` ; aucun cookie avant connexion | ✅ vérifié |
| Surface réseau | DNS ; [Shodan](https://www.shodan.io/) ou `nmap` sur l'adresse domestique | Ports ouverts chez l'auteur | Aucun service exposé | `altiplume.com` → Cloudflare seulement, pas de MX ; adresse domestique non publiée | — | DNS vérifié ; `nmap`/Shodan depuis l'extérieur | ❌ non effectué (nmap/Shodan) |
| Application web | [OWASP ZAP](https://www.zaproxy.org/) baseline (passif) | Injections évidentes, cookies, en-têtes, fuites | Zéro alerte haute | — | Mode opératoire ci-dessous | — | ❌ non effectué |
| Authentification | [webauthn.io](https://webauthn.io/), lecteur de passkeys du navigateur | Passkey liée à altiplume.com, découvrable, refuse un autre domaine | Clé liée au domaine | Tests de bout en bout (authenticateur virtuel) : `rpId`, seconde clé USB, refus d'un autre domaine — à chaque PR | — | Idem (CI) ; vérification manuelle sur un vrai appareil | ❌ non effectué (manuel) |
| Dépendances | `npm audit`, licences (CI) ; [Socket](https://socket.dev/), [OSV-Scanner](https://google.github.io/osv-scanner/) | Vulnérabilités connues, paquets suspects, licences | 0 vulnérabilité | 0 (CI, à chaque PR) | — | 0 (CI du 11/10) | ✅ vérifié (CI) ; Socket/OSV ❌ non effectué |
| Image Docker | [Trivy](https://trivy.dev/) ; `gh attestation verify` | Vulnérabilités de l'image, provenance | 0 critique ; attestation valide | Attestation signée à chaque publication (CI) | Mode opératoire ci-dessous | — | ❌ non effectué (Trivy) |
| Code | CodeQL (GitHub) ; [Semgrep](https://semgrep.dev/) | Injections, cryptographie faible, secrets | Aucune alerte ouverte | CodeQL : 3 analyses vertes par PR, 0 alerte ouverte | — | 0 alerte (PR #37) | ✅ vérifié (CodeQL) ; Semgrep ❌ non effectué |
| Accessibilité | Lighthouse, [WAVE](https://wave.webaim.org/), [axe DevTools](https://www.deque.com/axe/devtools/) | Contrastes, sémantique, étiquettes, focus | ≥ 95 ; zéro erreur WAVE | — | — | — | ❌ non effectué |
| PWA et performance | Lighthouse, [WebPageTest](https://www.webpagetest.org/) | Manifeste, service worker, icônes, chargement | Installable ; ≥ 90 | Installée et notifiant sur iPhone, Android, PC (constaté le 11/10) ; score non mesuré | — | — | ❌ non effectué (score) |
| Vie privée | [Blacklight](https://themarkup.org/blacklight), [webbkoll](https://webbkoll.dataskydd.net/) | Traqueurs, cookies tiers, requêtes sortantes | Aucun traqueur, un seul cookie | Par construction (`connect-src 'self'`, aucune ressource tierce) ; Observatory : « cookies not found » | — | — | ❌ non effectué (Blacklight) |
| Confidentialité du compte | [Have I Been Pwned](https://haveibeenpwned.com/DomainSearch) (domaine) | Fuite associée au domaine | Néant | — | Mode opératoire ci-dessous | — | ❌ non effectué |

**Bilan du 11 octobre** : les mesures externes qui notaient le site sont
passées de B+ / A / B à **A+ / A+ / A+**, l'évaluateur CSP n'a plus qu'une remarque informative, le courrier est authentifié de bout en
bout (SPF, DKIM, DMARC), et le contrôle hebdomadaire est vert. Neuf lignes
restent « non effectué » : ce sont les prochains interludes, dans cet ordre
proposé — ZAP baseline, Lighthouse/WAVE (accessibilité, promise depuis la
conception), Trivy, Blacklight, nmap depuis l'extérieur, HIBP, Socket, Semgrep,
passkey sur un vrai appareil.

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

**ZAP baseline (passif, sans attaque).** Depuis un poste avec Docker :
```
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://altiplume.com -I
```
`-I` : ne pas échouer sur les avertissements. Lire la liste ; une alerte
« haute » se corrige avant toute autre chose ; les « informatives » se notent
ici avec leur justification.

**Trivy sur l'image.**
```
docker run --rm aquasec/trivy:latest image --severity HIGH,CRITICAL ghcr.io/regis57/altiplume:latest
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

**Semgrep.** `npx semgrep --config p/nodejs --config p/typescript .` à la racine.

## Ce que le code garantit, indépendamment des outils

- Aucun port ouvert : le NAS sort vers Cloudflare par un tunnel ; rien n'entre.
- Pas de mot de passe ; jetons stockés en empreinte ; sessions `HttpOnly`,
  `Secure`, `SameSite=Lax`, et les écritures n'acceptent que du JSON (anti-CSRF).
- CSP `default-src 'none'` sans inline, Trusted Types exigés : une XSS n'aurait
  ni script à exécuter ni puits d'injection à atteindre.
- COOP/COEP/CORP : le document est isolé des autres origines ; aucune ressource
  tierce, donc aucune requête tierce (vie privée par construction).
- Schémas AJV stricts sur chaque entrée, limitation de débit sur chaque action,
  journal d'audit sans donnée personnelle.
- Dépendances auditées, licences contrôlées, CodeQL, image attestée : à chaque PR.
