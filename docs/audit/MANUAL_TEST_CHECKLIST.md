# Manual test checklist (things I could not test here)

Tick each on a real phone after deploying this branch.

## Deploy
- [ ] Render: the blueprint now adds `OWNER_RESET_CODE`. For an existing service, add it by hand (Environment → Add, at least 6 characters) and note it somewhere safe.
- [ ] Render → Environment: set `SUPPORT_NAME`, `SUPPORT_PHONE`, `SUPPORT_WHATSAPP`, `SUPPORT_EMAIL`; open `/contact` and check they show.
- [ ] Read `/privacy` and `/terms` once and correct anything that is not true for your business.
- [ ] On a **test** shop only: `/account-deletion` deletes everything (do NOT try on the real shop).
- [ ] `/healthz` shows `database: connected` after deploy.
- [ ] Sign in works; after **10 wrong passwords** you see "Too many wrong attempts" (wait 15 min).
- [ ] Forgot password: wrong code → refused; right code → you are signed in.

## SMS OTP (after MSG91 + DLT are ready)
- [ ] Render: `SMS_PROVIDER=msg91`, `MSG91_AUTHKEY`, `MSG91_OTP_TEMPLATE_ID` set. Sign-in shows "Login with OTP".
- [ ] OTP arrives on Jio, Airtel, Vi and BSNL within 30-90 s; wrong OTP 3 times shows "tries left"; Resend unlocks after 30 s.
- [ ] Forgot Password → "Get OTP on my mobile" → new password works.
- [ ] Never leave `SMS_PROVIDER=console` on the live server (it writes codes to the log).

## Native feel, scanner, WhatsApp, UPI (real phone)
- [ ] Bottom bar: Home · Stock · Scan · Bill · Udhar on every main screen; screens change with a short slide, no white flash; Back is instant.
- [ ] Scan: camera opens, reads a real barcode, phone vibrates, product sheet appears; torch button works; unknown barcode → Add new product.
- [ ] Profile → set your real UPI ID. Cart → Online → customer scans the QR with GPay/PhonePe/Paytm: amount and shop name are correct. Money reaches your account.
- [ ] Receipt → Share on WhatsApp: the PDF (or bill text) reaches the customer's chat.
- [ ] Udhar → Remind: WhatsApp opens the right customer with the Hindi reminder.
- [ ] Receipt → Cancel bill on a test bill: stock returns, udhar and today's sales go down.
- [ ] Profile → Download stock / bills / udhar (Excel): file opens in Google Sheets with ₹ and Hindi readable.
- [ ] Inside the Android app: WhatsApp and UPI links open the other apps (Cordova `allow-intent`; see note in report).

## Khata, printing, offline (real phone)
- [ ] Home → Galla: set opening cash, make a cash sale, add a cash expense, pay a supplier in cash → "Should be in galla" matches your own sum. Enter counted cash → shows matches / short / extra.
- [ ] Next morning: opening cash equals last night's counted cash.
- [ ] Sales report → Net profit = profit from sales − expenses.
- [ ] Low Stock → Send order list on WhatsApp → pick the wholesaler → list is readable.
- [ ] Receipt → Print on your 58 mm or 80 mm thermal printer: nothing cut off on the right, no buttons printed.
- [ ] Turn on airplane mode and open any screen → "No internet" page; turn it off → the screen opens by itself.

## Discount, GST per item, returns, backup (real phone)
- [ ] Stock → open a product → Edit → change price, set GST % and HSN → Save. New bills use the new price.
- [ ] Cart → Add Offer → ₹ or % discount → total goes down; with Add Tax, GST is charged after the discount. Invoice PDF shows Discount, GST, HSN.
- [ ] Receipt → Return items → return 1 of several → stock +1, bill smaller, message tells how much to give back; udhar bill → due goes down.
- [ ] Profile → Download full backup → file saves on the phone; keep a copy on Google Drive.

## Staff mode & Hindi
- [ ] Profile → Turn on staff mode → set PIN → profit shows 🔒, Profile/Reports are blocked, billing still works; badge → PIN unlocks.
- [ ] Sign-in → Preferred Language → हिंदी: menus, buttons and messages in Hindi at max font size.

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
- [x] Account deletion in-app + public web link (`/account-deletion`).
- [ ] Privacy Policy `/privacy` + Terms `/terms` ✔ in app; add the `/privacy` URL to the Play listing and `/account-deletion` to the Data safety form.
- [ ] Data Safety form: name, phone, email, purchase/udhar records, camera (not stored).
- [x] No in-app purchases (pricing hidden) → no Play Billing needed for now.
- [ ] New personal developer account: closed test with ≥12 testers for 14 days.
- [ ] Remove `allow-intent http://*/*` if not needed; keep `allow-navigation` limited to your domain.
