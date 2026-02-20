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
            //button.textContent = 'Ajouter aux favoris';
            button.querySelector('img').src = 'image/icones/favoris.png';
            console.log(`${mèmeData.title} a été retiré des favoris!`);
        } else {
            // Ajouter
            if (favoritesKey === 'audioFavorites') {
                favorites.push(mèmeData.title); // Audio stocke juste le titre
            } else {
                favorites.push(mèmeData); // Vidéo/Image stocke l'objet {title, ext}
            }
            //button.textContent = 'Retirer des favoris';
            button.querySelector('img').src = 'image/icones/favoris_cliquer.png';
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
                const safeTitle = mème.title.replace(/\s+/g, '-'); // ID propre pour le span des likes

                cardHTML.innerHTML = `
                    ${cardContent}
                    <div class="video-info">
                        <h3>${mème.title}</h3>
                        <div class="video-actions">
                            <button class="add-to-favorites action-button" onclick="gererLikeEtFavori('${mème.title}', '${pageType}', this)">
                                <img src="image/icones/favoris.png" alt="Favoris Icon">
                                <span id="likes-${safeTitle}" class="like-count">0</span>
                            </button>
                            <button class="partage-button action-button" onclick="shareVideo('${mediaPath}', '${mème.title}')">
                                <img src="image/icones/partager.png" alt="Partager Icon">
                            </button>
                            <a href="${mediaPath}" download="${mème.title}.${mème.ext}" class="download-button action-button">
                                <img src="image/icones/telechargements.png" alt="Download Icon">
                            </a>
                        </div>
                    </div>
                `;
                
                videoGrid.appendChild(cardHTML);
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

            // --- C'EST ICI QU'ON AJOUTE LE CHARGEMENT DES SCORES ---
            fetch('/.netlify/functions/get-stats')
                .then(res => res.json())
                .then(stats => {
                    stats.forEach(s => {
                        const safeTitle = s.id_meme.replace(/\s+/g, '-');
                        const span = document.getElementById(`likes-${safeTitle}`);
                        if (span) span.innerText = s.likes;
                    });
                })
                .catch(err => console.log("Pas encore de stats à charger"));

            // --- ET ICI LA FONCTION COMBO ---
            window.gererLikeEtFavori = async function(titre, favoritesKey, button) {
                let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
                const safeTitle = titre.replace(/\s+/g, '-');
                const img = button.querySelector('img');
                const span = document.getElementById(`likes-${safeTitle}`);

                const isFavorite = (favoritesKey === 'audioFavorites') 
                    ? favorites.includes(titre) 
                    : favorites.some(f => f.title === titre);

                if (!isFavorite) {
                    // Ajout
                    if (favoritesKey === 'audioFavorites') favorites.push(titre);
                    else favorites.push({title: titre, ext: 'mp4'}); 
                    img.src = 'image/icones/favoris_cliquer.png';

                    // Envoi du Like à Neon
                    try {
                        const res = await fetch('/.netlify/functions/like-meme?id=' + encodeURIComponent(titre));
                        const data = await res.json();
                        if (span) span.innerText = data.nouveauxLikes;
                    } catch(e) { console.error(e); }
                } else {
                    // Retrait
                    if (favoritesKey === 'audioFavorites') favorites = favorites.filter(t => t !== titre);
                    else favorites = favorites.filter(f => f.title !== titre);
                    img.src = 'image/icones/favoris.png';
                }
                localStorage.setItem(favoritesKey, JSON.stringify(favorites));
            };
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
