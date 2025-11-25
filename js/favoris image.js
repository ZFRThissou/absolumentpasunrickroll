document.addEventListener('DOMContentLoaded', function() {
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        const videoCard = button.closest('.video-card');
        const titleElement = videoCard.querySelector('h3');
        const imageTitle = titleElement.textContent.trim();
        let favorites = JSON.parse(localStorage.getItem('imageFavorites')) || [];
        if (favorites.includes(imageTitle)) {
            button.textContent = 'Retirer des favoris';
        } else {
            button.textContent = 'Ajouter aux favoris';
        }

        button.addEventListener('click', () => {
            let favorites = JSON.parse(localStorage.getItem('imageFavorites')) || [];
            if (favorites.includes(imageTitle)) {
                favorites = favorites.filter(fav => fav !== imageTitle);
                button.textContent = 'Ajouter aux favoris';
                console.log(`${imageTitle} a été retiré des favoris!`);
            } else {
                favorites.push(imageTitle);
                button.textContent = 'Retirer des favoris';
                console.log(`${imageTitle} a été ajouté aux favoris!`);
            }
            localStorage.setItem('imageFavorites', JSON.stringify(favorites));
        });
    });
});
