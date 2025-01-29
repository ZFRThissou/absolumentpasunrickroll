document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-bar");
    const videoCards = document.querySelectorAll(".video-card");

    // Récupération des titres de vidéos
    const videoData = Array.from(videoCards).map(card => ({
        title: card.querySelector(".video-info h3").textContent.trim(),
        element: card
    }));

    // Configuration de Fuse.js
    const fuse = new Fuse(videoData, {
        keys: ["title"],
        threshold: 0.3, // Permet une recherche tolérante (0 = strict, 1 = très permissif)
        distance: 100 // Gère la proximité dans les correspondances
    });

    searchInput.addEventListener("input", function () {
        const searchTerm = searchInput.value.trim();

        if (searchTerm === "") {
            // Si la barre de recherche est vide, afficher toutes les vidéos
            videoCards.forEach(card => card.style.display = "");
        } else {
            // Effectuer une recherche approximative
            const results = fuse.search(searchTerm);

            // Masquer toutes les vidéos
            videoCards.forEach(card => card.style.display = "none");

            // Afficher les vidéos correspondant à la recherche
            results.forEach(result => {
                result.item.element.style.display = "";
            });
        }
    });
});