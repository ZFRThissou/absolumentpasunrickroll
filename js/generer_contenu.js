document.addEventListener('DOMContentLoaded', async function() {
    const videoGrid = document.querySelector('.video-grid');
    const sortSelect = document.getElementById('sort-select');
    if (!videoGrid) return;

    let allMemesData = [];
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

    // --- 1. FONCTIONS DE CHARGEMENT ET FUSION ---

    async function chargerDonnees() {
        try {
            // Charger le JSON local
            const responseMeme = await fetch('data/mèmes.json');
            if (!responseMeme.ok) throw new Error("Erreur JSON local");
            const dataJson = await responseMeme.json();
            
            const mèmeType = pageType.replace('Favorites', ''); 
            const localMemes = dataJson[mèmeType + 's']; 

            // Charger les stats de la BDD (Netlify Function)
            let dbStats = [];
            try {
                const responseStats = await fetch('/.netlify/functions/get-all-stats');
                if (responseStats.ok) {
                    dbStats = await responseStats.json();
                }
            } catch (e) {
                console.error("Impossible de joindre la BDD, utilisation des données locales uniquement.");
            }

            // Fusionner les données
            allMemesData = localMemes.map(local => {
                const stats = dbStats.find(s => s.id_meme === local.title) || {};
                return {
                    ...local,
                    likes: stats.likes || 0,
                    duree: stats.duree || 0,
                    date_ajout: stats.date_ajout || new Date(0).toISOString()
                };
            });

            // Tri par défaut (Alphabétique) et affichage
            sortAndDisplay('alpha');

        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            videoGrid.innerHTML = '<p>Erreur de chargement du contenu.</p>';
        }
    }

    // --- 2. LOGIQUE DE TRI ---

    function sortAndDisplay(criteria) {
        const sorted = [...allMemesData];
        
        const strategies = {
            'alpha': (a, b) => a.title.localeCompare(b.title),
            'alpha-inv': (a, b) => b.title.localeCompare(a.title),
            'likes-plus': (a, b) => b.likes - a.likes,
            'likes-moins': (a, b) => a.likes - b.likes,
            'recent': (a, b) => new Date(b.date_ajout) - new Date(a.date_ajout),
            'ancien': (a, b) => new Date(a.date_ajout) - new Date(b.date_ajout),
            'long': (a, b) => b.duree - a.duree,
            'court': (a, b) => a.duree - b.duree
        };

        if (strategies[criteria]) {
            sorted.sort(strategies[criteria]);
        }
        
        renderGrid(sorted);
    }

    // --- 3. AFFICHAGE DU HTML ---

    function renderGrid(memes) {
        videoGrid.innerHTML = '';
        const mèmeType = pageType.replace('Favorites', '');

        memes.forEach(mème => {
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
                            <span class="like-count" id="count-${title.replace(/\s+/g, '-')}">${mème.likes}</span>
                        </div>
                        <div class="download-share">
                            <a class="download-button" href="${mediaPath}" download=""><img src="image/icones/telechargements.png" alt="Download"></a>
                            <img class="partage-button" src="image/icones/partager.png" alt="Share" onclick="shareVideo('${mediaPath}', '${title}')">
                        </div>
                    </div>
                </div>
            `;
            videoGrid.appendChild(cardHTML);

            const favBtn = cardHTML.querySelector('.add-to-favorites');
            updateFavoriteButton(favBtn, mème, pageType);
        });

        if (typeof initializeSearch === 'function') initializeSearch();
    }

    // --- 4. GESTION DES FAVORIS ET LIKES ---

    function updateFavoriteButton(button, mèmeData, favoritesKey) {
        let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
        let isFavorite = (favoritesKey === 'audioFavorites') 
            ? favorites.includes(mèmeData.title) 
            : favorites.some(fav => fav.title === mèmeData.title);

        button.innerHTML = `<img src="${isFavorite ? 'image/icones/favoris_cliquer.png' : 'image/icones/favoris.png'}" alt="Favoris">`;
        button.onclick = () => toggleFavorite(button, mèmeData, favoritesKey);
    }

    async function toggleFavorite(button, mèmeData, favoritesKey) {
        let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
        let isFavorite = (favoritesKey === 'audioFavorites') 
            ? favorites.includes(mèmeData.title) 
            : favorites.some(fav => fav.title === mèmeData.title);

        let action = isFavorite ? 'remove' : 'add';

        // Mise à jour locale (UI Optimiste)
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

        // Synchro BDD
        try {
            const res = await fetch(`/.netlify/functions/like-meme?id=${encodeURIComponent(mèmeData.title)}&action=${action}`);
            const data = await res.json();
            
            // Mise à jour du compteur de likes en temps réel
            const countSpan = document.getElementById(`count-${mèmeData.title.replace(/\s+/g, '-')}`);
            if (countSpan && data.nouveauxLikes !== undefined) {
                countSpan.textContent = data.nouveauxLikes;
                // Mettre à jour la variable globale pour que le prochain tri soit correct
                const memeInGlobal = allMemesData.find(m => m.title === mèmeData.title);
                if (memeInGlobal) memeInGlobal.likes = data.nouveauxLikes;
            }
        } catch(e) {
            console.error('Erreur synchro BDD:', e);
        }
    }

    // Écouteur pour le menu de tri
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => sortAndDisplay(e.target.value));
    }

    // Lancer le chargement initial
    chargerDonnees();
});
