# Developer Guide

This guide is for anyone modifying or debugging FarmVista. It explains where the important code lives, how requests move through the app, and where to look when something breaks.

## Architecture At A Glance

- Frontend: React, React Router, TanStack Query, Tailwind, Recharts.
- Backend: Django, Django REST Framework, JWT auth, SQLite locally.
- API base: `http://127.0.0.1:8001/api/v1` by default.
- Main local URLs: frontend `http://127.0.0.1:3000`, backend `http://127.0.0.1:8001`.

Most farmer screens follow this flow:

1. A page component in `frontend/src/pages`.
2. A hook in `frontend/src/hooks` calls `frontend/src/api/axios.js`.
3. Django routes the request from an app `urls.py` file to a DRF viewset or APIView.
4. The view returns JSON that is cached by TanStack Query.

## Frontend Map

- `frontend/src/App.jsx`: route registration and role protection.
- `frontend/src/context/AuthContext.jsx`: login, logout, current-user hydration, and token setup.
- `frontend/src/api/axios.js`: shared API client plus JWT refresh handling.
- `frontend/src/components/Layout/MainLayout.jsx`: farmer shell, topbar, and mobile wrapper.
- `frontend/src/components/Layout/Sidebar.jsx`: farmer navigation.
- `frontend/src/components/Layout/MobileNav.jsx`: bottom navigation for mobile.
- `frontend/src/components/ui`: small reusable UI primitives.

Important pages:

- `Dashboard.jsx`: first authenticated farmer screen. It combines dairy, finance, health, and quick actions.
- `DailyMilkEntry.jsx`: saves per-animal milk records for a selected date.
- `ProductionDashboard.jsx`: monthly dairy analytics and milk usage.
- `Finance.jsx`: income and expense entry plus transaction summaries.
- `Alerts.jsx`: reminder creation and alert queue.
- `Settings.jsx`: account and farm profile editing.
- `Insights.jsx`: AI recommendations, prediction summaries, and risk signals.

## Backend Map

- `backend/fms_core/urls.py`: top-level API route composition.
- `backend/accounts`: users, auth, JWT login, registration, current-user endpoint.
- `backend/farms`: farm profile data.
- `backend/animals`: animal CRUD plus AI/recommendation API views.
- `backend/dairy`: milk record model, serializer, and daily/monthly summaries.
- `backend/finance`: income, expenses, and finance summary endpoint.
- `backend/alerts`: alert CRUD and scheduled alert tasks.
- `backend/vets` and `backend/chat_module`: vet-facing workflows and messages.

## Authentication Debugging

Login writes `access_token` and `refresh_token` to `localStorage`. The Axios client adds the access token to every API request and attempts one refresh on a `401`.

If login loops back to `/login`:

- Check the backend is running on `127.0.0.1:8001`.
- Check `VITE_API_BASE_URL` is not pointing to the wrong port.
- In browser dev tools, inspect `localStorage.access_token`.
- Call `GET /api/v1/auth/me/` with the same token to confirm the backend accepts it.
- Check `AuthContext.jsx`: route protection waits for `loading` to finish before redirecting.

## Dairy Data Debugging

Milk records are tied to animals, and animals are tied to farms. Farmer users can only see records for their own farm.

Key endpoints:

- `GET /api/v1/milk/summary/daily/?date=YYYY-MM-DD`
- `GET /api/v1/milk/summary/monthly/?year=YYYY&month=M`
- `POST /api/v1/milk/bulk/`

When dairy totals look wrong:

- Confirm the selected date/month in the frontend.
- Check each `MilkRecord` has `morning_yield`, `evening_yield`, and the usage fields.
- `total_yield` is computed by the model; do not manually treat it as user input.
- The daily summary returns both raw `records` and aggregated `usage`.

## AI Recommendation Debugging

The current AI layer is local and deterministic. It does not call an external model by default.

Key file:

- `backend/animals/ai_views.py`

Important endpoints:

