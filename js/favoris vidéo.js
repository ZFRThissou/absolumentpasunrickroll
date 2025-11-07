document.addEventListener('DOMContentLoaded', function() {
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        // On cherche le nom du fichier (ex: Rickroll.mp4) depuis la balise <source> la plus proche
        const videoSource = button.closest('.video-card').querySelector('source');
        let videoFilename = "";
        if (videoSource) {
            const src = videoSource.getAttribute('src');
            // On récupère uniquement le nom du fichier sans le chemin
            videoFilename = src.substring(src.lastIndexOf('/') + 1);
        }

        let favorites = JSON.parse(localStorage.getItem('videoFavorites')) || [];
        if (favorites.includes(videoFilename)) {
            button.textContent = 'Retirer des favoris';
        }

        button.addEventListener('click', function() {
            let favorites = JSON.parse(localStorage.getItem('videoFavorites')) || [];
            if (favorites.includes(videoFilename)) {
                favorites = favorites.filter(fav => fav !== videoFilename);
                localStorage.setItem('videoFavorites', JSON.stringify(favorites));
                button.textContent = 'Ajouter aux favoris';
                console.log(`${videoFilename} a été retiré des favoris!`);
            } else {
                favorites.push(videoFilename);
                localStorage.setItem('videoFavorites', JSON.stringify(favorites));
                button.textContent = 'Retirer des favoris';
                console.log(`${videoFilename} a été ajouté aux favoris!`);
            }
        });
    });
});
