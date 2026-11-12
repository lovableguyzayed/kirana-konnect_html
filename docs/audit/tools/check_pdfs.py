"""PDF check for Kirana Konnect.

1. Lists every .pdf file in the repo and every '.pdf' / '/pdf' reference in
   code, and reports missing (referenced, absent) and orphan (present, unused).
2. Generates every server-made PDF (invoice + business export) against a
   throw-away SQLite database and validates it: starts with %PDF, non-empty,
   page count > 0, under 10 MB, and the ₹ glyph comes from an embedded font.

Run:  python docs/audit/tools/check_pdfs.py
"""
import io, os, re, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SKIP = {'.git', 'node_modules', 'attached_assets', 'docs', 'tests'}

files, refs = [], []
for d, dirs, fs in os.walk(ROOT):
    dirs[:] = [x for x in dirs if x not in SKIP]
    for f in fs:
        p = os.path.join(d, f)
        if f.lower().endswith('.pdf'):
            files.append(os.path.relpath(p, ROOT))
        elif f.endswith(('.py', '.html', '.js', '.json', '.xml')) and 'vendor' not in p:
            for i, line in enumerate(open(p, errors='ignore'), 1):
                for m in re.findall(r"[\w/{}\-.$]+\.pdf\b|/pdf\b", line):
                    refs.append((os.path.relpath(p, ROOT), i, m))
print('PDF files in repo:', files or 'none')
print('PDF references in code:')
for r in refs:
    print(f'  {r[0]}:{r[1]}  {r[2]}')
# Only real file paths (contain a folder); generated download names are skipped.
static_refs = [r for r in refs if r[2].endswith('.pdf') and '{' not in r[2] and '}' not in r[2] and '/' in r[2]]
missing = [r for r in static_refs if not any(f.endswith(os.path.basename(r[2])) for f in files)]
orphans = [f for f in files if not any(os.path.basename(f) in r[2] for r in refs)]
print('Missing (referenced but absent):', missing or 'none')
print('Orphans (present but unused):', orphans or 'none')

# --- generate and validate server PDFs ---------------------------------------
os.environ['DATABASE_URL'] = 'sqlite:///' + tempfile.NamedTemporaryFile(suffix='.db', delete=False).name
os.environ['SESSION_SECRET'] = 'pdf-check'
sys.path.insert(0, ROOT)
import app as A  # noqa: E402
from pypdf import PdfReader  # noqa: E402

c = A.app.test_client()
c.post('/signup', data={'owner_name': 'Ramesh', 'phone': '9876543210', 'password': 'secret123',
                        'shop_name': 'Ramesh General Store'})
bill = c.post('/api/bills', json={'subtotal': 125000, 'total_amount': 125000, 'payment_mode': 'cash',
              'items': [{'name': 'Dal <Toor> & Co', 'quantity': 1, 'unit_price': 125000,
                         'total_price': 125000}]}).get_json()['bill_number']
ok = True
for name, url in [('invoice', f'/api/bills/{bill}/pdf'), ('business export', '/export-business-data')]:
    r = c.get(url)
    data = r.data
    problems = []
    if r.status_code != 200: problems.append(f'HTTP {r.status_code}')
    if not data.startswith(b'%PDF'): problems.append('not a PDF')
    if len(data) > 10 * 1024 * 1024: problems.append('over 10 MB')
    try:
        reader = PdfReader(io.BytesIO(data))
        pages = len(reader.pages)
        fonts = set()
        for pg in reader.pages:
            for f in (pg.get('/Resources', {}).get('/Font', {}) or {}).values():
                fonts.add(str(f.get_object().get('/BaseFont')))
        if pages == 0: problems.append('0 pages')
        if not any('DejaVu' in f for f in fonts):
            problems.append('no ₹-capable embedded font (₹ would print as a box)')
    except Exception as e:
        pages, fonts = 0, set(); problems.append(f'unreadable: {e}')
    ok &= not problems
    try:  # optional: save page 1 as PNG for a visual check
        import pypdfium2
        out = os.path.join(tempfile.gettempdir(), f"pdfcheck_{name.replace(' ', '_')}.png")
        pypdfium2.PdfDocument(data)[0].render(scale=1.2).to_pil().save(out)
        print('  page 1 preview:', out)
    except Exception:
        pass
    print(f'{name}: {len(data)} bytes, {pages} page(s), fonts={sorted(fonts)} ->',
          'OK' if not problems else 'PROBLEMS: ' + '; '.join(problems))
sys.exit(0 if ok else 1)
