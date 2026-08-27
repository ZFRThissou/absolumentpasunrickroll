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