# Registre des activités de traitement

Tenu au titre de l'article 30 du RGPD. Responsable du traitement : l'éditeur
d'Altiplume (personne physique, France). Version du 11 octobre 2026.

## Traitement 1 — Comptes de joueurs

| | |
|---|---|
| **Finalité** | Permettre à une personne de créer un compte, de s'y connecter sans mot de passe et de jouer. |
| **Base légale** | Exécution du contrat (conditions d'utilisation acceptées à l'inscription). |
| **Personnes concernées** | Joueurs inscrits, 15 ans et plus. |
| **Données** | Adresse email ; pseudonyme (public) ; langue ; déclaration d'âge (oui/non) ; version des CGU acceptées et date ; dates de création et de dernière activité. |
| **Destinataires** | L'éditeur. Brevo (envoi des emails de connexion : adresse email uniquement). Cloudflare (acheminement du trafic : adresse IP en transit). |
| **Transferts hors UE** | Cloudflare, Inc. (États-Unis) — clauses contractuelles types. Brevo : France. |
| **Durée** | Tant que le compte existe. Suppression automatique après 24 mois d'inactivité, précédée de deux avertissements. Suppression immédiate à la demande, depuis le compte. |
| **Sécurité** | Aucun mot de passe. Jetons de connexion et de session stockés sous forme d'empreinte SHA-256 uniquement, à usage unique ou à expiration. Serveur non exposé directement (tunnel sortant). Conteneur non-root, lecture seule. Transport chiffré (TLS). |

## Traitement 2 — Sessions et liens de connexion

| | |
|---|---|
| **Finalité** | Maintenir la connexion d'un navigateur ; vérifier qu'un lien envoyé par email est bien utilisé par son destinataire. |
| **Base légale** | Exécution du contrat. |
| **Données** | Empreinte du jeton (jamais le jeton), identifiant de joueur, dates de création, d'usage et d'expiration. Pour un lien d'inscription : pseudonyme et langue choisis, en attente de confirmation. |
| **Durée** | Lien : 10 minutes. Session : 30 jours sans usage. Purge automatique. |

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
| **Durée** | 7 jours (rotation Docker : 3 fichiers de 10 Mo). |

## Traitement 5 — Limitation de débit

| | |
|---|---|
| **Finalité** | Empêcher les abus (envois massifs de liens, tentatives automatisées). |
| **Base légale** | Intérêt légitime. |
| **Données** | Adresse IP, en mémoire vive seulement, pour la durée de la fenêtre (quelques minutes). Jamais écrite sur disque. |

## Sous-traitants

| Sous-traitant | Rôle | Localisation | Encadrement |
|---|---|---|---|
| Cloudflare, Inc. | Acheminement, protection DDoS, certificat TLS | États-Unis (points de présence mondiaux) | Clauses contractuelles types, DPA Cloudflare |
| Sendinblue SAS (Brevo) | Envoi des emails de connexion | France | DPA Brevo |

## Traitements prévus, non encore actifs

- **Données de jeu** (aérodrome, pilotes, vols) : exécution du contrat, durée du compte. Arriveront avec la première version jouable ; ce registre sera mis à jour.
- **Publicité** (Google AdSense) : consentement, via une plateforme de gestion du consentement certifiée. Non actif. Ce registre, la politique de confidentialité et les CGU seront mis à jour avant toute activation.

## Droits des personnes

Export (JSON), rectification (pseudonyme, langue) et effacement sont exercés directement depuis la page « Mon compte », sans formulaire ni délai. Les autres demandes passent par l'adresse de contact des mentions légales. Autorité de contrôle : CNIL.
