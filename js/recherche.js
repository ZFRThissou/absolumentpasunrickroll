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

// ============================================================
// EASTER EGG : rickroll caché (le comble pour "Absolumentpasunrickroll")
// La boîte est créée dynamiquement en JS, donc aucune modification
// des fichiers HTML n'est nécessaire.
// ============================================================
const RICKROLL_VIDEO_ID = 'dQw4w9WgXcQ';
const RICKROLL_TRIGGER_WORDS = ['rickroll', 'rickastley', 'nevergonnagiveyouup'];

function ensureRickrollOverlay() {
    let overlay = document.getElementById('rickroll-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'rickroll-overlay';
    overlay.className = 'rickroll-overlay';
    overlay.innerHTML = `
        <div class="rickroll-content">
            <button type="button" class="rickroll-close" aria-label="Fermer">&times;</button>
            <iframe id="rickroll-iframe" src="" title="Easter egg"
                allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeOverlay = () => {
        overlay.classList.remove('active');
        document.getElementById('rickroll-iframe').src = ''; // stoppe la vidéo
        document.body.style.overflow = '';
    };

    overlay.querySelector('.rickroll-close').onclick = closeOverlay;
    overlay.onclick = (e) => {
        if (e.target === overlay) closeOverlay();
    };
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
    document.body.style.overflow = 'hidden';
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

        // Easter egg : chercher un rickroll... en trouve un quand même.
        if (RICKROLL_TRIGGER_WORDS.includes(searchTerm)) {
            triggerRickroll();
            return;
        }

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
// + easter eggs Konami Code et clic répété sur le logo
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const topbar = document.querySelector('.topbar');
    const searchIconBtn = document.getElementById('search-icon-btn');
    const backBtn = document.getElementById('back-btn');
    const searchInput = document.getElementById('search-bar');

    // Si la page n'a pas ces éléments (ex: contacter.html), on ne fait rien
    if (topbar && searchIconBtn && backBtn) {
        searchIconBtn.addEventListener('click', () => {
            topbar.classList.add('search-active');
            if (searchInput) searchInput.focus();
        });

        backBtn.addEventListener('click', () => {
            topbar.classList.remove('search-active');
        });
    }

    // ---- Easter egg : clic répété sur le logo ----
    const logo = document.querySelector('.logo');
    if (logo) {
        const CLICKS_REQUIRED = 5;
        const CLICK_WINDOW_MS = 1500;
        const NAV_DELAY_MS = 400; // délai laissé pour enchaîner un clic suivant

        let clickCount = 0;
        let resetTimer = null;
        let navTimer = null;

        logo.addEventListener('click', function (e) {
            e.preventDefault(); // on gère la navigation nous-même, le temps de vérifier

            clickCount++;
            clearTimeout(resetTimer);
            clearTimeout(navTimer);

            if (clickCount >= CLICKS_REQUIRED) {
                clickCount = 0;
                triggerRickroll();
                return;
            }

            resetTimer = setTimeout(() => { clickCount = 0; }, CLICK_WINDOW_MS);

            // Si l'utilisateur ne re-clique pas assez vite, on laisse la
            // navigation normale se faire après un court délai.
            navTimer = setTimeout(() => {
                window.location.href = logo.getAttribute('href');
            }, NAV_DELAY_MS);
        });
    }
});

// ---- Easter egg : Konami Code (↑ ↑ ↓ ↓ ← → ← → B A) ----
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
