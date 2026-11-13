// "Tap everything" bug hunt: on every screen, tap every visible button/link
// one by one (fresh page each time) and record JS errors, failed server calls,
// error pop-ups and broken text (NaN / undefined / null). Destructive buttons
// (delete, logout, cancel bill, remove, account) are skipped.
// Usage: node tap_everything.js <baseUrl> <phone> <password> [label]
const { chromium } = require('playwright');
const [base, phone, pw, label = 'shop'] = process.argv.slice(2);
const SCREENS = ['/dashboard', '/inventory', '/add-item', '/cart', '/bills', '/pending-credits', '/customer-ledger',
  '/low-stock', '/expiry-alert', '/notifications', '/sales-report', '/staff', '/profile', '/khata', '/receipt?bill=LAST',
  '/product-details?id=FIRST', '/product-details-weight?id=FIRSTKG', '/refill-stock?id=FIRST', '/refill-stock-weight?id=FIRSTKG'];
const SKIP = /delete|logout|log out|remove|cancel bill|account|sign out|clear|reset|turn on staff|deletion|^\s*$/i;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, timezoneId: 'Asia/Kolkata', permissions: [] });
  const p = await ctx.newPage();
  await p.goto(base + '/signin');
  await p.evaluate(() => { localStorage.setItem('kk_lang', 'en'); localStorage.setItem('kk_last_backup', Date.now()); });
  await p.fill('input[name=identifier]', phone); await p.fill('input[name=password]', pw);
  await Promise.all([p.waitForNavigation(), p.click('#signin-btn')]);
  const ids = await p.evaluate(async () => {
    const pr = (await (await fetch('/api/products')).json()).products || [];
    const bl = (await (await fetch('/api/bills?limit=1')).json()).bills || [];
    return { first: (pr.find(x => !x.is_weight_based) || pr[0] || {}).id || 0, kg: (pr.find(x => x.is_weight_based) || pr[0] || {}).id || 0, bill: (bl[0] || {}).bill_number || 'NONE' };
  });
  const problems = [];
  let taps = 0;
  for (const raw of SCREENS) {
    const path = raw.replace('LAST', ids.bill).replace('FIRSTKG', ids.kg).replace('FIRST', ids.first);
    const errs = [];
    const onErr = e => errs.push('JS: ' + e.message);
    const onResp = r => { const u = r.url().replace(base, ''); if (r.status() >= 400 && !u.startsWith('/static') && !u.startsWith('/sw.js')) errs.push(`HTTP ${r.status()} ${r.request().method()} ${u}`); };
    const onDlg = d => { if (/error|fail|wrong|could not|not found/i.test(d.message())) errs.push('POPUP: ' + d.message().slice(0, 90)); d.dismiss().catch(() => {}); };
    p.on('pageerror', onErr); p.on('response', onResp); p.on('dialog', onDlg);
    await p.goto(base + path, { waitUntil: 'networkidle' }).catch(e => errs.push('LOAD: ' + e.message.slice(0, 80)));
    await p.waitForTimeout(700);
    const text = await p.evaluate(() => document.body.innerText);
    const broken = [...new Set(text.match(/\bNaN\b|\bundefined\b|\[object Object\]|Infinity|₹null/g) || [])];
    if (broken.length) errs.push('TEXT: ' + broken.join(', '));
    const n = await p.evaluate(() => [...document.querySelectorAll('button, a[href], [onclick]')].filter(e => e.offsetParent !== null).length);
    for (let i = 0; i < n && i < 60; i++) {
      await p.goto(base + path, { waitUntil: 'networkidle' }).catch(() => {});
      await p.waitForTimeout(250);
      const info = await p.evaluate(i => {
        const els = [...document.querySelectorAll('button, a[href], [onclick]')].filter(e => e.offsetParent !== null);
        const e = els[i]; if (!e) return null;
        const t = (e.innerText || e.getAttribute('aria-label') || e.getAttribute('href') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
        const href = e.getAttribute('href') || '';
        return { t, external: /^(https?:|tel:|mailto:|upi:|whatsapp:)/.test(href) || /wa\.me/.test(href), csv: /export|backup/.test(href) };
      }, i);
      if (!info || SKIP.test(info.t) || info.external || info.csv) continue;
      taps++;
      const before = errs.length;
      await p.evaluate(i => { const els = [...document.querySelectorAll('button, a[href], [onclick]')].filter(e => e.offsetParent !== null); els[i].click(); }, i).catch(() => {});
      await p.waitForTimeout(600);
      const t2 = await p.evaluate(() => document.body ? document.body.innerText : '').catch(() => '');
      const br2 = [...new Set(t2.match(/\bNaN\b|\bundefined\b|\[object Object\]|₹null/g) || [])];
      if (br2.length) errs.push('TEXT after tap: ' + br2.join(', '));
      for (let k = before; k < errs.length; k++) errs[k] += `   ← tapped "${info.t}"`;
    }
    p.off('pageerror', onErr); p.off('response', onResp); p.off('dialog', onDlg);
    for (const e of [...new Set(errs)]) problems.push(`${path}: ${e}`);
  }
  console.log(`[${label}] screens ${SCREENS.length}, taps ${taps}, problems ${problems.length}`);
  console.log(problems.join('\n'));
  await b.close();
})();
