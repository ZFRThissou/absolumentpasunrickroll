let fuseInstance = null;

// Retire les accents (é, è, ê, ç, à...) et les espaces, pour que
// "sardoche concentre toi" et "sàrdöche  concentretoi" donnent le même résultat.
function normalizeSearchString(str) {
    return str
        .normalize('NFD')                // décompose "é" en "e" + accent séparé
        .replace(/[\u0300-\u036f]/g, '') // supprime tous les accents/diacritiques
        .replace(/\s+/g, '')             // supprime tous les espaces
        .toLowerCase();
}

function initializeSearch(allMemesData, onSearchCallback) {
    const searchInput = document.getElementById("search-bar");
    if (!searchInput) return;

    // On garde une version normalisée de chaque titre à côté de l'original,
    // c'est sur cette version-là que Fuse va comparer.
    const normalizedData = allMemesData.map(item => ({
        ...item,
        _searchKey: normalizeSearchString(item.title)
    }));

    fuseInstance = new Fuse(normalizedData, {
        keys: ["_searchKey"],
        threshold: 0.3,
        distance: 100
    });

    function runSearch() {
        const searchTerm = normalizeSearchString(searchInput.value.trim());

        if (searchTerm === "") {
            onSearchCallback(allMemesData);
        } else {
            const results = fuseInstance.search(searchTerm).map(res => res.item);
            onSearchCallback(results);
        }
    }

    // La recherche ne se déclenche plus à chaque frappe, seulement sur Entrée
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            runSearch();
        }
    });
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
