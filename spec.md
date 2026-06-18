# Lemtik Security — C4I Dashboard Master Specification
### The Complete Command, Control, Communications, Computers & Intelligence Interface
**Classification:** Internal Engineering
**Version:** 1.0
**Status:** Master Build Specification

---

## 1. What This Is

The C4I Dashboard is the interface through which every human
interacts with the Lemtik Security platform. It is not a
single product — it is five distinct experiences built into
one platform, each tailored to a specific role.

The platform serves two types of organisations:

**Lemtik Internal (lemtik_admin)**
The Lemtik team manages all client organisations,
billing, system health, and platform configuration
from a dedicated admin console. They never see
operational incident data. They see accounts,
usage, and platform status.

**Client Organisations (all other roles)**
Every organisation that subscribes to Lemtik —
whether a private estate, hotel, bank, police unit,
or government agency — is a client. Each client
has their own isolated environment with four roles:
client_admin, security_manager, operator, field_officer.

---

## 2. Technology Stack

```
Frontend Framework:    React 18 + TypeScript
Build Tool:            Vite
Styling:               Tailwind CSS + custom design tokens
State Management:      Zustand (client state)
                       TanStack Query (server state + caching)
Real-time:             Socket.io-client (live incident updates)
Maps:                  Mapbox GL JS (incident map)
                       Mapbox offline tiles (officer PWA)
Charts:                Recharts
Forms:                 React Hook Form + Zod validation
Icons:                 Lucide React
Date/Time:             date-fns (Lagos timezone: Africa/Lagos)
HTTP Client:           Axios (with JWT interceptor)
PWA:                   Vite PWA plugin (officer mobile app)
PDF Export:            React-PDF (reports)
Notifications:         React Hot Toast (in-app)
Email:                 Resend API (all transactional email) / Supabase (all authhentication email)
SMS:                   Termii (Nigerian SMS delivery)
WhatsApp:              Twilio WhatsApp Business API
Push Notifications:    Web Push API (PWA)

Hosting:
  Web App:             Vercel
  All services:        Render
  Database:            Supabase
  Email:               Resend
```

---

## 3. Role-Based Access Control (RBAC)

### Role Definitions

```
LEMTIK SIDE
─────────────────────────────────────────────
lemtik_admin
  Scope:      Global — all organisations
  Access:     Platform admin console only
  Cannot:     View any client operational data
              Dispatch officers or manage incidents
              Access client OSINT intelligence feeds

CLIENT SIDE
─────────────────────────────────────────────
client_admin
  Scope:      Their organisation only
  Who:        Estate chairman, hotel GM, Police Commissioner,
              Government agency head, company owner
  Access:     Reports, analytics, risk scores, billing
              User management, subscription
  Cannot:     Touch live operations
              Dispatch officers
              Approve autonomous actions
              Access raw OSINT feed

security_manager
  Scope:      Their organisation only
  Who:        Head of security, security director
  Access:     Everything operational
              All incidents, all patrols, all reports
              User management, system configuration
              Threshold configuration, alert settings
              Can approve all autonomous actions
  Cannot:     Manage billing or subscription
              See other organisations

operator
  Scope:      Their organisation + assigned locations
  Who:        Command desk officer, control room staff
  Access:     Live dashboard, incident management
              AI recommendation panels
              Officer dispatch and ping
              Supervisor-level autonomous action approval
              Real-time map
  Cannot:     Manager-level autonomous actions
              System configuration
              User management
              Billing

field_officer
  Scope:      Own assignments only
  Who:        Security guard, patrol officer, police constable
  Access:     PWA only (mobile)
              Own patrol route and check-ins
              Incident reporting
              Received pings and dispatch notifications
              Own shift schedule
  Cannot:     See other officers' data
              View command dashboard
              Approve any actions
              See OSINT or analytics
```

### Permission Matrix

```
Feature                          lemtik_admin  client_admin  security_manager  operator  field_officer
─────────────────────────────────────────────────────────────────────────────────────────────────────
Platform admin console           ✅            ✗             ✗                 ✗         ✗
Manage client organisations      ✅            ✗             ✗                 ✗         ✗
View billing & subscriptions     ✅            ✅            ✗                 ✗         ✗
View platform health             ✅            ✗             ✗                 ✗         ✗

Live incident map                ✗             ✅ (read)     ✅                ✅        ✗
Log new incident                 ✗             ✗             ✅                ✅        ✅ (own)
Manage incident lifecycle        ✗             ✗             ✅                ✅        ✗
View incident detail             ✗             ✅ (read)     ✅                ✅        ✅ (own)

AI recommendation panel          ✗             ✗             ✅                ✅        ✗
Dispatch officers via ping       ✗             ✗             ✅                ✅        ✗
Approve autonomous (supervisor)  ✗             ✗             ✅                ✅        ✗
Approve autonomous (manager)     ✗             ✗             ✅                ✗         ✗

Patrol route management          ✗             ✗             ✅                ✗         ✗
View patrol live status          ✗             ✅ (read)     ✅                ✅        ✗
Patrol check-in                  ✗             ✗             ✗                 ✗         ✅
View own patrol route            ✗             ✗             ✗                 ✗         ✅

OSINT intelligence feed          ✗             ✅ (read)     ✅                ✅        ✗
OSINT verification queue         ✗             ✗             ✗                 ✗         ✗ (Lemtik analyst only)
Generate weekly brief            ✗             ✗             ✅                ✗         ✗
Download reports                 ✗             ✅            ✅                ✅        ✗

Inventory view                   ✗             ✅ (read)     ✅                ✅        ✗
Inventory management             ✗             ✗             ✅                ✗         ✗
Configure thresholds             ✗             ✗             ✅                ✗         ✗

User management                  ✅ (platform) ✅ (org)      ✅ (below manager) ✗        ✗
Audit log view                   ✅            ✅ (org only) ✅                ✗         ✗
System configuration             ✅            ✗             ✅ (org)          ✗         ✗
Alert configuration              ✗             ✗             ✅                ✗         ✗
```

---

## 4. Application Architecture

