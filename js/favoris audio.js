document.addEventListener('DOMContentLoaded', function () {
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        const videoCard = button.closest('.video-card');
        const titleElement = videoCard.querySelector('h3');
        const audioTitle = titleElement.textContent.trim();
        let favorites = JSON.parse(localStorage.getItem('audioFavorites')) || [];
        if (favorites.includes(audioTitle)) {
            button.textContent = 'Retirer des favoris';
        } else {
            button.textContent = 'Ajouter aux favoris';
        }

        button.addEventListener('click', () => {
            let favorites = JSON.parse(localStorage.getItem('audioFavorites')) || [];
            if (favorites.includes(audioTitle)) {
                favorites = favorites.filter(fav => fav !== audioTitle);
                button.textContent = 'Ajouter aux favoris';
                console.log(`${audioTitle} retiré des favoris`);
            } else {
                favorites.push(audioTitle);
                button.textContent = 'Retirer des favoris';
                console.log(`${audioTitle} ajouté aux favoris`);
            }
            localStorage.setItem('audioFavorites', JSON.stringify(favorites));
        });
    });
});
