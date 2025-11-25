function shareVideo(videoUrl, videoTitle) {
    if (navigator.share) {
        navigator.share({
            title: videoTitle,
            text: `Regarde cette vidéo : ${videoTitle}`,
            url: videoUrl
        })
        .then(() => console.log('Partagé avec succès'))
        .catch(error => console.error('Erreur de partage', error));
    } else {
        navigator.clipboard.writeText(window.location.origin + '/' + videoUrl)
            .then(() => alert('Lien copié dans le presse-papier !'))
            .catch(err => alert("Impossible de copier le lien : " + err));
    }
}
