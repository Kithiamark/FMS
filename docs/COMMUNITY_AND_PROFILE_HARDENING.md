# Community & Profile Subsystem Hardening

## Overview
This document tracks the technical hardening applied to the Profile and Social Media / Community subsystems prior to decoupling them into an independent microservice.

---

## 1. Unique Community & Social Handles
- **Model**: [`accounts.User`](file:///home/kithia/Projects/FMS/backend/accounts/models.py)
  - `handle`: Unique, indexed lowercase string (`max_length=50`, alphanumeric + underscore).
  - Normalization: Auto-strips `@` prefixes, standardizes spaces and special characters into underscores.
  - Auto-Generation on Save: Automatically generates a collision-free candidate from the user's `full_name` (e.g. `baraka_farm`, `baraka_farm_1`).
  - Validation: Validated in `UserRegistrationSerializer` and `UserSerializer` with distinct 400 rejection on collision.
- **Cross-Platform Exposure**:
  - Web: Exposed in [`Settings.jsx`](file:///home/kithia/Projects/FMS/frontend/src/pages/Settings.jsx) under User Profile details.
  - Mobile: Displayed and editable via [`SettingsScreen.kt`](file:///home/kithia/Projects/FMS/FMS/app/src/main/java/com/example/fms/ui/screens/settings/SettingsScreen.kt) header pill.
  - Community Feed: Attached to every post via `author_handle` in [`CommunityPostSerializer`](file:///home/kithia/Projects/FMS/backend/community/serializers.py).

---

## 2. Scalable Community Feed Pagination
- **Pagination Class**: [`core.pagination.CommunityPostPagination`](file:///home/kithia/Projects/FMS/backend/core/pagination.py)
  - Standard DRF PageNumberPagination: 20 posts per page, configurable up to 100 via `?page_size=`.
  - Replaces the hard `[:100]` query slice in [`CommunityPostViewSet`](file:///home/kithia/Projects/FMS/backend/community/views.py).
- **Database Index Optimization**:
  - Added multi-column compound indexes to `CommunityPost`:
    - `(community, -created_at)`
    - `(county, -created_at)`
    - `(post_type, -created_at)`

---

## 3. Automated Announcement Ingestion & Notifications
- **Fanout Pipeline**: [`admin_panel.views.AnnouncementViewSet._fanout_announcement`](file:///home/kithia/Projects/FMS/backend/admin_panel/views.py)
  - When an announcement is published by an admin:
    - **Veterinarians**: All active veterinarian users (`User.Role.VETERINARIAN`).
    - **Paying Farmers**: All active farmer accounts whose farm holds an active subscription (`Subscription.Status.ACTIVE`).
  - **Delivery Channels**:
    1. **Inbox Support Thread**: A high-priority system thread `[Platform Announcement] {title}` is generated in each recipient's inbox.
    2. **Push / Notification Alert**: A corresponding `Alert(channel='PUSH')` entry is created for the farm operator.

---

## 4. Verification Suite
- `backend/accounts/tests.py`:
  - `test_user_handle_auto_generation_and_uniqueness`: Verifies handle auto-generation, sequential collision suffixing, and 400 rejection on duplicate handles.
- `backend/community/tests.py`:
  - `test_community_posts_pagination_and_handle`: Verifies DRF pagination response structure (`count`, `next`, `results`) and `author_handle` presence.
- `backend/admin_panel/tests.py`:
  - `test_announcement_fanout_to_paying_farmers_and_vets`: Verifies automatic inbox ticket creation and alert dispatch for paying farmers and vets, and exclusion of expired accounts.
