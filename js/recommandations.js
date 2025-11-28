// recommandations.js

document.addEventListener('DOMContentLoaded', function() {
    const recommendationsGrid = document.getElementById('recommendations-grid');
    if (!recommendationsGrid) return;

    // Récupération des données triées par le serveur
    fetch('/.netlify/functions/get-recommendations')
        .then(response => response.json())
        .then(sortedMemes => {
            if (sortedMemes.length === 0) {
                 recommendationsGrid.innerHTML = '<p>Aucune recommandation n’a encore été enregistrée.</p>';
                 return;
            }

            // Génération du HTML pour chaque mème trié
            sortedMemes.forEach(meme => {
                const title = meme.title;
                const type = meme.meme_type;
                const score = meme.score;
                
                // IMPORTANT: L'extension (ext) n'est pas dans la BDD. 
                // Vous devez soit l'ajouter, soit la deviner (solution la plus simple ici):
                const ext = (type === 'video' ? 'mp4' : (type === 'audio' ? 'mp3' : 'jpg')); 
                const folderName = (type === 'video' ? 'vidéos' : (type === 'audio' ? 'audios' : 'images'));
                const mediaPath = `image/mèmes/${folderName}/${title}.${ext}`;
                
                let cardContent = '';

                if (type === 'video') {
                    cardContent = `<video controls><source src="${mediaPath}"></video>`;
                } else if (type === 'audio') {
                    cardContent = `<button class="button" data-sound="${mediaPath}">Play Sound</button>`;
                } else if (type === 'image') {
                    cardContent = `<img src="${mediaPath}" alt="Image thumbnail">`;
                }

                const cardHTML = document.createElement('div');
                cardHTML.classList.add('video-card');
                cardHTML.innerHTML = `
                    ${cardContent}
                    <div class="video-info">
                        <h3>${title}</h3>
                        <p>🔥 Popularité: ${score} Favoris</p>
                        <div class="video-actions">
                            <a class="download-button" href="${mediaPath}" download="">Télécharger</a>
                        </div>
                    </div>
                `;
                
                recommendationsGrid.appendChild(cardHTML);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des recommandations:', error);
            recommendationsGrid.innerHTML = '<p>Désolé, une erreur serveur est survenue.</p>';
        });
});

// Ajoutez ici la logique pour le bouton 'Play Sound' (audio) si nécessaire, 
// similaire à ce que vous avez dans audios.html.
