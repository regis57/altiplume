# Sécurité — le protocole de vérification externe

Ce qu'une personne extérieure peut vérifier sur altiplume.com avec des outils
gratuits, ce que la conception attend, ce qui a été mesuré, et quoi faire quand
l'écart existe. Rien ici ne demande un secret ni un accès au NAS : tout se lit
depuis Internet. C'est voulu — « secured by design » doit pouvoir se constater
de l'extérieur.

La partie automatisable tourne chaque semaine (`.github/workflows/securite.yml`,
`node scripts/securite-check.mjs altiplume.com --strict`) et à la demande ; le
tableau ci-dessous est la référence humaine, mise à jour à chaque interlude.

## État au 11 octobre 2026 (interlude sécurité, 16 h 30)

| Domaine | Outil (gratuit, en ligne) | Ce qu'il vérifie | Attendu | Mesuré avant | Ce qui a été fait | Attendu après |
|---|---|---|---|---|---|---|
| En-têtes HTTP | [Mozilla HTTP Observatory](https://developer.mozilla.org/en-US/observatory/analyze?host=altiplume.com) | CSP, HSTS, cookies, Referrer-Policy, X-Content-Type-Options, COOP/CORP, redirection | A ou A+ ; CSP sans unsafe-inline | **B+ (80)** — 11 tests sur 12 ; le seul échec : `http://altiplume.com` répond 200 au lieu de rediriger vers HTTPS (−20) | Le serveur redirige en 301 toute requête arrivée en clair (`x-forwarded-proto: http`), sans HSTS sur la réponse en clair ; CSP passée à `default-src 'none'` (+ `worker-src`), COEP `require-corp` ajouté | **A+** dès que Cloudflare redirige aussi (voir « À faire à la main ») |
| En-têtes HTTP | [securityheaders.com](https://securityheaders.com/?q=altiplume.com&followRedirects=on) | Même famille, grille différente | A ou A+ | **A**, « plafonné à A : servi en HTTP sans redirection » | Idem ci-dessus | **A+** |
| CSP | [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/) | Faiblesses de la politique (sources larges, unsafe-*, absence de object-src) | Aucune alerte haute | Aucune alerte haute ; deux remarques : `script-src 'self'` (JSONP/upload — sans objet ici) et **Trusted Types absents** | `require-trusted-types-for 'script'` + `trusted-types altiplume` ; le client a une politique unique pour ses deux puits (textes traduits, adresse du service worker) ; vérifié dans Chromium par le parcours de bout en bout | Une seule remarque restante (`'self'`), informative |
| TLS | [Qualys SSL Labs](https://www.ssllabs.com/ssltest/analyze.html?d=altiplume.com) | Protocoles, suites, chaîne, HSTS | A ou A+ (TLS terminé par Cloudflare) | **B** sur les quatre adresses : TLS 1.0 et 1.1 encore acceptés par Cloudflare (réglage par défaut) ; chaîne valide, PFS, pas de RC4, HSTS présent | Rien côté serveur : c'est un réglage Cloudflare | **A+** (TLS ≥ 1.2 + HSTS ≥ 1 an) |
| Surface réseau | [Shodan](https://www.shodan.io/) ou `nmap` sur l'adresse domestique | Ports ouverts sur la connexion domestique | Aucun service exposé : le NAS n'écoute pas sur Internet | DNS : `altiplume.com` ne pointe que sur Cloudflare (188.114.96.2, 188.114.97.2), pas de MX. L'adresse domestique n'est pas publiée. | — | Inchangé ; à vérifier depuis l'extérieur (4G) : `nmap -Pn <ip publique>` → tout filtré |
| Application web | [OWASP ZAP](https://www.zaproxy.org/) en mode baseline (passif) | Injections évidentes, cookies, en-têtes, fuites d'information | Zéro alerte haute ; avertissements à documenter | Non encore lancé | Mode opératoire ci-dessous | Zéro alerte haute |
| Authentification | [webauthn.io](https://webauthn.io/) et le lecteur de passkeys de son navigateur | La passkey créée est liée à altiplume.com, découvrable, refuse un autre domaine | Clé liée au domaine ; aucune clé pour un autre site | Les tests de bout en bout (authenticateur virtuel) vérifient le `rpId`, la seconde clé USB, le refus d'un autre domaine | — | Inchangé |
| Email | [MXToolbox](https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3aaltiplume.com) | SPF, DKIM, DMARC, délivrabilité | SPF et DKIM valides (Brevo) ; DMARC à renforcer | DKIM Brevo publié (`brevo1`, `brevo2`) ; **SPF absent** ; DMARC `p=none` (surveillance seulement) ; pas de MX (le domaine n'en reçoit pas) | Rien côté serveur : ce sont trois enregistrements DNS | SPF `-all`, DMARC `p=quarantine` puis `p=reject` |
| Dépendances | [Socket](https://socket.dev/), [OSV-Scanner](https://google.github.io/osv-scanner/) ou `npm audit` sur le dépôt | Vulnérabilités connues, paquets suspects | 0 vulnérabilité ; licences permissives | `npm audit` : 0 (à chaque PR) ; licences : contrôlées (à chaque PR) | — | Inchangé |
| Image Docker | [Trivy](https://trivy.dev/) sur `ghcr.io/regis57/altiplume:latest` ; `gh attestation verify` | Vulnérabilités de l'image, provenance SLSA | Image minimale ; attestation valide depuis le dépôt | Attestation de provenance signée à chaque publication (CI) ; Trivy pas encore lancé | Mode opératoire ci-dessous | 0 critique |
| Code | CodeQL (intégré à GitHub), [Semgrep](https://semgrep.dev/) règles p/nodejs | Injections, cryptographie faible, secrets | Aucune alerte ouverte | CodeQL : 3 analyses (JavaScript/TypeScript, Python, Actions) vertes à chaque PR, 0 alerte ouverte | — | Inchangé |
| Accessibilité | [Lighthouse](https://developer.chrome.com/docs/lighthouse) (onglet Chrome), [WAVE](https://wave.webaim.org/), [axe DevTools](https://www.deque.com/axe/devtools/) | Contrastes, sémantique, étiquettes, focus | Accessibilité ≥ 95 ; zéro erreur WAVE sur l'accueil, la connexion et l'aérodrome | Non encore mesuré | Prochain interlude | ≥ 95 |
| PWA et performance | Lighthouse (catégories PWA et performance), [WebPageTest](https://www.webpagetest.org/) | Manifeste, service worker, icônes, temps de chargement | Installable ; performance ≥ 90 | Installée et notifiant sur iPhone, Android et PC (11/10) ; score non mesuré | Prochain interlude | ≥ 90 |
| Respect de la vie privée | [Blacklight](https://themarkup.org/blacklight) (The Markup), [webbkoll](https://webbkoll.dataskydd.net/) | Traqueurs, cookies tiers, requêtes sortantes | Aucun traqueur, un seul cookie (session), aucune requête tierce | Par construction : `connect-src 'self'`, aucune ressource tierce, aucun cookie avant connexion (Observatory : `cookies-not-found`) | — | Inchangé ; à confirmer avec Blacklight |
| Confidentialité du compte | [Have I Been Pwned](https://haveibeenpwned.com/DomainSearch) (domaine) | Qu'aucune fuite n'est associée au domaine | Néant (et rien à fuir : pas de mot de passe) | Domaine non encore vérifié chez HIBP | Mode opératoire ci-dessous | Néant |

## À faire à la main (cinq minutes, dans Cloudflare)

Trois réglages gratuits, dans le tableau de bord Cloudflare du domaine. Aucun ne
touche au NAS ni au code ; aucun ne peut bloquer le jeu (le serveur accepte
déjà exactement ces conditions).

1. **SSL/TLS → Edge Certificates → Always Use HTTPS : On.** Cloudflare répond
   301 vers HTTPS avant même d'atteindre le tunnel. (Le serveur le fait aussi
   depuis la v0.2, ceinture et bretelles ; mais Observatory et securityheaders
   testent le premier saut, donc celui de Cloudflare.)
2. **SSL/TLS → Edge Certificates → Minimum TLS Version : TLS 1.2.** Aucun
   navigateur du jeu n'utilise moins (TLS 1.0/1.1 sont retirés des navigateurs
   depuis 2020). SSL Labs passe de B à A+.
3. **DNS → trois enregistrements** (type TXT sauf mention) :
   - `altiplume.com` → `v=spf1 include:spf.brevo.com -all` (SPF : seul Brevo
     peut envoyer au nom du domaine ; `-all` parce que rien d'autre n'envoie).
   - `_dmarc.altiplume.com` → `v=DMARC1; p=quarantine; rua=mailto:rua@dmarc.brevo.com`
     (une semaine à `quarantine` sans rejet légitime dans les rapports Brevo,
     puis `p=reject`).
   - CAA `altiplume.com` → `0 issue "letsencrypt.org"`, `0 issue "pki.goog"`,
     `0 issue "digicert.com"`, `0 issue "comodoca.com"`, `0 issue "ssl.com"`
     (les autorités de l'Universal SSL de Cloudflare ; toute autre ne peut plus
     émettre pour le domaine). Optionnel, mais propre.

Puis relancer : Observatory (bouton « Rescan »), securityheaders, SSL Labs
(« Clear cache » puis nouveau test, ~2 min), MXToolbox `dmarc:altiplume.com`.
Ou simplement lancer le workflow **Sécurité** depuis l'onglet Actions : il fait
tout sauf securityheaders et Trusted Types, et échoue tant qu'un point est sous
l'attendu.

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
