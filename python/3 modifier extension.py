import os
from PIL import Image
from moviepy.video.io.VideoFileClip import VideoFileClip

DOSSIER_VIDEOS = "mèmes/vidéos"
DOSSIER_IMAGES = "mèmes/images"

def convertir_videos(dossier):
    if not os.path.exists(dossier):
        print(f"Dossier introuvable : {dossier}")
        return

    for fichier in os.listdir(dossier):
        chemin_entree = os.path.join(dossier, fichier)
        nom, ext = os.path.splitext(fichier)
        ext = ext.lower()

        if ext in ['.mov', '.webm']:
            chemin_sortie = os.path.join(dossier, f"{nom}.mp4")
            print(f"Vidéo : {fichier} -> {nom}.mp4")
            try:
                clip = VideoFileClip(chemin_entree)
                clip.write_videofile(chemin_sortie, codec="libx264", audio_codec="aac")
                clip.close()
            except Exception as e:
                print(f"Erreur lors de la conversion de {fichier}: {e}")

def convertir_images(dossier):
    if not os.path.exists(dossier):
        print(f"Dossier introuvable : {dossier}")
        return

    for fichier in os.listdir(dossier):
        chemin_entree = os.path.join(dossier, fichier)
        nom, ext = os.path.splitext(fichier)
        
        if ext.lower() == '.webp':
            chemin_sortie = os.path.join(dossier, f"{nom}.jpg")
            print(f"Image : {fichier} -> {nom}.jpg")
            try:
                with Image.open(chemin_entree) as img:
                    # Conversion en RGB nécessaire si le WEBP possède de la transparence (RGBA)
                    img.convert("RGB").save(chemin_sortie, "JPEG")
            except Exception as e:
                print(f"Erreur lors de la conversion de {fichier}: {e}")

if __name__ == "__main__":
    convertir_videos(DOSSIER_VIDEOS)
    convertir_images(DOSSIER_IMAGES)
    print("Conversion terminée !")