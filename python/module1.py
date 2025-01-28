from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException
import time
import os
import requests

memes_folder = "memes"

# Créer les dossiers "vidéos" et "images" si ils n'existent pas
videos_folder = os.path.join(memes_folder, "vidéos")
images_folder = os.path.join(memes_folder, "images")

os.makedirs(videos_folder, exist_ok=True)
os.makedirs(images_folder, exist_ok=True)

def get_file_extension(url):
    # Extraire l'extension du fichier à partir de l'URL
    return os.path.splitext(url)[1].lower()

def categorize_urls(urls):
    # Catégoriser les URLs en vidéo ou image en fonction de leur extension
    video_extensions = {'.mp4', '.mov'}
    image_extensions = {'.png', '.webp', '.jpeg', '.gif', '.jpg'}

    video_urls = []
    image_urls = []

    for url in urls:
        ext = get_file_extension(url)
        if ext in video_extensions:
            video_urls.append(url)
        elif ext in image_extensions:
            image_urls.append(url)

    return video_urls, image_urls

def download_file(url, folder):
    # Télécharger le fichier et le sauvegarder dans le dossier spécifié
    local_filename = url.split('/')[-1]
    local_path = os.path.join(folder, local_filename)
    with requests.get(url, stream=True) as r:
        with open(local_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return local_path

def scrape_meme_urls():
    # Configurer le WebDriver
    options = Options()
    options.add_argument("--headless")  # Exécuter le navigateur en mode headless
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=options)

    try:
        # Ouvrir la page cible
        driver.get("https://trouveton.meme/memes/recent/")
        time.sleep(2)  # Attendre que la page charge initialement

        # Trouver les éléments contenant les liens
        memes = driver.find_elements(By.CSS_SELECTOR, "a[href*='/memes/']")

        # Extraire les URL
        urls = [meme.get_attribute("href") for meme in memes]
        urls.remove("https://trouveton.meme/memes/recent/")
        urls.remove("https://trouveton.meme/memes/popular/")

        # Catégoriser les URLs en vidéo ou image
        video_urls, image_urls = categorize_urls(urls)

        # Télécharger les vidéos
        for url in video_urls:
            download_file(url, videos_folder)

        # Télécharger les images
        for url in image_urls:
            download_file(url, images_folder)

    except NoSuchElementException as e:
        print(f"Erreur lors de la récupération des mèmes : {e}")

    finally:
        # Fermer le navigateur
        driver.quit()

if __name__ == "__main__":
    scrape_meme_urls()
