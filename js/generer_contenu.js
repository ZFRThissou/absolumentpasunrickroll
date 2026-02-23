document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;

    let pageType;
    const path = window.location.pathname.toLowerCase();

    // Détermination du type de page
    if (path.includes('vid')) {
        pageType = 'videoFavorites';
    } else if (path.includes('audios')) {
        pageType = 'audioFavorites';
    } else if (path.includes('/images')) {
        pageType = 'imageFavorites';
    } else {
        return;
    }
    
    // 1. Charger les données JSON et les afficher
    fetch('data/mèmes.json')
        .then(response => {
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const mèmeType = pageType.replace('Favorites', '');
            const mèmes = data[mèmeType + 's'];
            
            mèmes.forEach(mème => {
                const title = mème.title;
                const ext = mème.ext;
                let mediaPath;
                let cardContent;

                if (mèmeType === 'video') {
                    mediaPath = `image/mèmes/vidéos/${title}.${ext}`;
                    cardContent = `<video controls><source src="${mediaPath}"></video>`;
                } else if (mèmeType === 'audio') {
                    mediaPath = `image/mèmes/audios/${title}.${ext}`;
                    cardContent = `<button class="button" data-sound="${mediaPath}">Play Sound</button>`;
                } else if (mèmeType === 'image') {
                    mediaPath = `image/mèmes/images/${title}.${ext}`;
                    cardContent = `<img src="${mediaPath}" alt="${title}">`;
                }
                
                const cardHTML = document.createElement('div');
                cardHTML.classList.add('video-card');
                cardHTML.innerHTML = `
                    ${cardContent}
                    <div class="video-info">
                        <h3>${title}</h3>
                        <div class="video-actions">
                            <div class="favorite-container">
                                <div class="add-to-favorites"></div>
                                <span class="like-count" id="count-${title.replace(/\s+/g, '-')}">0</span>
                            </div>
                            <a class="download-button" href="${mediaPath}" download=""><img src="image/icones/telechargements.png" alt="Download Icon"></a>
                            <img class="partage-button" src="image/icones/partager.png" alt="Share Icon" onclick="shareVideo('${mediaPath}', '${title}')">
                        </div>
                    </div>
                `;
                
                videoGrid.appendChild(cardHTML);

                // Initialiser l'état du bouton
                const favoriteButton = cardHTML.querySelector('.add-to-favorites');
                updateFavoriteButton(favoriteButton, mème, pageType);
            });

            // Initialisation recherche et audio
            if (mèmeType === 'audio') {
                setupAudioPlayers();
            }
            if (typeof initializeSearch === 'function') {
                initializeSearch();
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            videoGrid.innerHTML = '<p>Désolé, impossible de charger le contenu.</p>';
        });

    // --- FONCTIONS ---

    function updateFavoriteButton(button, mèmeData, favoritesKey) {
        let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
        let isFavorite = (favoritesKey === 'audioFavorites') 
            ? favorites.includes(mèmeData.title) 
            : favorites.some(fav => fav.title === mèmeData.title);

        button.innerHTML = `<img src="${isFavorite ? 'image/icones/favoris_cliquer.png' : 'image/icones/favoris.png'}" alt="Favoris Icon">`;
        button.onclick = () => toggleFavorite(button, mèmeData, favoritesKey);
    }

    async function toggleFavorite(button, mèmeData, favoritesKey) {
        let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
        let isFavorite = (favoritesKey === 'audioFavorites') 
            ? favorites.includes(mèmeData.title) 
            : favorites.some(fav => fav.title === mèmeData.title);

        let action = isFavorite ? 'remove' : 'add';

        // Mise à jour visuelle immédiate
        if (isFavorite) {
            favorites = (favoritesKey === 'audioFavorites') 
                ? favorites.filter(t => t !== mèmeData.title) 
                : favorites.filter(o => o.title !== mèmeData.title);
            button.querySelector('img').src = 'image/icones/favoris.png';
        } else {
            favorites.push(favoritesKey === 'audioFavorites' ? mèmeData.title : mèmeData);
            button.querySelector('img').src = 'image/icones/favoris_cliquer.png';
        }
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));

        // Appel API pour les likes
        try {
            const res = await fetch(`/.netlify/functions/like-meme?id=${encodeURIComponent(mèmeData.title)}&action=${action}`);
            const data = await res.json();
            
            // Mise à jour du chiffre sous le cœur
            const countSpan = document.getElementById(`count-${mèmeData.title.replace(/\s+/g, '-')}`);
            if (countSpan && data.nouveauxLikes !== undefined) {
                countSpan.textContent = data.nouveauxLikes;
            }
        } catch(e) {
            console.error('Erreur synchro BDD:', e);
        }
    }

    function setupAudioPlayers() {
        document.querySelectorAll('.button').forEach(button => {
            button.addEventListener('click', function(event) {
                const soundFile = event.target.getAttribute('data-sound');
                const audio = document.getElementById('audio');
                if (audio) {
                    audio.src = soundFile;
                    audio.currentTime = 0;
                    audio.play();
                }
            });
        });
    }
});
