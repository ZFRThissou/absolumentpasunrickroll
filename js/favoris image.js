document.addEventListener('DOMContentLoaded', function() {
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        const imageTitle = button.previousElementSibling.textContent;
        let favorites = JSON.parse(localStorage.getItem('imageFavorites')) || [];
        if (favorites.includes(imageTitle)) {
            button.textContent = 'Retirer des favoris';
        }

        button.addEventListener('click', function() {
            let favorites = JSON.parse(localStorage.getItem('imageFavorites')) || [];
            if (favorites.includes(imageTitle)) {
                favorites = favorites.filter(fav => fav !== imageTitle);
                localStorage.setItem('imageFavorites', JSON.stringify(favorites));
                button.textContent = 'Ajouter aux favoris';
                console.log(`${imageTitle} a été retiré des favoris!`);
            } else {
                favorites.push(imageTitle);
                localStorage.setItem('imageFavorites', JSON.stringify(favorites));
                button.textContent = 'Retirer des favoris';
                console.log(`${imageTitle} a été ajouté aux favoris!`);
            }
        });
    });
});
