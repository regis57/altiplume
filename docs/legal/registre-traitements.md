# Registre des activités de traitement

Tenu au titre de l'article 30 du RGPD. Responsable du traitement : l'éditeur
d'Altiplume (personne physique, France). Version du 18 octobre 2026.

## Traitement 1 — Comptes de joueurs

| | |
|---|---|
| **Finalité** | Permettre à une personne de créer un compte, de s'y connecter sans mot de passe et de jouer. |
| **Base légale** | Exécution du contrat (conditions d'utilisation acceptées à l'inscription). |
| **Personnes concernées** | Joueurs inscrits, 15 ans et plus. |
| **Données** | Adresse email ; pseudonyme (public) ; langue ; fuseau horaire déclaré par le navigateur (« Europe/Paris », depuis le 14/10 : la nuit du jeu suit l'heure du joueur) ; déclaration d'âge (oui/non) ; version des CGU acceptées et date ; dates de création et de dernière activité. Données de jeu rattachées au compte : nom de la compagnie (choisi ou proposé, filtré contre les marques réelles), francs, cachets, avions, pilotes embauchés et progression de leurs histoires, niveaux de l'aérodrome, décorations, album, routes ouvertes, main de cartes, vols, livre de bord (mouvements de francs) et compteurs (nombre de vols, délais tenus). Ces données décrivent la partie, pas la personne ; elles sont exportées et effacées avec le compte. |
| **Destinataires** | L'éditeur. Brevo (envoi des emails de connexion : adresse email uniquement). Cloudflare (acheminement du trafic : adresse IP en transit). |
| **Transferts hors UE** | Cloudflare, Inc. (États-Unis) — clauses contractuelles types. Brevo : France. |
| **Durée** | Tant que le compte existe. Suppression automatique après 24 mois d'inactivité, précédée de deux avertissements. Suppression immédiate à la demande, depuis le compte. |
| **Sécurité** | Aucun mot de passe. Jetons de connexion et de session stockés sous forme d'empreinte SHA-256 uniquement, à usage unique ou à expiration. Serveur non exposé directement (tunnel sortant). Conteneur non-root, lecture seule. Transport chiffré (TLS). |
| **Sauvegardes** | Copie cohérente de la base chaque nuit sur le NAS, conservée 3 jours (rotation automatique : les trois dernières), puis copie chiffrée hors du NAS par Hyper Backup, qui garde 3 versions. Un compte effacé disparaît donc des sauvegardes au plus tard 6 jours après son effacement. |
| **Notifications** | Sur demande explicite de la personne (bouton), le navigateur fournit une adresse d'abonnement et deux clés de chiffrement, conservées tant que la personne ne retire pas l'abonnement (cinq appareils au plus), supprimées avec le compte ou dès que le service de notification signale l'abonnement mort. Contenu envoyé : nom du pilote, village, montant — chiffré pour l'appareil seul ; le service de notification (Google, Mozilla ou Apple selon le navigateur) ne peut pas le lire. |

## Traitement 2 — Sessions et liens de connexion

| | |
|---|---|
| **Finalité** | Maintenir la connexion d'un navigateur ; vérifier qu'un lien envoyé par email est bien utilisé par son destinataire. |
| **Base légale** | Exécution du contrat. |
| **Données** | Empreinte du jeton (jamais le jeton), identifiant de joueur, dates de création, d'usage et d'expiration. Pour un lien d'inscription : pseudonyme et langue choisis, en attente de confirmation. Pour une passkey (WebAuthn) : identifiant de la clé, clé publique, compteur de signatures, type d'appareil (synchronisée ou non), nom choisi par la personne, dates. Pour une connexion par QR code : code à six chiffres, empreintes des deux jetons, état, 90 secondes. Défis WebAuthn : 5 minutes. |
| **Durée** | Lien : valable 10 minutes ; la ligne (adresse email, et pour une inscription pseudonyme et langue) est effacée par le ménage horaire du serveur : à la première purge après son usage, sinon à la première purge qui suit d'au moins une heure son expiration ; au plus tard 2 h 10 après l'envoi. Session : 30 jours sans usage. Passkey : jusqu'à suppression par la personne ou avec le compte. Demande QR : valable 90 secondes ; ligne effacée par le même ménage horaire, au plus tôt 10 minutes et au plus tard 70 minutes après l'expiration. |
| **Remarque** | L'authenticateur (téléphone, ordinateur) ne reçoit que le pseudonyme et l'identifiant interne du joueur, jamais l'adresse email. La clé privée reste sur l'appareil. |

## Traitement 3 — Journal d'audit

| | |
|---|---|
| **Finalité** | Sécurité et traçabilité des actions sensibles (inscription, connexion, export, suppression, liens refusés). |
| **Base légale** | Intérêt légitime (sécurité du service). |
| **Données** | Type d'événement, date, identifiant de joueur, codes techniques. **Jamais** d'adresse email, d'adresse IP ni d'agent utilisateur. |
| **Durée** | 90 jours, purge automatique. Les événements survivent à la suppression du compte, sans lien exploitable vers la personne. |

## Traitement 4 — Journaux techniques du serveur

| | |
|---|---|
| **Finalité** | Diagnostic des pannes, détection d'abus. |
| **Base légale** | Intérêt légitime. |
| **Données** | Lignes de journal du serveur web pouvant contenir des adresses IP (via les en-têtes transmis par Cloudflare), chemins demandés, codes de réponse. |
| **Durée** | Pas de durée fixe. Les journaux sont effacés à chaque mise à jour du jeu (les conteneurs sont recréés) ; entre deux, la rotation Docker garde au plus 3 fichiers de 10 Mo par conteneur et efface les lignes les plus anciennes. Avec peu de trafic et sans mise à jour, une ligne peut rester plusieurs semaines, voire davantage. |

## Traitement 5 — Limitation de débit

| | |
|---|---|
| **Finalité** | Empêcher les abus (envois massifs de liens, tentatives automatisées). |
| **Base légale** | Intérêt légitime. |
| **Données** | Adresse IP (en IPv6, son bloc /64), sous forme d'empreinte salée, en mémoire vive seulement, pour la durée de la fenêtre (quelques minutes). Jamais écrite sur disque. |

## Traitement 6 — Formulaire de contact

| | |
|---|---|
| **Finalité** | Permettre à une personne d'écrire à l'éditeur (question, signalement de bug, demande RGPD) sans exposer une adresse email aux robots. |
| **Base légale** | Intérêt légitime (répondre à une sollicitation) ; pour une demande RGPD, obligation légale. |
| **Données** | Le message, et facultativement une adresse email de réponse et un sujet. |
| **Stockage serveur** | **Aucun.** Le message est transmis par courriel et n'est écrit ni en base, ni sur disque. Le journal d'audit note uniquement `contact.sent` avec un indicateur « une adresse était jointe », sans contenu ni adresse. |
| **Destinataire** | L'éditeur, sur sa boîte `bonjour@altiplume.com` (redirection Cloudflare Email Routing vers une boîte Gmail personnelle). Le message part du serveur par l'API de Brevo, comme les emails de connexion. |
| **Durée** | Hors du serveur : le temps utile à la conversation, dans la boîte email de l'éditeur. Suppression sur demande. |
| **Transferts hors UE** | Cloudflare, Inc. (acheminement du courriel entrant) et Google Ireland/LLC (Gmail) — clauses contractuelles types. |
| **Mesures** | Destinataire fixé par la configuration du serveur, jamais par le navigateur (pas de relais ouvert) ; champ-piège et délai minimum de rédaction contre les robots ; trois envois par heure et par adresse IP ; longueurs bornées ; sujet et adresse nettoyés de tout caractère de contrôle (pas d'injection d'en-tête) ; message échappé dans la version HTML. |

## Sous-traitants

| Sous-traitant | Rôle | Localisation | Encadrement |
|---|---|---|---|
| Cloudflare, Inc. | Acheminement, protection DDoS, certificat TLS | États-Unis (points de présence mondiaux) | Clauses contractuelles types, DPA Cloudflare |
| Sendinblue SAS (Brevo) | Envoi des emails de connexion et des messages du formulaire de contact | France | DPA Brevo |
| Cloudflare, Inc. | Réception du courrier de `@altiplume.com` et redirection (Email Routing) | États-Unis | Clauses contractuelles types, DPA Cloudflare |
| Google Ireland Ltd. | Boîte email de l'éditeur (Gmail), destinataire final des messages | Irlande / États-Unis | Clauses contractuelles types |

## Traitements prévus, non encore actifs

- **Publicité** : aucune. Décision du 12/10/2026 : pas de régie publicitaire, donc ni traitement à ce titre ni bandeau de consentement. Un éventuel lien de don (Buy Me a Coffee) sera un lien sortant, sans script ni cookie chargé depuis le site.

## Droits des personnes

Export (JSON), rectification (pseudonyme, langue) et effacement sont exercés directement depuis la page « Mon compte », sans formulaire ni délai. Les autres demandes passent par l'adresse de contact des mentions légales. Autorité de contrôle : CNIL.
