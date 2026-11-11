/*
 * Kirana Konnect - edit a product (name, prices, low-stock level, barcode,
 * expiry, GST %, HSN) in a bottom sheet. Before this there was no way to
 * change a product's price or name after adding it.
 * Usage: KKEditProduct(productId)  -> saves with PUT /api/products/<id>, reloads.
 */
(function () {
    'use strict';
    function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function t(s) { return (window.KK && KK.t) ? KK.t(s) : s; }
    var CSS = '.kkpe-wrap{position:fixed;inset:0;z-index:2147483004;background:rgba(0,0,0,.45);display:flex;align-items:flex-end}' +
        '.kkpe{background:#fff;color:#1F2933;width:100%;max-height:92vh;overflow:auto;border-radius:18px 18px 0 0;padding:18px 16px calc(20px + env(safe-area-inset-bottom,0px));font:16px/1.4 Inter,system-ui,sans-serif}' +
        '.kkpe h3{margin:0 0 6px;font-size:19px}.kkpe label{display:block;font-weight:600;font-size:14px;margin:10px 0 4px}' +
        '.kkpe input,.kkpe select{width:100%;box-sizing:border-box;font-size:17px;padding:12px;border:1px solid #9AA5B1;border-radius:12px;background:#fff;color:#1F2933}' +
        '.kkpe .two{display:flex;gap:8px}.kkpe .two>div{flex:1;min-width:0}' +
        '.kkpe .b{width:100%;min-height:52px;border:0;border-radius:12px;font-weight:700;font-size:16px;margin-top:12px}' +
        '.kkpe .p{background:#2E7D32;color:#fff}.kkpe .s{background:#EEF2EE;color:#1F2933}.kkpe .err{color:#B71C1C;min-height:20px;margin:8px 0 0;font-size:14px}';
    function toIso(ddmmyyyy) {
        var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy || '');
        return m ? m[3] + '-' + m[2] + '-' + m[1] : '';
    }
    window.KKEditProduct = function (id) {
        if (!document.getElementById('kkpe-css')) { var st = document.createElement('style'); st.id = 'kkpe-css'; st.textContent = CSS; document.head.appendChild(st); }
        fetch('/api/products/' + encodeURIComponent(id), { credentials: 'same-origin', cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                if (!d.success) { KK.toast(d.error || 'Product not found', 'error'); return; }
                var p = d.product, kg = !!p.is_weight_based, price = kg ? (p.price_per_kg || p.price) : p.price;
                var w = document.createElement('div');
                w.className = 'kkpe-wrap'; w.setAttribute('role', 'dialog');
                var gstOpts = [['', 'Not set'], ['0', '0% (exempt)'], ['5', '5%'], ['12', '12%'], ['18', '18%'], ['28', '28%']].map(function (o) {
                    return '<option value="' + o[0] + '"' + (String(p.gst_rate == null ? '' : p.gst_rate) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
                }).join('');
                w.innerHTML = '<form class="kkpe" autocomplete="off"><h3>' + esc(t('Edit product')) + '</h3>' +
                    '<label for="pe-name">' + esc(t('Name')) + '</label><input id="pe-name" maxlength="100" required value="' + esc(p.name) + '">' +
                    '<div class="two"><div><label for="pe-price">' + esc(t('Selling price')) + ' (₹' + (kg ? '/kg' : '') + ')</label><input id="pe-price" inputmode="decimal" required value="' + esc(price) + '"></div>' +
                    '<div><label for="pe-cost">' + esc(t('Buying price')) + ' (₹' + (kg ? '/kg' : '') + ')</label><input id="pe-cost" inputmode="decimal" value="' + esc(p.cost_price || '') + '"></div></div>' +
                    '<div class="two"><div><label for="pe-low">' + esc(t('Low-stock alert at')) + '</label><input id="pe-low" inputmode="decimal" value="' + esc(p.reorder_level) + '"></div>' +
                    '<div><label for="pe-exp">' + esc(t('Expiry date')) + '</label><input id="pe-exp" type="date" value="' + esc(toIso(p.expiry_date)) + '"></div></div>' +
                    '<label for="pe-bar">' + esc(t('Barcode')) + '</label><input id="pe-bar" inputmode="numeric" maxlength="50" value="' + esc(p.barcode || '') + '">' +
                    '<div class="two"><div><label for="pe-gst">GST %</label><select id="pe-gst">' + gstOpts + '</select></div>' +
                    '<div><label for="pe-hsn">HSN code</label><input id="pe-hsn" inputmode="numeric" maxlength="12" value="' + esc(p.hsn_code || '') + '"></div></div>' +
                    '<p class="err" role="alert"></p><button class="b p" type="submit">' + esc(t('Save changes')) + '</button>' +
                    '<button class="b s" type="button" data-close>' + esc(t('Cancel')) + '</button></form>';
                w.addEventListener('click', function (e) { if (e.target === w || e.target.closest('[data-close]')) w.remove(); });
                document.body.appendChild(w);
                var q = function (sel) { return w.querySelector(sel); }, saving = false;
                q('form').addEventListener('submit', function (e) {
                    e.preventDefault();
                    if (saving) return;
                    var price = parseFloat(q('#pe-price').value), cost = parseFloat(q('#pe-cost').value || 0), low = parseFloat(q('#pe-low').value || 0);
                    if (!q('#pe-name').value.trim()) { q('.err').textContent = t('Enter the product name.'); return; }
                    if (!(price > 0)) { q('.err').textContent = t('Enter a selling price more than ₹0.'); return; }
                    if (cost > price && !confirm(t('Buying price is more than selling price. Save anyway?'))) return;
                    var body = { name: q('#pe-name').value.trim(), price: price, cost_price: cost || 0, reorder_level: low >= 0 ? low : 0,
                                 barcode: q('#pe-bar').value.trim(), expiry_date: q('#pe-exp').value || null,
                                 gst_rate: q('#pe-gst').value === '' ? null : parseFloat(q('#pe-gst').value), hsn_code: q('#pe-hsn').value.trim() };
                    if (kg) body.price_per_kg = price;
                    saving = true; q('.p').disabled = true;
                    fetch('/api/products/' + encodeURIComponent(id), { method: 'PUT', credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
                        .then(function (res) {
                            if (res.ok && res.d.success) { w.remove(); KK.toast(t('Product saved.'), 'ok'); setTimeout(function () { location.reload(); }, 300); }
                            else { q('.err').textContent = res.d.error || t('Could not save. Please try again.'); saving = false; q('.p').disabled = false; }
                        })
                        .catch(function () { q('.err').textContent = t('No internet. Product was NOT saved.'); saving = false; q('.p').disabled = false; });
                });
            })
            .catch(function () { KK.toast(t('No internet. Please try again.'), 'error'); });
    };
})();
