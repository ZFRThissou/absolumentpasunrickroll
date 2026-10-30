#!/usr/bin/env python3
"""
generer_pages.py : crée UNE PAGE HTML PAR MÈME + le sitemap.xml

Pourquoi ce script existe
-------------------------
Aujourd'hui le contenu du site est construit par JavaScript dans le navigateur.
Un robot (Google, l'évaluateur AdSense) qui lit le HTML brut voit donc une page
presque vide. Ici on fabrique, pour chaque mème, un vrai fichier HTML avec son
titre, son média et sa description : le contenu est lisible sans JavaScript.

Quand est-ce qu'il tourne ?
---------------------------
Automatiquement à CHAQUE déploiement Netlify (voir netlify.toml). Les pages
générées ne sont donc jamais commitées dans GitHub : le dossier meme/ et le
fichier sitemap.xml sont recréés à partir de data/mèmes.json à chaque fois.
Si tu ajoutes un mème ou une description, tu n'as rien d'autre à faire.

Règle importante : indexer seulement les pages qui ont une description
----------------------------------------------------------------------
- Mème AVEC description  -> page indexable (dans le sitemap, pub autorisée)
- Mème SANS description  -> la page existe (lien partageable) mais elle porte
  <meta name="robots" content="noindex"> et n'est pas dans le sitemap.
  C'est exactement le défaut que Google reproche : une page sans texte.
  Dès que tu écris une description, la page devient indexable au déploiement
  suivant, toute seule.

Compatibilité : écrit pour Python 3.8+ (version possible sur Netlify), sans
aucune bibliothèque externe.
"""

import hashlib
import html
import json
import os
import re
import sys
import unicodedata
from urllib.parse import quote

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Racine du dépôt = le dossier parent de python/
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Adresse "officielle" du site (utilisée pour les liens canoniques et le sitemap).
# On peut la remplacer sans toucher au code avec une variable d'environnement SITE_URL.
SITE_URL = os.environ.get("SITE_URL", "https://absolumentpasunrickroll.netlify.app").rstrip("/")

FICHIER_DONNEES = os.path.join(RACINE, "data", "mèmes.json")
DOSSIER_PAGES = os.path.join(RACINE, "meme")
FICHIER_SITEMAP = os.path.join(RACINE, "sitemap.xml")

# Pour chaque clé du JSON : dossier du média, libellés et page de catégorie.
# (Les noms de dossiers contiennent des accents : on les écrit tels quels.)
TYPES = {
    "videos": {
        "dossier": "vidéos",
        "nom": "vidéo",
        "pluriel": "vidéos",
        "page": "/vidéos",
        "icone": "vidéos_cliquer.png",
    },
    "audios": {
        "dossier": "audios",
        "nom": "audio",
        "pluriel": "audios",
        "page": "/audios",
        "icone": "audios_cliquer.png",
    },
    "images": {
        "dossier": "images",
        "nom": "image",
        "pluriel": "images",
        "page": "/images",
        "icone": "images_cliquer.png",
    },
}

# Pages "normales" du site qui doivent aussi figurer dans le sitemap
# (reprises de l'ancien sitemap.xml + la page de confidentialité).
PAGES_STATIQUES = [
    ("/", "daily", "1.0"),
    ("/vidéos", "daily", "0.8"),
    ("/audios", "daily", "0.8"),
    ("/images", "daily", "0.8"),
    ("/contacter", "monthly", "0.3"),
    ("/confidentialite", "monthly", "0.3"),
]

NB_MEMES_LIES = 6


# ---------------------------------------------------------------------------
# Petites fonctions utilitaires
# ---------------------------------------------------------------------------

def echapper(texte):
    """Rend un texte sûr à mettre dans du HTML (&, <, >, guillemets).
    Indispensable : un titre contenant un guillemet casserait sinon la page."""
    return html.escape(texte, quote=True)


def url_chemin(chemin):
    """Encode un chemin pour une URL : 'image/mèmes/vidéos/a b.mp4'
    devient 'image/m%C3%A8mes/vid%C3%A9os/a%20b.mp4'. Les '/' sont conservés."""
    return quote(chemin, safe="/")


