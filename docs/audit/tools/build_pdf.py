"""Build docs/audit/APP_AUDIT_REPORT.pdf from the Markdown report, the manual
test checklist and the before/after screenshots.

Run:  python docs/audit/tools/build_pdf.py   (needs: pip install markdown)
      then: node docs/audit/tools/print_pdf.js
"""
import base64, html, os, re
import markdown

AUDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOCK = os.path.join(AUDIT, 'mockups')

def md(path):
    text = open(os.path.join(AUDIT, path), encoding='utf-8').read()
    # gallery links point at files; in the PDF the pictures are in the appendix
    text = text.replace('[`mockups/index.html`](mockups/index.html)', 'the appendix')
    return markdown.markdown(text, extensions=['tables', 'sane_lists'])

def img(name, folder=None):
    """Embed an image; large screenshots are re-encoded as JPEG to keep the PDF small."""
    path = os.path.join(folder or MOCK, name)
    try:
        from PIL import Image
        import io
        im = Image.open(path).convert('RGB')
        buf = io.BytesIO()
        im.save(buf, 'JPEG', quality=82, optimize=True)
        return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        with open(path, 'rb') as f:
            return 'data:image/png;base64,' + base64.b64encode(f.read()).decode()

SCREENS = os.path.join(AUDIT, 'screens')
def all_screens():
    import json
    meta = os.path.join(SCREENS, 'screens.json')
    if not os.path.exists(meta):
        return ''
    items = json.load(open(meta, encoding='utf-8'))
    cards = []
    for i, x in enumerate(items):
        files = x.get('files') or [x['file']]
        for k, f in enumerate(files):
            part = f' ({k + 1}/{len(files)})' if len(files) > 1 else ''
            more = ' Longer list continues below in the app.' if x.get('more') and k == len(files) - 1 else ''
            cards.append(
                f'<figure class="screen"><figcaption><b>{i + 1}. {html.escape(x["title"])}{part}</b>'
                f'<span>{html.escape(x["url"] or "/")}</span>{html.escape(x["note"]) if k == 0 else "&nbsp;"}{more}</figcaption>'
                f'<img src="{img(f, SCREENS)}"></figure>')
    cards = ''.join(cards)
    return (f'<div class="chapter"><h2>All screens ({len(items)})</h2>'
            '<p>Every screen of the app as it is now, captured on a 360×800 phone screen. '
            'Long screens are shown from the top (very long lists are cut). Sample data: '
            'Ramesh General Store.</p>'
            f'<div class="screens">{cards}</div></div>')

GALLERY = [
    ('KK-003 Cart', 'Cart started with 6 fake items that could be billed; now starts empty.',
     'KK-003_cart_before.png', 'KK-003_cart_after.png'),
    ('KK-006 Refill stock', 'Opening refill for product 1 showed a sample product; now the real one.',
     'KK-006_refill_before.png', 'KK-006_refill_after.png'),
    ('KK-013 Sign in', 'Fake "Login with OTP" removed (real OTP appears once SMS is set up).',
     'KK-013_signin_before.png', 'KK-013_signin_after.png'),
    ('KK-017 Profile', 'Showed a made-up owner and fake GSTIN; now the real owner, and edits save.',
     'KK-017_profile_before.png', 'KK-017_profile_after.png'),
    ('KK-008 Business report PDF', '₹ printed as ■ and buy price = sell price; fixed.',
     'KK-008_export-pdf_before.png', 'KK-008_export-pdf_after.png'),
]
SINGLES = [
    ('KK-035 Invoice with Hindi names', 'KK-035_invoice-hindi_after.png'),
    ('D2 OTP login', 'D2_otp-login_after.png'),
    ('D11 Staff mode (profit locked)', 'D11_staff-mode_after.png'),
    ('D4 GST only with GSTIN (5%)', 'D4_cart-gst_after.png'),
    ('KK-022 Udhar history sheet', 'KK-022_ledger-details_after.png'),
    ('D1 Delete account page', 'KK-020_account-deletion_after.png'),
    ('D7 Privacy page', 'KK-020_privacy_after.png'),
    ('D6 Hindi, in-app message, offline strip', 'D6_hindi-toast-offline_after.png'),
]

parts = []
for title, note, before, after in GALLERY:
    parts.append(f'<section class="shot"><h3>{html.escape(title)}</h3><p>{html.escape(note)}</p>'
                 f'<div class="pair"><figure><img src="{img(before)}"><figcaption>Before</figcaption></figure>'
                 f'<figure><img src="{img(after)}"><figcaption>After</figcaption></figure></div></section>')
