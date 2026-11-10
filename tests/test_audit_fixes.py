"""Regression tests for the fixes listed in docs/audit/APP_AUDIT_REPORT.md."""
import app as A


def _bill(c, **over):
    body = {'subtotal': 100, 'tax_amount': 0, 'total_amount': 100, 'payment_mode': 'cash',
            'items': [{'name': 'Tata Salt', 'quantity': 1, 'unit_price': 100, 'total_price': 100}]}
    body.update(over)
    return c.post('/api/bills', json=body)


def test_pages_require_login(client):
    assert client.get('/dashboard').status_code == 302
    assert client.get('/api/bills').status_code == 401


def test_reset_needs_recovery_code(client, owner):  # KK-001
    r = client.post('/api/auth/reset-password', json={'identifier': owner['phone'], 'new_password': 'x' * 8})
    assert r.status_code == 401
    r = client.post('/api/auth/reset-password', json={'identifier': owner['phone'], 'new_password': 'x' * 8,
                                                      'recovery_code': 'wrong'})
    assert r.status_code == 401


def test_bill_numbers_sequential_and_unique(auth):  # KK-004
    nums = {_bill(auth).get_json()['bill_number'] for _ in range(30)}
    assert len(nums) == 30 and all(n.startswith('KK-') for n in nums)


def test_bill_validation(auth):  # KK-005
    assert _bill(auth, total_amount=-5).status_code == 400
    assert _bill(auth, items=[]).status_code == 400
    assert _bill(auth, total_amount=999).status_code == 400
    assert _bill(auth, payment_mode='bitcoin').status_code == 400


def test_payment_validation(auth):  # KK-005
    cid = auth.post('/api/customers', json={'name': 'Sunita', 'phone': '9811111111'}).get_json()['id']
    assert auth.post('/api/payments', json={'customer_id': cid, 'amount': -100}).status_code == 400
    assert auth.post('/api/payments', json={'customer_id': cid, 'amount': 'abc'}).status_code == 400
    assert auth.post('/api/payments', json={'customer_id': cid, 'amount': 50}).status_code == 201


def test_invoice_pdf_with_special_characters(auth):  # KK-007
    num = _bill(auth, items=[{'name': 'Dal <Toor> & "Chana"', 'quantity': 1,
                              'unit_price': 100, 'total_price': 100}]).get_json()['bill_number']
    r = auth.get(f'/api/bills/{num}/pdf')
    assert r.status_code == 200 and r.data[:4] == b'%PDF'


def test_export_pdf(auth):  # KK-008
    r = auth.get('/export-business-data')
    assert r.status_code == 200 and r.data[:4] == b'%PDF'


def test_indian_number_format():
    assert A.inr(125000) == '₹1,25,000.00'
    assert A.inr(100000000, 0) == '₹10,00,00,000'
    assert A.inr(999) == '₹999.00'


def test_ist_day_boundary():  # KK-009
    from datetime import date, datetime
    # 1:00 AM IST on 10 Nov is 7:30 PM UTC on 9 Nov - must count as 10 Nov.
    start = A.ist_day_start_utc(date(2026, 11, 10))
    assert start == datetime(2026, 11, 9, 18, 30)
    assert A.to_ist(datetime(2026, 11, 9, 19, 30)).date() == date(2026, 11, 10)


def test_change_password_and_profile(flask_app):  # KK-016 / KK-017
    c = flask_app.test_client()
    c.post('/signin', data={'identifier': '9876543210', 'password': 'secret123'})
    assert c.post('/api/auth/change-password', json={'current_password': 'nope', 'new_password': 'abcdef'}).status_code == 400
    assert c.post('/api/auth/change-password', json={'current_password': 'secret123', 'new_password': 'secret123'}).status_code == 200
    r = c.put('/api/auth/profile', json={'owner_name': 'R. K. Sharma', 'phone': '9876543210', 'shop_name': 'Sharma Kirana',
                                         'gst_number': '27ABCDE1234F1Z5'})
    assert r.status_code == 200
    st = c.get('/api/auth/status').get_json()
    assert st['owner_name'] == 'R. K. Sharma' and st['gst_number'] == '27ABCDE1234F1Z5'
    assert c.put('/api/auth/profile', json={'owner_name': 'x', 'phone': '12345', 'shop_name': 'y'}).status_code == 400


def test_public_pages(client):  # D7
    for url in ('/privacy', '/terms', '/contact', '/account-deletion'):
        r = client.get(url)
        assert r.status_code == 200, url
    assert b'Aadhaar' in client.get('/privacy').data


