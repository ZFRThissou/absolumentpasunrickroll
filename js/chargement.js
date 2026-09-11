// Fonctions partagées entre generer_contenu.js et afficher favoris.js
// pour afficher des cartes "squelette" (effet shimmer) pendant le
// chargement, et précharger un média avant de l'afficher (évite le
// clignotement où la carte apparaît vide le temps que la vidéo/image
// se télécharge).

function createSkeletonCards(count) {
    const fragment = document.createDocumentFragment();
    const elements = [];
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'skeleton-card';
        card.innerHTML = `
            <div class="skeleton-thumb"></div>
            <div class="skeleton-info">
                <div class="skeleton-line title"></div>
                <div class="skeleton-line short"></div>
            </div>
        `;
        fragment.appendChild(card);
        elements.push(card);
    }
    return { fragment, elements };
}

function preloadCardMedia(type, mediaPath) {
    // Les audios n'ont pas de miniature visuelle à précharger.
    if (type === 'audio') return Promise.resolve();

    return new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            resolve();
        };
        const timeout = setTimeout(finish, 4000); // filet de sécurité

        if (type === 'image') {
            const img = new Image();
            img.onload = () => { clearTimeout(timeout); finish(); };
            img.onerror = () => { clearTimeout(timeout); finish(); };
            img.src = mediaPath;
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.onloadeddata = () => { clearTimeout(timeout); finish(); };
            video.onerror = () => { clearTimeout(timeout); finish(); };
            video.src = mediaPath;
        } else {
            clearTimeout(timeout);
            finish();
        }
    });
}
