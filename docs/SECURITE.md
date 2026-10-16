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
| Surface réseau | DNS ; [Shodan](https://www.shodan.io/) ou `nmap` sur l'adresse domestique | Ports ouverts chez l'auteur | Aucun service exposé | `altiplume.com` → Cloudflare seulement, pas de MX ; adresse domestique non publiée | — | DNS vérifié ; `nmap`/Shodan depuis l'extérieur (mode opératoire corrigé le 13/10, ci-dessous) | **13/10, GRC ShieldsUP depuis la maison, IPv4.** Premier balayage (19 h 16) : **2 ports ouverts, 80 et 443**, sur 1 056 testés ; corrigés, puis nouveau balayage (21 h 18) : **0 ouvert, 0 fermé, 1 056 invisibles, `TruStealth: PASSED`**, aucune réponse au ping. Test UPnP : aucune réponse aux sondes. Voir « Un constat du 13 octobre » plus bas | ✅ ports 0 à 1055 **et** 5000, 5001, 32400 (accès au NAS, service de médias), IPv4, après correction ; pas d'adresse IPv6 sur la box ; ❌ Shodan : non effectué |
| Application web | [OWASP ZAP](https://www.zaproxy.org/) 2.17.0, passif | Injections évidentes, cookies, en-têtes, fuites, contenus réfléchis | Zéro alerte haute | — | 12/10 : ZAP en CI (`zap.yml`) sur l'image démarrée en production, à chaque PR, à chaque fusion et chaque lundi ; échec sur toute alerte moyenne ou haute non examinée | **0 haute, 0 moyenne réelle** sur 58 adresses (12/10, en local puis CI verte sur la PR #59 et sur `main`) ; 2 faux positifs justifiés, 2 informations | ✅ vérifié (CI) ; contre le site public : mis en place le 13/10, chaque lundi (job `zap-public` de `securite.yml` depuis le 14/10, pour ne plus apparaître « ignoré » dans les vérifications des PR) |
| Authentification | [webauthn.io](https://webauthn.io/), lecteur de passkeys du navigateur | Passkey liée à altiplume.com, découvrable, refuse un autre domaine | Clé liée au domaine | Tests de bout en bout (authenticateur virtuel) : `rpId`, seconde clé USB, refus d'un autre domaine — à chaque PR | — | Idem (CI) ; 13/10 : l'auteur confirme que la connexion par passkey fonctionne depuis le premier jour sur de vrais appareils, **Windows et iPhone** (constat manuel, sans outil) | ✅ vérifié (CI, appareils réels) |
| Dépendances | `npm audit`, licences (CI) ; [Socket](https://socket.dev/) | Vulnérabilités connues, paquets suspects, licences | 0 vulnérabilité | 0 (CI, à chaque PR) | 12/10 : application GitHub Socket installée sur ce seul dépôt, `socket.yml` | 0 (CI du 12/10) ; Socket : rapport de projet ✅ sur `main` (12/10, 21 h 04) | ✅ vérifié (CI, Socket) ; OSV-Scanner écarté (redondant, voir plus bas) |
| Image Docker | [Trivy](https://trivy.dev/) 0.69.3 ; `gh attestation verify` | Vulnérabilités de l'image, secrets, provenance | 0 critique ; attestation valide | Attestation signée à chaque publication (CI) | 12/10 : Trivy avant chaque publication (`release.yml`) et chaque lundi sur l'image publiée ; npm, npx, corepack et yarn retirés de l'image | **0 critique corrigeable** : verdict vert sur la PR #58 et à la publication du 12/10 (21 h 05) ; élevées listées dans le résumé du job *Release* | ✅ vérifié (CI) |
| Code | CodeQL (GitHub) ; [Opengrep](https://github.com/opengrep/opengrep) (reprise libre de Semgrep) | Injections, HTML non échappé, cryptographie faible, secrets, Dockerfile, workflows | Aucune alerte ouverte ; 0 ERROR | CodeQL : 3 analyses vertes par PR, 0 alerte ouverte | 12/10 : Opengrep v1.30.1 en CI (`opengrep.yml`) à chaque PR ; trois familles de règles hors sujet écartées avec leur raison ; la seule écriture HTML du client annotée | CodeQL : 0 alerte ; Opengrep : **0 ERROR**, 28 avertissements lus, aucun réel (12/10) | ✅ vérifié (CI) |
| Accessibilité | Lighthouse, [WAVE](https://wave.webaim.org/), [axe DevTools](https://www.deque.com/axe/devtools/) | Contrastes, sémantique, étiquettes, focus | ≥ 95 ; zéro erreur WAVE | — | 14/10 : conditions d'une route dites en mots (✓/✗, et « fait »/« manque » pour les lecteurs d'écran) ; légendes de l'album gardées entières dans la page ; mise en page testée à chaque PR, sur PC et téléphone (`scripts/e2e-mise-en-page.mjs`) | — | ❌ non effectué (mesure) |
| PWA et performance | Lighthouse, [WebPageTest](https://www.webpagetest.org/) | Manifeste, service worker, icônes, chargement | Installable ; ≥ 90 | Installée et notifiant sur iPhone, Android, PC (constaté le 11/10) ; score non mesuré | — | — | ❌ non effectué (score) |
| Vie privée | [Blacklight](https://themarkup.org/blacklight), [webbkoll](https://webbkoll.dataskydd.net/) | Traqueurs, cookies tiers, requêtes sortantes | Aucun traqueur, un seul cookie | Par construction (`connect-src 'self'`, aucune ressource tierce) ; Observatory : « cookies not found » | 13/10 : test de parcours `scripts/e2e-tiers.mjs`, à chaque PR : échoue sur la moindre requête vers un autre domaine, violation de la CSP ou cookie étranger | **Blacklight, 13/10/2026 à 18 h 39 (Paris)**, mobile, serveur californien : 0 traqueur publicitaire, 0 cookie tiers, pas de pistage par empreinte (canvas), pas d'enregistreur de session, pas de capture de frappe, pas de pixel Facebook, TikTok ni X, pas de remarketing Google. Parcours local : 194 requêtes, toutes vers l'aérodrome, 1 cookie, le nôtre | ✅ vérifié (Blacklight) ; webbkoll ❌ non effectué |
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
nmap depuis l'extérieur, HIBP.

**Bilan du 13 octobre** : Blacklight a été passé sur altiplume.com (zéro partout),
et le même contrôle tourne désormais à chaque PR ; la passkey est confirmée sur
Windows et iPhone depuis le premier jour ; ZAP visite aussi le site public chaque
lundi ; OSV-Scanner est **écarté** (voir plus bas). Restent « non effectué » :
l'accessibilité, HIBP, Shodan.

**Le fait marquant du 13 octobre** : le balayage de ports a trouvé **deux ports ouverts
sur l'adresse de la maison, 80 et 443**, alors que la conception dit « aucun port
ouvert ». Corrigés le soir même, puis revérifiés (voir plus bas).

**Bilan du 14 octobre (le jeu, rejoué)** : trois retouches de jeu et de présentation
(l'album, le tirage, les routes), sans rien ouvrir de neuf vers l'extérieur : le test
« aucune requête tierce » reste vert, 194 requêtes, toutes vers l'aérodrome. La nouvelle
règle de tirage (« l'escale attend sa lettre ») vit côté serveur, dans le tirage
déterministe : le navigateur ne peut ni la voir venir ni la forcer. L'accessibilité
progresse, sans être encore mesurée : l'état de chaque condition d'une route est dit en
mots aux lecteurs d'écran, pas seulement par la couleur, et les légendes de l'album
restent entières dans la page. Un test de mise en page rejoint les contrôles de chaque PR.

**Le fait marquant du soir (14 octobre)** : la sauvegarde hors du NAS existe, et sa
restauration a été essayée pour de bon (voir « Un constat du 14 octobre » plus bas). Elle
a aussi montré un écart avec ce qui est promis aux joueurs : la rotation choisie gardait
trop longtemps. Corrigé le soir même ; la mesure définitive viendra à la première
rotation de nuit.

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
| Aucune requête tierce | `ci.yml` (job *aucune requête tierce*), `scripts/e2e-tiers.mjs` | Chaque PR | Une requête vers un autre domaine, une violation de la CSP, un cookie étranger | 194 requêtes, toutes vers l'aérodrome ; un cookie, le nôtre (13/10) |
| Mise en page | `ci.yml` (job *mise en page*), `scripts/e2e-mise-en-page.mjs` | Chaque PR | Sur PC, l'album déborde d'un écran ou une page sort de sa case ; sur téléphone, la page défile sur le côté | Album en 656 px pour 900 ; 8 timbres par rangée sur PC, 3 sur téléphone (14/10) |

**Ce que ZAP a relevé, et pourquoi ce n'est pas un défaut :**

| Alerte | Niveau | Verdict |
|---|---|---|
| Absence de jeton anti-CSRF (`/aerodrome`) | Moyen | Faux positif : c'est un `<form method="dialog">`, qui ferme une boîte de dialogue dans la page et n'envoie rien. Les vrais envois passent par l'API, qui n'accepte que du JSON, avec un cookie `SameSite=Lax`. |
| Message d'erreur de débogage (`/cgu`) | Faible | Faux positif : « still under construction » est une phrase des CGU anglaises (le jeu est en essai). |
| Attribut HTML contrôlable (`/aide?lang=en`) | Info | Vérifié : seul `en` est accepté ; `?lang="zz` donne `lang="fr"`, rien n'est recopié. |
| Commentaire « suspect » dans le JavaScript | Info | Le mot « User » dans le code minifié. |
| « ZAP errors logged » (2) | Indication | Reproduit en local le 14/10, ce ne sont pas des défauts du site : « pas de vérification des mises à jour depuis plus de 3 mois » (voulu : ZAP tourne en `-silent`, version épinglée) et « impossible de créer un profil Firefox » (l'intégration navigateur de ZAP, qu'on n'utilise pas). Depuis le 14/10, le journal de ZAP part avec les rapports et ses erreurs s'affichent dans le résumé du job. |

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

**Les machines de la CI, figées elles aussi.** Depuis le 14 octobre, chaque job tourne sur `ubuntu-24.04`, plus sur `ubuntu-latest` : GitHub fait passer `latest` à Ubuntu 26 à partir du 19 octobre, et plusieurs contrôles s'appuient sur ce que l'image fournit (Chrome pour les parcours, Java pour ZAP). Le passage à Ubuntu 26 se fera exprès, dans une PR, quand il aura été essayé.

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

**ZAP contre le site public (passif, sans attaque).** Automatique depuis le
13 octobre : job `zap-public` de `securite.yml`, chaque lundi et à la demande (*Actions* →
*Sécurité* → *Run workflow*), jamais sur une PR. Même plan et même verdict que sur
l'image (échec sur toute alerte moyenne ou haute non examinée). Une alerte propre
à Cloudflare, si elle apparaît, se lit, se justifie et se déclare dans
`.github/zap/plan.yaml`, avec sa raison. À la main, depuis un poste avec Docker
(version fixée, jamais `stable` ni `latest`) :
```
docker run --rm -t ghcr.io/zaproxy/zaproxy:2.17.0 zap-baseline.py -t https://altiplume.com -I
```

**Trivy sur l'image, à la main.** Version fixée — surtout pas `latest`, qui a
servi le binaire piégé en mars 2026 :
```
docker run --rm aquasec/trivy:0.69.3 image --severity HIGH,CRITICAL ghcr.io/regis57/altiplume:latest
```
Puis `gh attestation verify oci://ghcr.io/regis57/altiplume:latest --owner regis57`
pour vérifier que l'image vient bien du dépôt (SLSA, signé par GitHub).

**Surface réseau, depuis l'extérieur.** Ce qu'on veut savoir : de l'extérieur,
l'adresse publique de la maison laisse-t-elle entrer quelqu'un ? Attention : un
outil qui teste « l'adresse d'où l'on vient » ne vaut que s'il est lancé depuis
la maison. Depuis un téléphone en 4G, il testerait l'adresse de l'opérateur.
- *Le plus simple, depuis un ordinateur ou un téléphone **sur le Wi-Fi de la
  maison*** : [GRC ShieldsUP](https://www.grc.com/shieldsup) → *Proceed* →
  *All Service Ports* (1 056 premiers ports seulement : ajouter la sonde de ports
  personnalisés, *User Specified Custom Port Probe*, pour ce qui est au-delà, par
  exemple `5000,5001,32400`), puis *Test UPnP Exposure* (une box
  qui ouvre des ports toute seule est le piège classique). Attendu : tous les
  ports « Stealth », UPnP non exposé. Le test vient des serveurs de GRC, donc de
  l'extérieur.
- *Avec `nmap`* : relever l'adresse publique de la maison (depuis le Wi-Fi), couper
  le Wi-Fi du téléphone, puis scanner cette adresse avec une application de scan de
  ports qui accepte une adresse saisie (par exemple « Network Tools » de Hurricane
  Electric). `nmap -Pn <adresse>` doit rendre tous les ports « filtered ». À noter :
  l'adresse publique ne se range ni dans le dépôt, ni dans une PR, ni dans un secret
  de dépôt ; et si la box a une adresse IPv6, la tester aussi.
- Shodan : chercher l'adresse ; aucun service ne doit apparaître.

**Blacklight.** [themarkup.org/blacklight](https://themarkup.org/blacklight) →
`https://altiplume.com`, appareil *Mobile*, lieu *Europe* puis *Californie*. Le
résultat attendu est « 0 » partout. Le contrôle continu (`scripts/e2e-tiers.mjs`)
dit la même chose à chaque PR, sans passer par un service extérieur.

**HIBP domaine.** Ajouter `altiplume.com` dans « Domain search » (vérification
par TXT DNS ou par email), puis vérifier qu'aucune adresse n'y est associée.
Rappel : même en cas de fuite, le jeu ne stocke aucun mot de passe, et les
jetons sont des empreintes SHA-256 inutilisables telles quelles.

**Socket.** Le tableau de bord du projet est sur [socket.dev](https://socket.dev/dashboard)
(connexion avec GitHub). L'accès se retire à tout moment : GitHub → *Settings* →
*Applications* → *Installed GitHub Apps* → *Socket Security* → *Configure*.

## Un constat du 13 octobre : deux ports ouverts, et leur fermeture

Ce qui s'est passé, sans l'adresse (qui n'entre jamais dans le dépôt) :

1. **Le constat.** Premier balayage depuis la maison, vu de l'extérieur : les ports
   **80 et 443** répondaient. Une visite de l'adresse dans un navigateur a montré une page
   d'erreur « 403 » du serveur web du NAS : aucune page de connexion, aucun contenu,
   mais un service joignable depuis Internet, donc reconnaissable.
2. **Ce que ça n'était pas.** Pas le jeu : Altiplume sort par le tunnel Cloudflare et
   n'a besoin d'aucun port ouvert. Et rien n'indique d'intrusion.
3. **La correction.** Redirection des ports 80 et 443 retirée de la box et du NAS (le
   tunnel rend inutiles aussi bien la redirection que le certificat à renouveler par
   le port 80).
4. **La revérification.** Nouveau balayage, deux heures après : zéro port ouvert sur
   les 1 056 premiers, aucune réponse au ping, `TruStealth: PASSED`. Sonde sur
   les ports 5000, 5001 et 32400 (accès au NAS, service de médias à distance) : trois
   invisibles. La box n'a pas d'adresse IPv6, donc rien à tester de ce côté. Le jeu
   n'en dépend pas : il sort par le tunnel.

**La leçon.** « Aucun port ouvert » était écrit dans la conception depuis le premier
jour ; c'était une intention, pas une mesure, et la mesure l'a démentie. Désormais
elle est datée. **À refaire** : après tout changement de la box ou du NAS, et une fois
par trimestre ; le service de médias à distance reste fermé tant qu'il n'est pas
décidé de l'ouvrir.

## Un constat du 14 octobre : la sauvegarde hors du NAS

1. **Le constat.** Jusqu'à ce soir, la copie quotidienne de la base (30 copies, contrôlée à
   chaque nuit) vivait sur le NAS lui-même. Elle protège d'une erreur ou d'une base
   abîmée, pas de la perte du NAS ou de son disque. La copie hors du NAS était une
   intention, écrite dans la conception depuis le début ; ce n'était pas un fait.
2. **Ce qui a été mis en place.** Une tâche Hyper Backup, nommée `altiplume`, copie chaque
   jour à 03 h 05 (cinq minutes après la copie du jeu) sur un disque USB branché au NAS.
   La copie est **chiffrée côté client** : le mot de passe est dans le gestionnaire de
   mots de passe de l'auteur et il n'existe aucun moyen de le récupérer. Au premier jour,
   la copie ne pèse que quelques kilo-octets. Seul le dossier des sauvegardes de la base
   est copié : dans la fenêtre de la tâche, `sauvegardes` est coché, `docker` et
   `altiplume` sont en sélection partielle, `journal` est décoché. Le fichier `.env`
   (jeton du tunnel, clés) ne quitte donc pas le NAS.
3. **Ce qui a été mesuré.** Une restauration d'essai depuis la tâche, le 14 octobre : l'écran
   de fin indique « Réussi ». Une sauvegarde jamais restaurée n'est qu'une hypothèse ;
   celle-ci a été restaurée une fois.
4. **L'écart constaté.** La rotation de la tâche est en « Smart Recycle » (versions
   horaires, puis journalières, puis hebdomadaires, gardées longtemps). Or la page de
   confidentialité et le registre des traitements annoncent que les sauvegardes sont
   gardées 30 jours, et qu'un compte effacé en disparaît au plus tard 30 jours après.
   Chaque version de la copie contient déjà les trente copies de la base : en
   Smart Recycle, un compte effacé peut donc survivre des mois, voire des années, sur le
   disque USB. Entre la création de la tâche et la correction (quelques heures, sur une
   tâche vieille d'un jour), cette promesse n'était donc pas tenue pour la copie USB.
5. **La correction, faite le 14 octobre au soir.** Rotation « à partir des versions les
   plus anciennes », **3 versions** au plus, lue sur la fenêtre des paramètres de la tâche.
   Une donnée ne dépasse alors guère la durée de conservation du NAS plus 2 jours sur le
   disque, plus le ménage interne de Hyper Backup, qui n'est pas instantané. Elle s'applique à la prochaine sauvegarde
   (cette nuit, 03 h 05), qui supprime les versions en trop. **Reste à constater** : la
   liste des versions de la tâche (icône horloge) n'en compte plus que 3 au plus. Ce
   constat sera daté ici, et la page de confidentialité relue à ce moment-là.

6. **La décision de l'auteur, le même soir : la durée est de 3.** Trois copies sur le NAS
   (au lieu de trente), trois versions sur le disque USB : un compte effacé disparaît des
   sauvegardes au plus tard **6 jours** après (3 sur le NAS, puis 3 sur le disque).
   `scripts/nas-backup.sh`, la page de confidentialité (en français et en anglais), le
   registre des traitements et le manifeste disent la même chose. Contrepartie assumée :
   on ne peut revenir qu'à trois jours en arrière. Le script collé dans la tâche
   planifiée du NAS a été recollé le soir même.

**La leçon.** Une copie qui n'a jamais été restaurée et une durée de conservation qu'on
ne relit pas après l'avoir réglée sont deux intentions de plus. Désormais : la restauration
d'essai est refaite **chaque trimestre** (date notée dans [Déploiement](Deploiement)), et
toute modification de la rotation se relit contre la page de confidentialité.

## La supervision (15 octobre 2026)

Jusqu'ici, la supervision était « plus tard ». Elle existe, en petit. **UptimeRobot** (offre
gratuite) interroge toutes les 5 minutes, de l'extérieur, deux adresses publiques : la page
d'accueil et `/v1/version` (qui prouve que le jeu lui-même tourne, pas seulement le tunnel).
Une page de statut publique les montre ; elle n'affiche que ces deux noms et leur état :
aucune adresse de l'auteur, aucun courriel, aucune donnée de joueur. Le service ne reçoit
rien d'autre que ce qu'un visiteur peut lire.

Autour, l'auteur est déjà prévenu par ses propres moyens : DSM si une tâche échoue,
l'onduleur en cas de coupure de courant. **Reste à constater** : une alerte réelle d'UptimeRobot
(les moniteurs sont verts, aucune panne n'est encore arrivée), et un courriel de test de
DSM, pour que ces alertes ne soient pas des intentions de plus.

## Ce qui a été écarté, et pourquoi

**OSV-Scanner** (Google). Écarté le 13 octobre : il ne dirait rien que les trois
contrôles déjà en place ne disent pas. Il lit `package-lock.json` et compare à la
base OSV, qui rassemble pour npm les mêmes avis de sécurité que ceux de GitHub, déjà
lus par `npm audit` (à chaque PR) ; Trivy relit les dépendances de l'image
elle-même, chaque semaine ; Socket regarde ce que font les paquets, ce qu'aucune
base d'avis ne voit. Un quatrième lecteur des mêmes avis ne trouverait pas plus,
demanderait un binaire de plus à épingler et à tenir à jour, et ferait échouer la CI
deux fois pour la même cause. À reconsidérer le jour où le projet embarquerait autre
chose que du npm.

**Une alarme de sauvegarde** (signal à la fin du script, service Healthchecks.io).
Écartée le 15 octobre : le script sait la faire (voir [Déploiement](Deploiement)), mais
l'auteur ne l'active pas. Une tâche qui échoue est déjà signalée par DSM, une coupure par
l'onduleur, un site muet par UptimeRobot. Le seul cas non couvert est une tâche désactivée
par erreur alors que le site tourne ; le test de restauration trimestriel le verrait en
trois mois au pire, pour une copie de trois jours. Un compte de plus chez un tiers, pour ce
seul cas, ne valait pas son entretien. À reconsidérer si la sauvegarde cessait un jour
d'être simplement une copie de la base.

## Ce que le code garantit, indépendamment des outils

- Aucun port ouvert : le NAS sort vers Cloudflare par un tunnel ; rien n'entre.
- Pas de mot de passe ; jetons stockés en empreinte ; sessions `HttpOnly`,
  `Secure`, `SameSite=Lax`, et les écritures n'acceptent que du JSON (anti-CSRF).
- Le cookie de session porte le préfixe `__Host-` (depuis le 16 octobre 2026) : un
  autre site vit désormais sous `*.altiplume.com`, et un sous-domaine peut déposer un
  cookie pour tout le domaine. Le navigateur refuse un cookie `__Host-` qui ne vient
  pas du nom exact, en HTTPS, sans `Domain` : aucun sous-domaine ne peut poser une
  fausse session. Il ne peut pas non plus écrire à la place d'un joueur : les écritures
  sont en JSON, et le navigateur bloque ces requêtes faute d'autorisation CORS.
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
