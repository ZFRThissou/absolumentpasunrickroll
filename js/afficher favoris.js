document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.querySelector('.video-grid') || document.querySelector('.main-content');
    if (!videoGrid) return;

    let currentMemesData = []; // Stockage local des favoris pour le tri
    let currentSortType = '';

    // --- Affichage des skeletons au démarrage ---
    function showLoader() {
        const { fragment } = createSkeletonCards(12);
        videoGrid.innerHTML = '';
        videoGrid.appendChild(fragment);
    }

    // 1. Initialisation : Récupérer et centraliser tous les favoris
    function loadFavorites() {
        showLoader(); // On affiche le spinner dès le début

        const videoFavs = JSON.parse(localStorage.getItem('videoFavorites')) || [];
        const audioFavs = JSON.parse(localStorage.getItem('audioFavorites')) || [];
        const imageFavs = JSON.parse(localStorage.getItem('imageFavorites')) || [];

        // On normalise les données
        const allFavs = [
            ...videoFavs.map(v => ({ ...v, type: 'video' })),
            ...audioFavs.map(title => ({ title: title, ext: 'mp3', type: 'audio' })),
            ...imageFavs.map(i => ({ ...i, type: 'image' }))
        ];

        if (allFavs.length === 0) {
            videoGrid.innerHTML = '<p style="color: white; text-align: center; width: 100%;">Aucun mème favori enregistré.</p>';
            return;
        }

        // Récupération des likes en temps réel
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
                initSearch();
            })
            .catch(err => {
                console.error("Erreur chargement stats:", err);
                // Si la DB échoue, on affiche quand même les favoris sans les likes (le loader partira ici)
                currentMemesData = allFavs.map(m => ({ ...m, likes: 0 }));
                renderGrid(currentMemesData);
                initSearch();
            });
    }

    // --- AJOUT : branchement de la recherche (Fuse.js), fournie par js/recherche.js ---
    function initSearch() {
        if (typeof initializeSearch !== 'function') return; // recherche.js pas chargé sur cette page
        initializeSearch(currentMemesData, (filteredList) => {
            renderGrid(filteredList);
        });
    }

    // 2. Fonction d'affichage
    function renderGrid(dataList) {
        videoGrid.innerHTML = ''; // supprime les skeletons/messages précédents

        if (dataList.length === 0) {
            videoGrid.innerHTML = '<p style="color: white; text-align: center; width: 100%;">Aucun mème favori enregistré.</p>';
            return;
        }

        // On affiche des skeletons pendant le préchargement, exactement
        // comme sur les autres pages.
        const { fragment, elements: skeletonElements } = createSkeletonCards(dataList.length);
        videoGrid.appendChild(fragment);

        const preloadPromises = [];
        const cardsToInsert = [];

        dataList.forEach(mème => {
            const title = mème.title;
            const ext = mème.ext;
            let mediaPath, cardContent;

            if (mème.type === 'video') {
                mediaPath = `image/mèmes/vidéos/${title}.${ext}`;
                cardContent = `<video class="open-modal-play" preload="metadata"><source src="${mediaPath}"></video>`;
            } else if (mème.type === 'audio') {
                mediaPath = `image/mèmes/audios/${title}.${ext}`;
                cardContent = `<button class="button open-modal-play" data-sound="${mediaPath}">Play Sound</button>`;
            } else if (mème.type === 'image') {
                mediaPath = `image/mèmes/images/${title}.${ext}`;
                cardContent = `<img src="${mediaPath}" loading="lazy" class="open-modal-play" alt="Image thumbnail">`;
            }

            const ShareURL = 'https://absolumentpasunrickroll.netlify.app/' + '?meme=' + encodeURIComponent(mème.title);
            const card = document.createElement('div');
            card.classList.add('video-card');
            card.style.cursor = "pointer";
            card.innerHTML = `
                ${cardContent}
                <div class="video-info">
                    <h3>${title}</h3>
                    <div class="video-actions">
                        <div class="favorite-container">
                            <div class="add-to-favorites">
                                <img class="remove-from-favorites" src="image/icones/favoris_cliquer.png" 
                                     data-type="${mème.type}" data-title="${title}" style="cursor: pointer;">
                            </div>
                            <span class="like-count" id="count-${title.replace(/\s+/g, '-')}">${mème.likes}</span>
                        </div>
                        <a class="download-button" href="${mediaPath}" download=""><img src="image/icones/telechargements.png"></a>
                        <img class="partage-button" src="image/icones/partager.png" style="cursor: pointer;" onclick="event.stopPropagation(); shareVideo('${ShareURL}', '${title}')">
                    </div>
                </div>
            `;
            card.querySelector('.open-modal-play').onclick = (e) => {
                e.stopPropagation(); // Empêche le clic sur la carte parente
                openMemeModal(mème, mediaPath, true);
            };
            card.onclick = () => {
                openMemeModal(mème, mediaPath, false);
            };

            cardsToInsert.push(card);
            preloadPromises.push(preloadCardMedia(mème.type, mediaPath));
        });

        Promise.all(preloadPromises).then(() => {
            const referenceNode = skeletonElements[0] || null;
            cardsToInsert.forEach(card => videoGrid.insertBefore(card, referenceNode));
            skeletonElements.forEach(el => el.remove());

            attachInteractions();
        });
    }

    // 3. Système de tri
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

    async function openMemeModal(mème, mediaPath, shouldPlay){
        // Easter egg : le 23 janvier (anniversaire du site), on attend de
        // savoir si l'API de date a répondu, puis on remplace le média par
        // le rickroll, peu importe le mème réellement cliqué.
        if (window.birthdayCheckPromise) {
            await window.birthdayCheckPromise;
        }
        if (typeof getBirthdayMediaPath === 'function') {
            mediaPath = getBirthdayMediaPath(mème.type, mediaPath);
        }

        const modal = document.getElementById('meme-modal');
        const container = document.getElementById('modal-media-container');
        const title = document.getElementById('modal-title');
        const globalAudio = document.getElementById('audio');
        const desc = document.getElementById('modal-description');
        const lastUrl = window.location.pathname;
        const newUrl = 'https://absolumentpasunrickroll.netlify.app/' + '?meme=' + encodeURIComponent(mème.title);
        history.pushState({ title: mème.title }, mème.title, newUrl);

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        title.textContent = mème.title;
        container.innerHTML = '';
        desc.textContent = window.IS_SITE_BIRTHDAY
            ? "🎉 Joyeux anniversaire au site ! Tu ne pensais quand même pas y échapper aujourd'hui..."
            : `${mème.desc ? mème.desc : "La description n'est pas encore disponible."}`;
        if (mème.type === 'video') {
            const video = document.createElement('video');
            video.src = mediaPath;
            video.controls = true;
            container.appendChild(video);
            if (shouldPlay) video.play();
        } else if (mème.type === 'image') {
            const img = document.createElement('img');
            img.src = mediaPath;
            container.appendChild(img);
        } else if (mème.type === 'audio') {
            const btnPlay = document.createElement('button');
            btnPlay.className = 'button';
            btnPlay.textContent = 'Play Sound';
            container.appendChild(btnPlay);
            if (globalAudio) {
                btnPlay.onclick = () => {
                    globalAudio.src = mediaPath;
                    globalAudio.currentTime = 0;
                    globalAudio.play();
                };
                if (shouldPlay) {
                    globalAudio.src = mediaPath;
                    globalAudio.play();
                }
            }
        }
        const closeModal = () => {
            modal.style.display = 'none';
            container.innerHTML = '';
            if (globalAudio) globalAudio.pause(); // Correction ici
            document.body.style.overflow = '';
            history.pushState({}, '', lastUrl);
        };
        const closeBtn = document.querySelector('.close-modal');
        closeBtn.onclick = closeModal;
        window.onclick = (event) => {
            if (event.target == modal) closeModal();
        };
        const escHandler = (event) => {
            if (event.key === "Escape") {
                closeModal();
                window.removeEventListener('keydown', escHandler);
            }
        };
        window.addEventListener('keydown', escHandler);
    }

    window.onpopstate = function(event) {
        const modal = document.getElementById('meme-modal');
        if (modal && modal.style.display === 'block') {
            // Appelle votre logique de fermeture si la modale est ouverte
            // (Note : vous devrez peut-être rendre closeModal accessible ou simuler un clic)
            document.querySelector('.close-modal').click();
        }
    };

    // 4. Gestion des clics
    function attachInteractions() {
        // Retirer des favoris
        document.querySelectorAll('.remove-from-favorites').forEach(btn => {
            btn.onclick = async function(e) {
                e.stopPropagation(); // Empêche le clic de remonter jusqu'à la carte (et donc d'ouvrir la modale)
                const title = this.getAttribute('data-title');
                const type = this.getAttribute('data-type');
                const favoritesKey = type + 'Favorites';

                let favs = JSON.parse(localStorage.getItem(favoritesKey)) || [];
                if (type === 'audio') {
                    favs = favs.filter(t => t !== title);
                } else {
                    favs = favs.filter(f => f.title !== title);
                }
                localStorage.setItem(favoritesKey, JSON.stringify(favs));

                try {
                    await fetch(`/.netlify/functions/like-meme?id=${encodeURIComponent(title)}&action=remove`);
                } catch(e) { console.error("Erreur DB", e); }

                currentMemesData = currentMemesData.filter(m => m.title !== title);
                renderGrid(currentMemesData);
            };
        });
    }

    loadFavorites();
});
