# Jour 2 — le résumé

Le premier jour avait prouvé que le jeu pouvait exister : un dossier vide un soir,
une notification sur un iPhone le lendemain. Le deuxième jour, le 12 octobre 2026,
devait prouver autre chose : qu'on peut le faire **grandir sans rien casser**. On l'a
joué, on a écouté ce qui coinçait, on a réparé, puis on a ouvert une région, une
mécanique, une année entière, et on a fini par passer tout l'aérodrome au crible.
Dix-sept PR fusionnées, toutes vertes, toutes publiées sous le nom de l'auteur.

Cette page est le résumé de la journée, dans l'ordre où elle s'est déroulée. Le
détail, chapitre par chapitre (28 à 38), est dans le [Journal](Journal) ; la
première journée, dans [Les 24 heures](Les-24-heures).

## Ce que la journée a ajouté, en une phrase

Une **quatrième région** et une route qui bifurque, des **convois** à deux avions,
les **saisons du calendrier**, un **aérodrome qui se voit grandir**, une fatigue qui
ne bloque plus personne, une étiquette qui dit **ce qui tourne en production**, des
**cartes de partage** dans chaque langue, et **quatre contrôleurs de sécurité** qui
relisent tout à chaque PR.

## Dans l'ordre

1. **Prosper Chickenman remplace Marthe Vaudrin.** Le pilote du premier jour change
   de nom et de genre ; son histoire, ses traits et les douze vols déjà faits avec
   lui sont gardés. La ligne régulière passe de 18 à 25 francs, et tous les contrats
   suivent : la progression est plus généreuse d'environ 40 %.
2. **Le compte à rebours bat à la seconde.** Les minutes affichées étaient justes,
   mais figées entre deux rafraîchissements. Une horloge locale fait maintenant
   descendre la barre et les minutes sans aucun appel réseau, et la page se
   resynchronise d'elle-même à l'atterrissage.
3. **Garance et Hedda.** Le renommage avait rompu la parité ; deux pilotes la
   rétablissent, et leurs histoires répondent à celles qui existaient déjà : la
   poutre aux marques de crayon de Prosper, les lettres de Teodor. Un test veille
   désormais sur la parité, et la bible du monde tient la liste des fils qui se
   rejoignent.
4. **Huit heures de vol, pas huit vols.** La fatigue comptait des vols : dix minutes
   de saut pesaient autant que deux heures et demie de traversée, et quatre-vingts
   minutes de jeu valaient vingt-quatre heures d'attente. Elle compte maintenant les
   minutes de vol, et le repos efface deux minutes par minute au sol. Sur la ligne
   régulière : **36 allers-retours d'affilée au lieu de 8**, et le pilote repart
   après une heure. La liste dit dans combien de temps il reprend son service.
5. **Des commits enfin « Verified ».** Les commits de l'agent n'étaient pas signés ;
   la fusion par *squash and merge* fait signer chaque commit de `main` par GitHub,
   au nom de l'auteur.
6. **Dire ce qui tourne.** Une PR fusionnée, un redéploiement lancé, et la
   production servait encore l'image d'avant, sans que rien ne le dise. Désormais,
   une étiquette `ESSAI v0.2.0` en haut de chaque page, la version exacte au survol,
   une page qui explique ce qu'« essai » veut dire, et une route `/v1/version` que
   le contrôle de sécurité hebdomadaire lit : un redéploiement raté ne passe plus
   inaperçu.
7. **Par avion.** Un lien Altiplume collé dans une conversation montre maintenant
   une carte tirée de la vraie scène, avec l'étiquette bleue *PAR AVION* — en
   français dans toutes les langues, comme le veut l'Union postale universelle
   depuis 1929. Une carte par langue, et le lien choisit. **Décision : pas de
   publicité.** Buy Me a Coffee viendra plus tard, en simple lien sortant.
8. **La Forêt de Cuivre.** La quatrième région répond à une question que personne
   n'avait posée : d'où vient le cuivre des lanternes. Six escales sous des hêtres
   qui gardent leurs feuilles l'hiver, des clairières où seul le Pic se pose, deux
   pilotes — Gaspard, facteur à pied pendant trente ans, et Rosalie, fille du
   forgeron. Et surtout **une fourche** : après la vallée, la mer ou les arbres, au
   choix. Dix pilotes, cinq femmes, cinq hommes. Au passage, les arbres et les
   hydravions des vignettes de région, noirs depuis la v0.2, retrouvent leurs
   couleurs.
9. **Deux compteurs au lieu d'un.** Les pages et l'API partageaient la même limite
   de débit : charger le site pouvait épuiser le droit de jouer. Les pages ont leur
   propre compteur ; la clé n'est plus l'adresse IP, mais une empreinte salée.