```
src/
├── apps/
│   ├── admin/              Lemtik admin console (lemtik_admin only)
│   ├── command/            Main C4I dashboard (manager, operator)
│   ├── reports/            Reports and analytics (client_admin, manager)
│   └── officer/            PWA mobile app (field_officer only)
├── components/
│   ├── ui/                 Base components (Button, Input, Modal, Badge...)
│   ├── layout/             AppShell, Sidebar, Header, BottomNav (mobile)
│   ├── map/                MapView, IncidentPin, PatrolLayer, OsintPin
│   ├── incidents/          IncidentCard, IncidentForm, IncidentDetail
│   ├── agent/              AIPanel, RecommendationCard, ApprovalButton
│   ├── patrols/            PatrolMap, ShiftCard, CheckinButton
│   ├── osint/              IntelFeed, ThreatCard, BriefViewer
│   ├── inventory/          ResourceCard, ThresholdAlert, StatusBadge
│   ├── autonomous/         ActionCard, ApprovalModal, OverrideStatus
│   ├── analytics/          StatCard, TrendChart, HeatmapLayer, RiskScore
│   ├── reports/            ReportCard, BriefPDF, ExportButton
│   └── notifications/      AlertBell, AlertCenter, PingNotification
├── pages/                  Route-level page components
├── hooks/                  Custom React hooks
├── stores/                 Zustand stores
├── services/               API call functions
├── utils/                  Helpers, formatters, validators
└── types/                  TypeScript type definitions
```

---

## 5. Routing Structure

```
/auth/login                 Login page (all roles)
/auth/forgot-password       Password reset
/auth/invite/:token         Accept team invitation

/admin/*                    Lemtik admin console (lemtik_admin)
  /admin/dashboard          Platform overview
  /admin/organisations      All client organisations
  /admin/organisations/:id  Single org management
  /admin/billing            Billing and subscriptions
  /admin/system             System health and service status
  /admin/audit              Platform-level audit log
  /admin/settings           Platform configuration

/dashboard                  Main C4I command dashboard
/map                        Full-screen live incident map
/incidents                  Incident list and management
/incidents/:id              Single incident detail
/incidents/new              Log new incident
/patrols                    Patrol management
/patrols/:id                Patrol route detail
/intelligence               OSINT intelligence feed
/intelligence/brief         Weekly brief viewer
/inventory                  Resource inventory
/analytics                  Analytics and reporting
/reports                    Report centre
/alerts                     Alert centre and history
/users                      User management
/settings                   Organisation settings
/audit                      Audit log

/officer/*                  PWA officer app (field_officer)
  /officer/home             Officer home screen
  /officer/patrol           Active patrol view
  /officer/incident/new     Report incident
  /officer/incident/:id     View own incident
  /officer/schedule         Shift schedule
  /officer/notifications    Notifications and pings
```

---

# SECTION A: LEMTIK ADMIN CONSOLE

## Page A1 — Platform Dashboard

**Who sees it:** lemtik_admin only

**Purpose:** Bird's-eye view of the entire Lemtik platform.
Not security operations — platform health and business metrics.

**Components:**

```
Platform Stats Row
  Total organisations (all clients)
  Active subscriptions
  Total incidents logged (all orgs, last 30 days)
  Platform uptime percentage
  Active service health indicators

Render Services Health Panel
  Each service shown as a card:
  ┌─────────────────────────────────┐
  │ 🟢 OSINT Brain          ONLINE │
  │ Last collection: 14 min ago     │
  │ Items collected today: 47       │
  │ Render URL: [link]              │
  └─────────────────────────────────┘
  Services shown: OSINT Brain, Inventory Service,
  Route Calculator, Proximity Finder,
  Autonomous Control, Master Agent, Relationship API
  Each shows: status (online/offline/degraded),
  last activity, error count last 24h

Recent Client Activity
  List of recent organisation events:
  "Hamduk Unique Concept — 3 incidents today"
  "Eko Hotel — New user invited"
  "Lagos State LASEMA — Subscription renewed"

Subscription Overview
  Active: X organisations
  Trial: X organisations
  Overdue: X organisations (highlighted red)
  Revenue this month (total MRR)

Recent Signups
  New organisations registered in last 30 days
```

---

## Page A2 — Organisation Management

**Who sees it:** lemtik_admin only

**Components:**

```
Organisations Table
  Columns: Name, Type, Tier, Status, Users,
           Incidents (30d), Created, Actions
  Filters: Type, Tier, Status, Search by name
  Actions per row: View, Edit, Suspend, Delete

Create Organisation Flow
  Step 1: Organisation details
    Name, type, address, contact email
  Step 2: Subscription tier selection
    Basic / Standard / Enterprise / Government
  Step 3: Admin user creation
    Creates the client_admin account
    Sends invitation email via Resend
  Step 4: Location setup
    Add first location (lat/lng or address)
    Set geofence boundary on map
  Step 5: Confirmation
    Sends welcome email to client_admin
    Organisation goes live

Single Organisation Page (/admin/organisations/:id)
  Organisation profile overview
  All users in the organisation (with roles)
  All locations registered
  Subscription details and billing history
  Usage metrics (API calls, incidents, storage)
  Recent activity log
  Danger zone: Suspend, Delete
```

---

## Page A3 — Billing & Subscriptions

**Who sees it:** lemtik_admin only

```
MRR Overview
  Total MRR
  MRR by tier
  MRR trend (last 12 months line chart)

Subscription Table
  All active subscriptions
  Tier, monthly amount, next billing date, status

Overdue Accounts
  Highlighted list of overdue payments
  Days overdue, amount, contact button

Tier Pricing Configuration
  Edit pricing per tier
  Configure what features each tier unlocks
```

---

## Page A4 — System Health

**Who sees it:** lemtik_admin only

```
All Render Services
  Real-time ping to each service health endpoint
  Response time graph (last 24 hours)
  Error log per service
  Restart trigger button (with confirmation)

Supabase Database Health
  Connection pool usage
  Query performance
  Storage usage
  Active connections

EMQX MQTT Broker Status
  Connected devices count
  Messages per second
  Broker health

Upstash Redis Status
  Memory usage
  Commands per second
  Cache hit rate

Third-Party Integrations Status
  Groq API: status + daily token usage
  Termii SMS: balance + messages sent today
  Twilio WhatsApp: balance + messages sent today
  Resend Email: quota used
  Radar.io: API calls remaining
  Mapbox: tile loads today
```