- `GET /api/v1/ai/farm-health/`
- `GET /api/v1/ai/recommendations/`
- `POST /api/v1/ai/predict/feed-recommendation/`
- `POST /api/v1/ai/predict/disease-risk/`
- `POST /api/v1/ai/predict/milk-yield/`

The recommendation endpoint combines:

- Milk history per animal.
- Simple linear projection for near-term yield.
- Health status.
- Vaccination due dates.
- Recent production changes.

When changing this code, keep the response shape stable because `frontend/src/pages/Insights.jsx` expects specific keys such as `model`, `summary`, `animal_predictions`, and `recommendations`.

## Finance Debugging

The finance page reads one summary endpoint:

- `GET /api/v1/income/summary/?year=YYYY&month=M`

That endpoint returns income totals, expense totals, net position, category/source breakdowns, and recent transactions. If the Money page is empty, check the month filter first.

## Membership And Payment Testing

Plans are defined in `backend/finance/serializers.py` as `PLAN_CATALOG`:

- Trial: free first month for learning-data capture.
- Basic: KES 500, vet ratings/contact/booking/texting, better AI, communities.
- Premium: KES 1000, Basic plus newsletters, weather, breed tips, personal vet sections.
- Enterprise: KES 2000, Premium plus head farmer and worker accounts.

Key endpoints:

- `GET /api/v1/subscription/`
- `POST /api/v1/subscription/checkout/`

Checkout currently supports test mode. In test mode, the app creates a `PaymentIntent`, marks it `TEST_APPROVED`, and activates the selected plan without contacting M-Pesa. This lets the UI, audit logs, and permissions be tested before production keys are available.

When M-Pesa keys are ready, replace the `PENDING_KEYS` path in `SubscriptionViewSet.checkout` with the real STK push call, then update `PaymentIntent` from the callback.

## OTP And Security

OTP endpoints:

- `POST /api/v1/auth/request-otp/`
- `POST /api/v1/auth/verify-otp/`

Development test OTP is `123456`. The backend stores only a hash and expiry time, tracks attempts, and marks `phone_verified=True` after a successful verification. Replace the fixed test OTP with a random code when the SMS provider is configured.

Activity logs live in `core.AuditLog`. The middleware logs successful mutating API requests, and critical flows such as login, OTP, subscription checkout, worker creation, and community posts add domain-specific metadata.

## Community Debugging

Community posts live under:

- `GET /api/v1/community/posts/`
- `POST /api/v1/community/posts/`

Use `type` and `county` query params for filtering. Posts support discussion, price, alert, and trend types. These records can later feed newsletters and LLM context retrieval.

## Enterprise Worker Accounts

Enterprise farms can create worker accounts through:

- `GET /api/v1/farm-workers/`
- `POST /api/v1/farm-workers/`

Worker accounts use role `FARM_WORKER` and `assigned_farm`. Their activity is logged against the head farmer's farm, which lets the farm admin review who entered what.

## UI Modification Tips

- Keep operational pages dense and scannable. Farmers should see the numbers first, then actions.
- Put page-level data fetching in hooks, not inline Axios calls, unless it is a one-off export.
- Keep cards shallow. Avoid cards inside cards unless the inner item is a repeated row.
- Use `lucide-react` icons for controls and section labels.
- Keep route labels in sync across `Sidebar.jsx`, `MobileNav.jsx`, and `App.jsx`.
- If you add a new API mutation, invalidate the matching TanStack Query keys in the hook so the UI refreshes.

## Common Commands

```bash
# Frontend
cd frontend
npm run lint
npm run build
npm run dev -- --host 127.0.0.1 --port 3000

# Backend
cd backend
python manage.py check
python manage.py migrate
python -m pytest -q
python manage.py runserver 127.0.0.1:8001
```

## Production Readiness Notes

- Move secrets and external service keys to environment variables.
- Replace the local deterministic AI layer with a real model service only after preserving the API response shape.
- Add stricter backend validation around finance categories and alert scheduling as workflows mature.
- Split the frontend bundle with route-level lazy loading if the Vite chunk warning becomes a deployment concern.
