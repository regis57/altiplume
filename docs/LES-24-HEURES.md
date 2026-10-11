# Les premières 24 heures — le résumé

Le 10 octobre 2026 au soir, un dossier vide et une envie : un petit jeu web cozy, en
pixel art, jouable au doigt. Le 11 octobre à 14 h 23, un iPhone posé sur une table
de cuisine a vibré : *ton courrier est arrivé*. Entre les deux, une personne qui ne
code pas, un agent IA qui code, et une règle : rien ne part en production sans un
clic humain. Cette page est le résumé ; le détail, chapitre par chapitre, est dans
le [Journal](Journal).

## Ce que c'est, en une phrase

Un jeu d'aérodrome postal des années 1930 dans un monde inventé, **DevSecOps** de
bout en bout, **conforme au RGPD** par construction, **sans mot de passe**, **installable
sur téléphone, tablette et PC**, **en français et en anglais**, **accessible**, hébergé
sur un NAS domestique **sans aucun port ouvert**, pour le prix d'un nom de domaine.

## Chronologie

| Quand | Quoi |
|---|---|
| **10 oct., soir** | Le concept, le nom (Altiplume, domaines libres), la licence (code AGPL-3.0, œuvre réservée), les règles : pas de mot de passe, NAS + tunnel, budget < 15 €. |
| 10 oct., 21 h | Premier code : serveur, pipeline CI (lint, types, tests, audit, licences), image Docker attestée. |
| 10 oct., 22 h 56 | Première requête venue d'Internet entre dans le NAS par le tunnel Cloudflare — et échoue, comme prévu. |
| **10 oct., 23 h 33** | `altiplume.com/healthz` répond `ok`. Le chemin complet PR → image → NAS fonctionne. |
| 11 oct., nuit | Inscription, lien magique, compte, export et effacement des données ; textes légaux ; registre des traitements. |
| 11 oct., 01 h 25 | Les passkeys, et la connexion d'un PC par QR code lu avec le téléphone. |
| 11 oct., nuit | Le monde : le chemin de la Croisette, six villages, trois avions, quatre pilotes (deux femmes, deux hommes) et leurs histoires. |
| 11 oct., 3 h 30 | Le premier vol : une carte, un avion, un pilote, du vrai temps. |
| 11 oct., 4 h – 5 h | L'aérodrome à restaurer et décorer, la scène qui vit, la musique de puce. |
| 11 oct., 10 h 30 | Première partie de Régis sur PC ; première vraie faute trouvée (« Compagnie des la Croisette »). |
| 11 oct., 13 h | Les notifications Web Push écrites à la main (VAPID, chiffrement aes128gcm), l'application installable. |
| **11 oct., 14 h 23** | La notification arrive sur l'iPhone. Le pari est gagné. |
| 11 oct., 14 h – 15 h 30 | Les retours de jeu : la ligne régulière (« ça me laisse pas refaire une mission »), la vache qui bloque la piste, l'invitation à créer sa passkey, les cinq premières minutes. |
| 11 oct., 16 h | v0.2 commence : la Côte de Saline, l'hydravion, le ponton, la route à dix cachets. |
| 11 oct., 16 h 30 – 19 h | Interlude sécurité : Observatory B+ → **A+**, SSL Labs B → **A+**, SPF/DKIM/DMARC, Trusted Types, contrôle hebdomadaire. |
| 11 oct., 19 h 30 | La scène redessinée en 320 × 144, chaque décoration visible, jour et nuit. |
| 11 oct., 20 h 30 | `bonjour@altiplume.com`, le formulaire de contact anti-robots. |
| 11 oct., 21 h | « Trois francs » : on ne peut plus jamais rester cloué au sol ; l'aide *Comment on joue* ; trois promesses du jeu tenues. |
| 11 oct., 21 h 30 | Les promesses RGPD tenues : suppression après 24 mois, avertie deux fois. |

## Les décisions clefs

- **Pas de mot de passe.** Lien magique, passkey, QR code. On ne stocke qu'un email, un pseudonyme et des clés publiques : il n'y a rien à voler.
- **Aucun port ouvert.** Le NAS sort vers Cloudflare par un tunnel ; rien n'entre. Secrets générés sur le NAS, jamais dans le dépôt ni dans une conversation.
- **Le serveur fait autorité.** Le navigateur envoie des intentions ; francs, cachets, tirages, aléas : tout est calculé côté serveur, avec des graines reproductibles.
- **Rien ne se perd si vous ne vous connectez pas.** Pas de tâche de fond : l'état se calcule à la lecture. L'absence n'est jamais punie — ni la maladresse (la ligne régulière part toujours).
- **Publié sous le nom de l'auteur dès le premier commit.** L'IA propose, la machine vérifie, l'humain fusionne.
- **Une correction = une nouvelle PR.** Jamais un commit ajouté à une PR fusionnée. Appris deux fois, écrit une fois.
- **Tout en deux langues natives**, jamais traduites mot à mot — *Crosslet Lane* n'est pas « Croisette Path ».
- **Mesurer ce qu'on affirme.** « Sécurisé par conception » est une intention tant qu'une plateforme extérieure ne l'a pas lu ; la page [Sécurité](Securite) tient l'avant, l'après et ce qui reste non effectué.
- **Pas de tiers.** Aucun script, aucune police, aucun traqueur externe ; pas de captcha. La CSP ne les laisserait pas entrer.
- **Le budget** : un nom de domaine, environ 10 €. Le NAS existait, tout le reste est gratuit.

## Les échanges qui ont structuré le projet

- *« Vérifie la sécurité avant, et publie en regis57 dès le début, rien en claude. »* — la règle de départ.
- *« Invente tout, autant de femmes que d'hommes, intègre le chemin de la Croisette. »* — le monde.
- *« Ça me laisse pas refaire une mission. »* — la ligne régulière.
- *« Comment je peux faire décoller Marthe si j'ai un imprévu ? Fixe la logique ou explique-la bien dans l'histoire. »* — la vache bloque la piste.
- *« La simplicité, tu te souviens ? »* — le raccourci sur l'écran d'accueil en deux gestes.
- *« Un correctif = une nouvelle PR, toujours. »* — la discipline Git.
- *« Mais je ne sais pas quoi faire. Sachant qu'on ne doit pas bloquer l'application non plus. »* — l'interlude sécurité, lu par les API avant d'agir.
- *« Attendu après ne veut pas dire que cela a été atteint. Renomme. »* — la page Sécurité ne dit que ce qui a été mesuré.
- *« 8 bits, on est d'accord, mais essaie de faire plus de pixels. »* — la scène en 320 × 144.
- *« Suis-je bloqué pour toujours ? Souviens-toi de l'esprit Stardew Valley. »* — la poste avance les frais.
- *« Best support is no support. »* — l'aide *Comment on joue*.

## Où en est le projet

**v0.1 livrée** (les Vallées de Brume), **v0.2 en cours** (la Côte de Saline fusionnée,
la scène redessinée ; l'Archipel des Lanternes vient). Observatory, securityheaders et
SSL Labs : **A+**. 174 tests, trois parcours de bout en bout dans un vrai navigateur,
un contrôle de sécurité externe chaque lundi. Jouable sur
[altiplume.com](https://altiplume.com).

Ce qui reste et dans quel ordre : [Sécurité](Securite) (les lignes « non effectué »),
[Conception](Conception) (la feuille de route), [Coûts](Couts) (le temps passé, heure
par heure).
