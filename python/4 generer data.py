import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_MEME_DIR = os.path.join(BASE_DIR, "mèmes")
DESC_FILE_PATH = os.path.join(BASE_DIR, "desc.json")

# Charger les descriptions depuis desc.json si le fichier existe
descriptions_map = {}
if os.path.exists(DESC_FILE_PATH):
    try:
        with open(DESC_FILE_PATH, "r", encoding="utf-8") as f:
            desc_list = json.load(f)
            # Dictionnaire pour retrouver rapidement la description grâce au titre
            descriptions_map = {
                item["title"].strip().lower(): item.get("desc", "")
                for item in desc_list
            }
    except Exception as e:
        print(
            f"Avertissement : Impossible de lire {DESC_FILE_PATH} ({e})",
            file=sys.stderr,
        )

CATEGORIES = {"vidéos": "videos", "audios": "audios", "images": "images"}

meme_data = {"videos": [], "audios": [], "images": []}

for folder_name_with_accent, json_key in CATEGORIES.items():
    folder_path = os.path.join(BASE_MEME_DIR, folder_name_with_accent)

    if not os.path.exists(folder_path):
        print(
            f"Avertissement : Le dossier '{folder_path}' n'existe pas. Ignoré.",
            file=sys.stderr,
        )
        continue

    try:
        file_list = os.listdir(folder_path)
        sorted_file = sorted(
            [f for f in file_list if not f.startswith(".")], key=str.lower
        )

        for file in sorted_file:
            base_name, extension_with_dot = os.path.splitext(file)
            extension = extension_with_dot.lstrip(".")

            if extension:
                # Recherche de la description par le nom du fichier (insensible à la casse)
                clean_title = base_name.strip().lower()
                description = descriptions_map.get(clean_title, "")

                meme_object = {
                    "title": base_name,
                    "ext": extension,
                    "desc": description
                }
                meme_data[json_key].append(meme_object)

    except Exception as e:
        print(
            f"Erreur lors du traitement du dossier {folder_path}: {e}",
            file=sys.stderr,
        )
        sys.exit(1)

try:
    json_output = json.dumps(meme_data, indent=4, ensure_ascii=False)
    output_file_path = os.path.join(BASE_DIR, "mèmes.json")

    with open(output_file_path, "w", encoding="utf-8") as f:
        f.write(json_output)

    print(
        f"\n Génération des données terminée. Le fichier a été enregistré dans {output_file_path}."
    )

except Exception as e:
    print(f"\n Erreur lors de la sérialisation JSON : {e}", file=sys.stderr)
    sys.exit(1)