def slug_de_base(titre):
    """Transforme un titre en morceau d'URL propre.

    "Ça, c'est l'œuvre !"  ->  "ca-c-est-l-oeuvre"

    Étapes : ligatures -> décomposition des accents (é = e + ´) -> on jette les
    accents -> minuscules -> tout ce qui n'est pas lettre/chiffre devient '-'.
    """
    titre = titre.replace("œ", "oe").replace("Œ", "OE")
    titre = titre.replace("æ", "ae").replace("Æ", "AE").replace("ß", "ss")
    decompose = unicodedata.normalize("NFKD", titre)
    ascii_seul = decompose.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", ascii_seul).strip("-")


def empreinte(titre):
    """Petite empreinte stable (6 caractères) calculée à partir du titre."""
    return hashlib.sha1(titre.encode("utf-8")).hexdigest()[:6]


def attribuer_slugs(titres):
    """Donne un slug unique à chaque titre. Renvoie ({titre: slug}, [avertissements]).

    - Le slug dépend UNIQUEMENT du titre : ajouter un mème n'en change aucun autre
      (une URL déjà indexée par Google ne doit jamais changer).
    - Si deux titres donnent le même slug (ou un slug vide, ex. titre en emojis),
      on ajoute une empreinte du titre pour les distinguer.
    """
    avertissements = []
    groupes = {}
    for titre in titres:
        groupes.setdefault(slug_de_base(titre), []).append(titre)

    slugs = {}
    for base, membres in groupes.items():
        if len(membres) == 1 and base:
            slugs[membres[0]] = base
            continue
        if base:
            avertissements.append(
                "Slug en double '%s' pour : %s" % (base, " | ".join(membres))
            )
        for titre in membres:
            slugs[titre] = ("%s-%s" % (base, empreinte(titre))) if base else ("meme-" + empreinte(titre))
    return slugs, avertissements


def decouper(texte, longueur):
    """Raccourcit un texte à `longueur` caractères, sans couper un mot en deux."""
    texte = " ".join(texte.split())
    if len(texte) <= longueur:
        return texte
    coupe = texte[:longueur].rsplit(" ", 1)[0].rstrip(",;:. ")
    return coupe + "…"


# ---------------------------------------------------------------------------
# Construction des pages
# ---------------------------------------------------------------------------

def choisir_memes_lies(meme, tous_du_meme_type):
    """Choisit quelques autres mèmes du même type à proposer en bas de page.

    On met d'abord ceux qui ont une description (pages indexables), puis on
    complète avec les autres. Le point de départ dans la liste dépend du slug :
    deux pages n'affichent donc pas toutes la même sélection, mais le résultat
    reste identique d'un déploiement à l'autre (pas de hasard).
    """
    autres = [m for m in tous_du_meme_type if m["slug"] != meme["slug"]]
    avec_desc = [m for m in autres if m["desc"]]
    sans_desc = [m for m in autres if not m["desc"]]

    choisis = []
    for groupe in (avec_desc, sans_desc):
        if not groupe or len(choisis) >= NB_MEMES_LIES:
            continue
        depart = int(empreinte(meme["slug"]), 16) % len(groupe)
        tourne = groupe[depart:] + groupe[:depart]
        choisis.extend(tourne[: NB_MEMES_LIES - len(choisis)])
    return choisis


def balise_media(meme, info):
    """Le HTML du lecteur : <video>, <audio> ou <img> selon le type."""
    src = "/" + url_chemin("image/mèmes/%s/%s.%s" % (info["dossier"], meme["title"], meme["ext"]))
    if meme["cle"] == "videos":
        return '<video src="%s" controls preload="metadata"></video>' % src
    if meme["cle"] == "audios":
        return '<audio src="%s" controls preload="none"></audio>' % src
    return '<img src="%s" alt="%s">' % (src, echapper("Mème image : " + meme["title"]))


