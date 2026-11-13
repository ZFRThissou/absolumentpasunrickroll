// getShareUrl() (l'adresse à partager d'un mème) est dans meme-ui.js.
function shareVideo(videoUrl, videoTitle) {
    if (navigator.share) {
        navigator.share({
            title: videoTitle,
            text: `Regarde ce mème : ${videoTitle}`,
            url: videoUrl
        })
        .then(() => console.log('Partagé avec succès'))
        .catch(error => console.error('Erreur de partage', error));
    } else {
        navigator.clipboard.writeText(videoUrl)
            .then(() => alert('Lien copié dans le presse-papier !'))
            .catch(err => alert("Impossible de copier le lien : " + err));
    }
}