---

## Page A5 — Platform Audit Log

**Who sees it:** lemtik_admin only

```
Complete immutable log of every action on the platform
Filters: Organisation, user, action type, date range
Columns: Timestamp, Org, User, Action, Resource, IP address
Export: CSV, JSON
Cannot be edited or deleted — append only
```

---

# SECTION B: C4I COMMAND DASHBOARD
## (security_manager + operator)

## Page B1 — Live Command Dashboard (Home)

**Who sees it:** security_manager (full), operator (full)
**client_admin:** read-only simplified view

**Purpose:** The nerve centre. Everything a commander
needs to see at a glance when they sit down at the desk.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ HEADER: Org name · Current time (Lagos) · Role badge │
│         Alert bell · User menu                       │
├──────────────┬───────────────────────────────────────┤
│              │                                       │
│  SIDEBAR     │         MAIN CONTENT AREA             │
│  Navigation  │                                       │
│              │                                       │
└──────────────┴───────────────────────────────────────┘
```

**Stat Cards Row (top)**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ OPEN         │ │ CRITICAL     │ │ OFFICERS     │ │ PATROL       │
│ INCIDENTS    │ │ (SEVERITY 4+)│ │ ON SHIFT     │ │ COMPLIANCE   │
│    3         │ │    1         │ │   9 / 12     │ │   87%        │
│ ▲2 vs 1hr ago│ │ ⚠ Needs attn │ │ 3 unavail.   │ │ ▼ from 92%  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ VEHICLES     │ │ FUEL         │ │ AREA RISK    │ │ AVG RESPONSE │
│ AVAILABLE    │ │ STATUS       │ │ SCORE        │ │ TIME         │
│  3 / 5       │ │ 🔴 2 low     │ │  72 / 100    │ │  4m 12s      │
│ 2 deployed   │ │              │ │ Elevated     │ │ ▲ improving  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Main Panel — Split View**

Left side (60%): Live Incident Map (see Page B2 — full map
is also available standalone)

Right side (40%):
```
Active Incidents List
  Real-time list, most recent first
  Each incident shown as a card:
  ┌─────────────────────────────────────────────┐
  │ 🔴 INC-001  Assault · Floor 3 · Eko Hotel  │
  │ 14:23 · 2 min ago · Ahmed assigned · OPEN  │
  │ [VIEW]  [AI PANEL]                          │
  └─────────────────────────────────────────────┘

OSINT Alerts Feed
  Live feed of severity 3+ OSINT items
  Each shown as a small card:
  ┌─────────────────────────────────────────────┐
  │ 🟠 Armed robbery reported 1.2km away       │
  │ Channels TV · 92% conf · 8 min ago         │
  │ [VIEW]                                      │
  └─────────────────────────────────────────────┘

Inventory Alerts
  Any active threshold alerts from inventory service:
  ┌─────────────────────────────────────────────┐
  │ 🔴 CRITICAL — 2 vehicles need fuel         │
  │ V002, V003 below 20%                        │
  │ [VIEW INVENTORY]                            │
  └─────────────────────────────────────────────┘
```

**Bottom Strip — Active Patrols**
```
Shows all currently active patrol shifts
Officer name · Route name · Last check-in time · Status
Green = on time · Amber = slightly late · Red = missed check-in
```

---

## Page B2 — Live Incident Map

**Who sees it:** security_manager, operator, client_admin (read)

**Full-screen Mapbox GL map with multiple layers:**

```
Layer 1 — Operational Incidents (default on)
  Circle pins, colour by severity
  5 = Red pulsing · 4 = Orange · 3 = Amber
  2 = Yellow · Resolved = Grey
  Click pin → incident summary slide-in panel

Layer 2 — OSINT Threat Signals (toggle)
  Diamond pins, separate colour scheme
  Click → intelligence item detail

Layer 3 — Officer Positions (toggle)
  Blue dots with officer initials
  Last GPS update shown on hover
  Click → officer profile mini card

Layer 4 — Patrol Routes (toggle)
  Route lines on map
  Completed waypoints = green dot
  Missed waypoints = red dot
  Active patrol = animated line

Layer 5 — Heatmap Overlay (toggle)
  Incident density heatmap
  Time window selector: 24h / 7d / 30d / 90d
  Adjustable opacity slider

Layer 6 — Zone Boundaries (toggle)
  Client-defined security zones shown as polygons
  Each zone coloured by current risk score

Layer 7 — Smart Infrastructure (toggle, manager only)
  Icons showing connected smart devices
  Green = online · Red = offline · Amber = active override

Map Controls
  Layer toggles (top right)
  Search by address or area
  Zoom to organisation boundary
  Current location button
  Fullscreen toggle

Right click on map
  Log incident at this location
  Draw new zone
  View area intelligence (OSINT query for that point)
```

---

## Page B3 — AI Command Panel (Incident Response)

**Who sees it:** security_manager, operator
**This is the most critical page in the entire platform**

**Accessed via:** Clicking [AI PANEL] on any active incident

**Layout:**
Full-width panel that opens when an incident is active
and the Master Agent has produced a recommendation.

```
Panel Header
  Incident ID · Type · Severity badge · Time since reported
  Confidence score of AI recommendation
  "AI Analysis by Lemtik Master Agent · Llama 3.3 · 89% conf"

Situation Summary
  AI-generated plain English summary of the incident
  Threat assessment (threat level, armed status, suspect status)
  Historical context from OSINT (area risk, past incidents)

