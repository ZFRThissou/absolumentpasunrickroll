/**
 * Initialise le système de recherche Fuse.js une fois que les cartes 
 * (video-card) ont été générées dynamiquement.
 */
function initializeSearch() {
    const searchInput = document.getElementById("search-bar");
    
    // NOUVEAU : Récupère les cartes JUSTE AVANT l'initialisation de la recherche
    const videoCards = document.querySelectorAll(".video-card");

    if (videoCards.length === 0) {
        // Aucune carte à rechercher (ne devrait pas arriver si appelé au bon moment)
        return; 
    }

    // Récupération des titres de vidéos
    const videoData = Array.from(videoCards).map(card => ({
        // Utiliser .textContent.trim() pour récupérer le titre
        title: card.querySelector(".video-info h3").textContent.trim(), 
        element: card
    }));

    // Configuration de Fuse.js
    const fuse = new Fuse(videoData, {
        keys: ["title"],
        threshold: 0.3, // Recherche tolérante
        distance: 100 
    });

    searchInput.addEventListener("input", function () {
        const searchTerm = searchInput.value.trim();

        // Afficher/Masquer le contenu en fonction de la recherche
        if (searchTerm === "") {
            // Si la barre de recherche est vide, afficher toutes les cartes
            videoCards.forEach(card => card.style.display = "");
        } else {
            // Effectuer une recherche approximative
            const results = fuse.search(searchTerm);

            // Masquer toutes les cartes
            videoCards.forEach(card => card.style.display = "none");

            // Afficher les cartes correspondant à la recherche
            results.forEach(result => {
                result.item.element.style.display = "";
            });
        }
    });
}

// NOTE : On retire l'écouteur DOMContentLoaded d'ici !
