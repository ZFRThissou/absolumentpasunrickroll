document.addEventListener('DOMContentLoaded', function () {
    const favoriteButtons = document.querySelectorAll('.add-to-favorites');

    favoriteButtons.forEach(button => {
        const videoCard = button.closest('.video-card');
        const videoTitleElement = videoCard.querySelector('.video-info h3');
        const videoTitle = videoTitleElement ? videoTitleElement.textContent.trim() : "";

        let favorites = JSON.parse(localStorage.getItem('videoFavorites')) || [];
        if (favorites.includes(videoTitle)) {
            button.textContent = 'Retirer des favoris';
        } else {
            button.textContent = 'Ajouter aux favoris';
        }

        button.addEventListener('click', function () {
            let favorites = JSON.parse(localStorage.getItem('videoFavorites')) || [];
            if (favorites.includes(videoTitle)) {
                favorites = favorites.filter(fav => fav !== videoTitle);
                localStorage.setItem('videoFavorites', JSON.stringify(favorites));
                button.textContent = 'Ajouter aux favoris';
                console.log(`${videoTitle} a été retiré des favoris!`);
            } else {
                favorites.push(videoTitle);
                localStorage.setItem('videoFavorites', JSON.stringify(favorites));
                button.textContent = 'Retirer des favoris';
                console.log(`${videoTitle} a été ajouté aux favoris!`);
            }
        });
    });
});

