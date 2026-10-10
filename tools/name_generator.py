"""Générateur de noms de compagnie — Altiplume.

Deux banques de mots NATIVES (fr, en), jamais de traduction automatique :
un nom français traduit sonne traduit. Chaque locale a ses propres motifs,
ses propres suffixes commerciaux et son propre registre d'époque (1930).

Usage :
    python3 name_generator.py            # échantillon des deux langues
    python3 name_generator.py fr 10
"""
import random
import sys
import unicodedata

# --- Banques de mots -------------------------------------------------------

BANKS = {
    "fr": {
        "adj": ["Dorée", "Pâle", "Haute", "Vive", "Lointaine", "Sereine",
                "Première", "Vagabonde", "Fidèle", "Claire"],
        "nom_f": ["Brume", "Nuée", "Aurore", "Escale", "Plume", "Alizée",
                  "Lanterne", "Rosée", "Voile", "Dérive"],
        "nom_m": ["Zéphyr", "Cachet", "Laiton", "Levant", "Sillage", "Fanal",
                  "Comptoir", "Pli", "Courant", "Matin"],
        "lieu": ["Brume", "Saline", "Ocre", "Cuivre", "Lanternes", "Grand Blanc",
                 "Verre", "Trois Vents"],
        "patterns": [
            "{nom_f} {adj} & Cie",
            "{nom_m} & Cie",
            "Compagnie des {lieu}",
            "Comptoir du {nom_m}",
            "Messageries {nom_f}",
            "Lignes de {lieu}",
            "{nom_f} & Fils",
            "Poste Aérienne {nom_f}",
            "Les Ailes de {lieu}",
        ],
    },
    "en": {
        "adj": ["Gilded", "Pale", "High", "Far", "Steady", "First", "Quiet",
                "Wandering", "Bright", "Northern"],
        "noun": ["Haze", "Feather", "Lantern", "Beacon", "Drift", "Zephyr",
                 "Postmark", "Brass", "Morning", "Wake"],
        "place": ["Mistvale", "Saltshore", "Ochre Reach", "Copperwood",
                  "Lantern Isles", "Great White", "Glass Flats", "Three Winds"],
        "patterns": [
            "{adj} {noun} & Co.",
            "{noun}line Mail Co.",
            "{noun} Trading Co.",
            "The {noun} Line",
            "{noun} & Sons",
            "{place} Airmail",
            "{adj} {noun} Airways",
            "{place} Post Company",
            "Wings of {place}",
        ],
    },
}

# Marques et noms réels à ne jamais produire (comparaison insensible aux
# accents et à la casse). À étoffer au fil du projet.
DENYLIST = {
    "cumulus", "nimbus", "aeropostale", "aéropostale", "air france",
    "lufthansa", "swissair", "pan am", "panam", "sabena", "imperial airways",
    "deutsche post", "la poste", "royal mail", "fedex", "dhl", "ups",
    "cathay", "qantas", "iberia", "alitalia", "aeroflot",
}


def _fold(s):
    """Minuscule sans accent ni ponctuation, pour la comparaison."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return "".join(c for c in s.lower() if c.isalnum() or c == " ").strip()


def _blocked(name):
    f = _fold(name)
    return any(bad in f for bad in DENYLIST)


def generate(locale="fr", rng=None):
    """Un nom de compagnie plausible dans la locale demandée."""
    if locale not in BANKS:
        locale = "en"
    rng = rng or random
    bank = BANKS[locale]
    for _ in range(50):
        pattern = rng.choice(bank["patterns"])
        slots = {k: rng.choice(v) for k, v in bank.items() if k != "patterns"}
        name = pattern.format(**slots)
        if not _blocked(name):
            return name
    return "Altiplume & Cie" if locale == "fr" else "Altiplume & Co."


def suggest(locale="fr", n=3, seed=None):
    """n suggestions distinctes — ce que le joueur voit à la création."""
    rng = random.Random(seed)
    out = []
    while len(out) < n:
        name = generate(locale, rng)
        if name not in out:
            out.append(name)
    return out


if __name__ == "__main__":
    loc = sys.argv[1] if len(sys.argv) > 1 else None
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    for lc in ([loc] if loc else ["fr", "en"]):
        print(f"\n--- {lc} ---")
        for name in suggest(lc, count, seed=None):
            print(" ", name)
