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
- [x] KK-019 Android target API 36 + CI fix (check GitHub Actions result)
- [ ] Waiting on decisions D1–D12 (see report §5)
- [ ] Visual batch 1 previews (KK-022 ledger payment, KK-028 toasts, KK-029 FAB overlap)
## Phase 4
- [x] MANUAL_TEST_CHECKLIST.md
- [x] tests: `pytest tests` (10 passing); PDFs: `python docs/audit/tools/check_pdfs.py`
