/*
 * Kirana Konnect - one barcode scanner for every screen.
 *
 * Tap the Scan button in the bottom bar (or any old openScanner() button):
 *   camera opens -> barcode read (phone's built-in BarcodeDetector when
 *   available, ZXing otherwise) -> short vibration -> the product sheet shows
 *   name, price and stock with "Add to bill", "Open" and "Refill". Unknown
 *   barcode -> "Add new product" with the barcode filled in.
 * A page can take the scanned code itself (e.g. Add Item fills its barcode
 * box) by setting window.KK_SCAN_TARGET = function (code) { ... }.
 * Manual entry and torch are in the same sheet. Camera is always released.
 */
(function () {
    'use strict';
    var t = function (s) { return (window.KK && KK.t) ? KK.t(s) : s; };
    var stream = null, reader = null, loop = null, busy = false, root = null;

    function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function inr(n) {
        var v = Number(n || 0), frac = Math.round(v * 100) % 100 !== 0;
        return '₹' + v.toLocaleString('en-IN', frac ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 });
    }
    function toast(m, k) { if (window.KK && KK.toast) KK.toast(m, k); }

    var CSS = '#kk-scan{position:fixed;inset:0;z-index:2147483003;background:#000;display:flex;flex-direction:column;font:16px Inter,system-ui,sans-serif;color:#fff}' +
        '#kk-scan video{flex:1;width:100%;object-fit:cover;min-height:0}' +
        '#kk-scan .bar{display:flex;justify-content:space-between;align-items:center;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;background:rgba(0,0,0,.55);position:absolute;left:0;right:0;top:0}' +
        '#kk-scan .btn{min-width:48px;min-height:48px;border:0;border-radius:24px;background:rgba(255,255,255,.15);color:#fff;font-size:20px}' +
        '#kk-scan .frame{position:absolute;left:12%;right:12%;top:34%;height:22%;border:3px solid #4CAF50;border-radius:14px;box-shadow:0 0 0 9999px rgba(0,0,0,.35)}' +
        '#kk-scan .bottom{position:absolute;left:0;right:0;bottom:0;padding:14px 16px calc(16px + env(safe-area-inset-bottom,0px));background:rgba(0,0,0,.65)}' +
        '#kk-scan .status{text-align:center;margin-bottom:10px;font-weight:600}' +
        '#kk-scan form{display:flex;gap:8px}#kk-scan input{flex:1;min-width:0;font-size:18px;padding:12px;border-radius:12px;border:0;color:#111}' +
        '#kk-scan form button{min-height:48px;padding:0 16px;border:0;border-radius:12px;background:#4CAF50;color:#fff;font-weight:700}' +
        '.kk-sheet-wrap{position:fixed;inset:0;z-index:2147483004;background:rgba(0,0,0,.45);display:flex;align-items:flex-end}' +
        '.kk-sheet{background:#fff;color:#1F2933;width:100%;border-radius:18px 18px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));font:16px/1.4 Inter,system-ui,sans-serif;animation:kkUp .18s ease-out}' +
        '@keyframes kkUp{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}' +
        '.kk-sheet h3{margin:0;font-size:19px}.kk-sheet .muted{color:#52606D;font-size:14px}' +
        '.kk-row{display:flex;gap:10px;margin-top:14px}.kk-row>*{flex:1}' +
        '.kk-b{min-height:50px;border-radius:12px;border:0;font-weight:700;font-size:16px}' +
        '.kk-b.p{background:#2E7D32;color:#fff}.kk-b.s{background:#EEF2EE;color:#1F2933}' +
        '.kk-qty{display:flex;align-items:center;gap:10px;margin-top:14px}.kk-qty button{width:52px;height:52px;border-radius:12px;border:1px solid #CBD2D9;background:#fff;font-size:24px}' +
        '.kk-qty input{flex:1;min-width:0;text-align:center;font-size:22px;padding:10px;border:1px solid #CBD2D9;border-radius:12px}' +
        '.kk-chips{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.kk-chips button{min-height:40px;padding:0 14px;border-radius:20px;border:1px solid #A5D6A7;background:#F1F8F1}';

    function ensureCss() {
        if (document.getElementById('kk-scan-css')) return;
        var s = document.createElement('style'); s.id = 'kk-scan-css'; s.textContent = CSS; document.head.appendChild(s);
    }

    function loadZXing() {
        return new Promise(function (res, rej) {
            if (window.ZXing) return res();
            var s = document.createElement('script');
            s.src = '/static/vendor/js/zxing.min.js'; s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
    }

    function stop() {
        if (loop) { clearInterval(loop); loop = null; }
        if (reader) { try { reader.reset(); } catch (e) {} reader = null; }
        if (stream) { stream.getTracks().forEach(function (tr) { tr.stop(); }); stream = null; }
        if (root) { root.remove(); root = null; }
        document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') stop(); }

    function status(msg) { var s = root && root.querySelector('.status'); if (s) s.textContent = t(msg); }

    function found(code) {
        if (busy || !code) return;
        busy = true;
        try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
        stop();
        busy = false;
        if (typeof window.KK_SCAN_TARGET === 'function') { window.KK_SCAN_TARGET(code); return; }
        showProduct(code);
    }

    function open() {
        stop(); ensureCss();
        root = el('<div id="kk-scan" role="dialog" aria-label="Scan barcode">' +
            '<video playsinline muted></video><div class="frame"></div>' +
            '<div class="bar"><button class="btn kk-close" aria-label="Close">✕</button>' +
            '<b>' + esc(t('Scan Barcode')) + '</b><button class="btn kk-torch" aria-label="Torch">🔦</button></div>' +
            '<div class="bottom"><div class="status">' + esc(t('Starting camera...')) + '</div>' +
            '<form class="kk-manual"><input inputmode="numeric" placeholder="' + esc(t('Or type the barcode')) + '" aria-label="Barcode">' +
            '<button type="submit">' + esc(t('Search')) + '</button></form></div></div>');
        document.body.appendChild(root);
        document.addEventListener('keydown', onKey);
        root.querySelector('.kk-close').onclick = stop;
        root.querySelector('.kk-manual').onsubmit = function (e) {
            e.preventDefault(); found(this.querySelector('input').value.replace(/\s/g, ''));
        };
        var video = root.querySelector('video');
        root.querySelector('.kk-torch').onclick = function () {
            var tr = stream && stream.getVideoTracks()[0];
            if (!tr || !tr.getCapabilities || !tr.getCapabilities().torch) { toast(t('Torch not available on this phone'), 'error'); return; }
            var on = !tr.getSettings().torch;
            tr.applyConstraints({ advanced: [{ torch: on }] }).catch(function () {});
        };
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            status('Camera not available - type the barcode below'); return;
        }
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
            .then(function (s) {
                if (!root) { s.getTracks().forEach(function (tr) { tr.stop(); }); return; }
                stream = s; video.srcObject = s; video.play().catch(function () {});
                status('Point the camera at the barcode');
                if ('BarcodeDetector' in window) {
                    var det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
                    loop = setInterval(function () {
                        if (video.readyState < 2) return;
                        det.detect(video).then(function (codes) { if (codes && codes[0]) found(codes[0].rawValue); }).catch(function () {});
                    }, 250);
                } else {
                    loadZXing().then(function () {
                        if (!root) return;
                        reader = new window.ZXing.BrowserMultiFormatReader();
                        reader.decodeFromVideoElementContinuously
                            ? reader.decodeFromVideoElementContinuously(video, function (r) { if (r) found(r.text); })
                            : reader.decodeFromStream(s, video, function (r) { if (r) found(r.text); });
                    }).catch(function () { status('Scanner could not start - type the barcode below'); });
                }
            })
            .catch(function () { status('Camera permission denied - type the barcode below'); });
    }

    // ----------------------------------------------------------- product sheet
    function sheet(html) {
        ensureCss();
        var w = el('<div class="kk-sheet-wrap" role="dialog"><div class="kk-sheet">' + html + '</div></div>');
        w.addEventListener('click', function (e) { if (e.target === w) w.remove(); });
        document.body.appendChild(w);
        return w;
    }
    function addToBill(p, qty) {
        var cart = [];
        try { cart = JSON.parse(localStorage.getItem('kiranakonnect_cart') || '[]'); } catch (e) {}
        var price = p.is_weight_based ? (p.price_per_kg || p.price) : p.price;
        cart.push({ product_id: p.id, id: p.id, name: p.name, quantity: qty,
                    unit: p.is_weight_based ? 'Kg' : 'Piece', price: Math.round(price * qty * 100) / 100,
                    isWeightBased: !!p.is_weight_based, unit_price: price });
        localStorage.setItem('kiranakonnect_cart', JSON.stringify(cart));
        if (window.KKNav) KKNav.refreshBadge();
    }
    function showProduct(code) {
        var w = sheet('<p class="muted">' + esc(t('Barcode')) + ' ' + esc(code) + '</p><h3>' + esc(t('Loading...')) + '</h3>');
        fetch('/api/products?barcode=' + encodeURIComponent(code), { credentials: 'same-origin' })
            .then(function (r) { if (r.status === 401) { location.href = '/signin'; throw 0; } return r.json(); })
            .then(function (d) {
                w.remove();
                var p = d.products && d.products[0];
                if (!p) {
                    var n = sheet('<h3>' + esc(t('New barcode')) + '</h3><p class="muted">' + esc(code) + ' — ' + esc(t('this product is not in your stock yet.')) + '</p>' +
                        '<div class="kk-row"><button class="kk-b s kk-again">' + esc(t('Scan again')) + '</button>' +
                        '<button class="kk-b p kk-new">' + esc(t('Add new product')) + '</button></div>');
                    n.querySelector('.kk-new').onclick = function () { location.href = '/add-item?barcode=' + encodeURIComponent(code); };
                    n.querySelector('.kk-again').onclick = function () { n.remove(); open(); };
                    return;
                }
                var kg = !!p.is_weight_based, unitPrice = kg ? (p.price_per_kg || p.price) : p.price;
                var s = sheet('<h3>' + esc(p.name) + '</h3>' +
                    '<p class="muted">' + inr(unitPrice) + (kg ? ' / kg' : '') + ' · ' + esc(t('Stock')) + ': ' + esc(p.stock_quantity) + (kg ? ' kg' : '') +
                    (p.is_low_stock ? ' · <b style="color:#B71C1C">' + esc(t('Low Stock')) + '</b>' : '') +
                    (p.is_expired ? ' · <b style="color:#B71C1C">' + esc(t('Expired')) + '</b>' : '') + '</p>' +
                    (p.offer_percent ? '<p style="margin:6px 0 0;font-weight:700;color:#E65100">' + esc(t('Expiry offer')) + ' ' + p.offer_percent + '% OFF → ' + inr(unitPrice * (100 - p.offer_percent) / 100) + (kg ? ' / kg' : '') + '</p>' : '') +
                    '<div class="kk-qty"><button class="kk-minus" aria-label="Less">−</button>' +
                    '<input class="kk-q" inputmode="decimal" value="1" aria-label="Quantity"><button class="kk-plus" aria-label="More">+</button></div>' +
                    (kg ? '<div class="kk-chips"><button data-q="0.25">250 g</button><button data-q="0.5">500 g</button><button data-q="1">1 kg</button><button data-q="2">2 kg</button><button data-q="5">5 kg</button></div>' : '') +
                    '<p class="muted kk-total" style="margin-top:10px"></p>' +
                    '<div class="kk-row"><button class="kk-b s kk-open">' + esc(t('Open')) + '</button><button class="kk-b s kk-refill">' + esc(t('Refill')) + '</button></div>' +
                    '<div class="kk-row"><button class="kk-b s kk-next">' + esc(t('Add & scan next')) + '</button><button class="kk-b p kk-add">' + esc(t('Add to bill')) + '</button></div>');
                var q = s.querySelector('.kk-q'), step = kg ? 0.25 : 1;
                function qty() { var v = parseFloat(q.value); return v > 0 ? v : 0; }
                function upd() { s.querySelector('.kk-total').textContent = t('Total') + ': ' + inr(unitPrice * qty() * (100 - (p.offer_percent || 0)) / 100); }
                s.querySelector('.kk-minus').onclick = function () { q.value = Math.max(step, +(qty() - step).toFixed(3)); upd(); };
                s.querySelector('.kk-plus').onclick = function () { q.value = +(qty() + step).toFixed(3); upd(); };
                q.oninput = upd;
                s.querySelectorAll('.kk-chips button').forEach(function (b) { b.onclick = function () { q.value = b.dataset.q; upd(); }; });
                upd();
                s.querySelector('.kk-open').onclick = function () { location.href = (kg ? '/product-details-weight?id=' : '/product-details?id=') + p.id; };
                s.querySelector('.kk-refill').onclick = function () { location.href = (kg ? '/refill-stock-weight?id=' : '/refill-stock?id=') + p.id; };
                function add(next) {
                    if (!qty()) { toast(t('Enter quantity'), 'error'); return; }
                    addToBill(p, qty()); s.remove();
                    toast(p.name + ' ' + t('added to bill'), 'ok');
                    if (next) open(); else if (!/^\/cart/.test(location.pathname)) location.href = '/cart'; else location.reload();
                }
                s.querySelector('.kk-add').onclick = function () { add(false); };
                s.querySelector('.kk-next').onclick = function () { add(true); };
            })
            .catch(function (e) { if (e !== 0) { w.remove(); toast(t('No internet. Please try again.'), 'error'); } });
    }

    window.KKScan = { open: open, close: stop, lookup: showProduct };
    // Old buttons on several screens call these global names.
    window.openScanner = function () { open(); };
    window.closeScanner = stop;
    window.scanBarcode = function () { open(); };
    window.addEventListener('pagehide', stop);
})();
