document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return; // Quitter si l'élément conteneur n'est pas trouvé

    let pageType;
    const path = window.location.pathname.toLowerCase();

    // Détermination du type de page avec la correction pour les URL propres (ex: /vidéos)    
    if (path.includes('vid')) {
        pageType = 'videoFavorites'; 
    } else if (path.includes('audios')) {
        pageType = 'audioFavorites'; 
    } else if (path.includes('/images')) {
        pageType = 'imageFavorites'; 
    } else {
        return;
    }
    
    // Fonction pour initialiser/mettre à jour le bouton de favoris
    function updateFavoriteButton(button, mèmeData, favoritesKey) {
        let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
        
        let isFavorite;
        if (favoritesKey === 'audioFavorites') {
            // Audio (chaîne simple)
            isFavorite = favorites.includes(mèmeData.title);
        } else {
            // Vidéo et Image (objets {title, ext})
            isFavorite = favorites.some(fav => fav.title === mèmeData.title);
        }
        //<img src="image/icones/telechargements.png" alt="Download Icon">
        button.innerHTML = `<img src="${isFavorite ? 'image/icones/favoris_cliquer.png' : 'image/icones/favoris.png'}" alt="Favoris Icon">`;
        button.onclick = function() {
            toggleFavorite(button, mèmeData, favoritesKey);
        };
    }

    // Fonction pour basculer l'état du favori
    async function toggleFavorite(button, mèmeData, favoritesKey) {
        let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
        let action = "";
        let isFavorite;
        if (favoritesKey === 'audioFavorites') {
            isFavorite = favorites.includes(mèmeData.title);
        } else {
            isFavorite = favorites.some(fav => fav.title === mèmeData.title);
        }

        if (isFavorite) {
            // Retirer
            action = 'remove';
            if (favoritesKey === 'audioFavorites') {
                favorites = favorites.filter(favTitle => favTitle !== mèmeData.title);
            } else {
                favorites = favorites.filter(favObj => favObj.title !== mèmeData.title);
            }
            //button.textContent = 'Ajouter aux favoris';
            button.querySelector('img').src = 'image/icones/favoris.png';
            console.log(`${mèmeData.title} a été retiré des favoris!`);
        } else {
            // Ajouter
            action = 'add';
            if (favoritesKey === 'audioFavorites') {
                favorites.push(mèmeData.title); // Audio stocke juste le titre
            } else {
                favorites.push(mèmeData); // Vidéo/Image stocke l'objet {title, ext}
            }
            //button.textContent = 'Retirer des favoris';
            button.querySelector('img').src = 'image/icones/favoris_cliquer.png';
            console.log(`${mèmeData.title} a été ajouté aux favoris!`);
        }
        try {
            const safeTitle = mèmeData.title;
            const res = await fetch(`/.netlify/functions/like-meme?id=${encodeURIComponent(safeTitle)}&action=${action}`);
            const data = await res.json();
            if (data && typeof data.nouveauxLikes !== 'undefined') {
                const countSpan = document.getElementById(`count-${safeTitle.replace(/\s+/g, '-')}`);
                if (countSpan) {
                    countSpan.textContent = data.nouveauxLikes;
                }
            }
        }
        catch(e){
            console.error('Erreur synchro base de données:', e);
        }
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    }


    // 2. Charger les données JSON
    fetch('data/mèmes.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const mèmeType = pageType.replace('Favorites', ''); // 'video', 'audio', 'image'
            const mèmes = data[mèmeType + 's']; // 'videos', 'audios', 'images'
            
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
                    cardContent = `<img src="${mediaPath}" alt="Image thumbnail">`;
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

                // Initialiser l'état et l'événement du bouton de favoris
                const favoriteButton = cardHTML.querySelector('.add-to-favorites');
                updateFavoriteButton(favoriteButton, mème, pageType);
            });

            fetch('/.netlify/functions/get-all-likes')
                .then(res => res.json())
                .then(stats => {
                    stats.forEach(stat => {
                        const countSpan = document.getElementById(`count-${stat.id_meme.replace(/\s+/g, '-')}`);
                        if (countSpan) {
                            countSpan.textContent = stat.likes;
                        }
                    });
                });


            // Initialiser la fonction Play Sound pour les audios
            if (mèmeType === 'audio') {
                document.querySelectorAll('.button').forEach(button => {
                    button.addEventListener('click', function(event) {
                        const soundFile = event.target.getAttribute('data-sound');
                        // L'élément audio doit exister dans audios.html
                        const audio = document.getElementById('audio'); 
                        if (audio) {
                            audio.src = soundFile;
                            audio.currentTime = 0;
                            audio.play();
                        }
                    });
                });
            }
            if (typeof initializeSearch === 'function') {
                initializeSearch();
            } else {
                console.error("Le script recherche.js n'a pas chargé la fonction initializeSearch.");
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement ou du traitement des mèmes:', error);
            videoGrid.innerHTML = '<p>Désolé, impossible de charger le contenu. Vérifiez que le fichier mèmes.json est présent et que les URL sont correctes.</p>';
        });
});