DISPATCH SECTION
  Recommended officers list (from proximity finder)
  Each officer shown as an action card:
  ┌──────────────────────────────────────────────────────┐
  │ #1  Ahmed Bello              🔫 Armed  ✅ First Aid  │
  │     Hotel Lobby · 180m away · ETA: 1m 21s           │
  │     Route: Lobby → Elevator B → NW Wing Floor 3     │
  │     Equipment: Radio, First Aid Kit, Handcuffs       │
  │     Instructions: [AI-generated instructions]        │
  │     [🔔 PING AHMED]  [📍 SEND ROUTE]  [✓ ASSIGN]   │
  └──────────────────────────────────────────────────────┘
  Operator clicks:
  PING — sends push notification to officer's PWA
         plays alert sound on officer's device
         shows incident details and instructions
  SEND ROUTE — pushes Mapbox navigation to officer's PWA
  ASSIGN — formally assigns officer to incident in database

Vehicle recommendations (if needed)
  Same card format as officers
  Shows fuel level, ETA, capacity, driver

AUTONOMOUS ACTIONS SECTION
  List of recommended autonomous infrastructure actions
  Auto-executable actions shown with "EXECUTING..." immediately
  Approval-required actions shown with approve/deny buttons:

  ┌──────────────────────────────────────────────────────┐
  │ AUTO  📷 Activate CCTV NW Wing Floor 3              │
  │       [EXECUTING...]                                  │
  └──────────────────────────────────────────────────────┘
  ┌──────────────────────────────────────────────────────┐
  │ NEEDS APPROVAL  🛗 Hold Elevator B at Ground Floor  │
  │ Saves: ~45 seconds · Cuts suspect escape route      │
  │ Risk: Low · Approval: Supervisor                    │
  │ [✓ APPROVE]  [✗ DENY]                              │
  └──────────────────────────────────────────────────────┘

INTELLIGENCE SECTION
  OSINT items relevant to this incident's area
  Area risk score and trend
  Historical incident pattern summary
  CCTV feed (if autonomous action activated it)

MEDICAL ALERT (if applicable)
  First aid requirement flagged
  Who is certified and dispatched
  LASAMBUS contact: 767

ESCALATION OPTIONS
  Pre-filled escalation buttons:
  [Call Nigeria Police 199]
  [Call LASAMBUS 767]
  [Escalate to Security Manager]
  [Send Alert to All Officers]

Active Overrides Status
  List of autonomous actions currently active
  Time remaining on each override
  Manual revert button per override

Timeline
  Real-time activity log of everything done on this incident
  Who did what, when, with timestamps to the second
```

---

## Page B4 — Incident List & Management

**Who sees it:** security_manager, operator, client_admin (read)

```
Page Header
  "Incidents"
  Total count · Open count · Critical count
  [+ Log Incident] button (manager, operator only)
  [Export CSV] button

Filter Bar
  Status: All · Open · Responding · Contained · Resolved · Escalated
  Severity: All · 5 · 4 · 3 · 2 · 1
  Type: All types (dropdown)
  Date range picker
  Location / Zone selector
  Assigned to (officer picker)
  Search (full text)

Incidents Table
  Sortable columns:
  ID · Severity · Type · Status · Location
  Reported time · Time open · Assigned to · Actions

Row actions:
  View detail · Assign · Change status · Open AI panel

Bulk actions:
  Select multiple → Assign to officer
  Select multiple → Change status
  Select multiple → Export

Pagination
  50 per page default
```

---

## Page B5 — Single Incident Detail

**Who sees it:** All roles (field_officer sees own incidents only)

```
Header
  Incident ID · Type badge · Severity badge · Status badge
  "Assigned to: Ahmed Bello" · "Reported by: Front Desk"
  Time reported · Time since reported · Total time open

Tab 1 — Overview
  Location (map pin + address)
  Full description
  Persons involved (suspect description, victim info)
  Current status + update status dropdown
  Assigned officer + reassign button

Tab 2 — AI Analysis
  Full AI recommendation panel (read-only if already actioned)
  Confidence score
  Threat assessment
  What actions were recommended
  What actions were taken

Tab 3 — Activity Log (Audit Trail)
  Immutable timeline of every action:
  "14:23:07 — Incident logged by Front Desk Operator"
  "14:23:18 — AI analysis triggered"
  "14:23:29 — Ahmed Bello pinged by Operator Chidi"
  "14:23:31 — Elevator B hold approved by Supervisor Emeka"
  "14:24:50 — Ahmed Bello arrived at scene (GPS confirmed)"
  "14:31:02 — Suspect apprehended — logged by Ahmed Bello"
  Cannot be edited or deleted

Tab 4 — Evidence
  All photos, videos, voice notes, documents
  Upload new evidence
  Chain of custody log per file
  Download individual files
  Flag as legal evidence (prevents deletion)

Tab 5 — Escalation History
  All escalation events
  Who was contacted, when, outcome
  Response time from external agencies

Tab 6 — Related Incidents
  System-suggested links + manually linked
  Map showing all related incidents together
```

---

## Page B6 — Log New Incident

**Who sees it:** security_manager, operator

```
Step 1 — Basic Info
  Incident type (dropdown with icons)
  Severity selector (1–5 with colour + label)
  Title (short description)
  Description (rich text, 1000 char)

Step 2 — Location
  GPS auto-detect button
  Manual pin drop on map
  Select saved location from list
  Floor / Zone (if indoor)
  Address fallback text input

Step 3 — People
  Number of suspects
  Suspect description (appearance, clothing, vehicle)
  Victim name + contact (optional)
  Witnesses (optional)

Step 4 — Evidence
  Photo upload (up to 5, drag and drop)
  Video upload (up to 2)
  Voice note recording (direct in browser)
  Document upload

Step 5 — Review & Submit
  Summary of all entered data
  [Submit & Get AI Analysis] button
  → Incident saved → AI panel opens automatically
```

---

## Page B7 — Patrol Management

**Who sees it:** security_manager (full), operator (view),
                 client_admin (read only)

```
Tab 1 — Active Patrols (Live)
  Map showing all active patrol routes
  Each officer's last known position
  Check-in status per waypoint (green/amber/red)
  Missed check-in alerts highlighted
  Click officer → officer mini profile + contact

Tab 2 — Shift Schedule
  Calendar view (week/month)
  All scheduled shifts
  Officer name · Route · Start/End time
  Create shift button (manager only)
  Edit / Delete shift
  Bulk shift creation (repeat schedule)

