import os
from urllib.parse import unquote

def rename_files_in_folder(folder_path):
    try:
        if not os.path.exists(folder_path):
            print(f"Folder '{folder_path}' does not exist.")
            return

        for filename in os.listdir(folder_path):
            old_path = os.path.join(folder_path, filename)

            if os.path.isfile(old_path):
                new_filename = unquote(filename)
                new_filename = new_filename.replace("_", " ").replace("-", " ").replace("'", " ")
                new_path = os.path.join(folder_path, new_filename)

                os.rename(old_path, new_path)
                print(f"Renamed: '{old_path}' to '{new_path}'")

    except Exception as e:
        print(f"Error while renaming files in folder '{folder_path}': {e}")

for i in ['audios', 'images', 'vidéos']:
    folder_path = f"mèmes/{i}"
    rename_files_in_folder(folder_path)