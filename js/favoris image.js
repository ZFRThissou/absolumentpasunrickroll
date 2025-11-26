document.addEventListener('DOMContentLoaded', function() {
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        const videoCard = button.closest('.video-card');
        const titleElement = videoCard.querySelector('h3');
        const imageTitle = titleElement.textContent.trim();
        
        // 1. Extraire le chemin complet de l'image pour obtenir l'extension
        const imgElement = videoCard.querySelector('img');
        const imagePath = imgElement ? imgElement.getAttribute('src') : null;
        const imageExtension = imagePath ? imagePath.split('.').pop() : 'jpg'; // Par défaut .jpg

        // Objet représentant le favori
        const imageData = {
            title: imageTitle,
            ext: imageExtension
        };
        
        let favorites = JSON.parse(localStorage.getItem('imageFavorites')) || [];
        
        // Vérifier si le titre existe déjà dans le tableau d'objets
        const isFavorite = favorites.some(fav => fav.title === imageTitle);

        if (isFavorite) {
            button.textContent = 'Retirer des favoris';
        } else {
            button.textContent = 'Ajouter aux favoris';
        }

        button.addEventListener('click', () => {
            let favorites = JSON.parse(localStorage.getItem('imageFavorites')) || [];
            const isFavoriteNow = favorites.some(fav => fav.title === imageTitle);

            if (isFavoriteNow) {
                // Retirer : filtrer par titre
                favorites = favorites.filter(fav => fav.title !== imageTitle);
                button.textContent = 'Ajouter aux favoris';
                console.log(`${imageTitle} a été retiré des favoris!`);
            } else {
                // Ajouter : ajouter l'objet complet (titre et extension)
                favorites.push(imageData);
                button.textContent = 'Retirer des favoris';
                console.log(`${imageTitle} a été ajouté aux favoris!`);
            }
            localStorage.setItem('imageFavorites', JSON.stringify(favorites));
        });
    });
});