def construire_page(meme, lies):
    info = TYPES[meme["cle"]]
    titre = meme["title"]
    avec_desc = bool(meme["desc"])
    chemin_media = "/" + url_chemin("image/mèmes/%s/%s.%s" % (info["dossier"], titre, meme["ext"]))
    url_page = "%s/meme/%s" % (SITE_URL, meme["slug"])

    # --- Textes pour les moteurs de recherche et les réseaux sociaux ---
    titre_onglet = "%s — mème %s | Absolumentpasunrickroll" % (titre, info["nom"])
    if avec_desc:
        description_meta = decouper(meme["desc"], 155)
    else:
        description_meta = "Mème %s « %s » : à regarder, télécharger et partager sur Absolumentpasunrickroll." % (
            info["nom"], titre)

    # Image d'aperçu pour les partages : l'image elle-même, sinon le logo.
    if meme["cle"] == "images":
        image_apercu = SITE_URL + chemin_media
    else:
        image_apercu = SITE_URL + "/image/logo/logo.png"

    # --- Pages sans description : pas d'indexation, pas de pub ---
    if avec_desc:
        balise_robots = ""
        attribut_pub = ""
        meta_adsense = '    <meta name="google-adsense-account" content="ca-pub-7071777313496372">\n'
    else:
        balise_robots = '    <meta name="robots" content="noindex, follow">\n'
        attribut_pub = ' data-adsense="false"'
        meta_adsense = ""

    # --- Bloc description (un <p> par ligne du texte) ---
    if avec_desc:
        paragraphes = "\n".join(
            "            <p>%s</p>" % echapper(ligne.strip()) for ligne in meme["desc"].splitlines() if ligne.strip()
        )
    else:
        paragraphes = "            <p>Le contexte de ce mème n'a pas encore été rédigé.</p>"

    # --- Mèmes liés ---
    if lies:
        elements = "\n".join(
            '                <li><a href="/meme/%s">%s</a></li>' % (m["slug"], echapper(m["title"])) for m in lies
        )
        bloc_lies = (
            '        <aside class="meme-lies">\n'
            "            <h2>Autres mèmes %s</h2>\n"
            "            <ul>\n%s\n            </ul>\n"
            "        </aside>\n" % (info["pluriel"], elements)
        )
    else:
        bloc_lies = ""

    # --- La barre latérale : même menu que les autres pages, avec la bonne icône allumée ---
    def entree(href, icone, alt, libelle):
        return (
            "            <li>\n"
            '                <a href="%s"><img src="/image/icones/%s" alt="%s"><span class="nav-label">%s</span></a>\n'
            "            </li>\n" % (url_chemin(href), url_chemin(icone), alt, libelle)
        )

    def icone(cle, normale):
        return TYPES[cle]["icone"] if meme["cle"] == cle else normale

    menu = (
        entree("/", "accueil.png", "Accueil Icon", "Accueil")
        + entree("/vidéos", icone("videos", "vidéos.png"), "Vidéos Icon", "Vidéos")
        + entree("/audios", icone("audios", "audios.png"), "Audios Icon", "Audios")
        + entree("/images", icone("images", "images.png"), "Images Icon", "Images")
        + entree("/favoris", "favoris.png", "Favoris Icon", "Favoris")
        + entree("/contacter", "contacter.png", "Contact Icon", "Nous contacter")
    )

    return """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#ffffff">
    <link href="/css/style.css" rel="stylesheet">
    <link href="/css/meme.css" rel="stylesheet">
    <link rel="icon" type="image/png" href="/image/logo/logo.png">
    <!-- Consentement + Analytics (+ AdSense si la page a une description) : doit rester le PREMIER script -->
    <script src="/js/consent.js"%(attribut_pub)s></script>
    <script src="/js/partager.js"></script>
    <script src="/js/page-meme.js" defer></script>
    <title>%(titre_onglet)s</title>
    <meta name="description" content="%(description_meta)s">
    <link rel="canonical" href="%(url_page)s">
%(balise_robots)s    <meta property="og:site_name" content="Absolumentpasunrickroll">
    <meta property="og:type" content="website">
    <meta property="og:title" content="%(og_titre)s">
    <meta property="og:description" content="%(description_meta)s">
    <meta property="og:url" content="%(url_page)s">
    <meta property="og:image" content="%(image_apercu)s">
    <meta name="twitter:card" content="%(twitter_card)s">
%(meta_adsense)s</head>
<body>
    <div class="topbar">
        <a href="/" style="text-decoration:none" class="logo">
            <img src="/image/logo/logo.png" alt="Logo">
            <p>Absolumentpasunrickroll</p>
        </a>
    </div>
    <div class="sidebar">
        <ul>
%(menu)s        </ul>
    </div>
    <div class="main-content meme-page">
        <nav class="meme-fil" aria-label="Fil d'Ariane">
            <a href="/">Accueil</a> &rsaquo; <a href="%(page_categorie)s">%(libelle_categorie)s</a> &rsaquo; <span>%(titre_html)s</span>
        </nav>
        <article class="meme-fiche">
            <h1>%(titre_html)s</h1>
            <p class="meme-type">Mème %(nom_type)s &middot; format %(extension)s</p>
            <div class="meme-media meme-media-%(nom_type)s">
                %(media)s
            </div>
            <div class="meme-actions">
                <a class="meme-bouton" href="%(chemin_media)s" download>Télécharger</a>
                <button type="button" class="meme-bouton" id="bouton-partager" data-titre="%(titre_html)s">Partager</button>
            </div>
            <section class="meme-contexte">
                <h2>Contexte</h2>
%(paragraphes)s
            </section>
        </article>
%(bloc_lies)s    </div>
</body>
</html>
""" % {
        "attribut_pub": attribut_pub,
        "titre_onglet": echapper(titre_onglet),
        "description_meta": echapper(description_meta),
        "url_page": echapper(url_page),
        "balise_robots": balise_robots,
        "og_titre": echapper(titre),
        "image_apercu": echapper(image_apercu),
        "twitter_card": "summary_large_image" if meme["cle"] == "images" else "summary",
        "meta_adsense": meta_adsense,
        "menu": menu,
        "page_categorie": url_chemin(info["page"]),
        "libelle_categorie": info["pluriel"].capitalize(),
        "titre_html": echapper(titre),
        "nom_type": info["nom"],
        "extension": echapper(meme["ext"].upper()),
        "media": balise_media(meme, info),
        "chemin_media": echapper(chemin_media),
        "paragraphes": paragraphes,
        "bloc_lies": bloc_lies,
    }


