document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;

    // --- AJOUT : Affichage du loader au démarrage ---
    const loader = document.createElement('div');
    loader.className = 'loader-container';
    loader.innerHTML = `
        <div class="spinner"></div>
        <p style="color: white; margin-top: 10px;">Chargement des mèmes...</p>
    `;
    videoGrid.appendChild(loader);

    let pageType;
    const path = window.location.pathname.toLowerCase();
    let currentMemesData = []; 
    let databaseStats = {};    
    let currentSortType = ''; 

    // Détection de la page
    if (path.includes('vid')) {
        pageType = 'videoFavorites'; 
    } else if (path.includes('audios')) {
        pageType = 'audioFavorites'; 
    } else if (path.includes('/images')) {
        pageType = 'imageFavorites'; 
    } else if (path === '/' || path.includes('index.html')) {
        pageType = 'index'; 
    } else {
        return;
    }

    // Récupération des données (JSON local + Stats DB)
    Promise.all([
        fetch('data/mèmes.json').then(res => res.json()),
        fetch('/.netlify/functions/get-all-likes').then(res => res.json())
    ])
    .then(([jsonData, stats]) => {
        let mèmesRaw = [];

        // Logique de récupération des données selon la page
        if (pageType === 'index') {
            Object.keys(jsonData).forEach(key => {
                const type = key.replace('s', ''); 
                const itemsWithType = jsonData[key].map(item => ({ ...item, typeMeme: type }));
                mèmesRaw = mèmesRaw.concat(itemsWithType);
            });
        } else {
            const mèmeType = pageType.replace('Favorites', ''); 
            mèmesRaw = jsonData[mèmeType + 's'].map(item => ({ ...item, typeMeme: mèmeType }));
        }

        stats.forEach(s => { 
            databaseStats[s.id_meme] = s; 
        });

        currentMemesData = mèmesRaw.map(m => ({
            ...m,
            likes: databaseStats[m.title]?.likes || 0,
            duree: databaseStats[m.title]?.duree || 0,
            date: databaseStats[m.title]?.date_ajout ? new Date(databaseStats[m.title].date_ajout) : new Date(0)
        }));

        // Le loader est supprimé à l'intérieur de renderGrid via .innerHTML = ''
        if (pageType === 'index') {
            currentSortType = 'likes-desc';
            sortMemes('likes-desc');
        } else {
            renderGrid(currentMemesData);
        }
        
        initSortEvents();
    })
    .catch(error => {
        console.error('Erreur:', error);
        videoGrid.innerHTML = '<p style="color: white;">Erreur de chargement des données.</p>';
    });

    function renderGrid(dataList) {
        // Nettoie la grille (supprime le loader)
        videoGrid.innerHTML = ''; 

        if (dataList.length === 0) {
            videoGrid.innerHTML = '<p style="color: white;">Aucun mème trouvé.</p>';
            return;
        }

        dataList.forEach(mème => {
            const title = mème.title;
            const ext = mème.ext;
            const type = mème.typeMeme;
            let mediaPath, cardContent;

            if (type === 'video') {
                mediaPath = `image/mèmes/vidéos/${title}.${ext}`;
                cardContent = `<video controls><source src="${mediaPath}"></video>`;
            } else if (type === 'audio') {
                mediaPath = `image/mèmes/audios/${title}.${ext}`;
                cardContent = `<button class="button" data-sound="${mediaPath}">Play Sound</button>`;
            } else if (type === 'image') {
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
            const favKey = (pageType === 'index') ? `${type}Favorites` : pageType;
            updateFavoriteButton(favoriteButton, mème, favKey);
        });

        if (dataList.some(m => m.typeMeme === 'audio')) initAudioButtons();
        if (typeof initializeSearch === 'function') initializeSearch();
    }

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
        } else {
            favorites.push(favoritesKey === 'audioFavorites' ? mèmeData.title : mèmeData);
        }
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    
        try {
            const res = await fetch(`/.netlify/functions/like-meme?id=${encodeURIComponent(mèmeData.title)}&action=${action}`);
            const data = await res.json();
            
            const memeInList = currentMemesData.find(m => m.title === mèmeData.title);
            if (memeInList && data.nouveauxLikes !== undefined) {
                memeInList.likes = data.nouveauxLikes;
                
                if (currentSortType.includes('likes')) {
                    sortMemes(currentSortType);
                } else {
                    const countSpan = document.getElementById(`count-${mèmeData.title.replace(/\s+/g, '-')}`);
                    if (countSpan) countSpan.textContent = data.nouveauxLikes;
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
