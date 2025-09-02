let currentIndex = 0;
const videosPerBatch = 8; // ✅ maintenant 8 vidéos à la fois
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

    // délai aléatoire 300ms–1200ms
    const randomDelay = Math.floor(Math.random() * (1200 - 300 + 1)) + 300;

    setTimeout(() => {
        const container = document.querySelector('.video-grid');
        const nextVideos = videos.slice(currentIndex, currentIndex + videosPerBatch);
        nextVideos.forEach(video => {
            container.insertAdjacentHTML('beforeend', createVideoCard(video));
        });
        currentIndex += videosPerBatch;
        document.getElementById('loader').style.display = "none";
        loading = false;

        // Si plus de vidéos à charger → on arrête d’observer
        if (currentIndex >= videos.length) {
            observer.disconnect();
            document.getElementById('loader').innerHTML = "✔️ Toutes les vidéos sont affichées";
        }
    }, randomDelay);
}

// 🔍 Intersection Observer
const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
        loadMoreVideos();
    }
}, { threshold: 1.0 });

// Ajouter un sentinel après la grid
document.addEventListener('DOMContentLoaded', () => {
    const sentinel = document.createElement('div');
    sentinel.id = "sentinel";
    document.querySelector('.main-content').appendChild(sentinel);
    observer.observe(sentinel);
    loadMoreVideos(); // premier lot
});
