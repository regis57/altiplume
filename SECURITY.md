# Politique de sécurité

## Signaler une faille

Utilisez le **signalement privé de vulnérabilité** de GitHub
(onglet *Security* → *Report a vulnerability*). Il est activé sur ce dépôt.

N'ouvrez pas d'issue publique pour une faille : laissez-nous le temps de corriger.

**Délai de réponse visé :** accusé de réception sous 72 heures, correctif ou plan de
correction sous 30 jours. Projet mené par une seule personne : merci pour la patience.

Vous serez crédité dans l'avis de sécurité, sauf si vous préférez l'anonymat.

## Portée

Dans la portée : ce dépôt, et l'instance de jeu, [altiplume.com](https://altiplume.com).
Hors portée : le déni de service par volume, les rapports issus uniquement d'un
scanner automatique sans démonstration d'impact, et l'ingénierie sociale.

## Ce que le projet protège

- **Aucun mot de passe n'est stocké.** L'authentification repose sur des liens
  magiques à usage unique et des passkeys (WebAuthn). Il n'y a pas d'empreinte de
  mot de passe à dérober.
- **Données personnelles minimales :** une adresse email, un pseudonyme, une clé
  publique de passkey, une locale. Les adresses IP ne
  vivent que dans les journaux techniques (30 Mo au plus, effacés à chaque mise à
  jour du jeu) ; pas d'analytique tierce.
- **Serveur autoritatif :** aucune valeur de jeu n'est acceptée depuis le client.
- **Chaîne d'approvisionnement :** dépendances épinglées, actions GitHub épinglées
  par empreinte SHA, licences vérifiées, audit à chaque pull request. Les paquets
  npm sont surveillés par Socket (comportement : scripts d'installation, accès
  réseau, code obscurci, noms imités), pas seulement par leurs failles connues.
- **Contrôles à chaque pull request :** CodeQL et Opengrep relisent le code ; OWASP
  ZAP visite l'application démarrée en production (passif), et chaque lundi le
  site public lui-même ; un test de bout en bout échoue sur toute requête vers un
  autre domaine ; Trivy scanne l'image,
  qui n'est **pas publiée** s'il y trouve une faille critique corrigeable, et la
  rescanne chaque lundi. Les outils eux-mêmes sont pris dans leurs releases
  officielles, version et empreinte SHA-256 fixées, sans action GitHub tierce.
- **Image minimale :** non-root, système de fichiers en lecture seule, sans npm ni
  autre gestionnaire de paquets ; provenance attestée et vérifiable
  (`gh attestation verify`).
- **Vérifié de l'extérieur :** le protocole, les mesures et ce qu'il reste à faire
  sont dans [docs/SECURITE.md](docs/SECURITE.md)
  ([wiki](https://github.com/regis57/altiplume/wiki/Securite)).
- **Secrets :** aucun secret dans le dépôt. La protection anti-poussée de GitHub est
  active et bloque tout commit en contenant.

## Versions suivies

Le projet est en pré-alpha : seule la branche `main` est suivie.
