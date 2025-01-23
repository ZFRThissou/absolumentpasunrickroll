from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException
import time
import os
import shutil

downloads_folder = "C:/Users/Eleve/Downloads"

def scroll_to_bottom(driver):
    # Faire défiler la page jusqu'à la fin
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)  # Attendre un peu pour charger le contenu

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

def rename_file(file_path):
    # Renommer un fichier en remplaçant les underscores par des espaces
    directory, filename = os.path.split(file_path)
    new_filename = filename.replace('_', ' ')
    new_path = os.path.join(directory, new_filename)
    os.rename(file_path, new_path)
    return new_path

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

        print("Mèmes trouvés:")
        for url in urls:
            print(url)

        # Catégoriser les URLs en vidéo ou image
        video_urls, image_urls = categorize_urls(urls)

        print("\nURLs de vidéos trouvées:")
        usb_folder = "D:/Site mèmes/image/mèmes/vidéos"
        for url in video_urls:
            print(url)
            driver.execute_script(f"window.open('{url}');")
            time.sleep(2)
            try:
                files = [
                    os.path.join(downloads_folder, f)
                    for f in os.listdir(downloads_folder)
                    if os.path.isfile(os.path.join(downloads_folder, f))
                ]
                latest_file = max(files, key=os.path.getmtime)
                shutil.move(latest_file, usb_folder)

                # Renommer le fichier après le déplacement
                renamed_file = os.path.join(usb_folder, os.path.basename(latest_file))
                renamed_file = rename_file(renamed_file)
                print(f"Fichier déplacé et renommé : {renamed_file}")

            except FileNotFoundError:
                print("Le dossier Téléchargements est introuvable.")
            except PermissionError:
                print("Permission refusée. Vérifie les droits d'accès.")
            except Exception as e:
                print(f"Une erreur s'est produite : {e}")

        print("\nURLs d'images trouvées:")
        usb_folder = "D:/Site mèmes/image/mèmes/images"
        for url in image_urls:
            print(url)
            driver.execute_script(f"window.open('{url}');")
            time.sleep(2)
            try:
                files = [
                    os.path.join(downloads_folder, f)
                    for f in os.listdir(downloads_folder)
                    if os.path.isfile(os.path.join(downloads_folder, f))
                ]
                latest_file = max(files, key=os.path.getmtime)
                shutil.move(latest_file, usb_folder)

                # Renommer le fichier après le déplacement
                renamed_file = os.path.join(usb_folder, os.path.basename(latest_file))
                renamed_file = rename_file(renamed_file)
                print(f"Fichier déplacé et renommé : {renamed_file}")

            except FileNotFoundError:
                print("Le dossier Téléchargements est introuvable.")
            except PermissionError:
                print("Permission refusée. Vérifie les droits d'accès.")
            except Exception as e:
                print(f"Une erreur s'est produite : {e}")

        return video_urls, image_urls

    except NoSuchElementException as e:
        print(f"Erreur lors de la récupération des mèmes : {e}")
        return [], []

    finally:
        # Fermer le navigateur
        driver.quit()

if __name__ == "__main__":
    scrape_meme_urls()
