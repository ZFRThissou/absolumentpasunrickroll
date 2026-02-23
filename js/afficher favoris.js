document.addEventListener('DOMContentLoaded',function() {
    // Récupération des favoris (avec les objets {title, ext} pour vidéo et image)
    const videoFavorites = JSON.parse(localStorage.getItem('videoFavorites')) || [];
    const audioFavorites = JSON.parse(localStorage.getItem('audioFavorites')) || [];
    const imageFavorites = JSON.parse(localStorage.getItem('imageFavorites')) || [];
    const videoGrid = document.querySelector('.video-grid') || document.createElement('div');
    if (!document.querySelector('.video-grid')) {
        videoGrid.classList.add('video-grid');
    }
    videoGrid.innerHTML = ''; // Nettoyer le contenu existant

    if (videoFavorites.length + audioFavorites.length + imageFavorites.length === 0) {
        videoGrid.innerHTML = '<p>Aucun mème favorit enregistré.</p>';
    }

    // --- Traitement des VIDÉOS ---
    if (videoFavorites.length > 0) {
        videoFavorites.forEach(videoData => {
            const mediaPath = `image/mèmes/vidéos/${videoData.title}.${videoData.ext}`;
            const videoCard = document.createElement('div');
            videoCard.classList.add('video-card');
            videoCard.setAttribute('data-title', videoData.title);
            videoCard.setAttribute('data-type', 'video');
            
            videoCard.innerHTML = `
                <video controls>
                    <source src="${mediaPath}">
                </video>
                <div class="video-info">
                    <h3>${videoData.title}</h3>
                    <div class="video-actions">
                        <div class="add-to-favorites"><img class="remove-from-favorites" src="image/icones/favoris_cliquer.png" alt="Favoris Icon" data-type="video" data-title="${videoData.title}"></div>
                        <a class="download-button" href="${mediaPath}" download=""><img src="image/icones/telechargements.png" alt="Download Icon"></a>
                        <img class="partage-button" src="image/icones/partager.png" alt="Share Icon" onclick="shareVideo('${mediaPath}', '${videoData.title}')">
                    </div>
                </div>
            `;
            videoGrid.appendChild(videoCard);
        });
    }

    // --- Traitement des AUDIOS ---
    if (audioFavorites.length > 0) {
        audioFavorites.forEach(title => {
            const mediaPath = `image/mèmes/audios/${title}.mp3`; // Supposons .mp3
            const audioCard = document.createElement('div');
            audioCard.classList.add('video-card');
            audioCard.setAttribute('data-title', title);
            audioCard.setAttribute('data-type', 'audio');

            audioCard.innerHTML = `
                <button class="button" data-sound="${mediaPath}">Play Sound</button>
                <div class="video-info">
                    <h3>${title}</h3>
                    <div class="video-actions">
                        <div class="add-to-favorites"><img class="remove-from-favorites" src="image/icones/favoris_cliquer.png" alt="Favoris Icon" data-type="audio" data-title="${title}"></div>
                        <a class="download-button" href="${mediaPath}" download=""><img src="image/icones/telechargements.png" alt="Download Icon"></a>
                        <img class="partage-button" src="image/icones/partager.png" alt="Share Icon" onclick="shareVideo('${mediaPath}', '${title}')">
                    </div>
                </div>
            `;
            videoGrid.appendChild(audioCard);
        });
    }

    // --- Traitement des IMAGES ---
    if (imageFavorites.length > 0) {
        imageFavorites.forEach(imageData => {
            const mediaPath = `image/mèmes/images/${imageData.title}.${imageData.ext}`;
            const imageCard = document.createElement('div');
            imageCard.classList.add('video-card');
            imageCard.setAttribute('data-title', imageData.title);
            imageCard.setAttribute('data-type', 'image');

            imageCard.innerHTML = `
                <img src="${mediaPath}" alt="Image thumbnail">
                <div class="video-info">
                    <h3>${imageData.title}</h3>
                    <div class="video-actions">
                        <div class="add-to-favorites"><img class="remove-from-favorites" src="image/icones/favoris_cliquer.png" alt="Favoris Icon" data-type="image" data-title="${imageData.title}"></div>
                        <a class="download-button" href="${mediaPath}" download=""><img src="image/icones/telechargements.png" alt="Download Icon"></a>
                        <img class="partage-button" src="image/icones/partager.png" alt="Share Icon" onclick="shareVideo('${mediaPath}', '${imageData.title}')">
                    </div>
                </div>
            `;
            videoGrid.appendChild(imageCard);
        });
    }

    // Ajouter la grille dans le contenu principal
    const mainContent = document.querySelector('.main-content');
    if (mainContent && !document.querySelector('.main-content .video-grid')) {
        mainContent.appendChild(videoGrid);
    }
    
    // --- Logique d'interaction : Play Sound et Retirer des favoris ---

    // 1. Fonction pour jouer le son (Play Sound)
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', function(event) {
            const soundFile = event.target.getAttribute('data-sound');
            let audio = document.getElementById('audio');
            if (!audio) {
                // Créer l'élément audio s'il n'existe pas (recommandé pour favoris.html)
                audio = document.createElement('audio');
                audio.id = 'audio';
                document.body.appendChild(audio); 
            }
            audio.src = soundFile;
            audio.currentTime = 0;
            audio.play();
        });
    });

    // 2. Logique pour "Retirer des favoris"
    document.querySelectorAll('.remove-from-favorites').forEach(button => {
        button.addEventListener('click', async function(event) {
            const type = button.getAttribute('data-type');
            const title = button.getAttribute('data-title');
            const card = button.closest('.video-card');

            let favoritesKey;
            
            if (type === 'video') {
                favoritesKey = 'videoFavorites';
            } else if (type === 'audio') {
                favoritesKey = 'audioFavorites';
            } else if (type === 'image') {
                favoritesKey = 'imageFavorites';
            }

            let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];

            if (type === 'audio') {
                // Audio (string simple)
                favorites = favorites.filter(favTitle => favTitle !== title);
            } else {
                // Vidéo et Image (objets {title, ext})
                favorites = favorites.filter(favObj => favObj.title !== title);
            }

            try {
                const res = await fetch(`/.netlify/functions/like-meme?id=${encodeURIComponent(title)}&action=remove`);
                const data = await res.json();
                console.log('Réponse de la fonction serverless:', data);
            }
            catch(e){
                console.error('Erreur synchro base de données:', e);
            }

            localStorage.setItem(favoritesKey, JSON.stringify(favorites));

            // Retirer la carte du DOM
            if (card) {
                card.remove();
            }

            // Si la liste devient vide, afficher le message
            if (document.querySelectorAll('.video-card').length === 0) {
                 videoGrid.innerHTML = '<p>Aucun mème favorit enregistré.</p>';
            }
        });
    });
});



