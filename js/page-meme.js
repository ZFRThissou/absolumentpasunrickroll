/*
 * page-meme.js : le bouton « Partager » des pages individuelles de mèmes.
 * La fonction shareVideo() vient de partager.js (chargé juste avant) : on la
 * réutilise au lieu de la réécrire. Le titre est lu dans l'attribut data-titre
 * du bouton, ce qui évite d'injecter du texte dans du JavaScript.
 */
// Cas particulier du bouton Retour : si on ouvre la modale d'un mème dans la
// grille (le site ajoute alors /meme/nom à l'historique), puis qu'on clique sur
// « Ouvrir la page » ou qu'on fait F5, le navigateur remplace cette entrée par
// la vraie page. En revenant en arrière, il croit alors rester sur le même
// document : il change l'adresse (en « / ») mais ne recharge RIEN, et on voit
// encore cette page sous une mauvaise adresse. On recharge donc nous-mêmes
// dès que l'adresse ne correspond plus à la page affichée.
const cheminDeCettePage = window.location.pathname;
window.addEventListener('popstate', function () {
    if (window.location.pathname !== cheminDeCettePage) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var bouton = document.getElementById('bouton-partager');
    if (!bouton) return;

    bouton.addEventListener('click', function () {
        shareVideo(window.location.href, bouton.dataset.titre);
    });
});