Tab 3 — Patrol Routes
  List of all defined patrol routes
  Name · Waypoint count · Estimated duration · Active
  Create route button → opens route builder
  Edit route → interactive map editor
  Assign route to shift

Route Builder
  Click on map to place waypoints
  Drag to reorder
  Name each waypoint
  Set expected dwell time per waypoint
  Preview route with estimated total time

Tab 4 — Patrol History
  Past shifts with completion percentages
  Officer compliance ranking
  Missed check-ins log
  Export patrol history as PDF
```

---

## Page B8 — OSINT Intelligence Feed

**Who sees it:** security_manager, operator, client_admin (read)

```
Page Header
  "Intelligence Feed"
  Current area risk score badge
  [Generate Weekly Brief] button (manager only)

Filter Bar
  Severity: All / 4+ / 3+ / 2+
  Category: Physical / Cyber / Political / Macro
  Date range
  Verified: All / Verified / Unverified
  Search

Intelligence Feed
  Cards in reverse chronological order
  Each card:
  ┌────────────────────────────────────────────────┐
  │ 🔴 Severity 4  Physical  92% conf  Partial ✓  │
  │ Police arrest three armed robbery suspects...  │
  │ Channels TV · 2 hours ago · Lekki Phase 1     │
  │ [VIEW FULL]  [RELEVANT TO US]  [DISMISS]       │
  └────────────────────────────────────────────────┘

Intelligence Item Detail (slide-in panel)
  Full summary
  Source link (external)
  Matched keywords
  Confidence score breakdown
  Location relevance
  Verification status
  Analyst notes (if any)
  Related incidents (if any)
  Actions: Mark relevant / Dismiss / Escalate to incident

Weekly Brief Section
  Latest generated brief shown as formatted document
  Download PDF button
  Generate new brief button (manager only)
  Brief history (last 12 briefs)

OSINT Map View (toggle)
  Switch between feed list and map view
  Intelligence items plotted as diamond pins
```

---

## Page B9 — Inventory Management

**Who sees it:**
security_manager (full read + edit),
operator (read only),
client_admin (read only)

```
Inventory Overview Cards
  Officers: available/total
  Vehicles: available/total + fuel summary
  Weapons: in armoury / issued
  Ammunition: quantity vs threshold
  Tactical Equipment: available by category
  Fuel Reserve: litres / percentage

Active Alerts Panel
  All active threshold alerts
  Each shown with: resource, current value,
  threshold, recommended action, time since alert
  Resolve button (when corrected)

Tab 1 — Officers Roster
  Table: Name · Badge · Status · Armed · Location
         Shift · Certifications · Contact
  Filter: Status / Armed / Certification / Zone
  Click officer → Officer profile
  Edit officer details (manager only)
  Add new officer (manager only)
  Export roster as PDF

Tab 2 — Vehicles Fleet
  Cards per vehicle showing:
  Vehicle ID · Type · Status · Fuel gauge visual
  Location on mini map · Condition · Driver
  Colour coded: green (available+fuelled) /
  amber (available, low fuel) / red (unavailable)
  Click → vehicle detail + fuel history
  Edit (manager) · Mark for service (manager)

Tab 3 — Weapons & Ammunition
  Armoury table: Weapon ID · Type · Status · Issued to
  Issue weapon to officer (manager)
  Return weapon (manager)
  Ammunition stock per type with threshold indicator
  Restock log

Tab 4 — Tactical Equipment
  Category cards: body armour, radios, first aid kits, etc.
  Available / In use / Total per category
  Check out equipment for operation (manager)
  Check in equipment return (manager)

Tab 5 — Fuel Reserve
  Current reserve gauge (visual)
  Reserve history (last 30 days)
  Log fuel delivery (manager)
  Threshold setting (manager)
```

---

## Page B10 — Analytics & Reporting

**Who sees it:**
client_admin (reports + high-level analytics),
security_manager (full analytics),
operator (read only)

```
Date Range Selector
  Presets: Today / This week / Last 7 days /
           This month / Last 30 days / Custom

Tab 1 — Overview Dashboard
  Incidents per day (line chart)
  Incidents by type (bar chart)
  Incidents by severity (donut chart)
  Average response time trend (line chart)
  Patrol compliance rate trend
  OSINT threat volume trend
  Risk score trend for all zones

Tab 2 — Incident Intelligence
  Heatmap: incidents by time of day (hour × day grid)
  Top incident locations (ranked list + map)
  Incident type frequency ranking
  Response time distribution
  Escalation rate
  Resolution rate

Tab 3 — Patrol Performance
  Compliance rate by officer (ranking table)
  Compliance rate by route
  Missed check-in frequency
  Shift completion rate
  Best and worst performing routes

Tab 4 — Resource Analysis
  Vehicle utilisation rates
  Officer deployment patterns
  Fuel consumption trend
  Equipment usage frequency

Tab 5 — OSINT Trends
  Threat volume by category over time
  Area risk score history
  Intelligence items by source reliability
  Alert-to-incident conversion rate
  (how often OSINT alerts precede real incidents)
```

---

## Page B11 — Report Centre

**Who sees it:** client_admin, security_manager, operator

```
Report Types Available

  Daily Incident Log
    Auto-generated at 6am every day
    Previous 24 hours of incidents
    Download PDF
    Auto-email to configured recipients

  Weekly Security Summary
    Auto-generated every Monday 8am
    Incident summary, patrol compliance,
    OSINT overview, recommendations
    Download PDF · Share link (time-limited, no login)
    Delivered via Resend email + WhatsApp

  Monthly Threat Analysis
    Auto-generated 1st of each month
    Full month breakdown, trends, forecasts
    Zone risk evolution
    Executive-ready format
    Download PDF · Email delivery

  Incident-Specific Report
    On demand per incident
    Full detail, evidence, chain of custody
    Legal and insurance ready
    Download PDF

  Custom Report Builder (Enterprise tier)
    Select sections to include
    Choose date range
    Add custom commentary
    Download PDF or PowerPoint

Report History
  Last 12 months of generated reports
  Download any past report
  Resend email delivery
```

---

## Page B12 — Alert Centre

**Who sees it:** security_manager, operator

```
Alert Bell (header)
  Count badge of unread alerts
  Click → dropdown of last 5 alerts
  "View all" link

