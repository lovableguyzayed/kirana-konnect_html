// Screenshot every screen at several phone/tablet sizes and collect JS errors.
// Usage: node screens.js <baseUrl> <outDir> [phone|all]
// Signs in with AUDIT_ID / AUDIT_PW env vars (a local test account only).
const { chromium } = require('playwright');
const fs = require('fs');
const base = process.argv[2] || 'http://127.0.0.1:5055';
const out = process.argv[3] || 'shots';
const mode = process.argv[4] || 'phone';
const pages = ['signin','signup','dashboard','cart','inventory','add-item','profile','settings',
  'notifications','sales-report','pending-credits','low-stock','expiry-alert','staff',
  'customer-ledger?id=1','product-details?id=1','refill-stock?id=1','receipt','bills','splash'];
const sizes = mode === 'all'
  ? { '320x568': [320,568], '360x800': [360,800], '412x915': [412,915], 'tablet768': [768,1024] }
  : { '360x800': [360,800] };
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const report = {};
  for (const [label, [w,h]] of Object.entries(sizes)) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const page = await ctx.newPage();
    let errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto(base + '/signin');
    await page.fill('input[name=identifier]', process.env.AUDIT_ID || '');
    await page.fill('input[name=password]', process.env.AUDIT_PW || '');
    await Promise.all([page.waitForNavigation(), page.click('#signin-btn')]);
    for (const p of pages) {
      errs = [];
      const name = p.replace(/[?=&]/g, '_');
      if (p === 'signin' || p === 'signup') { /* shown logged-in; still useful for layout */ }
      try {
        await page.goto(base + '/' + p, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(600);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        await page.screenshot({ path: `${out}/${name}_${label}.png` });
        report[`${p} @${label}`] = { url: page.url(), horizontalOverflowPx: overflow, errors: errs };
      } catch (e) { report[`${p} @${label}`] = { fail: String(e) }; }
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 1));
})();
