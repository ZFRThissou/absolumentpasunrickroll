document.addEventListener('DOMContentLoaded', function () {
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        // Récupère la carte vidéo complète
        const videoCard = button.closest('.video-card');

        // Récupère le titre dans le <h3>
        const titleElement = videoCard.querySelector('h3');
        const audioTitle = titleElement.textContent.trim();

        // Lecture du localStorage
        let favorites = JSON.parse(localStorage.getItem('audioFavorites')) || [];

        // État initial du bouton
        if (favorites.includes(audioTitle)) {
            button.textContent = 'Retirer des favoris';
        } else {
            button.textContent = 'Ajouter aux favoris';
        }

        // Clic sur le bouton
        button.addEventListener('click', () => {
            let favorites = JSON.parse(localStorage.getItem('audioFavorites')) || [];

            if (favorites.includes(audioTitle)) {
                // Retirer
                favorites = favorites.filter(fav => fav !== audioTitle);
                button.textContent = 'Ajouter aux favoris';
                console.log(`${audioTitle} retiré des favoris`);
            } else {
                // Ajouter
                favorites.push(audioTitle);
                button.textContent = 'Retirer des favoris';
                console.log(`${audioTitle} ajouté aux favoris`);
            }

            // Sauvegarde
            localStorage.setItem('audioFavorites', JSON.stringify(favorites));
        });
    });
});