Alert Centre Page
  Tabs: All / Unread / Incidents / Patrols / Inventory / OSINT / System

  Each alert card:
  ┌─────────────────────────────────────────────┐
  │ 🔴 CRITICAL — Missed patrol check-in       │
  │ Officer Emeka — Zone B Waypoint 3          │
  │ 14:45:23 · 3 min ago · [VIEW]  [DISMISS]   │
  └─────────────────────────────────────────────┘

  Mark all as read
  Configure alert preferences link

Alert Configuration (manager only)
  Per alert type: enable/disable
  Per alert type: which channels (in-app / WhatsApp / SMS / email)
  Quiet hours configuration
  Additional recipients
  Escalation contacts
```

---

## Page B13 — User Management

**Who sees it:**
lemtik_admin (platform level),
client_admin (org level),
security_manager (below manager level)

```
Users Table
  Name · Email · Phone · Role · Status · Last seen
  Filter by role, status
  Search by name or email

Invite User
  Enter email or phone
  Select role (limited to roles below your own)
  Select assigned location(s)
  Send invitation via Resend email or Termii SMS
  Invitation expires after 48 hours

User Profile
  All details
  Role and assigned locations
  Activity log (all actions taken)
  Incidents reported / managed
  Patrol check-ins
  Login history
  Change role · Deactivate · Reset password

Pending Invitations
  List of sent but not accepted invitations
  Resend / Cancel per invitation
```

---

## Page B14 — Audit Log

**Who sees it:**
lemtik_admin (platform audit),
client_admin (org audit, read only),
security_manager (org audit, read only)

```
Immutable log of every action in the system
Columns:
  Timestamp · User · Role · Action type
  Resource affected · Details · IP address

Filter:
  User · Role · Action type · Date range
  Resource type · Severity (for incident actions)

Search full text

Export: CSV, JSON, PDF

Cannot be edited, deleted, or modified
Append-only at database level

Special flags:
  🔴 Autonomous action executed
  🔒 Access control change
  👤 User management action
  📋 Report downloaded
  ⚙ Configuration changed
```

---

## Page B15 — Organisation Settings

**Who sees it:**
security_manager (full),
client_admin (subscription + billing sections)

```
Tab 1 — Organisation Profile
  Name, logo upload, address, timezone
  Emergency contacts (police, LASEMA, hospital)
  Organisation type

Tab 2 — Locations
  List of all registered locations
  Add / Edit / Archive location
  Set geofence for each location
  Assign officers and patrol routes per location

Tab 3 — Alert Configuration
  Per alert type: channels and recipients
  Quiet hours
  Escalation contacts and thresholds
  WhatsApp numbers for alert delivery

Tab 4 — Threshold Configuration (manager only)
  Per resource: set warning and critical thresholds
  Officers minimum (total, armed)
  Vehicles minimum (total, fuelled)
  Fuel reserve minimum
  Equipment thresholds per category

Tab 5 — Smart Infrastructure
  List of all registered autonomous devices
  Add new device (opens device registration form)
  Edit connection configuration
  Test connection button
  Enable / Disable per device
  View active overrides

Tab 6 — Integrations
  Resend email configuration (custom sender)
  Termii SMS sender ID
  Twilio WhatsApp number
  Webhook URL for incident events
  API key management (for SOD API access)

Tab 7 — Subscription (client_admin)
  Current plan details
  Usage this month
  Billing history
  Upgrade / Downgrade plan
  Cancel subscription (requires confirmation)
```

---

# SECTION C: FIELD OFFICER PWA

## PWA Technical Specification

```
Type:              Progressive Web App (PWA)
Framework:         React (same codebase, separate route tree)
Map:               Mapbox GL JS offline tiles
Build:             Vite PWA plugin
Manifest:          Full installable PWA manifest
Service Worker:    Workbox (offline caching strategy)
Install prompt:    Custom install banner on first visit

Platform:          Android-first (85%+ of Nigerian market)
                   iOS compatible (with limitations)
Minimum Android:   Android 8.0+
Tested on:         Mid-range Nigerian market devices
                   (Tecno, Infinix, Samsung A-series)

Network tolerance: Works on 2G/3G
                   Critical functions work fully offline
                   Syncs when connection restores

Offline capability:
  ✅ View assigned patrol route
  ✅ View shift schedule
  ✅ Log incident (queued, syncs on reconnect)
  ✅ View last received ping and instructions
  ✅ Patrol check-in (queued, syncs on reconnect)
  ❌ Live map updates (requires connection)
  ❌ Receive new pings (requires connection)
```

## PWA Install & Permission Flow

**On first visit (before login):**
```
Screen 1: "Install Lemtik Officer App"
  Logo · App name
  "Add to your home screen for the best experience"
  [INSTALL NOW]  [Continue in browser]
  → If Install: triggers PWA install prompt

Screen 2 (after install or skip): Login
```

**After first login (permission requests, one by one):**
```
Permission 1: Location
  "Lemtik needs your location to track your patrol
   and help dispatch you to incidents."
  "Allow location access at all times" (required)
  → If denied: app explains why it is required,
    user cannot proceed without granting

Permission 2: Notifications
  "Allow Lemtik to send you alerts when you are
   dispatched to an incident or when your check-in
   is approaching."
  [Allow]  [Skip]  (notifications can be enabled later)

Permission 3: Camera
  "Lemtik needs camera access to let you photograph
   incident evidence."
  [Allow]  [Skip]  (can be enabled later in settings)

Permission 4: Microphone
  "Lemtik needs microphone access to record voice
   notes at incident scenes."
  [Allow]  [Skip]  (can be enabled later)

All permissions explained plainly in plain English
No legal jargon
Each permission screen shows why it is needed
```

---

## Page C1 — Officer Home Screen

```
Header
  "Good morning, Ahmed" (time-appropriate greeting)
  Lagos time · Date
  Connection status indicator (green/amber/red)

Active Shift Card (if on shift)
  ┌──────────────────────────────────┐
  │ 🟢 ON SHIFT                      │
  │ Morning Round · Started 07:00   │
  │ Next check-in: Gate A in 12 min │
  │ [VIEW PATROL]                    │
  └──────────────────────────────────┘

