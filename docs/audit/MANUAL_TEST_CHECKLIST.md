# Manual test checklist (things I could not test here)

Tick each on a real phone after deploying this branch.

## Deploy
- [ ] Render: the blueprint now adds `OWNER_RESET_CODE`. For an existing service, add it by hand (Environment → Add, at least 6 characters) and note it somewhere safe.
- [ ] `/healthz` shows `database: connected` after deploy.
- [ ] Sign in works; after **10 wrong passwords** you see "Too many wrong attempts" (wait 15 min).
- [ ] Forgot password: wrong code → refused; right code → you are signed in.

## Core shop flows (on a budget Android, e.g. Redmi 3 GB)
- [ ] Empty cart shows "Cart is empty" (no ready-made items).
- [ ] Scan → add → Generate Bill → receipt shows bill number like `KK-2026-000123` and today's IST date/time.
- [ ] Download PDF from receipt: ₹ signs show correctly, opens in the phone's PDF viewer; Share to WhatsApp works.
- [ ] Profile → Export business data: ₹ shows, Buy Price differs from Sell Price.
- [ ] Low Stock → Refill on a product → stock increases on **that** product only.
- [ ] Profile → Edit: change GSTIN → new bill PDF says "TAX INVOICE" with GSTIN.
- [ ] Profile → Change password with the wrong current password → refused.
- [ ] Make a sale between 12:00 AM and 5:30 AM IST → shows under today on the dashboard.

## Android shell (APK from the GitHub Actions run)
- [ ] App installs and opens on Android 16 (target API 36); status bar and bottom nav not hidden under system bars (edge-to-edge); 3-button and gesture navigation both OK.
- [ ] Back button: goes back a page; on Dashboard it should not drop to a blank splash.
- [ ] Camera permission prompt appears only when the scanner opens; deny → app still usable.
- [ ] Airplane mode on launch → offline screen with Retry; mid-use → note what you see (no offline banner yet).
- [ ] Settings → Font size **max** and Display size **max**: sign-in, cart, receipt readable, buttons not cut.
- [ ] Xiaomi/Redmi with dark mode / force-dark: text still readable.
- [ ] Developer options → "Don't keep activities": leave app during billing, return → cart still there.
- [ ] Tablet / unfolded foldable, landscape: layout usable (portrait lock is ignored at API 36).
- [ ] 16 KB page-size emulator image: app opens (Cordova shell has no own native libraries, but check).
- [ ] Slow 3G (Developer options or Jio weak signal): pages load, no endless spinner.

## Before Play Store release
- [ ] Target API 36 ✔ (this branch). Signed **release** AAB (`cordova build android --release --packageType=bundle`).
- [ ] Account deletion in-app + public web link (decision D1).
- [ ] Privacy Policy + Terms public URLs (decision D7), linked in app and in Play listing.
- [ ] Data Safety form: name, phone, email, purchase/udhar records, camera (not stored).
- [ ] Billing policy decided for subscriptions (decision D3).
- [ ] New personal developer account: closed test with ≥12 testers for 14 days.
- [ ] Remove `allow-intent http://*/*` if not needed; keep `allow-navigation` limited to your domain.
