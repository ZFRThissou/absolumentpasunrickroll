// ============================================================
// MOTEUR DE RECHERCHE INTERNE (TF-IDF)
//
// Remplace Fuse.js. Fuse comparait le titre ENTIER comme une seule
// chaîne floue, positionnée par rapport à un "location" attendu. Comme
// normalizeSearchString() retirait aussi tous les espaces, un titre long
// comme "finalement cest qui le plus con maintenant siphano" devenait une
// chaîne de 45+ caractères sans séparateurs, avec "siphano" tout à la fin.
// Le score de Fuse pénalise les correspondances loin de la position
// attendue (paramètre "distance") : plus un titre est long, plus un mot
// présent en fin de titre risquait d'être ignoré, même s'il y figurait.
//
// La solution : découper chaque titre en MOTS (tokenisation) et calculer
// un score TF-IDF par mot. La position du mot dans le titre n'a alors
// plus aucune importance.
// ============================================================

function normalizeToken(str) {
    return str
        .normalize('NFD')                // décompose "é" en "e" + accent séparé
        .replace(/[\u0300-\u036f]/g, '') // supprime tous les accents/diacritiques
        .toLowerCase();
}

function tokenize(title) {
    return normalizeToken(title)
        .split(/[^a-z0-9]+/) // coupe sur tout ce qui n'est pas une lettre/chiffre
        .filter(Boolean);
}

// Distance de Levenshtein : nombre minimal d'insertions/suppressions/
// substitutions pour passer d'un mot à l'autre. Sert à tolérer les
// petites fautes de frappe dans la recherche.
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

class TfIdfSearchIndex {
    constructor(items, titleKey = 'title') {
        this.items = items;
        this.docTokens = items.map(item => tokenize(item[titleKey]));

        // Fréquence documentaire : dans combien de titres chaque mot apparaît.
        const df = new Map();
        this.docTokens.forEach(tokens => {
            new Set(tokens).forEach(t => df.set(t, (df.get(t) || 0) + 1));
        });
        this.vocabulary = [...df.keys()];

        // idf(mot) : plus un mot est rare dans l'ensemble des titres, plus
        // il est "informatif" et pèse lourd dans le score (+1 = lissage
        // pour éviter une division par zéro / un log de 0).
        const N = items.length;
        this.idf = new Map();
        df.forEach((freq, term) => {
            this.idf.set(term, Math.log((N + 1) / (freq + 1)) + 1);
        });

        // Vecteur TF-IDF précalculé pour chaque titre (mot -> poids).
        this.docVectors = this.docTokens.map(tokens => {
            const tf = new Map();
            tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
            const vec = new Map();
            tf.forEach((count, term) => {
                vec.set(term, (count / tokens.length) * (this.idf.get(term) || 0));
            });
            return vec;
        });
    }

    // Fait correspondre un mot tapé par l'utilisateur à un mot du
    // vocabulaire : correspondance exacte, préfixe (saisie partielle), ou
    // distance de Levenshtein courte (tolérance aux fautes de frappe).
    resolveToken(token) {
        if (this.idf.has(token)) return token;

        let best = null;
        let bestDist = Infinity;
        for (const vocabTerm of this.vocabulary) {
            if (vocabTerm.startsWith(token)) return vocabTerm;
            const maxDist = token.length <= 4 ? 1 : 2; // tolérance selon la longueur du mot
            const dist = levenshtein(token, vocabTerm);
            if (dist <= maxDist && dist < bestDist) {
                best = vocabTerm;
                bestDist = dist;
            }
        }
        return best;
    }

    search(query) {
        const queryTokens = tokenize(query)
            .map(t => this.resolveToken(t))
            .filter(Boolean);

        if (queryTokens.length === 0) return [];

        return this.docVectors
            .map((vec, i) => {
                let score = 0;
                queryTokens.forEach(term => { score += vec.get(term) || 0; });
                return { item: this.items[i], score };
            })
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(r => r.item);
    }
}

let searchIndex = null;

function initializeSearch(allMemesData, onSearchCallback) {
    const searchInput = document.getElementById("search-bar");
    if (!searchInput) return;

    searchIndex = new TfIdfSearchIndex(allMemesData, 'title');

    function runSearch() {
        const term = searchInput.value.trim();

        if (term === "") {
            onSearchCallback(allMemesData);
        } else {
            onSearchCallback(searchIndex.search(term));
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
