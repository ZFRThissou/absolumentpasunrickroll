// Fichier : js/recommandations.js (Corrigé)

document.addEventListener('DOMContentLoaded', function() {
    const recommendationsGrid = document.getElementById('recommendations-grid');
    if (!recommendationsGrid) return;

    // Récupération des données triées par le serveur
    fetch('/.netlify/functions/get-recommendations')
        .then(response => {
            // Vérifie le statut HTTP pour un meilleur débogage
            if (!response.ok) {
                // Si le statut n'est pas 200 (ex: 500), le traitement catch gérera l'erreur
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // ⭐️ CORRECTION : Vérifie si la réponse est bien un tableau (Array)
            if (!Array.isArray(data)) {
                 // Si c'est un objet, c'est probablement l'objet d'erreur du serveur
                 if (data && data.error) {
                    recommendationsGrid.innerHTML = `<p>Erreur serveur: ${data.error}</p>`;
                 } else {
                    recommendationsGrid.innerHTML = '<p>Désolé, la réponse du serveur n\'est pas au format attendu.</p>';
                 }
                 return;
            }

            const sortedMemes = data; // La réponse est bien le tableau attendu
            
            if (sortedMemes.length === 0) {
                 recommendationsGrid.innerHTML = '<p>Aucune recommandation n’a encore été enregistrée. Ajoutez des favoris !</p>';
                 return;
            }

            // Boucle sur le tableau (maintenant que nous sommes sûrs que c'en est un)
            sortedMemes.forEach(meme => {
                const title = meme.title;
                const type = meme.meme_type;
                const score = meme.score;
                
                // IMPORTANT: Assurez-vous que le chemin est correct selon votre structure de dossiers
                const ext = (type === 'video' ? 'mp4' : (type === 'audio' ? 'mp3' : 'jpg')); 
                const folderName = (type === 'video' ? 'vidéos' : (type === 'audio' ? 'audios' : 'images'));
                const mediaPath = `image/mèmes/${folderName}/${title}.${ext}`;
                
                let cardContent = '';

                if (type === 'video') {
                    cardContent = `<video controls><source src="${mediaPath}"></video>`;
                } else if (type === 'audio') {
                    // Les audios n'ont pas de prévisualisation mais un bouton de lecture
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
                            <button class="share-button" onclick="shareVideo('${mediaPath}', '${title}')">Partager</button>
                        </div>
                    </div>
                `;
                
                recommendationsGrid.appendChild(cardHTML);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des recommandations:', error);
            // Affiche l'erreur générique ou le statut HTTP si l'erreur n'était pas formatée en JSON
            recommendationsGrid.innerHTML = `<p>Désolé, une erreur serveur est survenue. (${error.message})</p>`;
        });
});
