let currentIndex = 0;
const videosPerBatch = 4;

function createVideoCard(video) {
    return `
        <div class="video-card">
            <video controls>
                <source src="${video.fichier}">
            </video>
            <div class="video-info">
                <h3>${video.titre}</h3>
                <button class="add-to-favorites">Ajouter aux favoris</button>
                <div class="download-share">
                    <a class="download-button" href="${video.fichier}" download>Télécharger</a>
                    <button class="share-button" onclick="shareVideo('${video.fichier}', '${video.titre.replace(/'/g, "\\'")}')">Partager</button>
                </div>
            </div>
        </div>
    `;
}

function loadMoreVideos() {
    const container = document.querySelector('.video-grid');
    const nextVideos = videos.slice(currentIndex, currentIndex + videosPerBatch);
    nextVideos.forEach(video => {
        container.insertAdjacentHTML('beforeend', createVideoCard(video));
    });
    currentIndex += videosPerBatch;
}

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        loadMoreVideos();
    }
});

document.addEventListener('DOMContentLoaded', loadMoreVideos);
