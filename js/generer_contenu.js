document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;

    let pageType;
    const path = window.location.pathname.toLowerCase();
    let currentMemesData = []; // Stockage local des données fusionnées
    let databaseStats = {};    // Stockage des stats de la DB

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

    // 1. Charger les données JSON et les statistiques de la DB
    Promise.all([
        fetch('data/mèmes.json').then(res => res.json()),
        fetch('/.netlify/functions/get-all-likes').then(res => res.json())
    ])
    .then(([jsonData, stats]) => {
        const mèmeType = pageType.replace('Favorites', ''); 
        const mèmes = jsonData[mèmeType + 's'];

        // Indexation des stats par titre
        stats.forEach(s => { databaseStats[s.id_meme] = s; });

        // Fusion des données locales et DB pour le tri
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
        console.error('Erreur lors du chargement:', error);
        videoGrid.innerHTML = '<p>Erreur de chargement des données.</p>';
    });

    // 2. Fonction d'affichage de la grille
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

    // 3. Logique de tri
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
                const sortType = this.getAttribute('data-sort');
                sortMemes(sortType);
                menu.classList.remove('active');
            };
        });

        window.onclick = () => menu.classList.remove('active');
    }

    function sortMemes(type) {
        let sorted = [...currentMemesData];
        switch(type) {
            case 'name-asc': sorted.sort((a,b) => a.title.localeCompare(b.title)); break;
            case 'name-desc': sorted.sort((a,b) => b.title.localeCompare(a.title)); break;
            case 'likes-desc': sorted.sort((a,b) => b.likes - a.likes); break;
            case 'likes-asc': sorted.sort((a,b) => a.likes - b.likes); break;
            case 'date-desc': sorted.sort((a,b) => b.date - a.date); break;
            case 'date-asc': sorted.sort((a,b) => a.date - b.date); break;
            case 'duration-desc': sorted.sort((a,b) => b.duree - a.duree); break;
            case 'duration-asc': sorted.sort((a,b) => a.duree - b.duree); break;
        }
        renderGrid(sorted);
    }

    // --- Fonctions utilitaires existantes (Favoris, Audio, etc.) ---

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

        if (isFavorite) {
            favorites = (favoritesKey === 'audioFavorites') 
                ? favorites.filter(t => t !== mèmeData.title) 
                : favorites.filter(f => f.title !== mèmeData.title);
            button.querySelector('img').src = 'image/icones/favoris.png';
        } else {
            favorites.push(favoritesKey === 'audioFavorites' ? mèmeData.title : mèmeData);
            button.querySelector('img').src = 'image/icones/favoris_cliquer.png';
        }

        try {
            const res = await fetch(`/.netlify/functions/like-meme?id=${encodeURIComponent(mèmeData.title)}&action=${action}`);
            const data = await res.json();
            const countSpan = document.getElementById(`count-${mèmeData.title.replace(/\s+/g, '-')}`);
            if (countSpan && data.nouveauxLikes !== undefined) {
                countSpan.textContent = data.nouveauxLikes;
                // Mettre à jour l'objet local pour que le tri reste cohérent
                const memeObj = currentMemesData.find(m => m.title === mèmeData.title);
                if (memeObj) memeObj.likes = data.nouveauxLikes;
            }
        } catch(e) { console.error('Erreur synchro DB:', e); }

        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
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
