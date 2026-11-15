# Arvion FMS Design System & Shared Components

## 1. Design Tokens

### Base Neutral
- **Neutral Palette**: Tailored Slate (`#f8fafc` surface muted, `#ffffff` surface default, `#e2e8f0` border, `#0f172a` primary text).
- **Dark Mode Strategy**: Removed incomplete dark mode toggles and `darkMode: 'class'` in favor of a clean, high-contrast, accessible light slate base across all roles and pages.

### Per-Role Accents
Roles share identical component geometry, shadows, and radii, varying only in semantic accents:
- **FARMER & FARM_WORKER**: Forest Green (`#1a3a1f`), Mid Green (`#2e6b39`), Light Green (`#4caf50`), Subtle (`#ecfdf5`).
- **VETERINARIAN**: Vet Teal (`#0d9488`), Vet Navy (`#0f2744`), Subtle (`#f0fdfa`).
- **AGGREGATOR**: Logistics Blue (`#2563eb`), Dark Blue (`#1d4ed8`), Subtle (`#eff6ff`).
- **ADMIN**: Admin Electric Accent (`#2563eb`), System Slate (`#0f172a`), Subtle (`#f1f5f9`).

### Dimensions & Touch Targets
- **Corner Radii**: `--radius-card` (1rem / 16px), `--radius-btn` (0.75rem / 12px), `--radius-input` (0.75rem / 12px).
- **Mobile Touch Targets**: Minimum 44px (`touch-target`, `min-h-[44px]`, `min-w-[44px]`) to ensure full compliance on 360px mobile viewports.

---

## 2. Shared Component Library (`src/components/ui/`)

| Component | Path | Description & Props |
| :--- | :--- | :--- |
| **Card** | `src/components/ui/Card.jsx` | Base container with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`. |
| **StatCard** | `src/components/ui/StatCard.jsx` | Unified KPI card replacing `DataCard`. Supports `title`, `value`, `unit`, `icon`, `trend`, `trendUp`, `subtitle`, `accent` (farmer, vet, aggregator, admin, emerald, amber, red, blue), and skeleton loading state. |
| **DataCard** | `src/components/ui/DataCard.jsx` | Backward-compatibility forwarder to `StatCard`. |
| **PageHeader** | `src/components/ui/PageHeader.jsx` | Standard page header with responsive layout: `title`, `subtitle`, `badge`, `backTo`, and `actions` slot. |
| **Skeleton** | `src/components/ui/Skeleton.jsx` | Shimmer pulse loading element with presets: `SkeletonText`, `SkeletonCircle`, `SkeletonCard`, `SkeletonStatGrid`, `SkeletonTable`. |
| **EmptyState** | `src/components/ui/EmptyState.jsx` | Reusable empty state with icon, title, description, primary button action, and optional secondary action. |
| **ErrorState** | `src/components/ui/ErrorState.jsx` | Error alert state with retry action button. |
| **DataTable** | `src/components/ui/DataTable.jsx` | Responsive data grid rendering desktop HTML table (`md+`) and mobile stacked cards (<md). |
| **Badge** | `src/components/ui/Badge.jsx` | Multi-role status badges covering clinical statuses, verification, tasks, risk levels, and logistics. |

---

## 3. Unified Layout Architecture (`AppShell`)

- **`src/components/Layout/AppShell.jsx`**: Universal shell uniting Desktop Sidebar, Collapsible Drawer, Mobile Adaptive Bottom Navigation, Language Switcher (EN/SW), Alerts Modal, and Offline Queue Banner.
- **`src/components/Layout/shellConfig.js`**: Pure configuration defining navigation items, accents, and branding per role.
- **Role Layout Adapters**: `MainLayout`, `VetLayout`, `AggregatorLayout`, and `AdminLayout` cleanly delegate to `AppShell` with role overrides, preserving existing routes and guards in `App.jsx`.
