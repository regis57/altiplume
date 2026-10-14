# Jour 4 — les cartes disent vrai

Le premier jour avait prouvé que le jeu pouvait exister. Le deuxième, qu'on pouvait le
faire grandir sans rien casser. Le troisième, que ses garanties se mesurent au lieu de
s'affirmer. Le quatrième, le 14 octobre 2026, part d'une phrase du joueur : *« Une carte
qui me donne la nuit, alors que ma journée réelle commence, c'est bizarre. »*

C'est la question qui reste quand la sécurité est faite : **ce que le jeu raconte
est-il ce que le jeu fait ?** Une carte est une promesse. Quand le texte dit « le vol se
fait », un vol doit se faire ; quand il dit « vous dormez sur place », rien ne doit
décoller ; quand il dit « la nuit », il doit faire nuit chez celui qui joue.

Cette page est le résumé de la journée, dans l'ordre où elle s'est déroulée. Le récit,
chapitres 45 et 46, est dans le [Journal](Journal) ; les règles du monde sont dans
[Monde](Monde) ; la veille, dans [Jour 3](Jour-3).

## Dans l'ordre

1. **« Saisir » n'est pas un vol.** Un pilote enrhumé, deux cartes « Saisir », et aucun
   vol qui part : normal, mais rien ne le disait. Une opportunité est un avion d'occasion,
   un pilote de passage, une fête, une vieille carte qui vaut un cachet. Le bouton dit
   maintenant ce qu'on fait (*Acheter · 1500 F*, *Embaucher*, *Y aller · 15 F*, *La
   prendre · +1 cachet*), la carte dit qu'elle n'est pas un vol, et le message raconte ce
   qui s'est passé.
2. **Vingt imprévus, tous « au sol ».** Les textes racontaient des vols (la brume en
   route, la nuit sur le retour) pour des effets qui se jouaient à l'aérodrome, avant
   un départ. Les vingt sont réécrits : tout se passe à la Croisette. Et « attendre »
   n'est plus un mot : **le choix ferme vraiment la piste** le nombre d'heures écrit sur
   le bouton ; la carte dit jusqu'à quand, et rien ne décolle d'ici là. L'imprévu
   « nuit » disparaît, remplacé par la citerne en retard.
3. **La nuit est celle du joueur.** Le jeu avançait à l'heure du serveur : sa « nuit »
   pouvait tomber en plein après-midi d'un joueur. Elle court maintenant de 21 h à 6 h,
   à l'heure de celui qui joue — le navigateur confie son fuseau au serveur, qui le range
   avec le compte. Une donnée de plus : elle est dans le registre des traitements et la
   page de confidentialité, mise à jour le jour même.
4. **Le cap.** Pour savoir quoi viser, le joueur devait recouper les routes, l'album et
   la caisse. Une fiche en haut de l'aérodrome le dit en une fois : la prochaine route,
   ses deux conditions chacune avec son état (✓/✗), les escales qui restent à livrer, les
   cachets qui manquent. Elle suit les livraisons et parle les deux langues.
5. **L'audit des cartes, en trois PR.** Soixante-treize contrats, vingt imprévus, treize
   opportunités, dix pilotes et leurs trente scènes, huit traits, quatre saisons : relus
   un à un, puis comparés au code qui les applique. Onze constats, rendus au joueur avant
   toute correction. Trois décisions à lui, six corrections sans question :
   - **Les traits** : quatre descriptions disaient autre chose que la simulation, et deux
     parlaient au féminin de pilotes qui sont des hommes. « Cœur de village » promettait du
     moral et donnait de la chance ; « Nocturne » rendait la nuit *plus* sûre que le jour
     alors que le texte disait « comme ». Réécrites sans genre, fidèles à l'effet, aucun
     chiffre changé.
   - **Les contrats** : trois textes promettaient une heure de pendule (« avant midi »)
     pour des cartes tirées à n'importe quelle heure. Ils parlent désormais en durées.
     « Semences de printemps » se tirait toute l'année : renommé « Sachets de semences ».
   - **L'embauche** : le pilote qui arrive est toujours le suivant de la liste, ce qui
     garde en ordre les histoires qui se citent entre elles. Mais deux cartes avaient un
     décor (« quelqu'un sur le ponton avec une lanterne ») et pouvaient faire arriver un
     pilote des plateaux. Elles sont devenues neutres.
6. **Chaque règle a son test, et sa contre-épreuve.** Aucune description de trait ne
   porte de pronom genré ; aucun contrat ne cite « midi » comme une heure ; aucune carte
   d'embauche ne nomme un village. Chacun de ces tests a été lancé sur l'ancien texte
   avant d'être gardé : il échoue là, il passe ici.

## La journée en une phrase

Huit PR fusionnées, de la #90 à la #97, toutes vertes, toutes publiées sous le nom de
l'auteur : le jeu a cessé de dire une chose et d'en faire une autre — sur les boutons,
sur les imprévus, sur l'heure de la nuit, sur les traits des pilotes, sur les contrats
et sur l'embauche — et il dit maintenant au joueur où il va.

## Ce qu'on en retient

**Un test qui contourne un défaut est pire qu'un test absent** (la leçon du jour 3) a un
cousin : **un texte que personne ne confronte au code finit par mentir**. Les cartes
avaient été relues pour leur style ; elles n'avaient jamais été relues pour leur vérité.
La relecture a trouvé ce qu'aucun test de comportement ne pouvait trouver — parce que le
code faisait ce qu'il devait, et que c'était le texte qui promettait autre chose.

## Où en est le projet, ce soir

4 régions et 24 escales, 6 avions, 10 pilotes (cinq femmes, cinq hommes), 106 cartes,
4 saisons ; **242 tests**, six parcours de bout en bout dans un vrai navigateur ; quinze
migrations de base de données. Les garanties du jour 3 tiennent toujours : A+ sur les
trois notes, zéro traqueur, rien d'ouvert chez l'auteur.

À faire ensuite, sans urgence : la sauvegarde quotidienne du NAS vers un disque USB
(chiffrée, avec un test de restauration), le crible des saisons et de l'équilibrage
économique, le passage à Ubuntu 26 après le 19 octobre dans une PR dédiée, et
l'accessibilité, à mesurer avec les personnes concernées.

Jouable sur [altiplume.com](https://altiplume.com).
