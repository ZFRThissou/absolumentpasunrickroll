document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return; // Quitter si l'élément conteneur n'est pas trouvé

    // 1. Déterminer le type de page actuel (vidéos, audios, images)
    let pageType;
    const path = window.location.pathname;
    
    if (path.includes('vidéos.html')) {
        pageType = 'videos';
    } else if (path.includes('audios.html')) {
        pageType = 'audios';
    } else if (path.includes('images.html')) {
        pageType = 'images';
    } else {
        return; // Quitter si ce n'est aucune des pages concernées
    }

    // 2. Charger les données JSON
    fetch('data/mèmes.json')
        .then(response => response.json())
        .then(data => {
            const mèmes = data[pageType];
            
            mèmes.forEach(mème => {
                const title = mème.title;
                const ext = mème.ext;
                
                // Construire les chemins
                let mediaPath;
                let cardContent;

                if (pageType === 'videos') {
                    mediaPath = `image/mèmes/vidéos/${title}.${ext}`;
                    cardContent = `
                        <video controls>
                            <source src="${mediaPath}">
                        </video>
                    `;
                } else if (pageType === 'audios') {
                    mediaPath = `image/mèmes/audios/${title}.${ext}`;
                    cardContent = `
                        <button class="button" data-sound="${mediaPath}">Play Sound</button>
                    `;
                } else if (pageType === 'images') {
                    mediaPath = `image/mèmes/images/${title}.${ext}`;
                    cardContent = `
                        <img src="${mediaPath}" alt="Image thumbnail">
                    `;
                }
                
                // Générer le HTML complet de la carte
                const cardHTML = `
                    <div class="video-card" data-title="${title}" data-ext="${ext}">
                        ${cardContent}
                        <div class="video-info">
                            <h3>${title}</h3>
                            <div class="video-actions">
                                <button class="add-to-favorites">Ajouter aux favoris</button>
                                <div class="download-share">
                                    <a class="download-button" href="${mediaPath}" download="">Télécharger</a>
                                    <button class="share-button" onclick="shareVideo('${mediaPath}', '${title}')">Partager</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                videoGrid.insertAdjacentHTML('beforeend', cardHTML);
            });

            // Une fois les cartes ajoutées, initialiser les fonctionnalités JS
            // (Favoris, Play Sound pour Audios)
            // Vous devrez appeler les fonctions d'initialisation de vos scripts ici.
            // Par exemple:
            // initFavoriteLogic(); // Une fonction que vous créez dans favoris_*.js pour réattacher les écouteurs
            
            // Pour l'instant, assurez-vous que vos scripts favoris et audios
            // attachent leurs écouteurs d'événements à ces nouveaux boutons.

            // Réattacher la logique 'Play Sound' si elle était dans un script externe:
            document.querySelectorAll('.button').forEach(button => {
                button.addEventListener('click', function(event) {
                    const soundFile = event.target.getAttribute('data-sound');
                    // Assurez-vous que l'élément <audio id="audio"></audio> existe dans audios.html
                    const audio = document.getElementById('audio');
                    audio.src = soundFile;
                    audio.currentTime = 0;
                    audio.play();
                });
            });

            // Re-initialiser la logique des favoris après chargement (voir étape 4)
            initializeFavoriteButtons(pageType);
        })
        .catch(error => console.error('Erreur lors du chargement des mèmes:', error));
});

// Cette fonction sera définie dans un des scripts favoris et sera appelée ici.
function initializeFavoriteButtons(pageType) {
    // Le code pour initier les boutons favoris (Retirer/Ajouter) doit être réécrit
    // pour fonctionner sur les boutons dynamiquement ajoutés.
    
    // Si vous souhaitez une aide pour adapter vos scripts favoris, dites-le-moi.
}
