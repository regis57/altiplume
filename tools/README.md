# Outils

Prototypes de conception, hors de la chaîne de production. Ils servent à éprouver une
idée avant de l'implémenter en TypeScript.

## `name_generator.py`

Génère les noms des compagnies que le joueur fonde.

```bash
python3 name_generator.py          # un échantillon dans les deux langues
python3 name_generator.py en 10
```

Deux banques de mots **natives**, française et anglaise, jamais de traduction
automatique : un nom français traduit sonne traduit. Chaque langue a ses propres
motifs d'époque (« Messageries Brume », « Featherline Mail Co. ») et sa propre liste
d'exclusion de marques réelles.

**Limite connue :** l'accord en genre n'est pas encore géré côté français, ce qui
produit parfois « Compagnie des Brume ». L'implémentation définitive portera le genre
et le nombre dans la banque elle-même.
