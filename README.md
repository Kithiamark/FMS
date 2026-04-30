# FarmVista Farm Management System

A dairy farm management app for Kenyan farmers. It covers farmer login, herd records, milk production and usage, finance tracking, alerts, vet workflows, and local AI-style recommendations.

## Quick Start

Backend:

```bash
cd backend
python manage.py migrate
python manage.py runserver 127.0.0.1:8001
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

The frontend API client defaults to `http://127.0.0.1:8001/api/v1`. Override it with `VITE_API_BASE_URL` when needed.

## Useful Checks

```bash
cd frontend
npm run lint
npm run build

cd ../backend
python manage.py check
python -m pytest -q
```

## Core Modules

- `frontend/src/pages/Dashboard.jsx`: farmer command center after login.
- `frontend/src/pages/DailyMilkEntry.jsx`: date-based milk entry table.
- `frontend/src/pages/ProductionDashboard.jsx`: dairy trends and usage ledger.
- `frontend/src/pages/Finance.jsx`: income, expense, and transaction tracking.
- `frontend/src/pages/Insights.jsx`: recommendations and AI-facing summaries.
- `backend/dairy`: milk record APIs and summary endpoints.
- `backend/animals/ai_views.py`: local recommendation and prediction logic.
- `backend/alerts`: alerts, reminders, and scheduled summary tasks.
- `backend/finance`: income and expense APIs.

For a deeper map of the codebase and debugging tips, read [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).
# FMS
