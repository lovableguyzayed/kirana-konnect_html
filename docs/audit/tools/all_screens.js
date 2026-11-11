// Screenshot EVERY screen of the app (phone 360x800 at 2x; long screens: 2 screenfuls)
// into docs/audit/screens/NN_name.png and write screens.json (title, note).
// Usage: AUDIT_ID=... AUDIT_PW=... AUDIT_PIN=... node all_screens.js <baseUrl> <outDir> <billNo>
const { chromium } = require('playwright');
const fs = require('fs');
const [base = 'http://127.0.0.1:5055', out = 'screens', bill = ''] = process.argv.slice(2);
const list = [];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2,
                                         locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept());
  let n = 0;
  // Each screen is captured like a phone user sees it: the first screenful,
  // plus one more scrolled screenful when the page is longer (max 2 parts).
  async function shot(name, title, note, opts = {}) {
    n += 1;
    await page.waitForTimeout(opts.wait || 700);
    const total = opts.viewportOnly ? 800 : await page.evaluate(() => document.documentElement.scrollHeight);
    const parts = Math.min(2, Math.ceil(total / 800));
    const files = [];
    for (let k = 0; k < parts; k++) {
      const file = `${String(n).padStart(2, '0')}_${name}${parts > 1 ? '_' + (k + 1) : ''}.png`;
      if (!opts.viewportOnly) {
        await page.evaluate(y => window.scrollTo(0, y), k * 700);
        await page.waitForTimeout(250);
      }
      await page.screenshot({ path: `${out}/${file}` });
      files.push(file);
    }
    if (!opts.viewportOnly) await page.evaluate(() => window.scrollTo(0, 0));
    list.push({ files, title, note, url: page.url().replace(base, ''), more: total > 1500 });
    console.log(files.join(', '));
  }
  async function go(path, o) { await page.goto(base + path, { waitUntil: 'networkidle', ...(o || {}) }); }

  // ---------- signed out ----------
  await go('/signin'); await page.evaluate(() => { localStorage.setItem('kk_lang', 'en'); localStorage.removeItem('kiranakonnect_persistent_cart'); });
  await go('/splash'); await shot('splash', 'Splash', 'First screen: Get Started (pricing button hidden).', { viewportOnly: true });
  await go('/signin'); await shot('signin', 'Sign in', 'Phone/email + password, OTP login (when SMS is set up), English/हिंदी.');
  await page.fill('input[name=identifier]', process.env.AUDIT_ID || '');
  await page.click('#otp-btn'); await shot('signin_otp', 'Sign in – OTP', '6-digit OTP, resend timer, change number.', { viewportOnly: true, wait: 1200 });
  await go('/signin'); await page.click('text=Forgot Password?');
  await shot('forgot_password', 'Forgot password', 'Get OTP on mobile, or use the recovery code.', { viewportOnly: true });
  await go('/signup'); await shot('signup', 'Create account', 'Owner, mobile, shop details; Terms & Privacy links.');
  await go('/privacy'); await shot('privacy', 'Privacy Policy (public)', 'What is collected and why, rights, grievance contact.');
  await go('/terms'); await shot('terms', 'Terms of Use (public)', 'Plain-language terms.');
  await go('/contact'); await shot('contact', 'Help & Contact (public)', 'Support contacts come from Render settings.');
  await go('/account-deletion'); await shot('account_deletion', 'Delete account (public)', 'Works without the app; password + type DELETE.');

  // ---------- signed in ----------
  await go('/signin');
  await page.fill('input[name=identifier]', process.env.AUDIT_ID || '');
  await page.fill('input[name=password]', process.env.AUDIT_PW || '');
  await Promise.all([page.waitForNavigation(), page.click('#signin-btn')]);
  await go('/dashboard'); await shot('dashboard', 'Dashboard', 'Today’s profit, sales, udhar, stock alerts, quick actions.', { wait: 1500 });
  await go('/notifications'); await shot('notifications', 'Notifications', 'Real low-stock / expiry alerts only.');
  await go('/inventory'); await shot('inventory', 'Inventory', 'All products with stock, price, expiry; list cut after the first part.', { wait: 1200 });
  await go('/add-item'); await shot('add_item', 'Add item', 'New product: name, category, unit or weight, prices, barcode.');
  await go('/product-details?id=80'); await shot('product_details', 'Product details (pieces)', 'Stock, prices, dates; refill / add to cart.', { wait: 1200 });
  await go('/product-details-weight?id=10'); await shot('product_details_weight', 'Product details (loose / kg)', 'Weight-based product.', { wait: 1200 });
  await go('/refill-stock?id=80'); await shot('refill_stock', 'Refill stock (pieces)', 'Adds stock to the product that was tapped.', { wait: 1200 });
  await go('/refill-stock-weight?id=10'); await shot('refill_stock_weight', 'Refill stock (kg)', 'Loose items in kg / grams.', { wait: 1200 });
  await go('/low-stock'); await shot('low_stock', 'Low stock', 'Products at or below their reorder level.', { wait: 1000 });
  await go('/expiry-alert'); await shot('expiry_alert', 'Expiry alerts', 'Expired and expiring-this-week items.', { wait: 1000 });

  await page.evaluate(() => localStorage.setItem('kiranakonnect_persistent_cart', '[]'));
  await go('/cart'); await shot('cart_empty', 'Cart – empty', 'Starts empty (fake demo items removed).');
  await page.evaluate(() => localStorage.setItem('kiranakonnect_persistent_cart', JSON.stringify([
    { id: 1, product_id: '80', name: 'Maggi 2-Minute Noodles', quantity: 6, unit: 'Piece', price: 84 },
    { id: 2, product_id: '10', name: 'Daawat Rozana Basmati', quantity: 2, unit: 'Kg', price: 196 },
    { id: 3, product_id: null, name: 'Toor Dal Unpolished', quantity: 1, unit: 'Kg', price: 155 }])));
  await go('/cart'); await shot('cart', 'Cart / billing', 'Items, GST only with GSTIN, cash / online / udhar, Generate Bill.', { wait: 1000 });
  if (bill) { await go('/receipt?bill=' + bill); await shot('receipt', 'Receipt', 'Bill with PDF download, share, print.', { wait: 1200 }); }
  await go('/bills'); await page.click('.chip[data-f="all"]'); await shot('bills', 'All Bills', 'Search by bill no., name or phone; Today / Udhar / Paid / Cancelled; Excel download.', { wait: 1000 });
  await page.click('.kk-scan-btn'); await page.fill('#kk-scan input', process.env.AUDIT_BARCODE || ''); await page.click('#kk-scan form button');
  await shot('scan_product', 'Scan → product sheet', 'Scan from any screen: price, stock, quantity, Add to bill / Refill.', { viewportOnly: true, wait: 1200 });
  await go('/pending-credits'); await shot('pending_credits', 'Pending credits (udhar)', 'Who owes how much; call, collect.', { wait: 1200 });
  await go('/customer-ledger'); await shot('customer_ledger', 'Udhar ledger', 'All customers with balance; search.', { wait: 1200 });
  await go('/pending-credits'); await page.click('button:has-text("Collect") >> nth=0'); await page.click('#collect-sheet [data-mode="upi"]');
  await shot('collect_payment', 'Collect udhar payment', 'Amount, Cash / UPI, payment QR.', { viewportOnly: true, wait: 900 });
  await go('/customer-ledger');
  await page.click('text=View Details >> nth=0'); await shot('ledger_details', 'Customer history', 'Bills and payments, tap to call, collect.', { viewportOnly: true, wait: 1200 });
  await go('/sales-report'); await shot('sales_report', 'Sales report', 'Sales (incl. udhar), profit, payment modes, top items.', { wait: 1800 });
  await go('/khata?tab=galla'); await shot('khata_galla', 'Khata – Galla (day closing)', 'Cash that should be in the drawer; count and close the day.', { wait: 1000 });
  await go('/khata?tab=kharcha'); await shot('khata_expenses', 'Khata – Expenses', 'Rent, bijli, salary… cash or UPI; today / this month.', { wait: 1000 });
  await go('/khata?tab=supplier'); await shot('khata_suppliers', 'Khata – Suppliers', 'What you owe each wholesaler.', { viewportOnly: true, wait: 1000 });
  if (await page.$('.sup')) { await page.click('.sup >> nth=0'); await shot('khata_supplier_sheet', 'Supplier ledger', 'Maal liya / paisa diya entries and history.', { viewportOnly: true, wait: 900 }); }
  await go('/offline'); await shot('offline', 'No internet screen', 'Shown instead of the browser error page; reloads by itself when internet returns.', { viewportOnly: true });
  await go('/staff'); await shot('staff', 'My Team', 'Add / remove staff members.', { wait: 1000 });
  await go('/profile'); await shot('profile', 'Profile', 'Owner and shop details, export, language, staff mode, delete account.', { wait: 1200 });

  // ---------- staff mode & Hindi ----------
  await page.evaluate(() => fetch('/api/staff-mode/lock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }));
  await go('/dashboard'); await shot('dashboard_staff_mode', 'Dashboard – staff mode', 'Profit locked; badge asks for owner PIN.', { viewportOnly: true, wait: 1500 });
  await page.evaluate(pin => fetch('/api/staff-mode/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) }), process.env.AUDIT_PIN || '');
  await page.evaluate(() => localStorage.setItem('kk_lang', 'hi'));
  await go('/dashboard'); await shot('dashboard_hindi', 'Dashboard – हिंदी', 'Hindi labels and buttons.', { viewportOnly: true, wait: 1500 });
  await go('/cart'); await shot('cart_hindi', 'Cart – हिंदी', 'Billing in Hindi.', { viewportOnly: true, wait: 1000 });
  await page.evaluate(() => { localStorage.setItem('kk_lang', 'en'); localStorage.setItem('kiranakonnect_persistent_cart', '[]'); });

  fs.writeFileSync(`${out}/screens.json`, JSON.stringify(list, null, 2));
  await browser.close();
})();
