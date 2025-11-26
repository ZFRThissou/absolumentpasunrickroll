document.addEventListener('DOMContentLoaded', function() {
    // Les listes contiennent maintenant des objets : [{title: 'titre', ext: 'ext'}, ...]
    const videoFavorites = JSON.parse(localStorage.getItem('videoFavorites')) || [];
    const audioFavorites = JSON.parse(localStorage.getItem('audioFavorites')) || []; // Reste un tableau de titres simples
    const imageFavorites = JSON.parse(localStorage.getItem('imageFavorites')) || [];
    const videoGrid = document.querySelector('.video-grid');

    // Afficher les vidéos favorites
    if (videoFavorites.length + audioFavorites.length + imageFavorites.length === 0) {
        videoGrid.innerHTML = '<p>Aucun mème favorit enregistrée.</p>';
    }
    
    // Traitement des VIDÉOS (utilise titre et extension)
    if (videoFavorites.length > 0) {
        videoFavorites.forEach(videoData => { // videoData est l'objet {title: '...', ext: '...'}
            const videoCard = document.createElement('div');
            videoCard.classList.add('video-card');
            videoCard.innerHTML = `
                <video controls>
                    <source src="image/mèmes/vidéos/${videoData.title}.${videoData.ext}">
                </video>
                <div class="video-info">
                    <h3>${videoData.title}</h3>
                </div>
            `;
            videoGrid.appendChild(videoCard);
        });
    }

    // Traitement des AUDIOS (conserve l'ancien comportement)
    if (audioFavorites.length > 0) {
        audioFavorites.forEach(title => { // title est une simple chaîne de caractères
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
    
    // Traitement des IMAGES (utilise titre et extension)
    if (imageFavorites.length > 0) {
        imageFavorites.forEach(imageData => { // imageData est l'objet {title: '...', ext: '...'}
            const imageCard = document.createElement('div');
            imageCard.classList.add('video-card');
            imageCard.innerHTML = `
                <img src="image/mèmes/images/${imageData.title}.${imageData.ext}" alt="Image thumbnail">
                <div class="video-info">
                    <h3>${imageData.title}</h3>
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