10. **Deux avions pour un courrier.** Le convoi : quand un avion ne porte pas tout,
    un second équipage décolle avec lui. Sept cartes de fret lourd, et la chaîne de
    la cloche de Sainte-Lueur. En l'écrivant, un test a révélé **trois contrats
    impossibles à livrer depuis la v0.1** et un avion, le Héron, **qu'aucune carte
    ne vendait** : réparés. Et « rentré de Les Tilleuls » dit enfin « des Tilleuls ».
11. **Les saisons.** Celles du calendrier, en temps universel. Une règle chacune, et
    aucune qui punisse : l'hiver rallonge les vols mais paie une prime de froid.
    Douze cartes de saison, une scène qui change de couleurs, et une page d'album,
    « Une année », qui ne s'obtient qu'en revenant pendant un an.
12. **L'aérodrome qui grandit.** Le hangar change de silhouette à chaque niveau, la
    tour promise depuis la v0.1 arrive en trois âges, chaque avion a son dessin et
    sa place, et un avion en vol laisse sa place vide.
13. **Le crible.** Quatre contrôleurs gratuits, une PR chacun, chacun pris dans sa
    release officielle avec son empreinte vérifiée — parce que l'action GitHub de
    Trivy avait été piégée en mars. **Trivy** scanne l'image avant toute
    publication, qui n'a d'ailleurs plus npm ; **OWASP ZAP** visite l'application
    démarrée comme en production, sans rien attaquer ; **Opengrep** relit le code ;
    **Socket** surveille ce que font les dépendances. Résultat : aucune faille
    critique corrigeable, aucune alerte haute ni moyenne réelle, aucune trouvaille
    bloquante, rapport Socket vert.
14. **Le manifeste de sécurité à jour.** La page [Sécurité](Securite) a maintenant
    deux moitiés — ce qui se voit du dehors, ce qui se contrôle du dedans — et la
    liste, plus courte, de ce qui reste à faire.

## Les décisions de la journée

- **Pas de publicité.** Une seule balise de régie aurait fait tomber les trois A+,
  l'argument « zéro traqueur », et imposé un bandeau de consentement. Buy Me a
  Coffee, plus tard, en simple lien.
- **La parité est une règle, et un test la garde.** Quand un renommage la rompt, on
  le dit, et on la rétablit le jour même.
- **Le jeu ne bloque jamais.** La fatigue se mesure en temps de vol ; aucune saison
  ne ferme de route ; aucun contrat n'est tiré s'il est impossible à livrer.
- **Dire ce qui tourne.** La version affichée vient de la chaîne de publication,
  jamais d'une saisie à la main.
- **Chaque nouvelle histoire répond à une histoire existante.** Le monde se tient
  par ses fils.
- **Les outils de sécurité ne sont pas au-dessus du soupçon.** Binaires officiels,
  versions avec du recul, empreintes vérifiées, aucune action tierce. ZAP en passif
  seulement : on ne bombarde pas son propre aérodrome.
- **Une PR par outil, et jamais deux PR sur le journal en même temps.**
- **Ce qui attend, et pourquoi.** DMARC en `reject` : on attend les rapports. La
  supervision : plus tard. L'accessibilité : mesurée avec les personnes concernées.

## Les échanges qui ont structuré la journée

- *« Renomme le personnage principal… en Prosper Chickenman. »* — et la parité qui
  saute, dite plutôt que tue.
- *« Le rafraîchissement du voyage n'est pas correct, je crois. »* — le compte à
  rebours à la seconde.
- *« Rétablis la parité pour le futur. Que l'histoire tienne ensemble. »* — Garance
  et Hedda, et les fils qui se rejoignent.
- *« Difficile d'évoluer, je trouve. »* — la fatigue en minutes de vol.
- *« Affiche la version. Il faut indiquer qu'on expérimente à ce stade. »* —
  l'étiquette *Essai*.
- *« Pas d'AdSense. Je mettrai seulement Buy Me a Coffee, plus tard. »* — la
  décision consignée.
- *« Ne te rate pas sur le storytelling. »* — la forêt, la cloche, les saisons,
  l'aérodrome.
- *« Ne fais pas sans mon go. »* puis *« Fais PR par PR. »* — le crible.

## Où en est le projet, ce soir

Un jeu complet, de la première lettre à la première année : **4 régions et 24
escales** qui s'ouvrent par deux routes, **6 avions**, **10 pilotes** (cinq femmes,
cinq hommes) et leurs histoires croisées, **106 cartes**, **46 pages d'album**, les
**4 saisons**, un aérodrome à quatre zones et douze décorations qui se voit grandir.
**210 tests**, **quatre parcours de bout en bout** dans un vrai navigateur.
Observatory, securityheaders, SSL Labs : **A+**. À chaque PR : CodeQL, Opengrep,
ZAP, Trivy, Socket, `npm audit`, licences ; chaque lundi, le contrôle externe et
l'image en service repassée sous Trivy. Jouable sur
[altiplume.com](https://altiplume.com).

Toujours le même budget : un nom de domaine, environ dix euros par an.
