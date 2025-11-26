document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return; // Quitter si l'élément conteneur n'est pas trouvé

    let pageType;
    const path = window.location.pathname.toLowerCase();

    // Détermination du type de page avec la correction pour les URL propres (ex: /vidéos)    
    if (path.includes('vid')) {
        pageType = 'videoFavorites'; 
        console.log(`vidéo`);
    } else if (path.includes('/audios')) {
        pageType = 'audioFavorites'; 
        console.log(`audio`);
    } else if (path.includes('/images')) {
        pageType = 'imageFavorites'; 
        console.log(`image`);
    } else {
        console.log(`rien`);
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

        button.textContent = isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris';
        button.onclick = function() {
            toggleFavorite(button, mèmeData, favoritesKey);
        };
    }

    // Fonction pour basculer l'état du favori
    function toggleFavorite(button, mèmeData, favoritesKey) {
        let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
        
        let isFavorite;
        if (favoritesKey === 'audioFavorites') {
            isFavorite = favorites.includes(mèmeData.title);
        } else {
            isFavorite = favorites.some(fav => fav.title === mèmeData.title);
        }

        if (isFavorite) {
            // Retirer
            if (favoritesKey === 'audioFavorites') {
                favorites = favorites.filter(favTitle => favTitle !== mèmeData.title);
            } else {
                favorites = favorites.filter(favObj => favObj.title !== mèmeData.title);
            }
            button.textContent = 'Ajouter aux favoris';
            console.log(`${mèmeData.title} a été retiré des favoris!`);
        } else {
            // Ajouter
            if (favoritesKey === 'audioFavorites') {
                favorites.push(mèmeData.title); // Audio stocke juste le titre
            } else {
                favorites.push(mèmeData); // Vidéo/Image stocke l'objet {title, ext}
            }
            button.textContent = 'Retirer des favoris';
            console.log(`${mèmeData.title} a été ajouté aux favoris!`);
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
                            <button class="add-to-favorites"></button>
                            <div class="download-share">
                                <a class="download-button" href="${mediaPath}" download="">Télécharger</a>
                                <button class="share-button" onclick="shareVideo('${mediaPath}', '${title}')">Partager</button>
                            </div>
                        </div>
                    </div>
                `;
                
                videoGrid.appendChild(cardHTML);

                // Initialiser l'état et l'événement du bouton de favoris
                const favoriteButton = cardHTML.querySelector('.add-to-favorites');
                updateFavoriteButton(favoriteButton, mème, pageType);
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
        })
        .catch(error => {
            console.error('Erreur lors du chargement ou du traitement des mèmes:', error);
            videoGrid.innerHTML = '<p>Désolé, impossible de charger le contenu. Vérifiez que le fichier mèmes.json est présent et que les URL sont correctes.</p>';
        });
});
