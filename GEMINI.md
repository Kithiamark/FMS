# Workspace Guidelines

## Clarification & Verification Invariant
- Always ask clarifying questions whenever user instructions, requirements, bug descriptions, or architectural decisions are ambiguous, vague, or underspecified.
- Never make silent assumptions on ambiguous specifications; present options or ask for explicit confirmation before proceeding.
- When performing sequential multi-step fixes, clearly state the proposed step, await user review and explicit approval, and verify each step before advancing to the next.

## Git Push Policy
- **NEVER** execute `git push` unless the user explicitly asks you to push code in that specific prompt.
- Staging (`git add`) and local commits (`git commit`) for verification are allowed, but remote pushes are strictly opt-in by user request.

## Web-to-Mobile Parity & Full-Stack Invariant
- When designing, building, or modifying native mobile screens (`FMS/app/`), ALWAYS compare against the existing web implementation in `frontend/src/` (pages, components, layouts, state models).
- Do not implement partial or "halfway" mockups; mirror the real operational depth present on the web platform.
- When mobile or frontend workflows require new fields, endpoints, or data relationships (e.g. vet clinical orders, aggregator quality test metrics, admin audit logs), update the Django `backend/` models, serializers, and API endpoints accordingly to maintain stack cohesion.

## Mobile UI Previews Invariant
- Every mobile screen Composable must have corresponding Jetpack Compose `@Preview` annotations (both Light and Dark theme modes) to allow visual inspection and compilation verification.

## Lightweight Data Architecture & State Storage Policy
- Keep client-side cache and offline interaction state lean.
- Do not bloat local Room database tables or session storage with redundant, nested, or ephemeral interaction metadata. Use streamlined, indexed entity models (such as lightweight `PostInteraction` and `CommunityInvite`) with minimal column footprint.