singles = ''.join(f'<figure class="single"><img src="{img(f)}"><figcaption>{html.escape(t)}</figcaption></figure>'
                  for t, f in SINGLES if os.path.exists(os.path.join(MOCK, f)))

doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kirana Konnect Audit</title>
<link rel="stylesheet" href="file://{os.path.abspath(os.path.join(AUDIT, '..', '..', 'static', 'vendor', 'fonts', 'fonts.css'))}">
<style>
@page {{ size: A4; margin: 16mm 14mm 18mm; }}
body {{ font: 10pt/1.45 Inter, "Noto Sans Devanagari", "DejaVu Sans", sans-serif; color: #1F2933; }}
h1 {{ font-size: 21pt; color: #2E7D32; margin: 0 0 4pt; }}
h2 {{ font-size: 14pt; color: #2E7D32; border-bottom: 2px solid #4CAF50; padding-bottom: 3pt; margin-top: 18pt; break-after: avoid; }}
h3 {{ font-size: 11.5pt; margin: 12pt 0 4pt; break-after: avoid; }}
table {{ width: 100%; border-collapse: collapse; margin: 6pt 0 10pt; font-size: 8pt; }}
th {{ background: #2E7D32; color: #fff; text-align: left; padding: 4pt; }}
td {{ border-bottom: 1px solid #DDE3DD; padding: 3.5pt 4pt; vertical-align: top; overflow-wrap: anywhere; }}
tr {{ break-inside: avoid; }} thead {{ display: table-header-group; }}
tr:nth-child(even) td {{ background: #F5F9F5; }}
code {{ font-size: 8.5pt; background: #EEF2EE; padding: 0 2pt; border-radius: 2pt; overflow-wrap: anywhere; }}
ul {{ padding-left: 16pt; }} li {{ margin: 2pt 0; }}
hr {{ border: 0; border-top: 1px solid #ccc; }}
.cover {{ border-left: 6pt solid #4CAF50; padding: 4pt 0 4pt 12pt; margin-bottom: 10pt; }}
.cover p {{ margin: 2pt 0; color: #52606D; }}
.chapter {{ break-before: page; }}
.shot {{ break-inside: avoid; margin-bottom: 10pt; }}
.pair {{ display: flex; gap: 10pt; }} .pair figure {{ flex: 1; margin: 0; }}
img {{ width: 100%; border: 1px solid #ccc; border-radius: 4pt; }}
.pair img {{ max-height: 115mm; object-fit: contain; }}
figcaption {{ text-align: center; font-size: 8.5pt; color: #52606D; }}
.singles {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; }}
.screens {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8pt 12pt; }}
.screen {{ margin: 0; break-inside: avoid; display: flex; flex-direction: column; align-items: center; }}
.screen figcaption {{ text-align: left; width: 100%; font-size: 8pt; color: #1F2933; margin-bottom: 3pt; min-height: 30pt; }}
.screen figcaption b {{ font-size: 10pt; display: block; color: #2E7D32; }}
.screen figcaption span {{ display: block; font-family: monospace; color: #52606D; }}
.screen img {{ width: auto; max-width: 100%; height: 108mm; object-fit: contain; border-radius: 6pt; }}
.single {{ margin: 0; break-inside: avoid; }} .single img {{ max-height: 120mm; object-fit: contain; }}
</style></head><body>
<div class="cover"><h1>Kirana Konnect — App Audit &amp; Fixes</h1>
<p>10 November 2026 · Branch <b>claude/new-session-e7po74</b></p>
<p>Contents: 1. Report · 2. Manual test checklist · 3. Before / after screenshots · 4. All screens of the app</p></div>
{md('APP_AUDIT_REPORT.md').replace('<h1>', '<h1 style="display:none">', 1)}
<div class="chapter">{md('MANUAL_TEST_CHECKLIST.md')}</div>
<div class="chapter"><h2>Before / after screenshots</h2>{''.join(parts)}
<h2>New screens</h2><div class="singles">{singles}</div></div>
{all_screens()}
</body></html>'''
doc = re.sub(r'<li>\[ \]', '<li>☐', doc).replace('<li>[x]', '<li>☑')
out = os.path.join(os.environ.get('PDF_TMP', AUDIT), 'report_print.html')
open(out, 'w', encoding='utf-8').write(doc)
print(out)
