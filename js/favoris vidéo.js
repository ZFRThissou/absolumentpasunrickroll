document.addEventListener('DOMContentLoaded', function () {
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        const videoCard = button.closest('.video-card');
        const videoTitleElement = videoCard.querySelector('.video-info h3');
        const videoTitle = videoTitleElement ? videoTitleElement.textContent.trim() : "";
        
        // 1. Extraire le chemin complet de la vidéo pour obtenir l'extension
        const sourceElement = videoCard.querySelector('video source');
        const videoPath = sourceElement ? sourceElement.getAttribute('src') : null;
        const videoExtension = videoPath ? videoPath.split('.').pop() : 'mp4'; // Par défaut .mp4 si non trouvé

        // Objet représentant le favori
        const videoData = {
            title: videoTitle,
            ext: videoExtension
        };

        let favorites = JSON.parse(localStorage.getItem('videoFavorites')) || [];

        // Vérifier si le titre existe déjà dans le tableau d'objets
        const isFavorite = favorites.some(fav => fav.title === videoTitle);
        
        if (isFavorite) {
            button.textContent = 'Retirer des favoris';
        } else {
            button.textContent = 'Ajouter aux favoris';
        }

        button.addEventListener('click', function () {
            let favorites = JSON.parse(localStorage.getItem('videoFavorites')) || [];
            const isFavoriteNow = favorites.some(fav => fav.title === videoTitle);

            if (isFavoriteNow) {
                // Retirer : filtrer par titre
                favorites = favorites.filter(fav => fav.title !== videoTitle);
                localStorage.setItem('videoFavorites', JSON.stringify(favorites));
                button.textContent = 'Ajouter aux favoris';
                console.log(`${videoTitle} a été retiré des favoris!`);
            } else {
                // Ajouter : ajouter l'objet complet (titre et extension)
                favorites.push(videoData);
                localStorage.setItem('videoFavorites', JSON.stringify(favorites));
                button.textContent = 'Retirer des favoris';
                console.log(`${videoTitle} a été ajouté aux favoris!`);
            }
        });
    });
});
