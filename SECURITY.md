# Politique de sécurité

## Signaler une faille

Utilisez le **signalement privé de vulnérabilité** de GitHub
(onglet *Security* → *Report a vulnerability*). Il est activé sur ce dépôt.

N'ouvrez pas d'issue publique pour une faille : laissez-nous le temps de corriger.

**Délai de réponse visé :** accusé de réception sous 72 heures, correctif ou plan de
correction sous 30 jours. Projet mené par une seule personne : merci pour la patience.

Vous serez crédité dans l'avis de sécurité, sauf si vous préférez l'anonymat.

## Portée

Dans la portée : ce dépôt, et l'instance de jeu lorsqu'elle sera en ligne.
Hors portée : le déni de service par volume, les rapports issus uniquement d'un
scanner automatique sans démonstration d'impact, et l'ingénierie sociale.

## Ce que le projet protège

- **Aucun mot de passe n'est stocké.** L'authentification repose sur des liens
  magiques à usage unique et des passkeys (WebAuthn). Il n'y a pas d'empreinte de
  mot de passe à dérober.
- **Données personnelles minimales :** une adresse email, un pseudonyme, une clé
  publique de passkey, une locale. Pas d'adresse IP conservée au-delà de 7 jours,
  pas d'analytique tierce.
- **Serveur autoritatif :** aucune valeur de jeu n'est acceptée depuis le client.
- **Chaîne d'approvisionnement :** dépendances épinglées, actions GitHub épinglées
  par empreinte SHA, licences vérifiées, audit à chaque pull request.
- **Secrets :** aucun secret dans le dépôt. La protection anti-poussée de GitHub est
  active et bloque tout commit en contenant.

## Versions suivies

Le projet est en pré-alpha : seule la branche `main` est suivie.
