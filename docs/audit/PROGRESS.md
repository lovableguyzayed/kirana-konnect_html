# Audit progress checklist

Branch: `claude/new-session-e7po74` (the session's assigned branch; used instead of `audit-fixes`).
Local run: `DATABASE_URL=sqlite:///kk.db SESSION_SECRET=x gunicorn app:app --bind 127.0.0.1:5055`

## Phase 0 — Discovery
- [x] Stack, screens, actions, PDFs inventoried (see APP_AUDIT_REPORT.md §2)
## Phase 1/2 — Audit + report
- [x] Backend audit (app.py) — verified with live requests
- [x] Screens screenshotted at 360×800, JS errors collected (`docs/audit/tools/screens.js`)
- [ ] Report written (`docs/audit/APP_AUDIT_REPORT.md`)
## Phase 3 — Fixes (non-visual first)
- [ ] KK-001 password reset takeover
- [ ] KK-002 hardcoded session secret fallback / cookie flags
- [ ] KK-003 demo items in empty cart get billed
- [ ] KK-004 bill-number collisions
- [ ] KK-005 server-side validation for bills/payments
- [ ] KK-006 refill writes to wrong product
- [ ] KK-007 invoice PDF crash on special characters
- [ ] KK-008 export PDF ₹ boxes + wrong buy price
- [ ] KK-009 IST date/time handling
- [ ] KK-010 profit maths for weight items
- [ ] KK-011 login rate limiting
- [ ] KK-012 .replit runs insecure mock app (main.py)
## Phase 4
- [ ] MANUAL_TEST_CHECKLIST.md
