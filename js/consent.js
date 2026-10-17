/*
 * consent.js — consentement cookies + Google Analytics + Google AdSense
 *
 * À charger EN PREMIER dans le <head>, en script classique (pas de async/defer) :
 *   <script src="js/consent.js"></script>                           (avec pub)
 *   <script src="js/consent.js" data-adsense="false"></script>      (sans pub, ex. contacter)
 *
 * Ordre d'exécution (important) :
 *   1. on déclare le consentement par défaut (refusé dans l'EEE/UK/CH)
 *   2. on charge le CMP de Google (via AdSense, ou Funding Choices sans pub)
 *   3. on charge Google Analytics
 */
(function () {
    'use strict';

    // ---- Configuration -------------------------------------------------
    var GA_ID = 'G-3QJVPT21ZK';
    var ADSENSE_CLIENT = 'ca-pub-7071777313496372';

    // Pays où le refus par défaut est obligatoire (EEE + Royaume-Uni + Suisse)
    var REGIONS_CONSENTEMENT = [
        'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
        'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
        'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH'
    ];

    // ---- Lecture de l'option data-adsense sur la balise <script> -------
    // document.currentScript = la balise <script> en cours d'exécution
    var balise = document.currentScript;
    var avecPub = !(balise && balise.getAttribute('data-adsense') === 'false');

    // ---- 1. Consent Mode : état par défaut -----------------------------
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); } // doit pousser "arguments"
    window.gtag = gtag;

    gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        region: REGIONS_CONSENTEMENT,
        wait_for_update: 500 // laisse 500 ms au CMP pour envoyer le choix mémorisé
    });
    // Hors des régions ci-dessus, Google considère le consentement comme accordé.

    // ---- petit utilitaire pour injecter un script ----------------------
    function chargerScript(src, extra) {
        var s = document.createElement('script');
        s.async = true;
        s.src = src;
        if (extra) {
            Object.keys(extra).forEach(function (k) { s.setAttribute(k, extra[k]); });
        }
        document.head.appendChild(s);
    }

    // ---- 2. CMP de Google ----------------------------------------------
    if (avecPub) {
        // AdSense : le message de consentement configuré dans
        // AdSense > Confidentialité et messagerie s'affiche via ce script.
        chargerScript(
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT,
            { crossorigin: 'anonymous' }
        );
    } else {
        // Page sans pub : on charge seulement le message de consentement
        // (Funding Choices) pour que le visiteur puisse choisir pour Analytics.
        chargerScript('https://fundingchoicesmessages.google.com/i/pub-7071777313496372?ers=1');
    }

    // ---- 3. Google Analytics -------------------------------------------
    chargerScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
    gtag('js', new Date());
    gtag('config', GA_ID);

    // ---- Bouton « Gérer mes cookies » (retrait du consentement) --------
    // À appeler depuis un lien : <a href="#" onclick="ouvrirChoixCookies(); return false;">
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.ouvrirChoixCookies = function () {
        window.googlefc.callbackQueue.push({
            CONSENT_DATA_READY: function () {
                try { window.googlefc.showRevocationMessage(); } catch (e) { /* message de révocation non activé */ }
            }
        });
    };
})();
