// Prints the HTML made by build_pdf.py to docs/audit/APP_AUDIT_REPORT.pdf.
// Usage: node print_pdf.js <report_print.html> <out.pdf>
const { chromium } = require('playwright');
(async () => {
  const [src, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + require('path').resolve(src), { waitUntil: 'networkidle' });
  await p.pdf({ path: out, format: 'A4', printBackground: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:8px;color:#777;width:100%;text-align:center">Kirana Konnect audit · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' } });
  await b.close();
})();
