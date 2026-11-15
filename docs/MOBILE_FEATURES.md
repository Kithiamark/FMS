# Mobile Feature Tracking & Web-to-Mobile Parity Registry

This document persistently registers all native Android Jetpack Compose screens, their web platform counterparts, backing Django REST API endpoints, and operational workflows in accordance with the **Feature Documentation & Tracking Invariant** ([`GEMINI.md`](../GEMINI.md)).

---

## 1. Farmer Field Pack

### Feature 1: Milk Off-taker & Cooperative Discovery (`FIND_BUYER`)

* **Purpose & User Workflow**:
  Enables smallholder and commercial dairy farmers to discover licensed cooperatives, commercial milk processors (e.g. Brookside, KCC, Bio Foods), and chilling stations within their county and adjoining routes. Farmers can filter by county, inspect minimum farmgate spot payouts (e.g., KES 54.00 - 58.00 / L), review intake quality requirements (lactometer density $\ge 1.028$, $68\%$ alcohol test, chilling threshold $<4^\circ\text{C}$), directly call procurement officers, and submit an off-take supply connection request.
* **Associated Screens / Routes**:
  - **Mobile**: [`FindBuyerScreen.kt`](../FMS/app/src/main/java/com/example/fms/ui/screens/farmer/buyers/FindBuyerScreen.kt) (`AppDestination.FIND_BUYER`)
  - **Web**: [`FindBuyer.jsx`](../frontend/src/pages/FindBuyer.jsx) (`/find-buyer`)
