"""Static wiring check for every screen.

1. Every fetch('/api/...') / window.location / href in templates must hit a
   real Flask route (method included).
2. Every onclick="fn()" must call a function that exists, and functions whose
   body only logs / alerts / says 'coming soon' are listed as DEAD.

Run: python docs/audit/tools/check_wiring.py
"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, ROOT)
os.environ.setdefault('DATABASE_URL', 'sqlite://')
os.environ.setdefault('SESSION_SECRET', 'x')
os.environ.setdefault('LOG_LEVEL', 'ERROR')
import app as A  # noqa: E402

rules = [(r.rule, r.methods) for r in A.app.url_map.iter_rules()]
def route_ok(url, method='GET'):
    url = url.split('?')[0].split('#')[0]
    url = re.sub(r'\$\{[^}]+\}', 'X', url)
    for rule, methods in rules:
        pat = '^' + re.sub(r'<(?:\w+:)?\w+>', '[^/]+', rule) + '$'
        if re.match(pat, url) and method in methods:
            return True
    return False

problems, dead = [], []
for f in sorted(glob.glob(os.path.join(ROOT, 'templates', '*.html'))):
    name = os.path.basename(f)
    src = open(f, encoding='utf-8').read()
    # fetch calls with method
    for m in re.finditer(r"fetch\(\s*[`'\"]([^`'\"]+)[`'\"]\s*(,\s*\{(.{0,300}?)\})?", src, re.S):
        url = m.group(1)
        meth = re.search(r"method:\s*['\"](\w+)['\"]", m.group(3) or '')
        meth = meth.group(1).upper() if meth else 'GET'
        if url.startswith('/') and not route_ok(url, meth):
            problems.append(f'{name}: {meth} {url} -> NO ROUTE')
    for m in re.finditer(r"(?:location\.href\s*=|location\.replace\(|href=)\s*[`'\"](/[^`'\"]*)[`'\"]", src):
        url = m.group(1)
        if url.startswith('/static') or url == '/':
            continue
        if not route_ok(url):
            problems.append(f'{name}: link {url} -> NO ROUTE')
    js = ''.join(re.findall(r'<script[^>]*>(.*?)</script>', src, re.S))
    defined = set(re.findall(r'function\s+(\w+)\s*\(', js)) | set(re.findall(r'(?:window\.)?(\w+)\s*=\s*(?:async\s*)?(?:function|\()', js))
    for fn in sorted(set(re.findall(r'on(?:click|change|submit|input)="\s*(?:return\s+)?(\w+)\(', src))):
        if fn not in defined and fn not in ('KK', 'history', 'window', 'document', 'event', 'alert', 'confirm', 'location', 'this'):
            problems.append(f'{name}: onclick {fn}() is NOT DEFINED')
    for m in re.finditer(r'function\s+(\w+)\s*\([^)]*\)\s*\{', js):
        depth, i = 1, m.end()
        while depth and i < len(js):
            depth += {'{': 1, '}': -1}.get(js[i], 0); i += 1
        body = js[m.end():i - 1]
        code = re.sub(r'//.*', '', body).strip()
        stmts = [s.strip() for s in re.split(r';\s*\n?', code) if s.strip()]
        if stmts and all(re.match(r'(console\.(log|error)|alert)\(', s) for s in stmts):
            dead.append(f'{name}: {m.group(1)}() only {"alerts" if "alert" in code else "logs"}: {code[:90]!r}')
        elif re.search(r'coming soon|would be implemented|not implemented', code, re.I):
            dead.append(f'{name}: {m.group(1)}() says coming soon')

print('== Broken wiring (calls/links with no backend route, undefined handlers)')
print('\n'.join(problems) or 'none')
print('\n== Dead buttons (handler only logs/alerts)')
print('\n'.join(dead) or 'none')