def test_account_deletion_wipes_everything(tmp_path):  # D1 - run on its own DB
    import subprocess, sys, os, textwrap
    code = textwrap.dedent('''
        import os, sys
        os.environ['DATABASE_URL'] = 'sqlite:///' + sys.argv[1]
        os.environ['SESSION_SECRET'] = 'x'
        sys.path.insert(0, sys.argv[2])
        import app as A
        c = A.app.test_client()
        c.post('/signup', data={'owner_name': 'Del', 'phone': '9000000001', 'password': 'secret123', 'shop_name': 'S'})
        with A.app.app_context():
            assert A.Product.query.count() > 0
        assert c.post('/account-deletion', data={'identifier': '9000000001', 'password': 'bad', 'confirm': 'DELETE'}).status_code == 401
        assert c.post('/account-deletion', data={'identifier': '9000000001', 'password': 'secret123', 'confirm': 'no'}).status_code == 400
        r = c.post('/account-deletion', data={'identifier': '9000000001', 'password': 'secret123', 'confirm': 'delete'})
        assert r.status_code == 200 and b'have been deleted' in r.data
        with A.app.app_context():
            for m in (A.User, A.Product, A.Bill, A.Customer, A.Payment, A.Staff):
                assert m.query.count() == 0, m
        assert c.get('/dashboard').status_code == 302
        print('OK')
    ''')
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = subprocess.run([sys.executable, '-c', code, str(tmp_path / 'd.db'), root],
                         capture_output=True, text=True)
    assert out.stdout.strip().endswith('OK'), out.stderr[-2000:]


def test_sales_report_counts_udhar(auth):  # D5
    cid = auth.post('/api/customers', json={'name': 'Udhar Wala', 'phone': '9822222222'}).get_json()['id']
    before = auth.get('/api/sales-data?period=daily').get_json()['data']
    _bill(auth, payment_mode='credit', customer_id=cid)
    after = auth.get('/api/sales-data?period=daily').get_json()['data']
    assert round(after['totalRevenue'] - before['totalRevenue'], 2) == 100
    assert round(after['udharSales'] - before['udharSales'], 2) == 100
    assert round(after['cashReceived'] - before['cashReceived'], 2) == 0


def test_hindi_names_use_devanagari_font(auth):  # D8
    num = _bill(auth, items=[{'name': 'अरहर दाल', 'quantity': 1, 'unit_price': 100,
                              'total_price': 100}]).get_json()['bill_number']
    data = auth.get(f'/api/bills/{num}/pdf').data
    assert data[:4] == b'%PDF' and b'NotoSansDevanagari' in data


def test_customer_phone_validation(auth):  # D12
    assert auth.post('/api/customers', json={'name': 'A', 'phone': '12345'}).status_code == 400
    r = auth.post('/api/customers', json={'name': 'Sita Devi', 'phone': '+91 93333-33333'})
    assert r.status_code == 200
    dup = auth.post('/api/customers', json={'name': 'Sita D', 'phone': '09333333333'})
    assert dup.status_code == 409 and dup.get_json()['existing_name'] == 'Sita Devi'


def test_shop_address_saved_and_on_invoice(auth):  # D12
    auth.put('/api/auth/profile', json={'owner_name': 'Ramesh', 'phone': '9876543210', 'shop_name': 'Ramesh General Store',
                                        'shop_address': 'Near Hanuman Mandir, Sitapur'})
    assert auth.get('/api/auth/status').get_json()['shop_address'] == 'Near Hanuman Mandir, Sitapur'
    num = _bill(auth).get_json()['bill_number']
    from pypdf import PdfReader
    import io
    text = PdfReader(io.BytesIO(auth.get(f'/api/bills/{num}/pdf').data)).pages[0].extract_text()
    assert 'Hanuman Mandir' in text


