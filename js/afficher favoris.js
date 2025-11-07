document.addEventListener('DOMContentLoaded', function() {
    const videoFavorites = JSON.parse(localStorage.getItem('videoFavorites')) || [];
    const audioFavorites = JSON.parse(localStorage.getItem('audioFavorites')) || [];
    const imageFavorites = JSON.parse(localStorage.getItem('imageFavorites')) || [];
    const videoGrid = document.querySelector('.video-grid');

    // Afficher les vidéos favorites
    if (videoFavorites.length > 0) {
        videoFavorites.forEach(filename => {
            const ext = filename.split('.').pop().toLowerCase();
            let mime = '';
            // Ajoute les mime-types connus pour chaque format
            if (ext === 'mp4') mime = 'video/mp4';
            else if (ext === 'webm') mime = 'video/webm';
            else if (ext === 'mov') mime = 'video/quicktime';
            else mime = `video/${ext}`;

            const videoCard = document.createElement('div');
            videoCard.classList.add('video-card');
            videoCard.innerHTML = `
                <video controls>
                    <source src="image/mèmes/vidéos/${filename}" type="${mime}">
                    Votre navigateur ne supporte pas ce format (${filename})
                </video>
                <div class="video-info">
                    <h3>${filename}</h3>
                </div>
        `    ;
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

