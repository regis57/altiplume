# Suivi des coûts — Altiplume

Registre tenu au fil du projet. Chaque ligne : date, poste, montant réel payé (TTC), périodicité, justificatif.
Les lignes « prévu » deviennent « payé » dès que la dépense est faite.

## Ligne du temps

| Date | Poste | Montant | Périodicité | Statut | Note |
|---|---|---|---|---|---|
| 2026-10-10 | Conception, choix du thème et des noms | 0 € | — | fait | Session de travail IA, hors budget monétaire |
| 2026-10-10 | GitHub Free, dépôt public | 0 € | — | **décidé** | Branches protégées, Actions, CodeQL et secret scanning gratuits en public ; Pro évité |
| 2026-10-10 | altiplume.com (Cloudflare Registrar) | ~10 €/an | annuel | **payé** | Montant exact à relever sur la facture Cloudflare |
| à faire | altiplume.fr (défensif, facultatif) | ~8 €/an | annuel | option | Évite qu'un tiers s'installe sur le .fr |
| 2026-10-10 | Cloudflare Free (DNS, tunnel, SSL, anti-DDoS) | 0 € | — | **en service** | Tunnel actif, certificat émis, aucune carte demandée |
| 2026-10-11 | Brevo Free (emails de connexion, 300/jour) | 0 € | — | **en service** | Domaine authentifié, premier email livré en boîte de réception |
| à faire | Électricité DS218+ | 0 € | — | prévu | NAS déjà allumé 24h/24 |
| optionnel | Barrette RAM DS218+ (4 Go SO-DIMM DDR3L) | ~30 € | ponctuel | option | Seulement si la mémoire sature |
| optionnel | Dépôt de marque INPI (1 classe) | ~190 € | ponctuel | option | Une fois le nom définitif choisi |
| plus tard | VPS européen (OVH VPS-1) | 7,79 €/mois | mensuel | prévu | Quand le NAS ne suffit plus |
| plus tard | AdSense + bandeau de consentement Google | 0 € | — | prévu | Revenus, pas coût |
| plus tard | Buy Me a Coffee | 5 % + frais Stripe par don | par transaction | prévu | Revenus, pas coût |

## Totaux

| Phase | Récurrent | Ponctuel |
|---|---|---|
| Développement (dépôt public) | 0 € | ~10 € (domaine, payé) |
| Lancement sur NAS | ~0,85 €/mois (domaine lissé) | 0 € |
| Phase VPS | ~8,70 €/mois | 0 € |

## Temps passé (indicatif)

| Date | Activité | Durée |
|---|---|---|
| 2026-10-10 | Cadrage : thème, licence, auth sans mot de passe, pipeline, coûts | ~1 h |
| 2026-10-10 | Choix du nom (vérifs domaines + antériorités web), premier thème musical | ~30 min |
| 2026-10-10 | Recherche d'antériorité marques (EUIPO, registre entreprises, TMview) | ~20 min |
| 2026-10-10 | Document de conception v0.1 + prototype générateur de noms | ~45 min |
| 2026-10-10 | Création et sécurisation du dépôt GitHub, audit par l'API | ~45 min |
| 2026-10-10 | Première PR : socle, chaîne de vérification, cœur de simulation | ~1 h |
| 2026-10-10 | NAS : sécurité DSM, Container Manager, tunnel Cloudflare, test externe | ~1 h |
| 2026-10-10 | PR #6 : chaîne de publication, attestation, mode d'emploi NAS | ~45 min |
| 2026-10-10 | Premier déploiement sur le NAS — altiplume.com répond | ~20 min |
| 2026-10-11 | PR #12 : comptes sans mot de passe, première page, pages légales | ~2 h |
| 2026-10-11 | Brevo, déploiement de la version comptes, première inscription réelle | ~30 min |
| 2026-10-11 | PR passkeys + connexion par QR, authenticateur de test, parcours de bout en bout | ~1 h 15 |
| 2026-10-11 | Correctif cache : empreintes dans les noms de fichiers, HTML sans cache | ~15 min |
| 2026-10-11 | Logo plume, mode jour/nuit, déconnexion en tête de page | ~45 min |
| 2026-10-11 | Le monde : six villages, trois avions, quatre pilotes et leurs histoires, 34 cartes, noms de compagnie, récompenses | ~1 h 30 |
| 2026-10-11 | La compagnie : fondation, page de l'aérodrome, scène, album, histoires sous clé | ~1 h 15 |
| 2026-10-11 | Le premier vol : cartes du jour, expédition, arrivées, imprévus, opportunités, livre de bord | ~1 h 30 |
| 2026-10-11 | Restaurer et décorer : piste, hangar, dix décorations, la scène qui les montre | ~45 min |
| 2026-10-11 | Compteur mondial anonyme | ~20 min |
| 2026-10-11 | La scène vivante : l'avion qui vole, le soleil qui tourne, la musique en Web Audio | ~40 min |
| 2026-10-11 | Réalignement des sept PR empilées après chaque fusion ; correctif « des la Croisette » | ~45 min |
| 2026-10-11 | Script de redéploiement NAS en tâche planifiée | ~15 min |

## Revenus (à partir du lancement)

| Mois | AdSense | Buy Me a Coffee | Total |
|---|---|---|---|
| — | — | — | — |
