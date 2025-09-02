let currentIndex = 0;
const videosPerBatch = 8; // ✅ maintenant 12 vidéos à la fois
let loading = false;

function createVideoCard(video) {
    return `
        <div class="video-card">
            <video controls>
                <source src="${video.fichier}">
            </video>
            <div class="video-info">
                <h3>${video.titre}</h3>
                <div class="video-actions">
                    <button class="add-to-favorites">Ajouter aux favoris</button>
                    <div class="download-share">
                        <a class="download-button" href="${video.fichier}" download>Télécharger</a>
                        <button class="share-button" onclick="shareVideo('${video.fichier}', '${video.titre.replace(/'/g, "\\'")}')">Partager</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadMoreVideos() {
    if (loading) return;
    loading = true;
    document.getElementById('loader').style.display = "block";

    setTimeout(() => { // petite pause pour simuler un vrai chargement
        const container = document.querySelector('.video-grid');
        const nextVideos = videos.slice(currentIndex, currentIndex + videosPerBatch);
        nextVideos.forEach(video => {
            container.insertAdjacentHTML('beforeend', createVideoCard(video));
        });
        currentIndex += videosPerBatch;
        document.getElementById('loader').style.display = "none";
        loading = false;
    }, 500);
}

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        loadMoreVideos();
    }
});

document.addEventListener('DOMContentLoaded', loadMoreVideos);
