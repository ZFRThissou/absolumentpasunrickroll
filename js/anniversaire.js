// ============================================================
// EASTER EGG : anniversaire du site (23 janvier)
// On interroge une API externe pour connaître la date du jour,
// plutôt que de faire confiance à l'horloge de l'appareil du
// visiteur (fuseau horaire différent, horloge mal réglée, etc.).
// ============================================================

const BIRTHDAY_MONTH = 1;  // janvier
const BIRTHDAY_DAY = 23;

const RICKROLL_ASSETS = {
    video: 'image/rickroll.mp4',
    audio: 'image/rickroll.mp3',
    image: 'image/rickroll.jpg'
};

// On expose une promesse que les autres scripts peuvent "attendre"
// avant d'ouvrir une modale, pour être sûrs d'avoir la réponse au
// moment où l'utilisateur clique sur un mème.
window.birthdayCheckPromise = (async function checkSiteBirthday() {
    try {
        const res = await fetch('https://timeapi.io/api/time/current/zone?timeZone=Europe/Paris');
        if (!res.ok) throw new Error('Réponse API invalide');
        const data = await res.json();
        window.IS_SITE_BIRTHDAY = (data.month === BIRTHDAY_MONTH && data.day === BIRTHDAY_DAY);
    } catch (err) {
        // Si l'API externe est injoignable (hors ligne, panne, etc.), on se
        // rabat sur l'horloge locale plutôt que de perdre l'easter egg.
        console.warn("Anniversaire du site : API de date injoignable, repli sur l'horloge locale.", err);
        const now = new Date();
        window.IS_SITE_BIRTHDAY = (now.getMonth() + 1 === BIRTHDAY_MONTH && now.getDate() === BIRTHDAY_DAY);
    }
    return window.IS_SITE_BIRTHDAY;
})();

// Retourne le chemin du "vrai" média, ou celui du rickroll si c'est
// l'anniversaire du site. `type` doit être 'video', 'audio' ou 'image'.
function getBirthdayMediaPath(type, originalPath) {
    if (window.IS_SITE_BIRTHDAY && RICKROLL_ASSETS[type]) {
        return RICKROLL_ASSETS[type];
    }
    return originalPath;
}
