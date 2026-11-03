// Page des favoris : affichage des mèmes enregistrés dans le localStorage.
// La carte, la modale et le tri sont dans meme-ui.js (partagé avec la grille
// des autres pages). Ici il ne reste que ce qui est propre aux favoris :
// lire le localStorage et retirer un mème.
document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.querySelector('.video-grid') || document.querySelector('.main-content');
    if (!videoGrid) return;

    let currentMemesData = []; // Stockage local des favoris pour le tri
    let currentSortType = '';

    const MESSAGE_VIDE = '<p style="color: black; text-align: center; width: 100%;">Aucun mème favori enregistré.</p>';

    // --- Affichage des skeletons au démarrage ---
    function showLoader() {
        const { fragment } = createSkeletonCards(12);
        videoGrid.innerHTML = '';
        videoGrid.appendChild(fragment);
    }

    // Le localStorage ne garde qu'une copie du mème au moment où on l'a mis
    // en favori (et rien du tout pour les audios : juste le titre). Pour
    // avoir la description et l'extension À JOUR, on les relit dans
    // data/mèmes.json, qui est la référence.
    function indexerCatalogue(catalogue) {
        const index = {};
        if (!catalogue) return index;
        Object.keys(catalogue).forEach(cle => {
            catalogue[cle].forEach(m => { index[m.title] = m; });
        });
        return index;
    }

    // 1. Initialisation : Récupérer et centraliser tous les favoris
    function loadFavorites() {
        showLoader();

        const videoFavs = JSON.parse(localStorage.getItem('videoFavorites')) || [];
        const audioFavs = JSON.parse(localStorage.getItem('audioFavorites')) || [];
        const imageFavs = JSON.parse(localStorage.getItem('imageFavorites')) || [];

        // On normalise les données (même nom de champ que la grille : typeMeme)
        const allFavs = [
            ...videoFavs.map(v => ({ ...v, typeMeme: 'video' })),
            ...audioFavs.map(title => ({ title: title, ext: 'mp3', typeMeme: 'audio' })),
            ...imageFavs.map(i => ({ ...i, typeMeme: 'image' }))
        ];

        if (allFavs.length === 0) {
            videoGrid.innerHTML = MESSAGE_VIDE;
            return;
        }

        // Catalogue, likes en temps réel et adresses des pages /meme/ en parallèle.
        // Chaque requête a son propre .catch : si l'une échoue, les favoris
        // s'affichent quand même avec ce qu'on a.
        Promise.all([
            fetch('data/mèmes.json').then(res => res.json()).catch(() => null),
            fetch('/.netlify/functions/get-all-likes').then(res => res.ok ? res.json() : []).catch(() => []),
            chargerSlugs()
        ]).then(([catalogue, stats]) => {
            const statsMap = {};
            stats.forEach(s => statsMap[s.id_meme] = s);
            const referenceParTitre = indexerCatalogue(catalogue);

            currentMemesData = allFavs.map(m => {
                const reference = referenceParTitre[m.title];
                return {
                    ...m,
                    ext: reference?.ext || m.ext,
                    desc: reference?.desc || m.desc || '',
                    likes: statsMap[m.title]?.likes || 0,
                    date: statsMap[m.title]?.date_ajout ? new Date(statsMap[m.title].date_ajout) : new Date(0)
                };
            });

            renderGrid(currentMemesData);
            initialiserMenuTri((type) => {
                currentSortType = type;
                sortMemes(type);
            });
            initSearch();
        });
    }

    // --- Branchement de la recherche, fournie par js/recherche.js ---
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
            videoGrid.innerHTML = MESSAGE_VIDE;
            return;
        }

        // On affiche des skeletons pendant le préchargement, exactement
        // comme sur les autres pages.
        const { fragment, elements: skeletonElements } = createSkeletonCards(dataList.length);
        videoGrid.appendChild(fragment);

        const preloadPromises = [];
        const cardsToInsert = [];

        dataList.forEach(mème => {
            const { carte, mediaPath } = creerCarteMeme(mème);

            // Seule différence avec la grille : ici le cœur RETIRE le mème des favoris
            const zoneFavori = carte.querySelector('.add-to-favorites');
            const coeur = document.createElement('img');
            coeur.className = 'remove-from-favorites';
            coeur.src = 'image/icones/favoris_cliquer.png';
            coeur.alt = 'Retirer des favoris';
            coeur.style.cursor = 'pointer';
            coeur.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêche le clic de remonter jusqu'à la carte (et donc d'ouvrir la modale)
                retirerDesFavoris(mème);
            });
            zoneFavori.appendChild(coeur);

            cardsToInsert.push(carte);
            preloadPromises.push(preloadCardMedia(mème.typeMeme, mediaPath));
        });

        Promise.all(preloadPromises).then(() => {
            const referenceNode = skeletonElements[0] || null;
            cardsToInsert.forEach(card => videoGrid.insertBefore(card, referenceNode));
            skeletonElements.forEach(el => el.remove());
        });
    }

    // 3. Tri
    function sortMemes(type) {
        trierMemes(currentMemesData, type);
        renderGrid(currentMemesData);
    }

    // 4. Retirer un mème des favoris
    async function retirerDesFavoris(mème) {
        const favoritesKey = mème.typeMeme + 'Favorites';

        let favs = JSON.parse(localStorage.getItem(favoritesKey)) || [];
        if (mème.typeMeme === 'audio') {
            favs = favs.filter(t => t !== mème.title);
        } else {
            favs = favs.filter(f => f.title !== mème.title);
        }
        localStorage.setItem(favoritesKey, JSON.stringify(favs));

        try {
            await fetch(`/.netlify/functions/like-meme?id=${encodeURIComponent(mème.title)}&action=remove`);
        } catch(e) { console.error("Erreur DB", e); }

        currentMemesData = currentMemesData.filter(m => m.title !== mème.title);
        renderGrid(currentMemesData);
    }

    loadFavorites();
});
