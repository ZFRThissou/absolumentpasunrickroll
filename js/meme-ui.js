// ============================================================
// meme-ui.js : tout ce qui est COMMUN aux pages qui affichent des mèmes
// - generer_contenu.js (accueil, vidéos, audios, images)
// - afficher favoris.js (page des favoris)
//
// Avant, ces deux fichiers contenaient chacun leur propre copie de la
// modale, du tri et de la construction des cartes (jusqu'à 94 % de code
// identique). Un bug corrigé dans l'un restait dans l'autre. Maintenant il
// n'y a qu'UNE version ici, et chaque page garde seulement ce qui lui est
// propre (d'où viennent les données, favoris, défilement infini...).
//
// À charger APRÈS chargement.js et AVANT generer_contenu.js /
// afficher favoris.js.
// ============================================================

// ------------------------------------------------------------
// 1. Chemins des médias
// ------------------------------------------------------------
const DOSSIERS_MEDIA = { video: "vidéos", audio: "audios", image: "images" };

// Le chemin commence par « / » (chemin absolu depuis la racine du site). Sans ça,
// il serait relatif à l'adresse affichée : quand la modale change l'adresse en
// /meme/nom, « image/... » deviendrait « /meme/image/... » (introuvable).
function getMediaPath(type, title, ext) {
  return `/image/mèmes/${DOSSIERS_MEDIA[type]}/${title}.${ext}`;
}

// ------------------------------------------------------------
// 2. Adresses des pages /meme/... (fabriquées au déploiement)
//
// Le "slug" (le morceau d'URL fabriqué à partir du titre) est calculé UNE
// seule fois, par python/generer_pages.py, qui écrit data/slugs.json.
// Ici on se contente de le lire : calculer le slug aussi en JavaScript
// reviendrait à écrire deux fois la même règle, et les deux finiraient par
// ne plus donner le même résultat (un accent, une apostrophe...).
// Si le fichier est absent (test en local sans déploiement), les cartes
// fonctionnent comme avant, simplement sans lien vers la page du mème.
// ------------------------------------------------------------
let slugsMemes = {};

function chargerSlugs() {
  return fetch("data/slugs.json")
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => ({}))
    .then((slugs) => {
      slugsMemes = slugs;
      return slugs;
    });
}

// '/meme/ah-cest-marrant', ou null si on ne connaît pas le slug de ce mème
function getMemeUrl(title) {
  const slug = slugsMemes[title];
  return slug ? "/meme/" + slug : null;
}

// Adresse à partager : la page du mème, sinon l'accueil
function getShareUrl(title) {
  return window.location.origin + (getMemeUrl(title) || "/");
}

// ------------------------------------------------------------
// 3. La carte d'un mème
// ------------------------------------------------------------

// Identifiant du compteur de likes d'une carte (pour le mettre à jour après un clic)
function getIdCompteur(title) {
  return "count-" + title.replace(/\s+/g, "-");
}

function creerMediaVignette(mème, mediaPath) {
  let media;
  if (mème.typeMeme === "video") {
    media = document.createElement("video");
    media.preload = "metadata";
    const source = document.createElement("source");
    source.src = mediaPath;
    media.appendChild(source);
  } else if (mème.typeMeme === "audio") {
    media = document.createElement("button");
    media.className = "button";
    media.textContent = "Play Sound";
    media.dataset.sound = mediaPath;
  } else {
    media = document.createElement("img");
    media.src = mediaPath;
    media.loading = "lazy";
    media.alt = mème.title;
  }
  media.classList.add("open-modal-play");
  return media;
}