def construire_sitemap(memes_indexables):
    """Le sitemap : la liste des pages que Google doit visiter."""
    lignes = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

    def ajouter(chemin, frequence, priorite):
        lignes.extend([
            "    <url>",
            "        <loc>%s</loc>" % html.escape(SITE_URL + chemin, quote=False),
            "        <changefreq>%s</changefreq>" % frequence,
            "        <priority>%s</priority>" % priorite,
            "    </url>",
        ])

    for chemin, frequence, priorite in PAGES_STATIQUES:
        ajouter(chemin, frequence, priorite)
    for meme in memes_indexables:
        ajouter("/meme/" + meme["slug"], "monthly", "0.6")

    lignes.append("</urlset>")
    return "\n".join(lignes) + "\n"


# ---------------------------------------------------------------------------
# Programme principal
# ---------------------------------------------------------------------------

def charger_memes():
    with open(FICHIER_DONNEES, "r", encoding="utf-8") as f:
        donnees = json.load(f)

    memes = []
    for cle in TYPES:
        for entree in donnees.get(cle, []):
            memes.append({
                "cle": cle,
                "title": entree["title"],
                "ext": entree["ext"],
                "desc": (entree.get("desc") or "").strip(),
            })

    slugs, avertissements = attribuer_slugs([m["title"] for m in memes])
    for meme in memes:
        meme["slug"] = slugs[meme["title"]]
    return memes, avertissements


def main():
    memes, avertissements = charger_memes()

    # On repart d'un dossier propre : si un mème est supprimé, sa page disparaît.
    # (On ne supprime que les .html de meme/, jamais autre chose.)
    os.makedirs(DOSSIER_PAGES, exist_ok=True)
    for nom in os.listdir(DOSSIER_PAGES):
        if nom.endswith(".html"):
            os.remove(os.path.join(DOSSIER_PAGES, nom))

    par_type = {cle: [m for m in memes if m["cle"] == cle] for cle in TYPES}

    manquants = []
    for meme in memes:
        info = TYPES[meme["cle"]]
        chemin_fichier = os.path.join(RACINE, "image", "mèmes", info["dossier"],
                                      "%s.%s" % (meme["title"], meme["ext"]))
        if not os.path.exists(chemin_fichier):
            manquants.append(chemin_fichier)

        page = construire_page(meme, choisir_memes_lies(meme, par_type[meme["cle"]]))
        with open(os.path.join(DOSSIER_PAGES, meme["slug"] + ".html"), "w", encoding="utf-8") as f:
            f.write(page)

    indexables = [m for m in memes if m["desc"]]
    with open(FICHIER_SITEMAP, "w", encoding="utf-8") as f:
        f.write(construire_sitemap(indexables))

    print("generer_pages : %d pages créées dans meme/ (%d indexables avec description, %d en noindex)"
          % (len(memes), len(indexables), len(memes) - len(indexables)))
    print("generer_pages : sitemap.xml écrit avec %d URLs" % (len(PAGES_STATIQUES) + len(indexables)))
    for texte in avertissements:
        print("ATTENTION : " + texte, file=sys.stderr)
    for chemin in manquants:
        print("ATTENTION : fichier média introuvable : " + chemin, file=sys.stderr)


if __name__ == "__main__":
    main()
