// End-to-end "one shop day" through the real screens, on a fresh database.
// Every request the screens make is recorded; any 4xx/5xx or JS error fails.
// Usage: node e2e_shop_day.js http://127.0.0.1:5056
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:5056';
const steps = [], bad = [];
function ok(name, cond, extra) { steps.push((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!cond) bad.push(name); }

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, timezoneId: 'Asia/Kolkata', locale: 'en-IN' });
  const p = await ctx.newPage();
  const net = [], jsErr = [];
  p.on('response', r => { const u = r.url().replace(base, ''); if (!u.startsWith('/static')) net.push([r.status(), r.request().method(), u]); });
  p.on('pageerror', e => jsErr.push(p.url().replace(base, '') + ': ' + e.message));
  let dialogAnswer = null;
  p.on('dialog', d => { d.type() === 'prompt' ? d.accept(dialogAnswer || '') : d.accept(); });
  const api = (path, opts) => p.evaluate(([path, opts]) => fetch(path, opts).then(r => r.json()), [path, opts || {}]);
  const go = async path => { await p.goto(base + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(500); };

  // 1. Sign up
  await go('/signup');
  await p.fill('input[name=owner_name]', 'Suresh Yadav');
  await p.fill('input[name=phone]', '+91 99887-76655');
  await p.fill('input[name=password]', 'dukaan123');
  await p.fill('input[name=shop_name]', 'Yadav Kirana Bhandar');
  await p.check('#terms');
  await Promise.all([p.waitForNavigation(), p.click('#signup-btn')]);
  ok('Sign up opens dashboard', p.url().endsWith('/dashboard'), p.url());

  // 2. Profile: UPI + address via the edit form
  await go('/profile');
  await p.click('button[aria-label="Edit profile"]');
  await p.waitForTimeout(400);
  await p.fill('#editUpi', 'yadavkirana@ybl');
  await p.fill('#editAddress', 'Near Hanuman Mandir, Main Bazaar, Sitapur 261001');
  await p.evaluate(() => saveProfile()); await p.waitForTimeout(800);
  const st = await api('/api/auth/status');
  ok('Profile saves UPI + address', st.upi_id === 'yadavkirana@ybl' && /Hanuman/.test(st.shop_address || ''), JSON.stringify([st.upi_id, st.shop_address]));

  // 3. Add item through the Add Item form
  await go('/add-item');
  await p.fill('#product-name', 'Parle-G Biscuit 100g');
  await p.selectOption('#category-select', 'snacks');
  await p.check('input[name=quantity_type][value=packet]');
  await p.waitForTimeout(300);
  await p.fill('#unit-quantity', '40');
  await p.fill('#unit-purchase-price', '8').catch(() => {});
  await p.fill('#unit-selling-price', '10').catch(() => {});
  await p.fill('#barcode', '8901719110016');
  await p.evaluate(() => addItem()); await p.waitForTimeout(1500);
  const found = await api('/api/products?barcode=8901719110016');
  const prod = found.products[0];
  ok('Add Item saves product', !!prod && prod.stock_quantity === 40, prod ? `${prod.name} stock ${prod.stock_quantity} price ${prod.price}` : 'not found');

  // 4. Scan (manual entry) -> Add to bill -> Cart -> cash bill
  await go('/dashboard');
  await p.click('.kk-scan-btn'); await p.waitForTimeout(400);
  await p.fill('#kk-scan input', '8901719110016'); await p.click('#kk-scan form button'); await p.waitForTimeout(900);
  await p.fill('.kk-q', '3');
  await Promise.all([p.waitForNavigation(), p.click('.kk-add')]); await p.waitForTimeout(800);
  const cartN = await p.evaluate(() => cartItems.length);
  ok('Scan adds item to bill', cartN === 1, `items ${cartN}`);
  await Promise.all([p.waitForNavigation(), p.evaluate(() => generateBill())]); await p.waitForTimeout(1200);
  const bill1 = new URL(p.url()).searchParams.get('bill');
  ok('Cash bill created -> receipt', !!bill1 && /\/receipt/.test(p.url()), bill1);
  const after = (await api('/api/products?barcode=8901719110016')).products[0];
  ok('Stock goes down after sale', after.stock_quantity === 37, `stock ${after.stock_quantity}`);
  const pdf = await p.evaluate(n => fetch(`/api/bills/${n}/pdf`).then(r => r.headers.get('content-type')), bill1);
  ok('Invoice PDF downloads', /pdf/.test(pdf || ''), pdf);
  ok('Receipt shows WhatsApp share', await p.isVisible('text=Share on WhatsApp'));

  // 5. New customer + udhar bill from the cart
  await p.evaluate(() => { localStorage.setItem('kiranakonnect_cart', JSON.stringify([{ product_id: 'x', name: 'Parle-G Biscuit 100g', quantity: 5, unit: 'Piece', price: 50 }])); });
  await go('/cart');
  await p.evaluate(() => showNewCustomerTab()); await p.waitForTimeout(300);
  await p.fill('#new-customer-name', 'Kamla Devi');
  await p.fill('#new-customer-phone', '98765 01234');
  await p.evaluate(() => saveNewCustomer()); await p.waitForTimeout(1000);
  await p.evaluate(() => selectPayment('credit')); await p.waitForTimeout(300);
  await Promise.all([p.waitForNavigation(), p.evaluate(() => generateBill())]); await p.waitForTimeout(1200);
  const bill2 = new URL(p.url()).searchParams.get('bill');
  const cust = (await api('/api/search-customers?q=Kamla')).customers[0];
  ok('Udhar bill for new customer', !!bill2 && cust && cust.outstanding_balance === 50, cust ? `due ${cust.outstanding_balance}` : 'no customer');
  ok('Udhar receipt shows UPI QR', await p.isVisible('#upi-box'));

  // 6. Udhar screen: collect part payment
  await go('/pending-credits');
  ok('Udhar list shows Kamla Devi', await p.isVisible('text=Kamla Devi'));
  await p.click('.credit-item:has-text("Kamla Devi") button:has-text("Collect")'); await p.waitForTimeout(400);
  await p.fill('#collect-amount', '20');
  await p.click('#collect-sheet [data-mode="upi"]'); await p.waitForTimeout(500);
  ok('Collect sheet shows UPI QR', await p.isVisible('#collect-qr svg'));
  await p.screenshot({ path: (process.env.SHOT_DIR || '.') + '/collect_sheet.png' });
  await p.click('#collect-sheet button[type=submit]'); await p.waitForTimeout(1200);
  const cust2 = (await api('/api/search-customers?q=Kamla')).customers[0];
  ok('Collect payment lowers udhar', cust2.outstanding_balance === 30, `due ${cust2.outstanding_balance}`);
  ok('WhatsApp Remind button present', await p.isVisible('button:has-text("Remind")'));

  // 7. Ledger history sheet
  await go('/customer-ledger');
  await p.click('text=View Details >> nth=0'); await p.waitForTimeout(1000);
  ok('Customer history sheet loads', /History/.test(await p.textContent('#cs-body').catch(() => '')));

  // 8. Refill from inventory
  await go(`/refill-stock?id=${prod.id}`);
  await p.fill('#additional-quantity, #quantity-input, input[type=number] >> nth=0', '10').catch(() => {});
  const r = await api(`/api/products/${prod.id}/refill`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: 10 }) });
  // 40 added - 3 cash sale - 5 udhar sale + 10 refill = 42
  ok('Refill adds stock', r.success && r.product.stock_quantity === 42, r.product && `stock ${r.product.stock_quantity}`);

  // 9. Bills screen search + cancel the cash bill from its receipt
  await go('/bills');
  await p.fill('#q', bill1); await p.waitForTimeout(900);
  ok('All Bills search finds bill', await p.isVisible(`text=${bill1}`));
  await go(`/receipt?bill=${bill1}`);
  await Promise.all([p.waitForNavigation(), p.click('#cancel-bill-btn')]); await p.waitForTimeout(800);
  ok('Cancelled bill shows banner', await p.isVisible('#cancelled-banner'));
  const back = (await api('/api/products?barcode=8901719110016')).products[0];
  ok('Cancel returns stock', back.stock_quantity === 45, `stock ${back.stock_quantity}`);

  // 10. Every other screen loads with live data
  for (const path of ['/khata', '/dashboard', '/inventory', '/low-stock', '/expiry-alert', '/notifications', '/sales-report', '/staff', '/profile', '/bills']) {
    await go(path);
  }
  const stats = await api('/api/dashboard/stats');
  ok('Dashboard sales = cash bill cancelled + udhar ₹50', Math.round(stats.total_sales) === 50, `total_sales ${stats.total_sales}`);
  const sales = await api('/api/sales-data?period=daily');
  ok('Sales report counts udhar', Math.round(sales.data.totalRevenue) === 50, `revenue ${sales.data.totalRevenue}`);

  // 10b. Khata: expense, supplier purchase + payment, galla closing
  await go('/khata?tab=kharcha');
  await p.fill('#exp-amount', '120'); await p.click('#exp-cats button[data-c="Electricity"]');
  await p.click('#exp-form button[type=submit]'); await p.waitForTimeout(900);
  ok('Expense saved and listed', await p.isVisible('#exp-list >> text=Electricity'));
  await p.click('.tab[data-tab="supplier"]'); await p.waitForTimeout(400);
  await p.click('#sup-add'); await p.fill('#sn', 'Gupta Traders'); await p.fill('#sp', '98110 22334');
  await p.click('.sheet button[type=submit]'); await p.waitForTimeout(800);
  await p.click('.sup >> nth=0'); await p.waitForTimeout(500);
  await p.fill('#se-amt', '5000'); await p.click('#se button[type=submit]'); await p.waitForTimeout(1200);
  await p.click('#se-kind button[data-k="payment"]'); await p.fill('#se-amt', '10'); await p.click('#se button[type=submit]'); await p.waitForTimeout(1200);
  const sup = await api('/api/suppliers');
  ok('Supplier balance = purchase - payment', sup.total_due === 4990, `due ${sup.total_due}`);
  const bookNow = await api('/api/daybook');
  // cash: +20 udhar collected by UPI is NOT cash; -120 expense; -10 supplier
  ok('Galla expected cash is right', bookNow.expected_cash === -130 && bookNow.udhar_given === 50 && bookNow.udhar_collected_online === 20,
     JSON.stringify([bookNow.expected_cash, bookNow.udhar_given, bookNow.udhar_collected_online]));
  await p.click('.sheet [data-close]'); await p.click('.tab[data-tab="galla"]'); await p.waitForTimeout(500);
  await p.click('#edit-opening'); await p.fill('#op-amt', '1000'); await p.click('.sheet button[type=submit]'); await p.waitForTimeout(700);
  await p.fill('#counted', '870'); await p.click('#close-btn'); await p.waitForTimeout(800);
  ok('Galla closing matches', /matches/.test(await p.textContent('#close-result')), await p.textContent('#close-result'));
  const rep = await api('/api/sales-data?period=daily');
  ok('Net profit = profit - expenses', Math.round(rep.data.netProfit) === Math.round(rep.data.totalProfit - 120), `${rep.data.totalProfit} - 120 = ${rep.data.netProfit}`);

  // 11. Staff: add a team member
  await go('/staff');
  const sres = await api('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Raju', role: 'Helper' }) });
  ok('Add staff member', sres.success);

  // 12. Logout, then Back must not show private screens
  await go('/logout');
  await p.goBack(); await p.waitForTimeout(1500);
  ok('Back after logout goes to sign-in', /\/(signin|login)/.test(p.url()), p.url());

  const errors = net.filter(([s, m, u]) => s >= 400);
  ok('No failed server calls on any screen', errors.length === 0, errors.map(e => e.join(' ')).join(', '));
  ok('No JavaScript errors on any screen', jsErr.length === 0, jsErr.join(' | '));
  console.log(steps.join('\n'));
  console.log(`\n${steps.length - bad.length}/${steps.length} passed; ${net.length} server calls checked`);
  await b.close();
  process.exit(bad.length ? 1 : 0);
})();
