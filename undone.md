# Undone Trace

Spec items that are missing, only partially present, or not enforced yet.

## Authentication
- JWT login flow end-to-end is not fully verified from spec perspective.
- 2FA for manager and admin roles is missing.
- Install prompt and PWA-first officer onboarding flow are missing.
- Permission request flow for location, notifications, camera, and microphone is missing.
- RBAC is centrally resolved for the command dashboard shell, but the spec-level auth flows still need broader validation.

## RBAC / Route Enforcement
- The full spec role matrix is not yet implemented as a complete product-wide access layer.
- `lemtik_admin`, `client_admin`, `security_manager`, `operator`, and `field_officer` still need a full surface-by-surface visibility audit.
- Command dashboard access is now section-gated, but the role matrix still needs product-wide audit against the spec.

## Section A: Lemtik Admin Console
- `/admin/*` routes do not exist.
- Platform-level settings page is missing.

## Section B: C4I Command Dashboard
- Inventory view page is missing.
- Analytics and reporting tabs are incomplete relative to the spec.
- Report centre needs the full report history/share/delivery surface.
- Alert centre needs the unread badge, tabs, mark-all-read, and full preference model.
- User management needs the full spec-level profile, assigned locations, login history, reset password, and platform/org permission separation.
- Audit log needs the full spec-level columns, filters, exports, and append-only guarantees.
- Organisation settings needs the full tab set, including thresholds, smart infrastructure, integrations, and subscription management.

## Section C: Field Officer PWA

## Real-Time System
- Socket.io event architecture is missing.
- Org/officer room segregation is missing.
- Incident, dispatch, patrol, autonomous, and location live events are not implemented as specified.
- Officer pings, dispatch alerts, and autonomous override updates are not wired through a socket server.

## Email / SMS / WhatsApp
- Resend transactional templates are not fully implemented.
- Termii SMS integration is not implemented.
- Twilio WhatsApp integration is not implemented.
- Fallback logic between WhatsApp and SMS is missing.
- Delivery tracking and provider balances are missing.

## Blackbox Audit Trail
- Append-only database enforcement is not verified in code.
- The spec-level audit schema is not implemented end to end.
- Audit export to CSV, JSON, and PDF is incomplete.
- Full action coverage for incidents, autonomous actions, user actions, dispatches, reports, configuration changes, AI agent calls, and device actions is not complete.

## Performance / Build Checklist
- Spec performance targets are not measured or enforced in the app.
- Build checklist items for most dashboard surfaces are incomplete.
- Officer PWA checklist items are missing.
- Real-time delivery checklist items are missing.
- Notification delivery checklist items are missing.
- Audit trail checklist items are incomplete.

## Missing Spec Surfaces Not Yet Backed by Routes
- Inventory management page is missing.
- Analytics and reporting deep tabs are missing.
- OSINT intelligence feed page is missing as a full standalone surface.
- Smart infrastructure / autonomous devices management page is missing.
- Device registry and connection testing are missing.
