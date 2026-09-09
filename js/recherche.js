let fuseInstance = null;

function initializeSearch(allMemesData, onSearchCallback) {
    const searchInput = document.getElementById("search-bar");
    if (!searchInput) return;

    // Fuse.js effectue la recherche sur TOUS les mèmes en mémoire
    fuseInstance = new Fuse(allMemesData, {
        keys: ["title"],
        threshold: 0.3,
        distance: 100
    });

    // Écoute la saisie et transmet la liste filtrée
    searchInput.oninput = function () {
        const searchTerm = searchInput.value.trim();

        if (searchTerm === "") {
            onSearchCallback(allMemesData);
        } else {
            const results = fuseInstance.search(searchTerm).map(res => res.item);
            onSearchCallback(results);
        }
    };
}

// ============================================================
// NOUVEAU : bascule loupe <-> champ de recherche (mode mobile)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const topbar = document.querySelector('.topbar');
    const searchIconBtn = document.getElementById('search-icon-btn');
    const backBtn = document.getElementById('back-btn');
    const searchInput = document.getElementById('search-bar');

    // Si la page n'a pas ces éléments (ex: contacter.html), on ne fait rien
    if (!topbar || !searchIconBtn || !backBtn) return;

    searchIconBtn.addEventListener('click', () => {
        topbar.classList.add('search-active');
        if (searchInput) searchInput.focus();
    });

    backBtn.addEventListener('click', () => {
        topbar.classList.remove('search-active');
    });
});
