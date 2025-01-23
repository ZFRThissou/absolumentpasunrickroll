import os

for i in ['audios', 'images', 'vidéos']:
    # Dossier contenant les vidéos et les vignettes
    folder = f"../image/mèmes/{i}"

    # Génération de code HTML
    html_content = ""
    for file in os.listdir(folder):
        if file.endswith(".mp3"):  # Extensions vidéo
            html_content += f"""
            <div class="video-card">
                <button class="button" data-sound="{folder}/{file}">Play Sound</button>
                <div class="video-info">
                    <h3>{os.path.splitext(file)[0]}</h3>
                </div>
            </div>
            """
        elif file.endswith((".jpg", ".png", ".gif")):  # Extensions vidéo
            html_content += f"""
            <div class="video-card">
                <img src="{folder}/{file}" alt="Video thumbnail">
                <div class="video-info">
                    <h3>{os.path.splitext(file)[0]}</h3>
                </div>
            </div>
            """
        elif file.endswith(".mp4"):  # Extensions vidéo
            html_content += f"""
            <div class="video-card">
                <video controls>
                    <source src="{folder}/{file}">
                </video>
                <div class="video-info">
                    <h3>{os.path.splitext(file)[0]}</h3>
                </div>
            </div>
            """

    # Afficher ou sauvegarder dans un fichier HTML
    print(i)
    print(html_content)