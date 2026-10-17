# Jour 6 — un voisin sous le domaine

Le cinquième jour avait appris au jeu à montrer le chemin. Le sixième, le 16 octobre 2026,
commence ailleurs : un second site s'installe sous `altiplume.com`, sur le même NAS, et la
question change d'échelle. **Ce qui tenait pour un site seul tient-il quand il a un
voisin ?** Et, en fil rouge, le joueur continue de jouer pour éprouver les mécanismes.

Cette page est le résumé de la journée, dans l'ordre où elle se déroule ; elle reste
ouverte tant que la journée continue. Le récit, à partir du chapitre 52, est dans le
[Journal](Journal) ; la veille, dans [Jour 5](Jour-5). Le récit s'arrêtera au jour 7.

## Dans l'ordre

1. **Un second site, séparé.** Un sous-domaine, son propre tunnel, son propre conteneur,
   son propre dossier et son propre fichier de secrets : couper l'un ne touche pas
   l'autre, et aucun port n'est ouvert. Le sous-domaine n'envoie pas de courrier et le dit
   au monde : un MX vide, un SPF `-all`, un DMARC `reject`. Il obtient A+ à l'Observatory
   de Mozilla, comme Altiplume.
2. **DNSSEC activé.** L'export de la zone ne permettait pas de le voir ; le joueur l'a
   vérifié et activé chez Cloudflare, qui est aussi son registrar.
3. **Le certificat qu'on ne coupe pas.** L'écran « Disable Universal SSL » est resté
   intact : ce certificat couvre le domaine et ses sous-domaines, et Altiplume demande
   aux navigateurs de toujours passer en HTTPS, sous-domaines compris. Le couper rendrait
   les deux sites inaccessibles.
4. **Le cookie de session préfixé `__Host-`.** Un sous-domaine peut déposer un cookie
   valable pour tout le domaine, y compris une fausse session pour Altiplume : rien à
   voler, mais de quoi déconnecter un joueur ou le connecter à un autre compte. En
   production, le cookie s'appelle désormais `__Host-altiplume_session`, que les
   navigateurs refusent à un sous-domaine. Chaque joueur s'est reconnecté une fois. Quatre
   tests en conditions de production ; vérifié dans le navigateur du joueur le soir même
   (#112).
5. **Une capture de trop.** La capture qui vérifiait le cookie montrait aussi sa valeur,
   donc la clé de la session. Déconnexion dans la minute : la session est annulée côté
   serveur, la valeur ne sert plus à rien. On coupe désormais le bas du panneau avant
   d'envoyer.
6. **La sauvegarde, rectifiée.** Le Jour 4, le manifeste et le journal disaient le script
   « recollé le soir même » du 14 ; il ne l'avait pas été (la tâche gardait `GARDER=30`
   jusqu'au 15 à 17 h 40, voir le [Jour 5](Jour-5)). Les trois disent maintenant la vérité,
   et le déploiement ajoute l'étape qui manquait : après chaque recollage, rouvrir la
   tâche, lire la ligne `GARDER=`, l'exécuter une fois. Reste à constater : trois copies
   dans le dossier des sauvegardes.

## Où en est le projet

4 régions et 24 escales, 6 avions, 10 pilotes (cinq femmes, cinq hommes), 106 cartes,
4 saisons et 4 musiques ; **281 tests**, six parcours de bout en bout dans un vrai
navigateur ; quinze migrations de base de données. A+ sur les trois notes, zéro traqueur,
rien d'ouvert chez l'auteur, DNSSEC actif. La base a une copie chiffrée hors du NAS,
gardée 3 jours ; deux moniteurs surveillent le site de l'extérieur.

À faire ensuite : constater les trois copies après une exécution de la tâche ; dimanche
18, compter les versions de la copie USB (trois au plus) ; décider du redémarrage
quotidien du NAS ; un courriel de test de DSM. Sans urgence : le passage à Ubuntu 26
après le 19 octobre dans une PR dédiée, la restauration d'essai chaque trimestre, et
l'accessibilité, à mesurer avec les personnes concernées.

Jouable sur [altiplume.com](https://altiplume.com).

La suite, et la fin du récit : [Jour 7](Jour-7).