* **Backend Models, Endpoints & Permissions**:
  - Models: [`AggregatorProfile`](../backend/aggregators/models.py#L4), [`AggregatorFarmConnection`](../backend/aggregators/models.py#L22)
  - Endpoints:
    - `GET /api/v1/aggregators/?county=<county>` (List verified buyers)
    - `POST /api/v1/aggregators/connections/` (Submit off-take connection)
    - `GET /api/v1/aggregators/connections/` (Check active connection status)
  - Permissions: Authenticated (`IsAuthenticated`), Farmer or Worker roles.
* **State Models & Key Actions**:
  - Data class `BuyerOffTaker` (`id`, `organizationName`, `county`, `operatingCounties`, `farmgatePriceKes`, `paymentTerms`, `tankerCapacityLitres`, `connectionStatus`).
  - Key Actions: County chip filter, search filter, Direct Phone Dialing (`Intent.ACTION_DIAL`), Request Off-take Modal (`IslandModal`).
* **Verification Steps**:
  - Light mode preview: `FindBuyerScreenLightPreview()`
  - Dark mode preview: `FindBuyerScreenDarkPreview()`
  - Navigation from `FarmerDashboard` quick action row.

---

### Feature 2: Time-Sensitive Herd Alerts & Withdrawal Notices (`ALERTS`)

* **Purpose & User Workflow**:
  Provides dairy operators with a prioritized real-time alert center. Critical clinical warnings include antibiotic milk withdrawal period countdowns (preventing antibiotic-contaminated milk from entering the bulk chilling tank and facing costly cooperative rejection), 21-day standing heat observation reminders, semi-annual Foot and Mouth Disease (FMD) herd booster vaccines, and Sabbath settlement freeze notifications. Farmers can also schedule custom field reminders dispatched via SMS or Push.
* **Associated Screens / Routes**:
  - **Mobile**: [`AlertsScreen.kt`](../FMS/app/src/main/java/com/example/fms/ui/screens/farmer/alerts/AlertsScreen.kt) (`AppDestination.ALERTS`)
  - **Web**: [`Alerts.jsx`](../frontend/src/pages/Alerts.jsx) (`/alerts`)
* **Backend Models, Endpoints & Permissions**:
  - Models: [`Alert`](../backend/alerts/models.py#L6), [`HealthRecord`](../backend/animals/models.py#L72) (`withdrawal_period_days`), [`Subscription`](../backend/finance/models.py#L47) (`is_sabbath_window`)
  - Endpoints:
    - `GET /api/v1/alerts/` (Fetch pending/unread alerts)
    - `POST /api/v1/alerts/` (Schedule new alert)
    - `PATCH /api/v1/alerts/{id}/` (Mark alert as read)
  - Permissions: Authenticated (`IsAuthenticated`).
* **State Models & Key Actions**:
  - Data class `FarmerAlert` (`id`, `alertType`, `title`, `message`, `animalTag`, `scheduledAt`, `channel`, `isRead`, `isPriorityUrgent`).
  - Key Actions: Filter by category (Withdrawals, Vaccines, Heat, Sabbath), Mark Read / Unread toggle, "Schedule Herd Alert" interactive modal.
* **Verification Steps**:
  - Light mode preview: `AlertsScreenLightPreview()`
  - Dark mode preview: `AlertsScreenDarkPreview()`
  - Navigation from `FarmerDashboard` quick action row.

---

### Feature 3: Farm Worker Tasks & Daily Chore Center (`WORKER_TASKS`)

* **Purpose & User Workflow**:
  Provides a dual-mode task center for farm workers and dairy operators:
  1. **Personal Farm To-Do Checklist ("My To-Do")**: Personal task tracking with progress percentage metrics (Total, Completed, Completion Rate), quick-add suggestion chips ("Replenish salt licks", "Check cooler temp", "Order dairy meal"), category tags, interactive completion checkboxes, and strike-through states.
  2. **Enterprise Worker Chore Dispatch ("Worker Chores")**: Multi-worker dispatch suite exclusively available on the Enterprise tier (or Admin). Allows farm owners to assign routine chores to specific workers (milkers, feeders, quality controllers), specify instructions, set shift due times, and track status transitions (`PENDING` ➔ `IN_PROGRESS` ➔ `COMPLETED`). Workers can cycle and update their shift duty statuses in real time.
* **Associated Screens / Routes**:
  - **Mobile**: [`WorkerTasksScreen.kt`](../FMS/app/src/main/java/com/example/fms/ui/screens/worker/WorkerTasksScreen.kt) (`AppDestination.WORKER_TASKS`)
  - **Web**: [`WorkerTasks.jsx`](../frontend/src/pages/WorkerTasks.jsx) (`/worker-tasks`)
* **Backend Models, Endpoints & Permissions**:
  - Models: [`WorkerTask`](../backend/farms/models.py#L19) (`farm`, `assigned_to`, `title`, `description`, `status`, `due_date`, `completed_at`)
  - Endpoints:
    - `GET /api/v1/farms/tasks/` (List tasks for farm; worker sees assigned tasks, farmer sees all)
    - `POST /api/v1/farms/tasks/` (Create and assign task, requires Enterprise tier)
    - `PATCH /api/v1/farms/tasks/{id}/` (Update status to `IN_PROGRESS` or `COMPLETED`)
    - `DELETE /api/v1/farms/tasks/{id}/` (Delete task, owner/admin only)
  - Permissions: Authenticated (`IsAuthenticated`), Farmer or Worker roles.
* **State Models & Key Actions**:
  - Data classes: `PersonalTodoItem` (`id`, `title`, `isCompleted`, `createdAt`, `category`), `EnterpriseChoreItem` (`id`, `title`, `description`, `assignedTo`, `roleBadge`, `dueDate`, `status`, `priority`).
  - Key Actions: Dual mode switcher ("My To-Do" vs "Worker Chores"), Add To-Do with quick-tag autofill, Cycle chore status ("Start Chore", "Mark Done"), Assign Task modal dialog (`IslandModal`), Delete confirmation modal.
* **Verification Steps**:
  - Light mode preview: `WorkerTasksScreenLightPreview()`
  - Dark mode preview: `WorkerTasksScreenDarkPreview()`
  - Navigation from `FarmerDashboard` ("Manage All Tasks & Chores" row) and `WorkerDashboard` ("Open Full Task Center" row).

---

### Feature 4: Veterinary Clinical Visits & On-Farm Schedules (`VET_VISITS`)

* **Purpose & User Workflow**:
  Equips veterinary surgeons and field officers with an on-farm schedule management and callout workflow:
  1. **Clinical Schedule Center**: Displays upcoming farm visits categorized by urgency (*Routine Herd Check*, *Emergency Callout*, *Vaccination Drive*, *Consultation*).
  2. **Direct Farmer Dialing & Navigation**: Provides 1-tap phone dispatch (`Intent.ACTION_DIAL`) to farm managers and displays route location details.
  3. **Agenda & Calendar View**: Quick monthly clinical overview highlighting booked vs free dates.
  4. **Schedule Visit Modal**: Allows vets to book new farm appointments with connected dairy farms, set shift time slots (*Morning 09:00 AM*, *Afternoon 02:00 PM*, etc.), document clinical preparation instructions, and log estimated consultation fees (KES).
  5. **Status Lifecycle**: Track appointments from `SCHEDULED` ➔ `COMPLETED` or `CANCELLED`.
* **Associated Screens / Routes**:
  - **Mobile**: [`VetVisitsScreen.kt`](../FMS/app/src/main/java/com/example/fms/ui/screens/vet/VetVisitsScreen.kt) (`AppDestination.VET_VISITS`)
  - **Web**: [`VetVisits.jsx`](../frontend/src/pages/vet/VetVisits.jsx) (`/vet/visits`)
* **Backend Models, Endpoints & Permissions**:
  - Models: [`VetVisit`](../backend/vets/models.py#L116) (`vet`, `farm`, `scheduled_date`, `visit_type`, `status`, `notes`, `cost_kes`)
  - Endpoints:
    - `GET /api/v1/vet/data/visits/` (List all scheduled and past visits for vet)
    - `POST /api/v1/vet/data/visits/` (Schedule new on-farm appointment)
    - `PATCH /api/v1/vet/data/visits/{id}/` (Mark visit completed or update notes)
  - Permissions: Authenticated (`IsAuthenticated`), Veterinarian role (`VETERINARIAN`).
* **State Models & Key Actions**:
  - Data class: `MobileVetVisit` (`id`, `farmName`, `farmerName`, `farmerPhone`, `location`, `scheduledDate`, `visitType`, `status`, `clinicalNotes`, `costKes`).
  - Key Actions: List / Calendar mode toggle, Filter chips (`All`, `Scheduled`, `Completed`, `Emergency`), Direct Call, Mark Completed, Schedule Visit modal sheet (`IslandModal`).
* **Verification Steps**:
  - Light mode preview: `VetVisitsScreenLightPreview()`
  - Dark mode preview: `VetVisitsScreenDarkPreview()`
  - Navigation from `VetDashboard` ("Open Full Visits Center" header button).

---

### Feature 5: Dairy Production Analytics & 30-Day Ledger (`PRODUCTION_DASHBOARD`)

* **Purpose & User Workflow**:
  Comprehensive production and allocation management for commercial dairy operations:
  1. **Historical Monthly Metrics**: Tracks monthly gross yield, household consumption, cooperative sales volume, calf feeding, and average daily output per cow.
  2. **Allocation Stacked Ratio**: Visualizes percentage distribution (e.g. 87% Sold, 9% Calves, 4% Home) and balance indicators.
  3. **30-Day Ledger**: Day-by-day production breakdown with 1-tap rebalancing navigation.
  4. **Report Export**: Instant export of monthly production logs.
* **Associated Screens / Routes**:
  - **Mobile**: [`ProductionDashboardScreen.kt`](../FMS/app/src/main/java/com/example/fms/ui/screens/farmer/milk/ProductionDashboardScreen.kt) (`AppDestination.PRODUCTION_DASHBOARD`)
  - **Web**: [`ProductionDashboard.jsx`](../frontend/src/pages/ProductionDashboard.jsx) (`/dairy`)
* **Backend Models, Endpoints & Permissions**:
  - Models: [`MilkRecord`](../backend/milk/models.py)
  - Endpoints:
    - `GET /api/v1/milk/summary/monthly/?year={year}&month={month}`
    - `GET /api/v1/milk/stats/`
  - Permissions: Authenticated (`IsAuthenticated`), Farmer or Worker roles.
* **State Models & Key Actions**:
  - Data class: `DailyLedgerItem` (`date`, `producedLitres`, `homeLitres`, `soldLitres`, `calvesLitres`, `isBalanced`).
  - Key Actions: Month/Year selector, Ledger row navigation, Export summary report.
* **Verification Steps**:
  - Light mode preview: `ProductionDashboardScreenLightPreview()`
  - Dark mode preview: `ProductionDashboardScreenDarkPreview()`
  - Navigation from `FarmerDashboard` ("Production Analytics & Ledger" row).

---

### Feature 6: Connected Client Farms Directory (`VET_FARMS`)

* **Purpose & User Workflow**:
  Allows veterinary surgeons to manage their network of registered client farms, review livestock headcounts, inspect clinical flags (active drug withdrawals, pending vaccine boosters), and directly initiate phone contact with farm owners.
* **Associated Screens / Routes**:
  - **Mobile**: [`VetFarmsScreen.kt`](../FMS/app/src/main/java/com/example/fms/ui/screens/vet/VetFarmsScreen.kt) (`AppDestination.VET_FARMS`)
  - **Web**: [`VetFarms.jsx`](../frontend/src/pages/vet/VetFarms.jsx) (`/vet/farms`)
* **Backend Models, Endpoints & Permissions**:
  - Models: [`VetFarmConnection`](../backend/vets/models.py), [`Farm`](../backend/farms/models.py)
  - Endpoints: `GET /api/v1/vet/data/farms/`
  - Permissions: Authenticated (`IsAuthenticated`), Veterinarian role (`VETERINARIAN`).
* **State Models & Key Actions**:
  - Data class: `ClientFarmItem` (`id`, `name`, `owner`, `phone`, `county`, `totalCattle`, `lactatingCount`, `clinicalFlag`).
  - Key Actions: Farm search filter, Direct Call (`Intent.ACTION_DIAL`), View Herd Records.
* **Verification Steps**:
  - Light mode preview: `VetFarmsScreenLightPreview()`
  - Dark mode preview: `VetFarmsScreenDarkPreview()`
  - Navigation from `VetDashboard` ("Client Farm Directory" row).

---

### Feature 7: Admin Support Desk & Dispute Triage (`ADMIN_TICKETS`)

* **Purpose & User Workflow**:
  Provides system administrators with an on-call dispute and support triage desk for managing M-Pesa payment activations, IoT cooler alerts, and AI projection adjustments.
* **Associated Screens / Routes**:
  - **Mobile**: [`AdminTicketsScreen.kt`](../FMS/app/src/main/java/com/example/fms/ui/screens/admin/AdminTicketsScreen.kt) (`AppDestination.ADMIN_TICKETS`)
  - **Web**: [`AdminTickets.jsx`](../frontend/src/pages/admin/AdminTickets.jsx) (`/admin/tickets`)
* **Backend Models, Endpoints & Permissions**:
  - Models: Support Ticket & Audit models
  - Endpoints:
    - `GET /api/v1/admin/tickets/`
    - `PATCH /api/v1/admin/tickets/{id}/`
    - `POST /api/v1/admin/tickets/{id}/messages/`
  - Permissions: Superuser / Admin (`IsAdminUser`).
* **State Models & Key Actions**:
  - Data class: `SupportTicketItem` (`id`, `ticketNumber`, `farmName`, `farmerName`, `title`, `description`, `category`, `priority`, `status`, `createdAt`).
  - Key Actions: Status filters, Resolution reply modal (`IslandModal`), status lifecycle updates.
* **Verification Steps**:
  - Light mode preview: `AdminTicketsScreenLightPreview()`
  - Dark mode preview: `AdminTicketsScreenDarkPreview()`
  - Navigation from `AdminDashboard` ("Farmer Support & Dispute Desk" row).

---

## 2. Web-to-Mobile Parity Status Matrix

| Route Name | Mobile Destination (`FMS/app/`) | Web Platform (`frontend/src/`) | Parity Status |
| :--- | :--- | :--- | :--- |
| **Login / Register / OTP** | `SPLASH`, `LOGIN`, `REGISTER`, `OTP_VERIFY` | `/login`, `/register`, `/otp` | **100% Parity** |
| **Farmer Dashboard** | `MAIN_APP` (Dashboard Tab) | `/dashboard` | **100% Parity** |
| **Herd Management** | `HERD_OVERVIEW`, `ANIMAL_DETAIL` | `/animals`, `/animals/:id` | **100% Parity** |
| **Daily Milk Recording** | `DAILY_MILK_ENTRY`, `MILK_ALLOCATION` | `/dairy/record` | **100% Parity** |
| **Production Analytics** | `PRODUCTION_DASHBOARD` (`ProductionDashboardScreen.kt`) | `/dairy` | **100% Parity (NEW)** |
| **Find Verified Buyers** | `FIND_BUYER` (`FindBuyerScreen.kt`) | `/find-buyer` | **100% Parity (NEW)** |
| **Dairy Alerts & Notices** | `ALERTS` (`AlertsScreen.kt`) | `/alerts` | **100% Parity (NEW)** |
| **Worker Tasks & Chores** | `WORKER_TASKS` (`WorkerTasksScreen.kt`) | `/worker-tasks` | **100% Parity (NEW)** |
| **Finance & Cashflow** | `FINANCE` (`FinanceScreen.kt`) | `/finance` | **100% Parity** |
| **Find Registered Vet** | `FIND_VET` (`FindVetScreen.kt`) | `/find-vet` | **100% Parity** |
| **AI Farm Advisory** | `AI_OVERVIEW` (`AIOverviewScreen.kt`) | `/insights` | **100% Parity** |
| **Community & Social Feed**| `COMMUNITY` (`CommunityScreen.kt`) | `/community` | **100% Parity** |
| **Direct Messaging** | `MESSAGES`, `DIRECT_MESSAGE` | `/messages` | **100% Parity** |
| **Milking Keypad** | `WORKER_KEYPAD` (`MilkingKeypadScreen.kt`) | Parlor Keypad mode | **100% Parity** |
| **Worker Dashboard** | `WorkerDashboard.kt` | `/dashboard` (Worker) | **100% Parity** |
| **Vet Dashboard & Visits** | `VetDashboard.kt`, `VetRecordsScreen.kt`, `VetVisitsScreen.kt`, `VetFarmsScreen.kt` | `/vet/dashboard`, `/vet/records`, `/vet/visits`, `/vet/farms` | **100% Parity (NEW)** |
| **Aggregator Portal** | `AggregatorDashboard.kt`, `AggregatorConnectionsScreen.kt` | `/aggregator/dashboard` | **100% Parity** |
| **Admin Panel & Tickets** | `AdminDashboard.kt`, `AdminFarmersScreen.kt`, `AdminTicketsScreen.kt` | `/admin/dashboard`, `/admin/farmers`, `/admin/tickets` | **100% Parity (NEW)** |



