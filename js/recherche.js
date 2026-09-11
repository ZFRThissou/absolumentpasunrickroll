let fuseInstance = null;

// Retire les accents (é, è, ê, ç, à...) et les espaces, pour que
// "sardoche concentre toi" et "sàrdöche  concentretoi" donnent le même résultat.
function normalizeSearchString(str) {
    return str
        .normalize('NFD')                // décompose "é" en "e" + accent séparé
        .replace(/[\u0300-\u036f]/g, '') // supprime tous les accents/diacritiques
        .replace(/\s+/g, '')             // supprime tous les espaces
        .toLowerCase();
}

function initializeSearch(allMemesData, onSearchCallback) {
    const searchInput = document.getElementById("search-bar");
    if (!searchInput) return;

    // On garde une version normalisée de chaque titre à côté de l'original,
    // c'est sur cette version-là que Fuse va comparer.
    const normalizedData = allMemesData.map(item => ({
        ...item,
        _searchKey: normalizeSearchString(item.title)
    }));

    fuseInstance = new Fuse(normalizedData, {
        keys: ["_searchKey"],
        threshold: 0.3,
        distance: 100
    });

    function runSearch() {
        const searchTerm = normalizeSearchString(searchInput.value.trim());

        if (searchTerm === "") {
            onSearchCallback(allMemesData);
        } else {
            const results = fuseInstance.search(searchTerm).map(res => res.item);
            onSearchCallback(results);
        }
    }

    // La recherche ne se déclenche plus à chaque frappe, seulement sur Entrée
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            runSearch();
        }
    });
}

// ============================================================
// NOUVEAU : bascule loupe <-> champ de recherche (mode mobile)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const topbar = document.querySelector('.topbar');
    const searchIconBtn = document.getElementById('search-icon-btn');
    const backBtn = document.getElementById('back-btn');
    const searchInput = document.getElementById('search-bar');

    // Si la page n'a pas ces éléments (ex: contacter.html), on ne fait rien
    if (!topbar || !searchIconBtn || !backBtn) return;

    searchIconBtn.addEventListener('click', () => {
        topbar.classList.add('search-active');
        if (searchInput) searchInput.focus();
    });

    backBtn.addEventListener('click', () => {
        topbar.classList.remove('search-active');
    });
});

// ============================================================
// EASTER EGG : Konami Code (↑ ↑ ↓ ↓ ← → ← → B A)
// Affiche un rickroll en plein écran (le comble pour un site
// qui s'appelle "Absolumentpasunrickroll"). La boîte est créée
// dynamiquement en JS : aucune modification des fichiers HTML
// n'est nécessaire.
// ============================================================
const RICKROLL_VIDEO_ID = 'dQw4w9WgXcQ';

function ensureRickrollOverlay() {
    let overlay = document.getElementById('rickroll-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'rickroll-overlay';
    overlay.className = 'rickroll-overlay';
    overlay.innerHTML = `
        <button type="button" class="rickroll-close" aria-label="Fermer">&times;</button>
        <iframe id="rickroll-iframe" src="" title="Easter egg"
            allow="autoplay; encrypted-media" allowfullscreen></iframe>
    `;
    document.body.appendChild(overlay);

    const closeOverlay = () => {
        overlay.classList.remove('active');
        document.getElementById('rickroll-iframe').src = ''; // stoppe réellement la vidéo
        // On libère le scroll sur <html> ET <body> : c'est <html> qui gère
        // le scroll de ce site (voir le scroll listener du scroll infini),
        // donc ne libérer que <body> laissait la page dans un état incohérent.
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
    };

    overlay.querySelector('.rickroll-close').onclick = closeOverlay;
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeOverlay();
    });

    return overlay;
}

function triggerRickroll() {
    const overlay = ensureRickrollOverlay();
    const iframe = document.getElementById('rickroll-iframe');
    iframe.src = `https://www.youtube.com/embed/${RICKROLL_VIDEO_ID}?autoplay=1`;
    overlay.classList.add('active');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
}

const KONAMI_SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiProgress = 0;

window.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    if (key === KONAMI_SEQUENCE[konamiProgress]) {
        konamiProgress++;
        if (konamiProgress === KONAMI_SEQUENCE.length) {
            triggerRickroll();
            konamiProgress = 0;
        }
    } else {
        // Si la touche pressée est le début d'une nouvelle séquence, on repart de 1
        konamiProgress = (key === KONAMI_SEQUENCE[0]) ? 1 : 0;
    }
});
