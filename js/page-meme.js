/*
 * page-meme.js : le bouton « Partager » des pages individuelles de mèmes.
 * La fonction shareVideo() vient de partager.js (chargé juste avant) : on la
 * réutilise au lieu de la réécrire. Le titre est lu dans l'attribut data-titre
 * du bouton, ce qui évite d'injecter du texte dans du JavaScript.
 */
document.addEventListener('DOMContentLoaded', function () {
    var bouton = document.getElementById('bouton-partager');
    if (!bouton) return;

    bouton.addEventListener('click', function () {
        shareVideo(window.location.href, bouton.dataset.titre);
    });
});
