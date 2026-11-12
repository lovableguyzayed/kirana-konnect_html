# Audit progress checklist

Branch: `claude/new-session-e7po74` (the session's assigned branch; used instead of `audit-fixes`).
Local run: `DATABASE_URL=sqlite:///kk.db SESSION_SECRET=x gunicorn app:app --bind 127.0.0.1:5055`

## Phase 0 — Discovery
- [x] Stack, screens, actions, PDFs inventoried (see APP_AUDIT_REPORT.md §2)
## Phase 1/2 — Audit + report
- [x] Backend audit (app.py) — verified with live requests
- [x] Screens screenshotted at 360×800, JS errors collected (`docs/audit/tools/screens.js`)
- [x] Report written (`docs/audit/APP_AUDIT_REPORT.md`)
## Phase 3 — Fixes (non-visual first)
- [x] KK-001 password reset takeover
- [x] KK-002 hardcoded session secret fallback / cookie flags
- [x] KK-003 demo items in empty cart get billed
- [x] KK-004 bill-number collisions
- [x] KK-005 server-side validation for bills/payments
- [x] KK-006 refill writes to wrong product
- [x] KK-007 invoice PDF crash on special characters
- [x] KK-008 export PDF ₹ boxes + wrong buy price
- [x] KK-009 IST date/time handling
- [x] KK-010 profit maths for weight items
- [x] KK-011 login rate limiting
- [x] KK-012 .replit runs insecure mock app (main.py)
- [x] KK-013..018 fake OTP/receipt/alarms/profile/password/dashboard links
- [x] KK-019 Android target API 36 + CI fix (APK build passed, run #15)
- [x] Round 2 ("do it now"): D1, D3, D4, D5, D7, D8, D9, D10 + KK-022, KK-037–040 done
- [x] Round 3 ("do it"): D2 SMS OTP (off until keys), D6 Hindi, D11 staff mode, D12 additive schema, KK-023/025/028/041-046
- [x] Round 5: shared bottom bar, one scanner, native-feel layer, /bills, cancel bill, WhatsApp, UPI QR, CSV, signup fix, collect sheet; e2e 25/25
- [x] Round 6: Khata (galla closing, expenses, suppliers), net profit, order list, thermal print CSS, service worker + offline page; e2e 30/30
- [x] Round 7: bill discount, product edit sheet, per-product GST/HSN, part returns, full backup; e2e 35/35
- [x] Round 8: expiry offers (item / all, auto-applied in cart), WhatsApp offers, GST summary CSV; e2e 39/39
- [ ] Still open: fully-offline billing, unattended cloud backup + restore, per-staff logins, real-device checks, KK-027 escape all innerHTML, KK-032 N+1 queries, real-device checks
- [x] KK-022, KK-029 built (owner said go ahead); KK-028 toasts still open
## Phase 4
- [x] MANUAL_TEST_CHECKLIST.md
- [x] tests: `pytest tests` (23 passing); wiring: `python docs/audit/tools/check_wiring.py`; e2e: `node docs/audit/tools/e2e_shop_day.js <url>` on a fresh DB; PDFs: `python docs/audit/tools/check_pdfs.py`
