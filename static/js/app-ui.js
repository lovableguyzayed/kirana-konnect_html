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
    function toast(message, kind) {
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
        try {  // survive an immediate page change
            sessionStorage.setItem('kk_toast', JSON.stringify({ m: message, e: isError, at: Date.now() }));
            setTimeout(function () { sessionStorage.removeItem('kk_toast'); }, 1500);
        } catch (e) {}
    }
    window.alert = function (message) { toast(message); };
    window.KK = { toast: toast, setLang: setLang, lang: getLang, t: t };

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
            if (saved && Date.now() - saved.at < 6000) toast(saved.m, saved.e ? 'error' : 'ok');
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
        window.addEventListener('offline', function () { offlineBanner(true); });
        window.addEventListener('online', function () { offlineBanner(false); });
    });
})();
