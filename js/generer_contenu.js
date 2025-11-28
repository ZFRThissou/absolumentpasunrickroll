document.addEventListener('DOMContentLoaded', function() {
    // Déterminer la catégorie de mèmes basée sur l'URL de la page
    const pathname = window.location.pathname;
    let type;
    let categoryKey; // Clé dans le JSON (videos, audios, images)
    let folderName;  // Nom du dossier sur le serveur (vidéos, audios, images)
    let localStorageKey; // Clé dans localStorage (videoFavorites, audioFavorites, etc.)

    if (pathname.includes('vid')) {
        console.log("vidéo")
        type = 'video';
        categoryKey = 'videos';
        folderName = 'vidéos';
        localStorageKey = 'videoFavorites';
    } else if (pathname.includes('audios')) {
        console.log("audios")
        type = 'audio';
        categoryName = 'audios';
        folderName = 'audios';
        localStorageKey = 'audioFavorites';
    } else if (pathname.includes('images')) {
        console.log("image")
        type = 'image';
        categoryKey = 'images';
        folderName = 'images';
        localStorageKey = 'imageFavorites';
    } else {
        // Page non reconnue (ex: page d'accueil ou autre)
        return; 
    }

    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;
    
    // ----------------------------------------------------
    // FONCTIONS CÔTÉ SERVEUR (Netlify Function)
    // ----------------------------------------------------

    /**
     * Envoie une requête à la Netlify Function pour incrémenter ou décrémenter le score du mème.
     * @param {string} title - Le titre du mème.
     * @param {string} type - Le type du mème ('video', 'audio', 'image').
     * @param {number} change - +1 (ajout aux favoris) ou -1 (retrait des favoris).
     */
    function updateServerScore(title, type, change) {
        fetch('/.netlify/functions/update-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: title, change: change, type: type })
        })
        .then(response => {
            if (!response.ok) throw new Error('Erreur réseau ou serveur lors de l\'appel à la fonction Netlify.');
            return response.json();
        })
        .then(data => {
            // Log de confirmation (optionnel)
            console.log(`Score de ${title} (${type}) mis à jour. Nouveau score: ${data.new_score}`);
        })
        .catch(error => {
            console.error('Échec de la mise à jour du score (BDD) :', error);
            // On peut ici informer l'utilisateur qu'il y a eu un problème serveur
        });
    }

    /**
     * Gère le clic sur le bouton 'Ajouter/Retirer des favoris'.
     * @param {HTMLElement} button - Le bouton cliqué.
     * @param {string} title - Le titre du mème.
     * @param {string} type - Le type du mème ('video', 'audio', 'image').
     * @param {string} localStorageKey - La clé de localStorage (ex: 'videoFavorites').
     */
    function toggleFavorite(button, title, type, localStorageKey) {
        let favorites = JSON.parse(localStorage.getItem(localStorageKey)) || [];
        const isFavorite = favorites.includes(title);
        
        if (isFavorite) {
            // Retirer des favoris
            favorites = favorites.filter(fav => fav !== title);
            button.textContent = 'Ajouter aux favoris';
            
            // ⭐️ APPEL SERVEUR : Décrémenter (-1)
            updateServerScore(title, type, -1);
        } else {
            // Ajouter aux favoris
            favorites.push(title);
            button.textContent = 'Retirer des favoris';

            // ⭐️ APPEL SERVEUR : Incrémenter (+1)
            updateServerScore(title, type, 1);
        }

        // Mise à jour du stockage local (pour l'affichage personnel des favoris)
        localStorage.setItem(localStorageKey, JSON.stringify(favorites));
    }


    // ----------------------------------------------------
    // LOGIQUE DE GÉNÉRATION DU CONTENU
    // ----------------------------------------------------

    // Fonction pour générer le HTML de la carte
    function createMemeCard(meme, type, folderName, localStorageKey) {
        const title = meme.title;
        const ext = meme.ext;
        const mediaPath = `image/mèmes/${folderName}/${title}.${ext}`;
        
        let cardContent;

        if (type === 'video') {
            cardContent = `
                <video controls>
                    <source src="${mediaPath}" type="video/${ext}">
                </video>
            `;
        } else if (type === 'audio') {
            // L'élément <audio> est mis en bas du body dans audios.html
            cardContent = `<button class="button" data-sound="${mediaPath}">Play Sound</button>`;
        } else if (type === 'image') {
            cardContent = `<img src="${mediaPath}" alt="Image thumbnail">`;
        } else {
            return null; // Ne rien générer si le type est inconnu
        }
        
        // Vérifier si le mème est déjà en favori pour l'affichage initial du bouton
        const favorites = JSON.parse(localStorage.getItem(localStorageKey)) || [];
        const buttonText = favorites.includes(title) ? 'Retirer des favoris' : 'Ajouter aux favoris';

        const card = document.createElement('div');
        card.classList.add('video-card');
        card.innerHTML = `
            ${cardContent}
            <div class="video-info">
                <h3>${title}</h3>
                <div class="video-actions">
                    <button class="add-to-favorites">${buttonText}</button>
                    <div class="download-share">
                        <a class="download-button" href="${mediaPath}" download="">Télécharger</a>
                        <button class="share-button" onclick="shareVideo('${mediaPath}', '${title}')">Partager</button>
                    </div>
                </div>
            </div>
        `;
        
        // Gérer le clic sur le bouton Favoris
        const favButton = card.querySelector('.add-to-favorites');
        if (favButton) {
            favButton.addEventListener('click', () => {
                toggleFavorite(favButton, title, type, localStorageKey);
            });
        }

        return card;
    }

    // Charger le JSON et générer les cartes
    fetch('data/mèmes.json')
    .then(response => {
        if (!response.ok) {
            // Affiche l'erreur si le fichier JSON n'est pas trouvé (404) ou inaccessible
            throw new Error(`Erreur HTTP: ${response.status} - Impossible de charger le fichier mèmes.json. Vérifiez le chemin.`);
        }
        return response.json();
    })
    .then(data => {
        // ⭐️ DÉBOGAGE AJOUTÉ: Vérifiez si les données JSON sont bien chargées
        if (!data || !data[categoryKey]) {
            console.error(`Erreur de structure : La clé '${categoryKey}' est manquante ou vide dans le JSON.`);
            videoGrid.innerHTML = '<p>Désolé, la structure des mèmes est incorrecte.</p>';
            return;
        }

        const memes = data[categoryKey]; // Utilisez la clé détectée (videos, audios, images)
        console.log(`✅ ${memes.length} mèmes de type '${categoryKey}' chargés.`); // Affiche le nombre de mèmes

        memes.forEach(meme => {
            // ... (Reste de votre code pour créer la carte) ...
            const card = createMemeCard(meme, type, folderName, localStorageKey);
            if (card) {
                videoGrid.appendChild(card);
            }
        });

            // ----------------------------------------------------
            // INITIALISATION FINALE
            // ----------------------------------------------------
            
            // 1. Initialiser la recherche (Fuse.js) après que toutes les cartes soient créées
            if (typeof initializeSearch === 'function') {
                initializeSearch();
            }

            // 2. Initialiser le 'Play Sound' si c'est la page Audio
            if (type === 'audio') {
                document.querySelectorAll('.button').forEach(button => {
                    button.addEventListener('click', function(event) {
                        // Assurez-vous que l'élément <audio id="audio"></audio> est présent dans audios.html
                        const soundFile = event.target.getAttribute('data-sound');
                        const audio = document.getElementById('audio');
                        if (audio) {
                            audio.src = soundFile;
                            audio.currentTime = 0;
                            audio.play();
                        }
                    });
                });
            }
        })
        //.catch(error => {
            //console.error('Erreur lors du chargement ou du traitement du fichier mèmes.json :', error);
            //videoGrid.innerHTML = '<p>Désolé, impossible de charger les mèmes pour le moment.</p>';
        //});
        .catch(error => {
        console.error('❌ Erreur critique lors du chargement du contenu :', error);
        // Affiche l'erreur pour l'utilisateur
        videoGrid.innerHTML = `<p>Erreur critique : ${error.message}</p>`;
    });
});

// NOTE : La fonction initializeSearch() doit être présente dans votre fichier js/recherche.js
//       (comme nous l'avons corrigé précédemment).
// NOTE : La fonction shareVideo() doit être présente dans votre fichier js/partager.js.
