from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException
import time
import os
import requests
from pynput import keyboard
import threading

pause_event = threading.Event()
pause_event.set()

def toggle_pause(key):
    """Met le script en pause ou le reprend avec la barre Espace."""
    if key == keyboard.Key.space:
        if pause_event.is_set():
            pause_event.clear()
            print("Script en pause. Appuyez sur Espace pour reprendre.")
        else:
            pause_event.set()
            print("Script repris.")

keyboard_listener = keyboard.Listener(on_press=toggle_pause)

def wait_if_paused():
    pause_event.wait()

meme_folder = "mèmes"

video_folder = os.path.join(meme_folder, "vidéos")
image_folder = os.path.join(meme_folder, "images")

os.makedirs(video_folder, exist_ok=True)
os.makedirs(image_folder, exist_ok=True)

def scroll_to_bottom(driver):
    """Scrolls to the bottom of the page to load all content."""
    last_height = driver.execute_script("return document.body.scrollHeight")
    while True:
        wait_if_paused()
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)  # Wait for new content to load
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height

def get_file_extension(url):
    """Returns the file extension of the given URL."""
    return os.path.splitext(url)[1].lower()

def categorize_meme(urls):
    """Categorizes meme URLs based on their file extensions."""
    video_extensions = {".mp4", ".mov", ".webm"}
    image_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

    video_urls = []
    image_urls = []

    for url in urls:
        ext = get_file_extension(url)
        if ext in video_extensions:
            video_urls.append(url)
        elif ext in image_extensions:
            image_urls.append(url)

    return video_urls, image_urls

def download_meme(url, folder):
    """Downloads a meme from the given URL and saves it to the specified folder."""
    local_filename = url.split("/")[-1]
    local_path = os.path.join(folder, local_filename)
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(local_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                wait_if_paused()
                f.write(chunk)
    return local_path

def scrape_meme_urls():
    options = Options()
    options.add_argument("--headless")  # Run in headless mode
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")

    driver = webdriver.Chrome()
    keyboard_listener.start()

    try:
        driver.get("https://trouveton.meme/memes/recent/")
        time.sleep(3)  # Wait for the page to load
        scroll_to_bottom(driver)

        memes = driver.find_elements(By.CSS_SELECTOR, "a[href*='/memes/']")

        urls = [meme.get_attribute("href") for meme in memes]
        urls.remove("https://trouveton.meme/memes/recent/")  # Remove the main page URL
        urls.remove("https://trouveton.meme/memes/popular/")  # Remove the popular page URL

        print(f"Found {len(urls)} meme URLs.")

        video_urls, image_urls = categorize_meme(urls)
        print(f"Found {len(video_urls)} video URLs and {len(image_urls)} image URLs.")

        for url in video_urls:
            download_meme(url, video_folder)

        for url in image_urls:
            download_meme(url, image_folder)


    except NoSuchElementException as e:
        print(f"Error while scraping meme URLs: {e}")
        return []

    finally:
        keyboard_listener.stop()
        driver.quit()

if __name__ == "__main__":
    a = time.monotonic()
    scrape_meme_urls()
    print(f"Scraping completed in {time.monotonic() - a:.2f} seconds.")