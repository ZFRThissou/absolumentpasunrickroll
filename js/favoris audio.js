document.addEventListener('DOMContentLoaded', function() {
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        const audioTitle = button.previousElementSibling.textContent;
        let favorites = JSON.parse(localStorage.getItem('audioFavorites')) || [];
        if (favorites.includes(audioTitle)) {
            button.textContent = 'Retirer des favoris';
        }

        button.addEventListener('click', function() {
            let favorites = JSON.parse(localStorage.getItem('audioFavorites')) || [];
            if (favorites.includes(audioTitle)) {
                favorites = favorites.filter(fav => fav !== audioTitle);
                localStorage.setItem('audioFavorites', JSON.stringify(favorites));
                button.textContent = 'Ajouter aux favoris';
                console.log(`${audioTitle} a été retiré des favoris!`);
            } else {
                favorites.push(audioTitle);
                localStorage.setItem('audioFavorites', JSON.stringify(favorites));
                button.textContent = 'Retirer des favoris';
                console.log(`${audioTitle} a été ajouté aux favoris!`);
            }
        });
    });
});