// Construit une carte. Retourne { carte, mediaPath }.
// La carte contient une zone vide `.add-to-favorites` : c'est la page qui
// la remplit (cœur "ajouter" sur la grille, cœur "retirer" sur la page des
// favoris), car c'est la seule vraie différence entre les deux cartes.
//
// `mème` doit avoir : title, ext, typeMeme ('video' | 'audio' | 'image'),
// likes, et desc (optionnel).
function creerCarteMeme(mème) {
  const mediaPath = getMediaPath(mème.typeMeme, mème.title, mème.ext);
  const urlPage = getMemeUrl(mème.title);

  const carte = document.createElement("div");
  carte.classList.add("video-card");
  carte.style.cursor = "pointer";

  const media = creerMediaVignette(mème, mediaPath);
  carte.appendChild(media);

  // Contenu fixe (aucun texte venant des données) : innerHTML sans risque.
  const info = document.createElement("div");
  info.className = "video-info";
  info.innerHTML = ` <h3></h3> <div class="video-actions"> <div class="favorite-container"> <div class="add-to-favorites"></div> <span class="like-count"></span> </div> <a class="download-button" download=""><img src="/image/icones/telechargements.png" alt="Download Icon"></a> <img class="partage-button" src="/image/icones/partager.png" alt="Share Icon"> </div> `;
  carte.appendChild(info);

  // Le titre est un VRAI lien vers la page du mème : c'est ce que suivent
  // les moteurs de recherche. On ajoute le texte avec textContent (et non
  // dans le innerHTML ci-dessus) pour qu'un titre contenant < ou & ne
  // puisse jamais casser la page.
  const titre = info.querySelector("h3");
  if (urlPage) {
    const lien = document.createElement("a");
    lien.href = urlPage;
    lien.className = "lien-meme";
    lien.textContent = mème.title;
    titre.appendChild(lien);
  } else {
    titre.textContent = mème.title;
  }

  const compteur = info.querySelector(".like-count");
  compteur.id = getIdCompteur(mème.title);
  compteur.textContent = mème.likes || 0;

  const telechargement = info.querySelector(".download-button");
  telechargement.href = mediaPath;
  telechargement.addEventListener("click", (e) => e.stopPropagation());

  info.querySelector(".partage-button").addEventListener("click", (e) => {
    e.stopPropagation();
    shareVideo(getShareUrl(mème.title), mème.title);
  });

  // Clic sur la vignette : ouvre la modale ET lance la lecture
  media.addEventListener("click", (e) => {
    e.stopPropagation();
    ouvrirModale(mème, mediaPath, true);
  });

  // Clic ailleurs sur la carte : ouvre la modale
  carte.addEventListener("click", (e) => {
    const lien = e.target.closest("a.lien-meme");
    // Ctrl/Cmd/Maj + clic sur le titre : le visiteur veut la vraie page
    // (nouvel onglet), on laisse le navigateur faire.
    if (lien && (e.ctrlKey || e.metaKey || e.shiftKey)) return;
    e.preventDefault(); // un clic simple sur le titre ne quitte pas la grille
    ouvrirModale(mème, mediaPath, false);
  });

  return { carte, mediaPath };
}

// ------------------------------------------------------------
// 4. Le tri
// ------------------------------------------------------------
function trierMemes(liste, type) {
  switch (type) {
    case "name-asc":
      liste.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "name-desc":
      liste.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "likes-desc":
      liste.sort((a, b) => b.likes - a.likes);
      break;
    case "likes-asc":
      liste.sort((a, b) => a.likes - b.likes);
      break;
    case "date-desc":
      liste.sort((a, b) => b.date - a.date);
      break;
    case "date-asc":
      liste.sort((a, b) => a.date - b.date);
      break;
    case "duration-desc":
      liste.sort((a, b) => b.duree - a.duree);
      break;
    case "duration-asc":
      liste.sort((a, b) => a.duree - b.duree);
      break;
  }
}

// Branche le bouton "Trier par" et son menu. `onTri(type)` est appelée
// quand le visiteur choisit une option.
function initialiserMenuTri(onTri) {
  const bouton = document.getElementById("sort-button");
  const menu = document.getElementById("sort-menu");
  if (!bouton || !menu) return;

  bouton.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("active");
  });

  document.querySelectorAll(".sort-option").forEach((option) => {
    option.addEventListener("click", () => {
      menu.classList.remove("active");
      onTri(option.getAttribute("data-sort"));
    });
  });

  // Un clic n'importe où ailleurs referme le menu. On utilise
  // addEventListener : l'ancienne version écrivait `window.onclick = ...`,
  // et la modale écrasait cette ligne (le menu ne se refermait plus après
  // avoir ouvert un mème).
  document.addEventListener("click", () => menu.classList.remove("active"));
}

// ------------------------------------------------------------
// 5. La modale
//
// L'adresse change (pushState) quand la modale s'ouvre : /meme/nom-du-meme.
// Pour la fermer on fait "retour arrière" (history.back) au lieu d'ajouter
// une nouvelle entrée à l'historique : le bouton Retour du navigateur et la
// croix font alors exactement la même chose, et l'historique reste propre.
// ------------------------------------------------------------
const DESCRIPTIONS_ABSENTES = [
  "La description n'est pas encore disponible.",
  "Traquille ça arrive (dans 1 an environ).",
  "Bon tu vois bien que y'a pas de description mais ça arrive.",
  "Je suis pas sûr mais je crois que y'a pas de description après elle viendra peut être mais bon avec un site aussi grand et beaucoup de description a faire je sais pas si c'est avec elle que je vait commencer après je suis quasiment sûr que avant la fin de l'année il y aura une description mais quasiment.",
  "Message de la france non.",
  "En faite non.",
  "Je crois pas nannnn.",
];

let modaleOuverte = false;
let fermetureDemandee = false;

function fermerAffichageModale() {
  const modale = document.getElementById("meme-modal");
  const conteneur = document.getElementById("modal-media-container");
  const audioGlobal = document.getElementById("audio");

  modale.style.display = "none";
  conteneur.innerHTML = "";
  if (audioGlobal) audioGlobal.pause();
  document.body.style.overflow = "";
  modaleOuverte = false;
  fermetureDemandee = false;
}