def test_sms_otp_login_and_reset(flask_app, owner, monkeypatch):  # D2
    c = flask_app.test_client()
    assert c.post('/api/auth/otp/send', json={'phone': owner['phone']}).status_code == 503  # off by default
    sent = {}
    monkeypatch.setenv('SMS_PROVIDER', 'console')
    monkeypatch.setattr(A, '_send_sms_otp', lambda phone, code: sent.update(code=code) or True)
    A._RATE_BUCKETS.clear()
    assert c.post('/api/auth/otp/send', json={'phone': '9123456789'}).status_code == 404  # not registered
    r = c.post('/api/auth/otp/send', json={'phone': '+91 ' + owner['phone']})
    assert r.status_code == 200 and len(sent['code']) == 6
    assert c.post('/api/auth/otp/send', json={'phone': owner['phone']}).status_code == 429  # 30 s resend wait
    bad = c.post('/api/auth/otp/verify', json={'phone': owner['phone'], 'code': '000000' if sent['code'] != '000000' else '111111'})
    assert bad.status_code == 400 and 'tries left' in bad.get_json()['error']
    ok = c.post('/api/auth/otp/verify', json={'phone': owner['phone'], 'code': sent['code']})
    assert ok.status_code == 200 and c.get('/api/auth/status').get_json()['authenticated']
    # a used code cannot be reused
    assert c.post('/api/auth/otp/verify', json={'phone': owner['phone'], 'code': sent['code']}).status_code == 400
    # reset with OTP
    with flask_app.app_context():
        A.OtpCode.query.delete(); A.db.session.commit()
    c2 = flask_app.test_client()
    c2.post('/api/auth/otp/send', json={'phone': owner['phone'], 'purpose': 'reset'})
    r = c2.post('/api/auth/otp/verify', json={'phone': owner['phone'], 'purpose': 'reset', 'code': sent['code'],
                                              'new_password': owner['password']})
    assert r.status_code == 200


def test_staff_mode_locks_owner_screens(flask_app, owner):  # D11
    c = flask_app.test_client()
    c.post('/signin', data={'identifier': owner['phone'], 'password': owner['password']})
    assert c.post('/api/staff-mode/lock', json={}).get_json().get('need_pin')
    assert c.post('/api/staff-mode/lock', json={'pin': '4321'}).status_code == 200
    assert c.get('/profile').status_code == 302 and 'locked=1' in c.get('/profile').location
    assert c.get('/api/sales-data').status_code == 403
    assert c.get('/export-business-data').status_code == 302
    assert c.delete('/api/products/1').status_code == 403
    stats = c.get('/api/dashboard/stats').get_json()
    assert stats['today_profit'] is None and stats['actual_cost'] is None
    assert _bill(c).status_code == 201            # billing still works
    assert c.post('/api/staff-mode/unlock', json={'pin': '0000'}).status_code == 400
    assert c.post('/api/staff-mode/unlock', json={'pin': '4321'}).status_code == 200
    assert c.get('/profile').status_code == 200


def test_bills_search_cancel_and_csv(auth):  # round 5
    cid = auth.post('/api/customers', json={'name': 'Cancel Test', 'phone': '9844444444'}).get_json()['id']
    prod = auth.post('/api/products', json={'name': 'Test Biscuit Zeta', 'price': 10, 'stock_quantity': 50}).get_json()['product']
    r = _bill(auth, payment_mode='credit', customer_id=cid, subtotal=30, total_amount=30,
              items=[{'product_id': prod['id'], 'name': 'Test Biscuit Zeta', 'quantity': 3, 'unit_price': 10, 'total_price': 30}])
    num = r.get_json()['bill_number']
    assert auth.get(f'/api/products/{prod["id"]}').get_json()['product']['stock_quantity'] == 47
    assert auth.get(f'/api/customer/{cid}').get_json()['outstanding_balance'] == 30
    found = auth.get('/api/bills?q=Cancel Test&page=1').get_json()
    assert found['total'] == 1 and found['bills'][0]['customer_phone'] == '9844444444'
    assert any(b['bill_number'] == num for b in auth.get('/api/bills?status=udhar&page=1&per_page=100').get_json()['bills'])
    assert auth.post(f'/api/bills/{num}/cancel').status_code == 200
    assert auth.post(f'/api/bills/{num}/cancel').status_code == 400          # only once
    assert auth.get(f'/api/products/{prod["id"]}').get_json()['product']['stock_quantity'] == 50  # stock back
    assert auth.get(f'/api/customer/{cid}').get_json()['outstanding_balance'] == 0                # udhar gone
    assert auth.get('/api/bills?status=cancelled&page=1').get_json()['total'] >= 1
    for kind in ('products', 'bills', 'udhar'):
        csv = auth.get(f'/export/{kind}.csv')
        assert csv.status_code == 200 and csv.data.startswith('﻿'.encode()) and b',' in csv.data
    assert auth.get('/bills').status_code == 200


def test_upi_id_validation(auth):  # round 5
    base = {'owner_name': 'Ramesh', 'phone': '9876543210', 'shop_name': 'Ramesh General Store'}
    assert auth.put('/api/auth/profile', json=dict(base, upi_id='not a upi')).status_code == 400
    assert auth.put('/api/auth/profile', json=dict(base, upi_id='9876543210@ybl')).status_code == 200
    assert auth.get('/api/auth/status').get_json()['upi_id'] == '9876543210@ybl'
