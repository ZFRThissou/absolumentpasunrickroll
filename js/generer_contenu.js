// Page d'accueil, vidéos, audios, images : affichage de la grille de mèmes.
// La carte, la modale et le tri sont dans meme-ui.js (partagé avec la page
// des favoris). Ici il ne reste que ce qui est propre à ces pages : le
// chargement des données, le défilement infini et l'ajout aux favoris.
document.addEventListener("DOMContentLoaded", function () {
  // Évite d'exécuter le script deux fois si chargé en double
  if (window.__genererContenuInitialized) return;
  window.__genererContenuInitialized = true;

  const videoGrid = document.querySelector(".video-grid");
  if (!videoGrid) return;

  let pageType;
  const path = window.location.pathname.toLowerCase();

  // Détection de la page (placé AVANT la création du loader)
  if (path.includes("vid")) {
    pageType = "videoFavorites";
  } else if (path.includes("audios")) {
    pageType = "audioFavorites";
  } else if (path.includes("/images")) {
    pageType = "imageFavorites";
  } else if (path === "/" || path.includes("index.html")) {
    pageType = "index";
  } else {
    return;
  }

  let currentMemesData = [];
  let databaseStats = {};
  let currentSortType = "";
  let currentPage = 1;
  const MEMES_PER_PAGE = 20;
  let activeMemesList = []; // Garde en mémoire la liste actuelle (pratique avec le tri)
  let isFetching = false; // Empêche de déclencher le chargement 50 fois d'un coup en scrollant

  // --- Affichage des skeletons au démarrage ---
  if (!videoGrid.querySelector(".skeleton-card")) {
    const { fragment } = createSkeletonCards(MEMES_PER_PAGE);
    videoGrid.innerHTML = "";
    videoGrid.appendChild(fragment);
  }

  // Récupération des données (JSON local + Stats DB + adresses des pages /meme/)
  Promise.all([
    fetch("data/mèmes.json").then((res) => res.json()),
    fetch("/.netlify/functions/get-all-likes")
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []),
    chargerSlugs(), // remplit la table des slugs utilisée par creerCarteMeme (meme-ui.js)
  ])
    .then(([jsonData, stats]) => {
      let mèmesRaw = [];

      // Logique de récupération des données selon la page
      if (pageType === "index") {
        Object.keys(jsonData).forEach((key) => {
          const type = key.replace("s", "");
          const itemsWithType = jsonData[key].map((item) => ({
            ...item,
            typeMeme: type,
          }));
          mèmesRaw = mèmesRaw.concat(itemsWithType);
        });
      } else {
        const mèmeType = pageType.replace("Favorites", "");
        mèmesRaw = jsonData[mèmeType + "s"].map((item) => ({
          ...item,
          typeMeme: mèmeType,
        }));
      }

      stats.forEach((s) => {
        databaseStats[s.id_meme] = s;
      });

      currentMemesData = mèmesRaw.map((m) => ({
        ...m,
        likes: databaseStats[m.title]?.likes || 0,
        duree: databaseStats[m.title]?.duree || 0,
        date: databaseStats[m.title]?.date_ajout
          ? new Date(databaseStats[m.title].date_ajout)
          : new Date(0),
      }));

      // Le loader est supprimé à l'intérieur de renderGrid via .innerHTML = ''
      if (pageType === "index") {
        currentSortType = "likes-desc";
        sortMemes("likes-desc");
      } else {
        currentSortType = "name-asc";
        sortMemes("name-asc");
      }

      initialiserMenuTri((type) => {
        currentSortType = type;
        sortMemes(type);
      });
      if (typeof initializeSearch === "function") {
        initializeSearch(currentMemesData, (filteredList) => {
          renderGrid(filteredList, false);
        });
      }
    })
    .catch((error) => {
      console.error("Erreur:", error);
      videoGrid.innerHTML =
        '<p style="color: black;">Erreur de chargement des données.</p>';
    });

  // preloadCardMedia() et createSkeletonCards() sont définies dans
  // js/chargement.js ; creerCarteMeme(), trierMemes() et la modale dans
  // js/meme-ui.js (voir <head> de la page).

  function renderGrid(dataList, append = false) {
    if (!append) {
      currentPage = 1;
      activeMemesList = dataList;
    }

    const startIndex = (currentPage - 1) * MEMES_PER_PAGE;
    const endIndex = startIndex + MEMES_PER_PAGE;
    const memesToRender = activeMemesList.slice(startIndex, endIndex);

    if (!append && memesToRender.length === 0) {
      videoGrid.innerHTML = '<p style="color: black">Aucun mème trouvé.</p>';
      return;
    }

    // On affiche des skeletons pendant le préchargement, que ce soit un
    // premier affichage / tri / recherche (on vide et remplace tout)
    // ou un ajout en scrollant (on complète à la suite des cartes
    // déjà affichées, ce qui agrandit scrollHeight immédiatement et
    // empêche le scroll listener de redéclencher un chargement).
    if (!append) {
      videoGrid.innerHTML = "";
    }
    const { fragment, elements: skeletonElements } = createSkeletonCards(
      memesToRender.length
    );
    videoGrid.appendChild(fragment);

    const preloadPromises = [];
    const cardsToInsert = [];

    memesToRender.forEach((mème) => {
      const { carte, mediaPath } = creerCarteMeme(mème);

      // Seule différence avec la page des favoris : ici le cœur AJOUTE le mème
      const favKey =
        pageType === "index" ? `${mème.typeMeme}Favorites` : pageType;
      updateFavoriteButton(
        carte.querySelector(".add-to-favorites"),
        mème,
        favKey
      );

      cardsToInsert.push(carte);
      preloadPromises.push(preloadCardMedia(mème.typeMeme, mediaPath));
    });

    Promise.all(preloadPromises).then(() => {
      // On insère chaque vraie carte juste avant le premier skeleton,
      // puis on retire les skeletons. Fonctionne aussi bien pour un
      // remplacement complet (skeletons = toute la grille) que pour un
      // ajout en fin de grille (skeletons = seulement les nouvelles cartes).
      const referenceNode = skeletonElements[0] || null;
      cardsToInsert.forEach((card) =>
        videoGrid.insertBefore(card, referenceNode)
      );
      skeletonElements.forEach((el) => el.remove());

      isFetching = false;
    });
  }

  window.addEventListener("scroll", () => {
    // On récupère les dimensions réelles et fiables du document
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const scrollHeight = document.documentElement.scrollHeight;

    // Si on est à moins de 200 pixels du VRAI bas de la page
    if (windowHeight + scrollTop >= scrollHeight - 200) {
      if (
        !isFetching &&
        currentPage * MEMES_PER_PAGE < activeMemesList.length
      ) {
        isFetching = true;
        currentPage++;
        renderGrid(activeMemesList, true);
      }
    }
  });

  function sortMemes(type) {
    trierMemes(currentMemesData, type);
    renderGrid(currentMemesData, false);
  }

  function updateFavoriteButton(button, mèmeData, favoritesKey) {
    let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
    let isFavorite =
      favoritesKey === "audioFavorites"
        ? favorites.includes(mèmeData.title)
        : favorites.some((fav) => fav.title === mèmeData.title);

    button.innerHTML = `<img src="${ isFavorite ? "/image/icones/favoris_cliquer.png" : "/image/icones/favoris.png" }" alt="Favoris Icon">`;
    button.onclick = (e) => {
      e.stopPropagation(); // Empêche le clic de remonter jusqu'à la carte (et donc d'ouvrir la modale)
      toggleFavorite(button, mèmeData, favoritesKey);
    };
  }

  async function toggleFavorite(button, mèmeData, favoritesKey) {
    let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
    let isFavorite =
      favoritesKey === "audioFavorites"
        ? favorites.includes(mèmeData.title)
        : favorites.some((fav) => fav.title === mèmeData.title);

    let action = isFavorite ? "remove" : "add";

    if (isFavorite) {
      favorites =
        favoritesKey === "audioFavorites"
          ? favorites.filter((t) => t !== mèmeData.title)
          : favorites.filter((f) => f.title !== mèmeData.title);
    } else {
      favorites.push(
        favoritesKey === "audioFavorites" ? mèmeData.title : mèmeData
      );
    }
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));

    try {
      const res = await fetch(
        `/.netlify/functions/like-meme?id=${encodeURIComponent( mèmeData.title )}&action=${action}`
      );
      const data = await res.json();

      const memeInList = currentMemesData.find(
        (m) => m.title === mèmeData.title
      );
      if (memeInList && data.nouveauxLikes !== undefined) {
        memeInList.likes = data.nouveauxLikes;

        if (currentSortType.includes("likes")) {
          sortMemes(currentSortType);
        } else {
          const countSpan = document.getElementById(
            getIdCompteur(mèmeData.title)
          );
          if (countSpan) countSpan.textContent = data.nouveauxLikes;
          const img = button.querySelector("img");
          img.src = !isFavorite
            ? "/image/icones/favoris_cliquer.png"
            : "/image/icones/favoris.png";
        }
      }
    } catch (e) {
      console.error("Erreur DB:", e);
    }
  }
});