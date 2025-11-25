from PIL import Image
import os

folder = "image/mèmes/images"

for file in os.listdir(folder):
    if file.lower().endswith((".jpg", ".jpeg")):

        input_path = os.path.join(folder, file)
        img = Image.open(input_path)

        # Convertir en RGB (évite certaines erreurs)
        img = img.convert("RGB")

        output_path = os.path.join(folder, os.path.splitext(file)[0] + ".png")

        img.save(output_path, "PNG")
        print(f"Converti : {file} → {os.path.basename(output_path)}")