Active Dispatch (if pinged for incident)
  ┌──────────────────────────────────┐
  │ 🚨 YOU HAVE BEEN DISPATCHED      │
  │ Assault · Floor 3 · North Wing  │
  │ ETA: 1 min 21 sec               │
  │ [VIEW ROUTE]  [ACKNOWLEDGE]      │
  └──────────────────────────────────┘
  (pulsing red border, alert sound plays)

Quick Actions Row
  [📋 Report Incident]
  [✅ Check In]
  [🆘 SOS]

Upcoming Shifts
  Next 3 shifts listed
  Date · Route · Start time

Recent Notifications
  Last 5 notifications received
  [View all notifications]
```

---

## Page C2 — Active Patrol View

```
Full-screen Mapbox map (offline cached)
  Officer's current position (blue dot)
  Patrol route drawn in blue
  Completed waypoints: green filled circle
  Upcoming waypoints: white circle
  Current/next waypoint: pulsing white circle
  Incident pins within 500m shown

Bottom Panel (slide up)
  Current waypoint name
  Distance to waypoint
  Estimated time to reach

  [✅ CHECK IN AT [WAYPOINT NAME]]
  Large button, easy to tap
  → On tap: GPS verified check-in
  → Confirmation: "✓ Check-in logged at Gate A"
  → Next waypoint highlighted on map

  If GPS does not match waypoint location (> 50m):
  "You appear to be 80m from Gate A.
   Are you at Gate A?"
  [Yes, I'm here (manual override)]
  [No, I'm not there yet]

Voice Notes Button
  Record a note at current waypoint
  Attached to patrol shift record

Incident Report Button (while on patrol)
  Opens Quick Report form
  Location auto-filled from GPS

Shift Handover (at end of shift)
  Text field for handover notes
  [End Shift + Submit Handover]
```

---

## Page C3 — Dispatch & Navigation View

**Triggered when operator pings the officer**

```
Full-screen alert on device
  Sound alert + vibration (even if phone is silenced)
  
┌──────────────────────────────────────────────────────┐
│ 🚨 DISPATCH — INC-2024-001                          │
│ Assault with Weapon                                  │
│ North West Wing · Floor 3 · Eko Hotel               │
│                                                      │
│ INSTRUCTIONS:                                        │
│ Proceed immediately to North West Wing Floor 3.     │
│ Suspect: Male, unknown clothing. Treat as armed.    │
│ Carry: Radio, First Aid Kit, Handcuffs              │
│                                                      │
│ ETA: 1 min 21 sec                                   │
│                                                      │
│ [🗺 OPEN NAVIGATION]  [✓ ACKNOWLEDGE]               │
└──────────────────────────────────────────────────────┘

Navigation Screen (after tapping Open Navigation)
  Mapbox turn-by-turn navigation
  Pre-loaded route (no data needed to navigate)
  Large clear instructions
  ETA countdown
  "You have arrived" confirmation
  → On arrival: [LOG ARRIVAL AT SCENE] button
  → Tap: records arrival time, notifies command
```

---

## Page C4 — Report Incident (Officer)

```
Quick Report Mode (under 30 seconds)
  Large description text field
  Severity picker (1–5 with colours)
  [📍 USE MY LOCATION]  (one tap GPS)
  [📷 ADD PHOTO]  (camera opens directly)
  [🎙 VOICE NOTE]  (record directly)
  [SUBMIT REPORT]

After submit:
  "Incident logged. Command notified."
  Officer can add more detail later
  Incident appears in officer's recent incidents

Offline mode:
  "You are offline. Incident saved to device.
   Will submit when connection returns."
  Pending indicator shown on home screen
```

---

## Page C5 — SOS Emergency

```
Accessed from:
  Home screen quick action
  Patrol view
  Navigation view (panic situation)

Large red SOS button with confirmation:
  "Send SOS Alert?"
  "This will immediately notify all supervisors
   and managers of your location and status."
  [CONFIRM SOS]  [CANCEL]

On confirm:
  Immediately sends officer's GPS to all supervisors
  Creates a Severity 5 incident automatically
  Sends WhatsApp + SMS to all supervisor numbers
  Dashboard shows SOS alert in red

  On officer's screen:
  "SOS sent. Help is coming."
  Continuous location updates every 10 seconds
  [Cancel SOS] button (if false alarm)
```

---

## Page C6 — Officer Notifications

```
All notifications received
  Pings (dispatches)
  Missed check-in warnings
  Shift reminders
  Messages from supervisor

Each notification:
  Timestamp
  Read / Unread indicator
  Link to relevant incident or shift

Notification Settings
  Toggle notification types
  Quiet hours (officer can mute non-critical alerts)
  Critical alerts (SOS, dispatch) cannot be muted
```

---

# SECTION D: REAL-TIME SYSTEM

## Socket.io Event Architecture

```
Connection:
  Officer app connects: room org:{orgId} + officer:{officerId}
  Operator connects:    room org:{orgId}
  Manager connects:     room org:{orgId}

Events dashboard emits to server:
  incident:created       → server broadcasts to org room
  incident:updated       → server broadcasts to org room
  officer:pinged         → server emits to officer:{officerId}
  autonomous:approved    → server emits to org room
  patrol:checkin         → server broadcasts to org room

Events server emits to dashboard:
  incident:new           → add pin to map, card to list
  incident:updated       → update pin, card, detail panel
  alert:inventory        → show alert card on dashboard
  alert:patrol:missed    → highlight officer on map
  agent:analysis:ready   → show AI panel for incident
  autonomous:executed    → update override status
  autonomous:reverted    → remove override indicator
  officer:location       → update officer dot on map

Events server emits to officer PWA:
  officer:dispatch       → full-screen dispatch alert
  officer:ping           → notification + sound
  shift:reminder         → shift start/end reminder
  incident:assigned      → your incident was assigned
```

---

# SECTION E: EMAIL & NOTIFICATION DELIVERY

## Resend Email Integration

```
All transactional email via Resend API
Sender: Lemtik Security <alerts@lemtik.com.ng>

Templates (React Email):
  Welcome email (new user invitation)
  Password reset
  Daily incident log (PDF attached)
  Weekly security summary (PDF attached)
  Monthly threat analysis (PDF attached)
  Inventory threshold alert
  OSINT high-confidence alert
  New user invitation
  Subscription confirmation
  Subscription renewal reminder
  Subscription overdue notice
  Account suspended notice

All emails:
  Lemtik branded dark theme
  Responsive for mobile
  Plain text fallback
  Unsubscribe link (non-critical emails only)
```

## Termii SMS Integration

```
Sender ID: LEMTIK
Nigerian coverage: All major networks

Triggers:
  Severity 4–5 incident alert (to manager + supervisor phones)
  Officer SOS alert (to all supervisor numbers)
  Missed check-in (critical) (to supervisor)
  Inventory CRITICAL alert
  OTP for 2FA login
  Invite via phone number

Character limit: Standard 160 char
Multi-part: Supported for longer alerts
Cost monitoring: Alert lemtik_admin if monthly spend
                 exceeds configured threshold
```

## Twilio WhatsApp Integration

```
WhatsApp Business number configured per organisation
Templates pre-approved with WhatsApp

Message types:
  Incident alerts (severity 3+)
  Weekly brief delivery (PDF)
  Daily summary (text)
  Officer dispatch notification
  Inventory alerts
  OSINT threat alerts

Format: Plain text + optional PDF attachment
Delivery confirmation: tracked per message
Failed delivery: falls back to SMS via Termii
```

---

# SECTION F: BLACKBOX AUDIT TRAIL

## Architecture

Every write operation anywhere in the system generates
an immutable audit record. This is the legal and
compliance backbone of the platform.

```sql
-- sod schema

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    org_id UUID,
    user_id UUID,
    user_role VARCHAR(50),
    user_email VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    action_detail JSONB,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(100),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

-- Enforce append-only at database level
-- No UPDATE or DELETE permissions on this table
-- Even lemtik_admin cannot delete audit records
-- Retention: minimum 5 years
```

## What Gets Logged

```
Every incident:
  Created, updated, status changed, assigned, escalated,
  resolved, evidence uploaded, note added

Every autonomous action:
  Command received, validation result, approval given/denied,
  execution result, revert executed, revert failed

Every user action:
  Login, logout, failed login (with IP), password reset,
  user invited, user deactivated, role changed

Every dispatch:
  Officer pinged, route sent, officer acknowledged,
  officer arrived, officer assigned

Every report:
  Generated, downloaded, emailed, shared link created

Every configuration change:
  Threshold changed, alert config changed,
  device registered, device removed, integration updated

Every AI agent call:
  Triage request, synthesis request, confidence score,
  tokens used, model used, job manifest issued

Every autonomous device action:
  Device registered, device tested, command sent,
  acknowledgement received, override active, override reverted
```

---

# SECTION G: PERFORMANCE REQUIREMENTS

```
Dashboard initial load:          < 3 seconds
Live map render:                 < 2 seconds
Incident card real-time update:  < 5 seconds from logging
AI panel first render:           < 10 seconds from incident log
Officer ping delivery:           < 3 seconds from operator click
Route to officer device:         < 5 seconds from dispatch

PWA offline map load:            < 1 second (cached tiles)
PWA check-in response:           < 2 seconds
PWA SOS send:                    < 2 seconds

Works on:
  Nigerian average internet speed (5–15 Mbps)
  2G/3G for officer PWA critical functions
  Low-end Android devices (2GB RAM, Android 8+)
  Desktop Chrome, Firefox, Edge (latest 2 versions)
  Mobile Safari iOS 14+
```

---

# SECTION H: BUILD CHECKLIST

```
Authentication
  [ ] JWT login flow end-to-end
  [ ] All 5 roles receive correct dashboard view
  [ ] Role-based route guards tested
  [ ] 2FA for manager and admin roles
  [ ] Password reset via Resend email

Lemtik Admin Console
  [ ] Organisation management CRUD
  [ ] Service health panel (all 7 services)
  [ ] Platform audit log (append-only verified)
  [ ] Billing overview

C4I Command Dashboard
  [ ] Live dashboard stats cards (real-time)
  [ ] Live incident map (all 7 layers)
  [ ] AI command panel end-to-end
  [ ] Incident CRUD + lifecycle management
  [ ] Officer ping + route push to PWA
  [ ] Autonomous action approval flow
  [ ] Patrol management + route builder
  [ ] OSINT feed + intelligence cards
  [ ] Inventory view + threshold alerts
  [ ] Analytics charts (all tabs)
  [ ] Report generation and delivery
  [ ] Alert centre + alert configuration
  [ ] User management + invitation flow
  [ ] Audit log (read only, export)
  [ ] Organisation settings all tabs
  [ ] Device registry + connection test

Officer PWA
  [ ] PWA installable on Android (tested)
  [ ] All permissions requested on first launch
  [ ] Offline patrol route view
  [ ] Offline check-in (sync on reconnect)
  [ ] Offline incident report (sync on reconnect)
  [ ] Dispatch full-screen alert + sound
  [ ] Mapbox navigation (pre-loaded route)
  [ ] SOS button end-to-end
  [ ] Push notifications (background + foreground)

Real-time
  [ ] Socket.io incident:new received on dashboard
  [ ] Officer location dot updates on map
  [ ] Autonomous override status updates live
  [ ] Patrol check-in updates on patrol map

Notifications
  [ ] Resend email all templates tested
  [ ] Termii SMS delivery confirmed
  [ ] Twilio WhatsApp delivery confirmed
  [ ] Push notification to officer PWA confirmed

Audit Trail
  [ ] Every incident action logged
  [ ] Every autonomous action logged
  [ ] Every user action logged
  [ ] Append-only confirmed (no delete possible)
  [ ] Export to CSV working
```

---

*Version 1.0 — Lemtik Security Engineering*
*This document is the complete specification for every screen,*
*every component, every role, and every interaction in the*
*Lemtik C4I Dashboard.*
*Build from the RBAC outward. Get auth right first.*
*Everything else depends on it.*