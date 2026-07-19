// Kirana Konnect - Android shell loader.
// Waits for Cordova, checks connectivity, then hands the WebView over to the
// hosted web app defined in js/config.js (window.APP_CONFIG.APP_URL).

(function () {
    'use strict';

    var APP_URL = (window.APP_CONFIG && window.APP_CONFIG.APP_URL) || '';

    function el(id) { return document.getElementById(id); }

    function showOffline() {
        el('splash').classList.add('hidden');
        el('offline').classList.remove('hidden');
    }

    function showLoading(msg) {
        el('offline').classList.add('hidden');
        el('splash').classList.remove('hidden');
        if (msg) { el('status').textContent = msg; }
    }

    function isOnline() {
        // navigator.onLine is reliable enough inside the Android WebView.
        return typeof navigator.onLine === 'undefined' ? true : navigator.onLine;
    }

    function launch() {
        if (!APP_URL || APP_URL.indexOf('REPLACE-WITH-YOUR') !== -1) {
            el('status').textContent =
                'App URL not set. Edit www/js/config.js (APP_URL) and rebuild.';
            el('spinner').classList.add('hidden');
            return;
        }
        if (!isOnline()) {
            showOffline();
            return;
        }
        showLoading('Connecting to your store…');
        // Hand the WebView over to the hosted app.
        window.location.replace(APP_URL);
    }

    function onDeviceReady() {
        // Retry button re-checks connectivity and relaunches.
        el('retry').addEventListener('click', function () {
            showLoading('Loading…');
            setTimeout(launch, 300);
        });

        // If connectivity returns while on the offline screen, auto-retry.
        document.addEventListener('online', function () {
            if (!el('offline').classList.contains('hidden')) { launch(); }
        }, false);

        launch();
    }

    // Use Cordova's deviceready when available; fall back to DOM ready for
    // browser testing (cordova.js absent).
    if (window.cordova) {
        document.addEventListener('deviceready', onDeviceReady, false);
    } else {
        document.addEventListener('DOMContentLoaded', onDeviceReady, false);
    }
})();
