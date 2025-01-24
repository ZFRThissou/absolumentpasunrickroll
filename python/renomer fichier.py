import os

def rename_files_in_folder(folder_path):
    try:
        # Vérifie si le chemin existe
        if not os.path.exists(folder_path):
            print(f"Le dossier spécifié n'existe pas : {folder_path}")
            return

        # Parcourt tous les fichiers dans le dossier
        for filename in os.listdir(folder_path):
            old_path = os.path.join(folder_path, filename)

            # Vérifie si c'est bien un fichier
            if os.path.isfile(old_path):
                # Nouveau nom avec remplacements
                new_filename = filename.replace("_", " ").replace("-", " ")
                new_path = os.path.join(folder_path, new_filename)

                # Renomme le fichier
                os.rename(old_path, new_path)
                print(f"Renommé : '{filename}' -> '{new_filename}'")

    except Exception as e:
        print(f"Une erreur est survenue : {e}")

# Spécifiez le chemin du dossier à traiter
for i in ['audios','images','vidéos']:
    folder_path = f"../image/mèmes/{i}"  # Remplacez par le chemin réel
    rename_files_in_folder(folder_path)
