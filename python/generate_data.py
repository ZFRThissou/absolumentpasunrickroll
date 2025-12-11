import os
import json
import sys

# --- Configuration des chemins ---
# Le script doit être placé à la racine de votre projet (là où se trouvent 'image' et 'js').
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_MEME_DIR = os.path.join(BASE_DIR, 'image', 'mèmes') 

# Mappage des dossiers vers les clés JSON
CATEGORIES = {
    'vidéos': 'videos',
    'audios': 'audios',
    'images': 'images'
}
# ---------------------------------

# Initialisation de la structure de données
meme_data = {
    'videos': [],
    'audios': [],
    'images': []
}

# Parcourir les catégories
for folder_name_with_accent, json_key in CATEGORIES.items():
    folder_path = os.path.join(BASE_MEME_DIR, folder_name_with_accent)
    
    if not os.path.isdir(folder_path):
        print(f"⚠️ Avertissement : Le répertoire {folder_path} n'existe pas. Ignoré.", file=sys.stderr)
        continue

    try:
        file_list = os.listdir(folder_path)
        sorted_files = sorted([f for f in file_list if not f.startswith('.')], key=str.lower)
        
        for file in sorted_files:
            base_name, extension_with_dot = os.path.splitext(file)
            extension = extension_with_dot.lstrip('.')
            
            if extension:
                meme_object = {
                    "title": base_name,
                    "ext": extension
                }
                meme_data[json_key].append(meme_object)
                
    except Exception as e:
        print(f"❌ Erreur lors du traitement du dossier {folder_path}: {e}", file=sys.stderr)
        sys.exit(1)


# 🚀 AFFICHAGE DU CONTENU JSON COMPLET DANS LA CONSOLE
# Utilisez cet affichage et copiez-collez le résultat dans votre fichier data/mèmes.json
try:
    # Utiliser ensure_ascii=False pour bien gérer les accents comme 'é'
    # Utiliser indent=4 pour que la structure soit facilement copiable
    json_output = json.dumps(meme_data, indent=4, ensure_ascii=False)
    
    print("--- DÉBUT DU CONTENU POUR mèmes.json ---")
    print(json_output)
    print("--- FIN DU CONTENU POUR mèmes.json ---")
    
    print(f"\n✅ Génération des données terminée. Copiez le contenu ci-dessus (sans les lignes DEBUT/FIN) et collez-le dans data/mèmes.json.")
    
except Exception as e:
    print(f"\n❌ Erreur lors de la sérialisation JSON : {e}", file=sys.stderr)
    sys.exit(1)
