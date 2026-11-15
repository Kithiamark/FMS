# Backend Needs & Specification Document

This document lists the required Django REST Framework backend endpoints, schemas, and contract requirements to support the frontend's role-aware Arvion AI surfaces and logistics workflows. All frontend callers are implemented in `src/hooks/useAI.js` and `src/hooks/useAggregator.js` with non-blocking graceful fallbacks.

---

## 1. Role-Aware AI Assistant & Feedback

### `POST /api/v1/ai/chat/`
- **Purpose**: Power the role-aware Arvion AI assistant widget and expandable drawer.
- **Request Body**:
  ```json
  {
    "message": "What is the recommended TMR ration for a 22L Friesian cow?",
    "history": [
      { "role": "user", "content": "Hello" },
      { "role": "model", "content": "Hello! I am your Arvion AI Advisor." }
    ],
    "roleContext": {
      "role": "FARMER", // "FARMER" | "FARM_WORKER" | "VETERINARIAN" | "AGGREGATOR" | "ADMIN"
      "userName": "John Kamau",
      "farmId": 12
    }
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "response": "For a 22-litre daily producing Friesian in Kiambu, target 16-18 kg Dry Matter intake consisting of 60% high-quality wilted Napier grass / silage and 40% commercial dairy meal concentrate (16% Crude Protein)...",
    "provider": "arvion-ai",
    "mode": "live",
    "farm_context": {
      "farm_name": "Kamau Dairy Farm",
      "county": "Kiambu",
      "active_animals": 14,
      "sick_animals": 1,
      "last_7_days_milk_litres": 980
    }
  }
  ```

### `POST /api/v1/ai/feedback/`
- **Purpose**: Collect user thumbs up / thumbs down ratings on AI responses for reinforcement and prompt fine-tuning.
- **Request Body**:
  ```json
  {
    "messageId": "msg_3",
    "score": "UP", // "UP" | "DOWN"
    "role": "FARMER",
    "notes": "Optional feedback text"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Feedback recorded."
  }
  ```

---

## 2. Aggregator Intelligence & Forecasting

### `GET /api/v1/ai/aggregator/supply-forecast/`
- **Purpose**: Provide regional milk collection forecast, route volume drop percentage, and risk mitigation strategies to off-takers.
- **Headers**: `Authorization: Bearer <token>` (Aggregator role required)
- **Response (200 OK)**:
  ```json
  {
    "region": "Central Kenya (Kiambu / Muranga)",
    "forecast_drop_pct": 14,
    "confidence_score": 0.92,
    "title": "Central Region Milk Supply & Risk Intelligence",
    "summary": "Projected 14% drop in morning collections over the next 10 days driven by regional heat stress (+2.8°C above seasonal mean) and sporadic feed concentrate delivery delays.",
    "risk_drivers": [
      {
        "name": "Heat Stress Index",
        "detail": "Peak daytime temperature reaching 28.5°C in Limuru sub-county, lowering cow dry matter intake."
      },
      {
        "name": "Subclinical Mastitis Flags",
        "detail": "14 subclinical mastitis alerts reported by connected veterinary practitioners in the last 7 days."
      }
    ],
    "recommendations": [
      "Reroute fleet surplus tankers towards Muranga South & Nyandarua high-altitude co-ops.",
      "Enforce mandatory 68% ethanol platform testing on all morning collections to reject milk with elevated titratable acidity.",
      "Maintain depot chilling storage at or below 3.8°C prior to processor transfer."
    ]
  }
  ```

---

## 3. Veterinary Clinical AI Services

### `GET /api/v1/ai/vet/pre-visit-brief/?visit_id=<id>`
- **Purpose**: Synthesize client herd telemetry, at-risk animals, 7-day milk dips, and diagnostic equipment recommendations before a veterinarian departs for a farm visit.
- **Headers**: `Authorization: Bearer <token>` (Veterinarian role required)
- **Response (200 OK)**:
  ```json
  {
    "visit_id": 42,
    "farm_name": "Muguga Highlands Farm",
    "at_risk_count": 2,
    "recent_milk_average_litres": 185.4,
    "clinical_focus_points": [
      "Cow Bessie (Tag #042) flagged with sudden 35% milk yield drop over past 48 hours.",
      "Suspected acute mastitis in left hind quarter; elevated somatic cell indicators reported.",
      "Routine annual Anthrax and Blackquarter vaccination due for 6 yearling heifers."
    ],
    "diagnostic_recommendations": "Pack California Mastitis Test (CMT) kit, sterile teat cannulas, broad-spectrum intramammary tubes, and cold-box vaccines (2-8°C)."
  }
  ```

---

## 4. Platform Administration & Anomaly Detection

### `GET /api/v1/ai/admin/anomalies/`
- **Purpose**: Detect multi-tenant systemic anomalies (e.g., milk yield drops exceeding threshold, subscription churn clusters, sudden unread support tickets).
- **Headers**: `Authorization: Bearer <token>` (Admin role required)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "anom_1",
      "title": "Elevated Subclinical Mastitis Alerts in Kiambu Corridor",
      "severity": "HIGH",
      "description": "28 farms in Kikuyu and Limuru reported sudden 20%+ yield reductions and elevated somatic cell flags within the last 48 hours.",
      "detected_at": "2026-10-28T00:15:00Z"
    },
    {
      "id": "anom_2",
      "title": "Milk Collection Lactometer Variance Spike",
      "severity": "MEDIUM",
      "description": "Aggregator depot #4 logged 6 rejected batches due to lactometer reading < 1.025 sp.gr.",
      "detected_at": "2026-10-27T18:40:00Z"
    }
  ]
  ```

### `POST /api/v1/ai/admin/ask-data/`
- **Purpose**: Natural-language data analyst for platform administrators to query real-time database state across farmers, vets, aggregators, and revenue.
- **Request Body**:
  ```json
  {
    "query": "Which sub-counties had the highest milk collection growth this month?"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "query": "Which sub-counties had the highest milk collection growth this month?",
    "answer": "Kiambu South and Limuru registered the highest intake growth (+18.4% and +14.1% MoM respectively), driven by 8 new commercial dairy co-op registrations.",
    "data_points": {
      "kiambu_south_growth_pct": 18.4,
      "limuru_growth_pct": 14.1,
      "total_additional_litres": 24200
    }
  }
  ```

---

## 5. Security & Authentication Requirements
1. **Role-Based Access Control (RBAC)**: All endpoints must validate the JWT token role claim (`user.role`). Requests from unauthorized roles should return `403 Forbidden`.
2. **Rate Limiting**: Protect AI generation endpoints (`/ai/chat/`, `/ai/admin/ask-data/`) with a per-user rate limit (e.g. 60 requests/minute for standard users, 120/minute for admin).
3. **Data Privacy**: No Personally Identifiable Information (PII) such as KRA PINs, National ID numbers, or raw phone numbers should be included in prompt contexts sent to external LLMs.
