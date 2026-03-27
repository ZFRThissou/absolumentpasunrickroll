document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.querySelector('.video-grid') || document.querySelector('.main-content');
    let currentMemesData = []; // Stockage local des favoris pour le tri
    let currentSortType = '';

    // 1. Initialisation : Récupérer et centraliser tous les favoris
    function loadFavorites() {
        const videoFavs = JSON.parse(localStorage.getItem('videoFavorites')) || [];
        const audioFavs = JSON.parse(localStorage.getItem('audioFavorites')) || [];
        const imageFavs = JSON.parse(localStorage.getItem('imageFavorites')) || [];

        // On normalise les données pour avoir un format commun (objet avec title, ext, type)
        const allFavs = [
            ...videoFavs.map(v => ({ ...v, type: 'video' })),
            ...audioFavs.map(title => ({ title: title, ext: 'mp3', type: 'audio' })), // On assume .mp3 pour l'audio
            ...imageFavs.map(i => ({ ...i, type: 'image' }))
        ];

        // Récupération des likes en temps réel pour permettre le tri par popularité
        fetch('/.netlify/functions/get-all-likes')
            .then(res => res.json())
            .then(stats => {
                const statsMap = {};
                stats.forEach(s => statsMap[s.id_meme] = s);

                // On enrichit nos favoris avec les stats de la DB
                currentMemesData = allFavs.map(m => ({
                    ...m,
                    likes: statsMap[m.title]?.likes || 0,
                    date: statsMap[m.title]?.date_ajout ? new Date(statsMap[m.title].date_ajout) : new Date(0)
                }));

                renderGrid(currentMemesData);
                initSortEvents();
            })
            .catch(err => {
                console.error("Erreur chargement stats:", err);
                // Si la DB échoue, on affiche quand même les favoris sans les likes
                currentMemesData = allFavs.map(m => ({ ...m, likes: 0 }));
                renderGrid(currentMemesData);
            });
    }

    // 2. Fonction d'affichage (inspirée de generer_contenu.js)
    function renderGrid(dataList) {
        if (!videoGrid) return;
        videoGrid.innerHTML = '';

        if (dataList.length === 0) {
            videoGrid.innerHTML = '<p>Aucun mème favori enregistré.</p>';
            return;
        }

        dataList.forEach(mème => {
            const title = mème.title;
            const ext = mème.ext;
            let mediaPath, cardContent;

            // Définition du chemin et du contenu selon le type
            if (mème.type === 'video') {
                mediaPath = `image/mèmes/vidéos/${title}.${ext}`;
                cardContent = `<video controls><source src="${mediaPath}"></video>`;
            } else if (mème.type === 'audio') {
                mediaPath = `image/mèmes/audios/${title}.${ext}`;
                cardContent = `<button class="button" data-sound="${mediaPath}">Play Sound</button>`;
            } else if (mème.type === 'image') {
                mediaPath = `image/mèmes/images/${title}.${ext}`;
                cardContent = `<img src="${mediaPath}" alt="Image thumbnail">`;
            }

            const card = document.createElement('div');
            card.classList.add('video-card');
            card.innerHTML = `
                ${cardContent}
                <div class="video-info">
                    <h3>${title}</h3>
                    <div class="video-actions">
                        <div class="favorite-container">
                            <div class="add-to-favorites">
                                <img class="remove-from-favorites" src="image/icones/favoris_cliquer.png" 
                                     data-type="${mème.type}" data-title="${title}">
                            </div>
                            <span class="like-count" id="count-${title.replace(/\s+/g, '-')}">${mème.likes}</span>
                        </div>
                        <a class="download-button" href="${mediaPath}" download=""><img src="image/icones/telechargements.png"></a>
                        <img class="partage-button" src="image/icones/partager.png" onclick="shareVideo('${mediaPath}', '${title}')">
                    </div>
                </div>
            `;
            videoGrid.appendChild(card);
        });

        attachInteractions();
    }

    // 3. Système de tri (Identique à generer_contenu.js)
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
    }

    function sortMemes(type) {
        switch(type) {
            case 'name-asc': currentMemesData.sort((a,b) => a.title.localeCompare(b.title)); break;
            case 'name-desc': currentMemesData.sort((a,b) => b.title.localeCompare(a.title)); break;
            case 'likes-desc': currentMemesData.sort((a,b) => b.likes - a.likes); break;
            case 'likes-asc': currentMemesData.sort((a,b) => a.likes - b.likes); break;
        }
        renderGrid(currentMemesData);
    }

    // 4. Gestion des clics (Play et Suppression)
    function attachInteractions() {
        // Play Sound
        document.querySelectorAll('.button').forEach(btn => {
            btn.onclick = (e) => {
                let audio = document.getElementById('audio') || document.createElement('audio');
                audio.id = 'audio';
                if (!audio.parentElement) document.body.appendChild(audio);
                audio.src = e.target.getAttribute('data-sound');
                audio.currentTime = 0;
                audio.play();
            };
        });

        // Retirer des favoris
        document.querySelectorAll('.remove-from-favorites').forEach(btn => {
            btn.onclick = async function() {
                const title = this.getAttribute('data-title');
                const type = this.getAttribute('data-type');
                const favoritesKey = type + 'Favorites';

                // Mise à jour LocalStorage
                let favs = JSON.parse(localStorage.getItem(favoritesKey)) || [];
                if (type === 'audio') {
                    favs = favs.filter(t => t !== title);
                } else {
                    favs = favs.filter(f => f.title !== title);
                }
                localStorage.setItem(favoritesKey, JSON.stringify(favs));

                // Mise à jour de la base de données (décrémenter le like)
                try {
                    await fetch(`/.netlify/functions/like-meme?id=${encodeURIComponent(title)}&action=remove`);
                } catch(e) { console.error("Erreur DB", e); }

                // Mise à jour de l'affichage local
                currentMemesData = currentMemesData.filter(m => m.title !== title);
                renderGrid(currentMemesData);
            };
        });
    }

    loadFavorites();
});
