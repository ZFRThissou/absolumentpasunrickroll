document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;

    let pageType;
    const path = window.location.pathname.toLowerCase();
    let currentMemesData = []; 
    let databaseStats = {};    
    let currentSortType = ''; // Stocke le tri actuel (ex: 'likes-desc')

    if (path.includes('vid')) {
        pageType = 'videoFavorites'; 
    } else if (path.includes('audios')) {
        pageType = 'audioFavorites'; 
    } else if (path.includes('/images')) {
        pageType = 'imageFavorites'; 
    } else {
        return;
    }

    // 1. Chargement initial
    Promise.all([
        fetch('data/mèmes.json').then(res => res.json()),
        fetch('/.netlify/functions/get-all-likes').then(res => res.json())
    ])
    .then(([jsonData, stats]) => {
        const mèmeType = pageType.replace('Favorites', ''); 
        const mèmes = jsonData[mèmeType + 's'];

        stats.forEach(s => { 
            databaseStats[s.id_meme] = s; 
        });

        currentMemesData = mèmes.map(m => ({
            ...m,
            likes: databaseStats[m.title]?.likes || 0,
            duree: databaseStats[m.title]?.duree || 0,
            date: databaseStats[m.title]?.date_ajout ? new Date(databaseStats[m.title].date_ajout) : new Date(0)
        }));

        renderGrid(currentMemesData);
        initSortEvents();
    })
    .catch(error => {
        console.error('Erreur:', error);
        videoGrid.innerHTML = '<p>Erreur de chargement.</p>';
    });

    // 2. Affichage de la grille
    function renderGrid(dataList) {
        videoGrid.innerHTML = ''; 
        const mèmeType = pageType.replace('Favorites', '');

        dataList.forEach(mème => {
            const title = mème.title;
            const ext = mème.ext;
            let mediaPath, cardContent;

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
                            <span class="like-count" id="count-${title.replace(/\s+/g, '-')}">${mème.likes}</span>
                        </div>
                        <a class="download-button" href="${mediaPath}" download=""><img src="image/icones/telechargements.png" alt="Download Icon"></a>
                        <img class="partage-button" src="image/icones/partager.png" alt="Share Icon" onclick="shareVideo('${mediaPath}', '${title}')">
                    </div>
                </div>
            `;
            videoGrid.appendChild(cardHTML);

            const favoriteButton = cardHTML.querySelector('.add-to-favorites');
            updateFavoriteButton(favoriteButton, mème, pageType);
        });

        if (mèmeType === 'audio') initAudioButtons();
        if (typeof initializeSearch === 'function') initializeSearch();
    }

    // 3. Système de Tri amélioré
    function initSortEvents() {
        const btn = document.getElementById('sort-button');
        const menu = document.getElementById('sort-menu');
        if (!btn || !menu) return;

        btn.onclick = (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
        };

        document.querySelectorAll('.sort-option').forEach(opt => {
            opt.onclick = function() {
                currentSortType = this.getAttribute('data-sort');
                sortMemes(currentSortType);
                menu.classList.remove('active');
            };
        });

        window.onclick = () => menu.classList.remove('active');
    }

    function sortMemes(type) {
        switch(type) {
            case 'name-asc': currentMemesData.sort((a,b) => a.title.localeCompare(b.title)); break;
            case 'name-desc': currentMemesData.sort((a,b) => b.title.localeCompare(a.title)); break;
            case 'likes-desc': currentMemesData.sort((a,b) => b.likes - a.likes); break;
            case 'likes-asc': currentMemesData.sort((a,b) => a.likes - b.likes); break;
            case 'date-desc': currentMemesData.sort((a,b) => b.date - a.date); break;
            case 'date-asc': currentMemesData.sort((a,b) => a.date - b.date); break;
            case 'duration-desc': currentMemesData.sort((a,b) => b.duree - a.duree); break;
            case 'duration-asc': currentMemesData.sort((a,b) => a.duree - b.duree); break;
        }
        renderGrid(currentMemesData);
    }

    // 4. Gestion des favoris avec actualisation du classement
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
    
        // 1. Mise à jour immédiate du LocalStorage pour l'état visuel
        if (isFavorite) {
            favorites = (favoritesKey === 'audioFavorites') 
                ? favorites.filter(t => t !== mèmeData.title) 
                : favorites.filter(f => f.title !== mèmeData.title);
        } else {
            favorites.push(favoritesKey === 'audioFavorites' ? mèmeData.title : mèmeData);
        }
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    
        // 2. Appel à la base de données
        try {
            const res = await fetch(`/.netlify/functions/like-meme?id=${encodeURIComponent(mèmeData.title)}&action=${action}`);
            const data = await res.json();
            
            const memeInList = currentMemesData.find(m => m.title === mèmeData.title);
            if (memeInList && data.nouveauxLikes !== undefined) {
                memeInList.likes = data.nouveauxLikes;
                
                // 3. Si on est en mode tri par likes, on reconstruit la grille
                // Maintenant que le localStorage est à jour, renderGrid affichera le bon coeur
                if (currentSortType === 'likes-desc' || currentSortType === 'likes-asc') {
                    sortMemes(currentSortType);
                } else {
                    // Si pas de tri, on change juste le chiffre sans tout reconstruire
                    const countSpan = document.getElementById(`count-${mèmeData.title.replace(/\s+/g, '-')}`);
                    if (countSpan) countSpan.textContent = data.nouveauxLikes;
                    
                    // On change aussi l'image manuellement pour éviter l'inversion sans re-render
                    const img = button.querySelector('img');
                    img.src = !isFavorite ? 'image/icones/favoris_cliquer.png' : 'image/icones/favoris.png';
                }
            }
        } catch(e) { 
            console.error('Erreur DB:', e); 
        }
    }

    function initAudioButtons() {
        document.querySelectorAll('.button').forEach(btn => {
            btn.onclick = function(e) {
                const audio = document.getElementById('audio');
                if (audio) {
                    audio.src = e.target.getAttribute('data-sound');
                    audio.currentTime = 0;
                    audio.play();
                }
            };
        });
    }
});
        
