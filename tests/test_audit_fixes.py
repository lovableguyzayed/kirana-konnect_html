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