function demanderFermetureModale() {
  if (!modaleOuverte || fermetureDemandee) return; // évite un double "retour" si on clique deux fois
  fermetureDemandee = true;
  history.back(); // déclenche l'événement popstate (plus bas) qui ferme vraiment la modale
  // Filet de sécurité : si le navigateur ne répond pas, on ferme quand même.
  setTimeout(() => {
    if (modaleOuverte) fermerAffichageModale();
  }, 600);
}

// play() renvoie une promesse qui est REFUSÉE si le navigateur bloque la
// lecture automatique, ou si on ferme la modale (pause) juste après
// l'ouverture. Sans .catch, la console affiche une erreur "Uncaught (in promise)".
function jouerSansErreur(element) {
  const promesse = element.play();
  if (promesse) promesse.catch(() => {});
}

function afficherMediaModale(conteneur, type, mediaPath, jouer) {
  const audioGlobal = document.getElementById("audio");

  if (type === "video") {
    const video = document.createElement("video");
    video.src = mediaPath;
    video.controls = true;
    conteneur.appendChild(video);
    if (jouer) jouerSansErreur(video);
  } else if (type === "image") {
    const img = document.createElement("img");
    img.src = mediaPath;
    img.alt = "";
    conteneur.appendChild(img);
  } else if (type === "audio") {
    const boutonLecture = document.createElement("button");
    boutonLecture.className = "button";
    boutonLecture.textContent = "Play Sound";
    conteneur.appendChild(boutonLecture);
    if (audioGlobal) {
      boutonLecture.onclick = () => {
        audioGlobal.src = mediaPath;
        audioGlobal.currentTime = 0;
        jouerSansErreur(audioGlobal);
      };
      if (jouer) {
        audioGlobal.src = mediaPath;
        jouerSansErreur(audioGlobal);
      }
    }
  }
}

// Lien "Ouvrir la page de ce mème", créé la première fois qu'on en a besoin
function getLienPageModale() {
  let lien = document.getElementById("modal-lien-page");
  if (!lien) {
    lien = document.createElement("a");
    lien.id = "modal-lien-page";
    lien.className = "modal-lien-page";
    lien.textContent = "Ouvrir la page de ce mème";
    document.querySelector("#meme-modal .modal-info").appendChild(lien);
  }
  return lien;
}

async function ouvrirModale(mème, mediaPath, jouer) {
  if (modaleOuverte) return;
  modaleOuverte = true;

  // Easter egg : le 23 janvier (anniversaire du site), on attend de
  // savoir si l'API de date a répondu, puis on remplace le média par
  // le rickroll, peu importe le mème réellement cliqué.
  if (window.birthdayCheckPromise) {
    await window.birthdayCheckPromise;
  }
  if (typeof getBirthdayMediaPath === "function") {
    mediaPath = getBirthdayMediaPath(mème.typeMeme, mediaPath);
  }

  const modale = document.getElementById("meme-modal");
  const conteneur = document.getElementById("modal-media-container");
  const urlPage = getMemeUrl(mème.title);

  // Sans slug on garde l'adresse actuelle : on ajoute quand même une entrée
  // d'historique, car la fermeture fait toujours "retour arrière".
  history.pushState({ modale: true }, "", urlPage || window.location.href);

  modale.style.display = "block";
  document.body.style.overflow = "hidden";
  document.getElementById("modal-title").textContent = mème.title;
  conteneur.innerHTML = "";

  document.getElementById("modal-description").textContent =
    window.IS_SITE_BIRTHDAY
      ? "🎉 Joyeux anniversaire au site ! Tu ne pensais quand même pas y échapper aujourd'hui..."
      : mème.desc
      ? mème.desc
      : descriptionAbsenteAleatoire();

  const lienPage = getLienPageModale();
  lienPage.hidden = !urlPage;
  if (urlPage) lienPage.href = urlPage;

  afficherMediaModale(conteneur, mème.typeMeme, mediaPath, jouer);
}

function descriptionAbsenteAleatoire() {
  return DESCRIPTIONS_ABSENTES[
    Math.floor(Math.random() * DESCRIPTIONS_ABSENTES.length)
  ];
}

// Ces écouteurs sont posés UNE seule fois. L'ancienne version en ajoutait
// un nouveau (Échap) à chaque ouverture de modale, sans toujours le retirer.
document.addEventListener("DOMContentLoaded", function () {
  const modale = document.getElementById("meme-modal");
  if (!modale) return;

  const croix = modale.querySelector(".close-modal");
  if (croix) croix.addEventListener("click", demanderFermetureModale);

  modale.addEventListener("click", (e) => {
    if (e.target === modale) demanderFermetureModale(); // clic sur le fond sombre
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") demanderFermetureModale();
});

// Le bouton Retour (ou history.back() ci-dessus) arrive ici.
window.addEventListener("popstate", () => {
  if (modaleOuverte) {
    fermerAffichageModale();
  } else if (window.location.pathname.startsWith("/meme/")) {
    // Bouton "Avancer" vers une adresse de modale déjà fermée : on charge
    // la vraie page de ce mème plutôt que d'afficher la grille sous une
    // adresse qui n'est pas la sienne.
    window.location.reload();
  }
});