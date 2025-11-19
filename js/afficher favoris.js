document.addEventListener('DOMContentLoaded', function() {
    const videoFavorites = JSON.parse(localStorage.getItem('videoFavorites')) || [];
    const audioFavorites = JSON.parse(localStorage.getItem('audioFavorites')) || [];
    const imageFavorites = JSON.parse(localStorage.getItem('imageFavorites')) || [];
    const videoGrid = document.querySelector('.video-grid');

    // Afficher les vidéos favorites
    if (videoFavorites.length + audioFavorites.length + imageFavorites.length === 0) {
        videoGrid.innerHTML = '<p>Aucun mème favorit enregistrée.</p>';
    }
    if (videoFavorites.length > 0) {
        videoFavorites.forEach(title => {
            const videoCard = document.createElement('div');
            videoCard.classList.add('video-card');
            videoCard.innerHTML = `
                <video controls>
                    <source src="image/mèmes/vidéos/${title}.mp4">
                </video>
                <div class="video-info">
                    <h3>${title}</h3>
                </div>
            `;
            videoGrid.appendChild(videoCard);
        });
    }

    if (audioFavorites.length > 0) {
        audioFavorites.forEach(title => {
            const audioCard = document.createElement('div');
            audioCard.classList.add('video-card');
            audioCard.innerHTML = `
                <button class="button" data-sound="image/mèmes/audios/${title}.mp3">Play Sound</button>
                <div class="video-info">
                    <h3>${title}</h3>
                </div>
            `;
            videoGrid.appendChild(audioCard);
        });
    }
    if (imageFavorites.length > 0) {
        imageFavorites.forEach(title => {
            const imageCard = document.createElement('div');
            imageCard.classList.add('video-card');
            imageCard.innerHTML = `
                <img src="image/mèmes/images/${title}.png" alt="Video thumbnail">
                <div class="video-info">
                    <h3>${title}</h3>
                </div>
            `;
            videoGrid.appendChild(imageCard);
        });
    }

    // Ajouter la grille audio dans le contenu principal
    document.querySelector('.main-content').appendChild(videoGrid);

    // Fonction pour jouer le son
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', function(event) {
            const soundFile = event.target.getAttribute('data-sound');
            const audio = document.getElementById('audio');
            audio.src = soundFile;
            audio.currentTime = 0;
            audio.play();
        });
    });
});




