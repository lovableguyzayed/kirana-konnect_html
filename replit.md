# Kirana Konnect

A Flask-based mobile-style web app for kirana (Indian grocery) store management.

## Features
- Inventory management (products, stock levels, expiry alerts)
- Billing / POS with cart and receipt generation
- Customer ledger and pending credits tracking
- Sales reports and profit/loss tracking
- Staff management
- Barcode scanning
- Notifications (low stock, expiry, pending payments)

## Stack
- **Backend:** Python 3.11, Flask, Gunicorn
- **Frontend:** HTML/CSS/JS templates (Jinja2), Tailwind CSS (CDN), Chart.js
- **Data:** Currently uses in-memory sample data; PostgreSQL + SQLAlchemy are listed as dependencies but not yet wired up

## How to run
The app starts automatically via the **Start application** workflow:
```
gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
```
Entry point is `main.py` (imports `app` from `app.py`).

## Project structure
- `main.py` — WSGI entry point
- `app.py` — Flask routes and sample data
- `templates/` — Jinja2 HTML templates
- `static/js/` — Client-side JavaScript (universal-scanner.js)
- `attached_assets/` — Reference screenshots and HTML snapshots

## User preferences
