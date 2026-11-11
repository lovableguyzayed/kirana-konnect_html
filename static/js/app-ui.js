/*
 * Kirana Konnect - shared UI helpers loaded on every screen.
 *
 * 1. In-app messages: window.alert() is replaced by a short toast at the
 *    bottom of the screen (browser pop-ups made the app feel like a website
 *    and blocked the screen). If the page navigates right after the message,
 *    the toast is shown on the next screen instead of being lost.
 *    confirm() stays as it is, because callers rely on its yes/no answer.
 * 2. Offline banner: a clear "No internet" strip when the phone goes offline.
 * 3. Hindi: when the shop owner picks हिंदी, common buttons, headings, menu
 *    labels and messages are shown in Hindi. Data (product and customer
 *    names) is never changed.
 */
(function () {
    'use strict';

    // ---------------------------------------------------------------- Hindi
    var HI = {
        // navigation & common
        'Home': 'होम', 'Inventory': 'सामान', 'Cart': 'कार्ट', 'Profile': 'प्रोफ़ाइल',
        'Settings': 'सेटिंग्स', 'Notifications': 'सूचनाएँ', 'Search': 'खोजें',
        'Cancel': 'रद्द करें', 'Confirm': 'पक्का करें', 'Continue': 'आगे बढ़ें', 'Save': 'सेव करें',
        'Save Changes': 'बदलाव सेव करें', 'Delete': 'हटाएँ', 'Remove': 'हटाएँ', 'Edit': 'बदलें',
        'Close': 'बंद करें', 'Retry': 'फिर कोशिश करें', 'Loading...': 'लोड हो रहा है...',
        'Loading…': 'लोड हो रहा है…', 'All': 'सभी', 'Total': 'कुल', 'Done': 'हो गया',
        'Logout': 'लॉग आउट', 'Language': 'भाषा', 'Preferred Language': 'भाषा चुनें',
        // sign in / sign up
        'Sign In': 'साइन इन', 'Welcome Back!': 'फिर से स्वागत है!',
        'Sign in to your Kirana Konnect account': 'अपने किराना कनेक्ट खाते में साइन इन करें',
        'Phone Number or Email': 'मोबाइल नंबर या ईमेल', 'Password': 'पासवर्ड',
        'Remember me': 'मुझे याद रखें', 'Forgot Password?': 'पासवर्ड भूल गए?',
        'Create Account': 'नया खाता बनाएँ', 'Reset Password': 'पासवर्ड बदलें',
        'Recovery Code': 'रिकवरी कोड', 'New Password': 'नया पासवर्ड',
        'Login with OTP': 'OTP से लॉगिन', 'Send OTP': 'OTP भेजें', 'Verify OTP': 'OTP जाँचें',
        'Full Name': 'पूरा नाम', 'Phone Number': 'मोबाइल नंबर', 'Email': 'ईमेल',
        'Shop Name': 'दुकान का नाम', 'GST Number': 'GST नंबर',
        // dashboard
        'Quick Actions': 'तुरंत काम', 'Payment': 'भुगतान', 'Add Item': 'सामान जोड़ें',
        'Total Sales': 'कुल बिक्री', "Today's Profit": 'आज का मुनाफ़ा', 'Daily Reports': 'रोज़ की रिपोर्ट',
        'Sales, profit & loss analytics': 'बिक्री, मुनाफ़ा और घाटा',
        'Udhar Ledger': 'उधार खाता', 'Customer credit management': 'ग्राहकों का उधार',
        'Low Stock': 'कम स्टॉक', 'Expiring Soon': 'जल्द एक्सपायर', 'Pending Credits': 'बाकी उधार',
        'Items that need restocking': 'जिनका स्टॉक भरना है', 'Recent Transactions': 'हाल के बिल',
        // inventory & products
        'In Stock': 'स्टॉक में', 'Out of Stock': 'स्टॉक ख़त्म', 'Available': 'उपलब्ध', 'Expired': 'एक्सपायर',
        'Add to Cart': 'कार्ट में डालें', 'Add Cart': 'कार्ट में डालें', 'Refill': 'स्टॉक भरें',
        'Refill Stock': 'स्टॉक भरें', 'Add Stock': 'स्टॉक जोड़ें', 'Add New Stock': 'नया स्टॉक जोड़ें',
        'Current Stock': 'अभी का स्टॉक', 'New Total Stock': 'नया कुल स्टॉक',
        'Low Stock Threshold': 'कम स्टॉक की सीमा', 'Additional Quantity': 'कितना और',
        'Total Purchase Price': 'कुल ख़रीद मूल्य', 'Product Details': 'सामान की जानकारी',
        'Purchase Price': 'ख़रीद मूल्य', 'Selling Price': 'बिक्री मूल्य', 'Quantity': 'मात्रा',
        'Price': 'दाम', 'Barcode': 'बारकोड', 'Scan Barcode': 'बारकोड स्कैन करें',
        'Enter Manually': 'ख़ुद लिखें', 'Enter Barcode': 'बारकोड लिखें', 'Expiry Date': 'एक्सपायरी तारीख़',
        'Manufacturing Date': 'बनने की तारीख़', 'No products found': 'कोई सामान नहीं मिला',
        'Unit-Based': 'गिनती वाला', 'Weight-Based': 'वज़न वाला',
        // cart & billing
        'Billing': 'बिल', 'Customer': 'ग्राहक', 'New Customer': 'नया ग्राहक', 'Cash': 'नकद',
        'Online': 'ऑनलाइन', 'Udhar': 'उधार', 'Credit': 'उधार', 'Add Tax': 'GST जोड़ें',
        'Add Offer': 'छूट जोड़ें', 'Subtotal': 'कुल (टैक्स से पहले)', 'Generate Bill': 'बिल बनाएँ',
        'Cart is empty': 'कार्ट ख़ाली है', 'Add More Items to Cart': 'और सामान जोड़ें',
        'Bill No:': 'बिल नंबर:', 'Given after the bill is saved': 'बिल सेव होने पर मिलेगा',
        'Receipt': 'रसीद', 'Download PDF': 'PDF डाउनलोड', 'Share': 'शेयर करें', 'Print': 'प्रिंट',
        // udhar
        'Collect Payment': 'पैसे लें', 'Collect payment': 'पैसे लें', 'View Details': 'पूरा हिसाब',
        'Record Payment': 'भुगतान दर्ज करें', 'Total Outstanding': 'कुल बाकी', 'Customers': 'ग्राहक',
        'Overdue': 'देर हो गई', 'Due Soon': 'जल्द देना है', 'Call': 'कॉल करें', 'Remind': 'याद दिलाएँ',
        'Outstanding Amount': 'बाकी रकम', 'Payment Amount': 'भुगतान रकम', 'History': 'हिसाब',
        'No customers found': 'कोई ग्राहक नहीं मिला', 'Add New Customer': 'नया ग्राहक जोड़ें',
        // reports, profile, settings
        'Sales Report': 'बिक्री रिपोर्ट', 'Staff': 'कर्मचारी', 'Manage Staff': 'कर्मचारी संभालें',
        'Edit Profile': 'प्रोफ़ाइल बदलें', 'Change Password': 'पासवर्ड बदलें',
        'Current Password': 'अभी का पासवर्ड', 'Update Password': 'पासवर्ड अपडेट करें',
        'Help & Support': 'मदद', 'Privacy Policy': 'प्राइवेसी नीति', 'Terms of Service': 'नियम व शर्तें',
        'Delete my shop account': 'मेरा दुकान खाता हटाएँ', 'Export Data': 'डेटा डाउनलोड',
        'Shop Information': 'दुकान की जानकारी', 'Personal Information': 'निजी जानकारी',
        'Notification Settings': 'सूचना सेटिंग्स', 'App Settings': 'ऐप सेटिंग्स',
        'Low Stock Alerts': 'कम स्टॉक की सूचना', 'Expiry Alerts': 'एक्सपायरी की सूचना',
        // messages
        'No internet. Changes may not be saved.': 'इंटरनेट नहीं है। बदलाव सेव नहीं होंगे।',
        'Back online': 'इंटरनेट वापस आ गया',
        'OK': 'ठीक है', 'Staff mode · Unlock': 'स्टाफ़ मोड · खोलें',
        'Enter owner PIN to unlock': 'खोलने के लिए मालिक का PIN डालें',
        'Choose a 4-6 digit owner PIN': '4-6 अंकों का मालिक PIN चुनें', 'Wrong PIN': 'PIN गलत है',
        'Owner PIN needed for that screen.': 'इस स्क्रीन के लिए मालिक का PIN चाहिए।',
        'Staff mode': 'स्टाफ़ मोड',
        'Edit product': 'सामान बदलें', 'Name': 'नाम', 'Selling price': 'बिक्री मूल्य', 'Buying price': 'ख़रीद मूल्य',
        'Low-stock alert at': 'कम स्टॉक की सीमा', 'Expiry date': 'एक्सपायरी तारीख़', 'Save changes': 'बदलाव सेव करें',
        'Product saved.': 'सामान सेव हो गया।', 'Return items': 'माल वापसी', 'Save return': 'वापसी सेव करें',
        'Discount': 'छूट', 'Download full backup': 'पूरा बैकअप डाउनलोड करें',
        'Backup reminder: download a copy of your shop data (Profile → Download full backup).': 'बैकअप याद दिलाना: अपनी दुकान के डेटा की कॉपी डाउनलोड करें (प्रोफ़ाइल → पूरा बैकअप)।',
        'Khata': 'खाता', 'Galla': 'गल्ला', 'Expenses': 'ख़र्चे', 'Suppliers': 'सप्लायर',
        'Cash in the galla': 'गल्ले में नकद', 'Opening cash': 'शुरुआती नकद', 'Cash sales': 'नकद बिक्री',
        'Udhar received (cash)': 'उधार वापस मिला (नकद)', 'Expenses (cash)': 'ख़र्चे (नकद)',
        'Paid to suppliers (cash)': 'सप्लायर को दिया (नकद)', 'Should be in galla': 'गल्ले में होना चाहिए',
        'Other money today': 'आज का बाकी हिसाब', 'UPI / online received': 'UPI / ऑनलाइन मिला', 'Udhar given': 'उधार दिया',
        'Close the day': 'दिन बंद करें', 'Save closing': 'क्लोज़िंग सेव करें', 'Add expense': 'ख़र्चा जोड़ें',
        'Save expense': 'ख़र्चा सेव करें', 'What for?': 'किस लिए?', 'Paid by': 'कैसे दिया', 'Rent': 'किराया',
        'Electricity': 'बिजली', 'Salary': 'तनख़्वाह', 'Transport': 'भाड़ा', 'Tea / Snacks': 'चाय / नाश्ता',
        'Packing': 'पैकिंग', 'Repair': 'मरम्मत', 'Other': 'अन्य', 'This month': 'इस महीने',
        'You owe suppliers': 'सप्लायर को देना है', '+ Add supplier': '+ सप्लायर जोड़ें', 'Add supplier': 'सप्लायर जोड़ें',
        'Save supplier': 'सप्लायर सेव करें', 'Maal liya (purchase)': 'माल लिया', 'Paisa diya (payment)': 'पैसा दिया',
        'Remove supplier': 'सप्लायर हटाएँ', 'Net profit': 'शुद्ध मुनाफ़ा', 'Profit from sales': 'बिक्री से मुनाफ़ा',
        'Send order list on WhatsApp': 'ऑर्डर लिस्ट WhatsApp पर भेजें', 'Save payment': 'भुगतान सेव करें',
        'Closing saved.': 'क्लोज़िंग सेव हो गई।', 'Saved.': 'सेव हो गया।',
        'Stock': 'स्टॉक', 'All Bills': 'सारे बिल', 'bills': 'बिल', 'Today': 'आज', 'Paid': 'भुगतान हुआ',
        'Cancelled': 'रद्द', 'Part paid': 'आंशिक भुगतान', 'Load more': 'और दिखाएँ',
        'No bills here yet': 'अभी कोई बिल नहीं', 'No bills match your search': 'खोज से कोई बिल नहीं मिला',
        'Share on WhatsApp': 'WhatsApp पर भेजें', 'WhatsApp reminder': 'WhatsApp पर याद दिलाएँ',
        'Scan to pay with any UPI app': 'किसी भी UPI ऐप से स्कैन करके भुगतान करें', 'Cancel bill': 'बिल रद्द करें',
        'No internet. Please try again.': 'इंटरनेट नहीं है। फिर कोशिश करें।', 'Bill': 'बिल', 'Scan': 'स्कैन', 'Open': 'खोलें',
        'Add to bill': 'बिल में जोड़ें', 'Add & scan next': 'जोड़ें और अगला स्कैन', 'Scan again': 'फिर स्कैन करें',
        'Add new product': 'नया सामान जोड़ें', 'New barcode': 'नया बारकोड', 'added to bill': 'बिल में जुड़ गया',
        'Point the camera at the barcode': 'कैमरा बारकोड की तरफ़ करें', 'Starting camera...': 'कैमरा चालू हो रहा है...',
        'Or type the barcode': 'या बारकोड लिखें', 'Enter quantity': 'मात्रा लिखें',
        'this product is not in your stock yet.': 'यह सामान अभी आपके स्टॉक में नहीं है।',
        'Camera permission denied - type the barcode below': 'कैमरा की अनुमति नहीं मिली - नीचे बारकोड लिखें',
        'Profile saved.': 'प्रोफ़ाइल सेव हो गई।',
        'The cart is empty. Add items before generating a bill.': 'कार्ट ख़ाली है। बिल बनाने से पहले सामान जोड़ें।',
        'Network error - the bill was not generated.': 'इंटरनेट नहीं है - बिल नहीं बना।',
        'Search the customer, then tap "Collect Payment".': 'ग्राहक खोजें, फिर "पैसे लें" दबाएँ।'
    };
    var PH_HI = {
        'Enter phone number or email': 'मोबाइल नंबर या ईमेल लिखें', 'Enter your password': 'पासवर्ड लिखें',
        'Search customers...': 'ग्राहक खोजें...', 'Search customers by name or phone...': 'नाम या नंबर से ग्राहक खोजें...',
        'Enter amount': 'रकम लिखें', 'Enter customer name for bill': 'बिल के लिए ग्राहक का नाम',
        'Enter or scan barcode': 'बारकोड लिखें या स्कैन करें', 'Enter barcode manually': 'बारकोड लिखें'
    };

    function getLang() {
        try { return localStorage.getItem('kk_lang') || 'en'; } catch (e) { return 'en'; }
    }
    function t(text) {
        return getLang() === 'hi' && HI[text] ? HI[text] : text;
    }

    var ORIGINAL = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    function translateNode(root) {
        if (getLang() !== 'hi' || !root) return;
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        var node;
        while ((node = walker.nextNode())) {
            var p = node.parentNode;
            if (!p || /^(SCRIPT|STYLE|TEXTAREA|OPTION)$/.test(p.nodeName)) continue;
            var raw = node.nodeValue, key = raw.trim();
            if (key && HI[key]) {
                if (ORIGINAL && !ORIGINAL.has(node)) ORIGINAL.set(node, raw);
                node.nodeValue = raw.replace(key, HI[key]);
            }
        }
        var inputs = (root.querySelectorAll ? root.querySelectorAll('[placeholder]') : []);
        for (var i = 0; i < inputs.length; i++) {
            var ph = inputs[i].getAttribute('placeholder');
            if (PH_HI[ph]) inputs[i].setAttribute('placeholder', PH_HI[ph]);
        }
    }

    function setLang(lang) {
        try { localStorage.setItem('kk_lang', lang === 'hi' ? 'hi' : 'en'); } catch (e) {}
        document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
        location.reload();
    }


    // ---------------------------------------------------------------- native feel
    // Injected as early as possible (this script is in <head>).
    (function nativeFeel() {
        var css = [
            // Smooth native-style screen changes (Chrome/Android WebView 126+).
            '@view-transition { navigation: auto; }',
            '::view-transition-old(root) { animation: 120ms ease-out both kkFadeOut; }',
            '::view-transition-new(root) { animation: 200ms cubic-bezier(.2,.8,.2,1) both kkSlideIn; }',
            '@keyframes kkFadeOut { to { opacity: 0; } }',
            '@keyframes kkSlideIn { from { opacity: 0; transform: translateX(6%); } }',
            '::view-transition-group(kk-nav) { animation: none; }',
            'html { -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }',
            'body { overscroll-behavior-y: contain; }',
            // No double-tap zoom delay; UI labels are not text-selectable (inputs still are).
            'a, button, [onclick], label, nav, .kk-nav { touch-action: manipulation; -webkit-user-select: none; user-select: none; }',
            'a:active, button:active, [onclick]:active { opacity: .72; transition: opacity 0s; }',
            'button, [onclick] { transition: opacity .12s; cursor: pointer; }',
            // Room for the shared bottom bar on every screen that has it.
            'body:has(.kk-nav) { padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }',
            '#kk-progress { position: fixed; top: 0; left: 0; height: 3px; width: 0; background: #2E7D32; z-index: 2147483005; transition: width 6s cubic-bezier(.1,.7,.2,1); }'
        ].join('\n');
        var st = document.createElement('style'); st.id = 'kk-native'; st.textContent = css;
        (document.head || document.documentElement).appendChild(st);
        // Prefetch a screen as soon as a finger touches its link, so it opens instantly.
        try {
            if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
                var sr = document.createElement('script'); sr.type = 'speculationrules';
                sr.textContent = JSON.stringify({ prefetch: [{ source: 'document', eagerness: 'moderate',
                    where: { and: [{ href_matches: '/*' },
                                   { not: { href_matches: '/logout' } }, { not: { href_matches: '/api/*' } },
                                   { not: { href_matches: '/export-business-data' } }, { not: { href_matches: '/account-deletion' } }] } }] });
                (document.head || document.documentElement).appendChild(sr);
            }
        } catch (e) {}
    })();

    // Cache CSS/fonts/scripts on the phone and show a friendly page when offline.
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
    }

    // Thin progress bar while the next screen loads (instant feedback on tap).
    function startProgress() {
        var b = document.getElementById('kk-progress');
        if (!b) { b = document.createElement('div'); b.id = 'kk-progress'; document.body.appendChild(b); }
        b.style.width = '0'; void b.offsetWidth; b.style.width = '85%';
    }
    window.addEventListener('beforeunload', function () { if (document.body) startProgress(); });

    // Back/Forward restored a screen from memory: make sure the user is still
    // signed in (after Logout, Back must not show private data) and refresh
    // stale data if the screen was away for over a minute.
    var hiddenAt = Date.now();
    window.addEventListener('pagehide', function () { hiddenAt = Date.now(); });
    window.addEventListener('pageshow', function (e) {
        var bar = document.getElementById('kk-progress'); if (bar) bar.remove();
        if (!e.persisted) return;
        if (/^\/(signin|signup|login|privacy|terms|contact|account-deletion|splash)?$/.test(location.pathname)) return;
        fetch('/api/auth/status', { cache: 'no-store', credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (st) {
                if (!st.authenticated) location.replace('/signin');
                else if (Date.now() - hiddenAt > 60000) location.reload();
            }).catch(function () {});
    });

    // ---------------------------------------------------------------- toasts
    var ERROR_WORDS = /(error|could not|couldn't|not |wrong|failed|invalid|please|no internet|too many|required|must|नहीं)/i;
    function ensureToastHost() {
        var host = document.getElementById('kk-toast-host');
        if (!host) {
            host = document.createElement('div');
            host.id = 'kk-toast-host';
            host.setAttribute('role', 'status');
            host.setAttribute('aria-live', 'polite');
            host.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(88px + env(safe-area-inset-bottom, 0px));' +
                'z-index:2147483000;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none';
            (document.body || document.documentElement).appendChild(host);
        }
        return host;
    }
    function toast(message, kind, restored) {
        message = t(String(message == null ? '' : message));
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', function () { toast(message, kind); });
            return;
        }
        var isError = kind ? kind === 'error' : ERROR_WORDS.test(message);
        var el = document.createElement('div');
        el.style.cssText = 'max-width:520px;width:100%;box-sizing:border-box;padding:14px 16px;border-radius:12px;' +
            'font:500 16px/1.4 Inter,system-ui,sans-serif;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.25);' +
            'pointer-events:auto;white-space:pre-line;overflow-wrap:anywhere;background:' +
            (isError ? '#B71C1C' : '#1B5E20');
        el.textContent = message;
        el.addEventListener('click', function () { el.remove(); });
        ensureToastHost().appendChild(el);
        setTimeout(function () { el.remove(); }, Math.min(7000, 2500 + message.length * 40));
        if (!restored) try {  // survive an immediate page change (once)
            sessionStorage.setItem('kk_toast', JSON.stringify({ m: message, e: isError, at: Date.now() }));
            setTimeout(function () { sessionStorage.removeItem('kk_toast'); }, 1500);
        } catch (e) {}
    }
    window.alert = function (message) { toast(message); };

    // ---------------------------------------------------------------- WhatsApp & UPI
    // WhatsApp: opens the customer's chat with the message typed in (no API,
    // no cost). Without a number, WhatsApp asks whom to send it to.
    function whatsapp(phone, text) {
        var d = String(phone || '').replace(/\D/g, '');
        if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
        var to = /^[6-9]\d{9}$/.test(d) ? '91' + d : '';
        location.href = 'https://wa.me/' + to + '?text=' + encodeURIComponent(text);
    }
    // UPI deep link understood by GPay, PhonePe, Paytm, BHIM and bank apps.
    function upiLink(upiId, payeeName, amount, note) {
        var p = ['pa=' + encodeURIComponent(upiId), 'pn=' + encodeURIComponent(payeeName || 'Shop'), 'cu=INR'];
        if (amount > 0) p.push('am=' + Number(amount).toFixed(2));
        if (note) p.push('tn=' + encodeURIComponent(String(note).slice(0, 50)));
        return 'upi://pay?' + p.join('&');
    }
    // Draws a QR code (lazy-loads the small qrcode.js library).
    function qr(target, text, size) {
        function draw() {
            var q = window.qrcode(0, 'M'); q.addData(text); q.make();
            target.innerHTML = q.createSvgTag({ cellSize: Math.max(3, Math.floor((size || 200) / (q.getModuleCount() + 8))), margin: 4, scalable: true });
            var svg = target.querySelector('svg'); if (svg) { svg.style.width = (size || 200) + 'px'; svg.style.height = (size || 200) + 'px'; svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'UPI QR code'); }
        }
        if (window.qrcode) return draw();
        var sc = document.createElement('script'); sc.src = '/static/vendor/js/qrcode.js'; sc.onload = draw;
        document.head.appendChild(sc);
    }
    function inrText(n) { var v = Number(n || 0); return (v < 0 ? '− ' : '') + '₹' + Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
    function udharReminder(shop, name, amount, upiId) {
        return 'Namaste ' + name + ' ji 🙏\n' + (shop || 'Hamari dukaan') + ' par aapka ' + inrText(amount) + ' baaki hai.\n' +
               'Kripya jaldi bhugtan karein.' + (upiId ? '\nUPI: ' + upiId : '') + '\nDhanyavaad!';
    }
    window.KK = { toast: toast, setLang: setLang, lang: getLang, t: t, whatsapp: whatsapp, upiLink: upiLink, qr: qr, inr: inrText, udharReminder: udharReminder };


    // ---------------------------------------------------------------- staff mode
    function pinSheet(title, onSubmit) {
        var wrap = document.createElement('div');
        wrap.setAttribute('role', 'dialog');
        wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2147483002;display:flex;align-items:flex-end';
        wrap.innerHTML = '<form style="background:#fff;width:100%;border-radius:16px 16px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom,0px));font:16px Inter,system-ui,sans-serif">' +
            '<h3 style="margin:0 0 12px;font-size:18px"></h3>' +
            '<input type="password" inputmode="numeric" autocomplete="off" maxlength="6" aria-label="PIN" style="width:100%;box-sizing:border-box;font-size:26px;letter-spacing:.5em;text-align:center;padding:12px;border:1px solid #9AA5B1;border-radius:12px">' +
            '<p class="kk-pin-err" role="alert" style="color:#B71C1C;min-height:20px;margin:8px 0"></p>' +
            '<button type="submit" style="width:100%;min-height:52px;border:0;border-radius:12px;background:#2E7D32;color:#fff;font-weight:700;font-size:17px">' + t('OK') + '</button>' +
            '<button type="button" class="kk-pin-cancel" style="width:100%;min-height:48px;margin-top:8px;border:0;background:none;font-size:16px">' + t('Cancel') + '</button></form>';
        wrap.querySelector('h3').textContent = t(title);
        var input = wrap.querySelector('input'), err = wrap.querySelector('.kk-pin-err');
        wrap.querySelector('.kk-pin-cancel').onclick = function () { wrap.remove(); };
        wrap.querySelector('form').onsubmit = function (e) {
            e.preventDefault();
            onSubmit(input.value.replace(/\D/g, ''), function (msg) { err.textContent = t(msg || ''); input.value = ''; input.focus(); },
                     function () { wrap.remove(); });
        };
        document.body.appendChild(wrap);
        input.focus();
    }
    function postJSON(url, body) {
        return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
                            body: JSON.stringify(body || {}) })
            .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { d._ok = r.ok; return d; }); });
    }
    function unlockStaffMode() {
        pinSheet('Enter owner PIN to unlock', function (pin, fail, done) {
            postJSON('/api/staff-mode/unlock', { pin: pin }).then(function (d) {
                if (d._ok && d.success) { done(); location.reload(); } else fail(d.error || 'Wrong PIN');
            }).catch(function () { fail('No internet. Please try again.'); });
        });
    }
    function lockStaffMode(pinAlreadySet) {
        function go(pin, fail, done) {
            postJSON('/api/staff-mode/lock', pin ? { pin: pin } : {}).then(function (d) {
                if (d._ok && d.success) { if (done) done(); location.href = '/dashboard'; }
                else if (d.need_pin) { pinSheet('Choose a 4-6 digit owner PIN', go); }
                else if (fail) fail(d.error); else toast(d.error || 'Could not turn on staff mode', 'error');
            });
        }
        if (pinAlreadySet) go(null); else pinSheet('Choose a 4-6 digit owner PIN', function (pin, fail, done) {
            if (pin.length < 4) { fail('PIN must be 4 to 6 digits'); return; }
            go(pin, fail, done);
        });
    }
    function staffBanner() {
        var b = document.createElement('button');
        b.type = 'button';
        b.id = 'kk-staff-banner';
        b.style.cssText = 'position:fixed;left:12px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:2147482999;white-space:nowrap;' +
            'background:#263238;color:#fff;border:0;border-radius:999px;padding:8px 14px;min-height:40px;font:600 14px Inter,system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.3)';
        b.textContent = '🔒 ' + t('Staff mode · Unlock');
        b.onclick = unlockStaffMode;
        document.body.appendChild(b);
    }
    window.KK.lockStaffMode = lockStaffMode;
    window.KK.unlockStaffMode = unlockStaffMode;

    // ---------------------------------------------------------------- offline
    function offlineBanner(show) {
        var b = document.getElementById('kk-offline');
        if (show && !b) {
            b = document.createElement('div');
            b.id = 'kk-offline';
            b.setAttribute('role', 'alert');
            b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483001;background:#B71C1C;color:#fff;' +
                'text-align:center;padding:calc(8px + env(safe-area-inset-top, 0px)) 12px 8px;font:600 15px/1.3 Inter,system-ui,sans-serif';
            b.textContent = t('No internet. Changes may not be saved.');
            document.body.appendChild(b);
        } else if (!show && b) {
            b.remove();
            toast(t('Back online'), 'ok');
        }
    }

    // ---------------------------------------------------------------- start
    document.addEventListener('DOMContentLoaded', function () {
        try {
            var saved = JSON.parse(sessionStorage.getItem('kk_toast') || 'null');
            sessionStorage.removeItem('kk_toast');
            if (saved && Date.now() - saved.at < 6000) toast(saved.m, saved.e ? 'error' : 'ok', true);
        } catch (e) {}
        if (getLang() === 'hi') {
            document.documentElement.lang = 'hi';
            translateNode(document.body);
            var pending = false;
            new MutationObserver(function (muts) {
                if (pending) return;
                pending = true;
                setTimeout(function () {
                    pending = false;
                    muts.forEach(function (m) {
                        m.addedNodes.forEach(function (n) {
                            if (n.nodeType === 1) translateNode(n);
                            else if (n.nodeType === 3 && n.parentNode) translateNode(n.parentNode);
                        });
                    });
                }, 50);
            }).observe(document.body, { childList: true, subtree: true });
        }
        var picker = document.getElementById('kk-lang-select');
        if (picker) {
            picker.value = getLang();
            picker.addEventListener('change', function () { setLang(picker.value); });
        }
        if (navigator.onLine === false) offlineBanner(true);
        if (!/^\/(signin|signup|login|privacy|terms|contact|account-deletion|splash)?$/.test(location.pathname)) {
            fetch('/api/auth/status', { cache: 'no-store', credentials: 'same-origin' })
                .then(function (r) { return r.json(); })
                .then(function (st) {
                    if (st.staff_mode) staffBanner();
                    if (st.staff_mode && /[?&]locked=1/.test(location.search)) toast('Owner PIN needed for that screen.', 'error');
                }).catch(function () {});
        }
        window.addEventListener('offline', function () { offlineBanner(true); });
        window.addEventListener('online', function () { offlineBanner(false); });
    });
})();
