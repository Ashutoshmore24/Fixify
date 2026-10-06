# Fixify: IT Asset & Maintenance Management System
## Master Implementation Plan & System Architecture

This master plan details the phase-by-phase engineering strategy for building **Fixify**, derived strictly from `docs/SRS.md`, architectural invariants, and all approved business rules.

---

## 1. Monorepo Architecture & Directory Structure

```text
Fixify/
├── docs/
│   ├── SRS.md                         # Source of truth specification
│   ├── TRACEABILITY.md                # REQ & BR to code/test matrix
│   ├── ASSUMPTIONS.md                 # TBD items, deployment constraints & resolutions
│   ├── API.md                         # Standardized OpenAPI / REST documentation
│   └── ER_UML_NOTES.md                # Entity relationship & state machine diagrams
├── scripts/
│   ├── seed.ts                        # Comprehensive database seed script (college labs data)
│   ├── backup.ts                      # Scheduled/manual MongoDB backup (mongodump)
│   └── restore.ts                     # Database restoration utility (mongorestore)
├── server/
│   ├── src/
│   │   ├── common/
│   │   │   ├── config/                # Zod-validated env & system constants
│   │   │   ├── database/              # Mongoose connection & replica-set transaction helper
│   │   │   ├── errors/                # AppError hierarchy (BadRequest, NotFound, Forbidden, etc.)
│   │   │   ├── middleware/            # auth, rbac, csrf, rate-limit, upload, validate, errorHandler
│   │   │   ├── models/                # Shared schemas (counter, auditLog)
│   │   │   ├── socket/                # Socket.IO server & authenticated handshake handler
│   │   │   ├── utils/                 # apiResponse envelope, logger (Pino), safetyKeywordDetector
│   │   │   └── types/                 # Shared TypeScript interfaces & declarations
│   │   ├── modules/
│   │   │   ├── auth/                  # Fully decoupled Google SSO & JWT module (SRS 6.3)
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.schema.ts
│   │   │   │   └── auth.test.ts
│   │   │   ├── qr/                    # Fully decoupled QR Code generator & URL parser (SRS 6.3)
│   │   │   │   ├── qr.controller.ts
│   │   │   │   ├── qr.routes.ts
│   │   │   │   ├── qr.service.ts
│   │   │   │   ├── qr.schema.ts
│   │   │   │   └── qr.test.ts
│   │   │   ├── users/                 # User CRUD, role management, lab assistant assignments
│   │   │   ├── departments/           # Department management & HOD bindings
│   │   │   ├── laboratories/          # Labs, unique slugs (nanoid), assigned assistants
│   │   │   ├── computers/             # IT Assets, specs, installedComponents, history
│   │   │   ├── tickets/               # Core ticket state machine, annual counter, assignment
│   │   │   ├── escalations/           # Hierarchical escalation, auto-escalation cron
│   │   │   ├── inventory/             # Spare parts stock, part requests, atomic replacement transactions
│   │   │   ├── notifications/         # In-app notifications & Nodemailer dispatch
│   │   │   ├── audit/                 # Append-only audit logging & query service
│   │   │   ├── analytics/             # Departmental metrics, MTTR, laboratory failure rates
│   │   │   └── settings/              # Dynamic institutional settings (escalation hours, thresholds)
│   │   ├── app.ts                     # Express app configuration & middleware registration
│   │   └── server.ts                  # Server entry point & Socket.IO HTTP server bind
│   ├── test/                          # Unit, integration, and business rule test suites
│   │   ├── business-rules/            # Dedicated tests for BR-1 through BR-10
│   │   ├── helpers/                   # Test DB setup (mongodb-memory-server replica set)
│   │   └── setup.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── vitest.config.ts
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── assets/                    # Logos, branding graphics, icons
│   │   ├── components/                # shadcn/ui primitives & shared design system elements
│   │   │   ├── ui/                    # Button, Dialog, Sheet, Dropdown, Table, Input, Badge, etc.
│   │   │   ├── Navbar.tsx             # Universal topbar with user profile, role badge & notifications
│   │   │   ├── Sidebar.tsx            # Role-scoped dynamic navigation
│   │   │   ├── IdleTimerModal.tsx     # 15-minute inactivity warning & auto-logout modal
│   │   │   ├── ProtectedRoute.tsx     # Role-based route guard
│   │   │   └── SafetyWarningModal.tsx # Urgent electrical/safety alert modal
│   │   ├── context/                   # AuthContext, SocketContext, NotificationContext
│   │   ├── features/
│   │   │   ├── auth/                  # Google OAuth button & token handler
│   │   │   ├── complaints/            # <=4 step mobile-first submission flow & PC selector
│   │   │   ├── tickets/               # Ticket detail, status stepper, action modals
│   │   │   ├── assets/                # Asset registry, hardware spec editor
│   │   │   ├── inventory/             # Spare parts table, request part dialog, stock badges
│   │   │   ├── analytics/             # Recharts visualizations (MTTR, failure frequency, lab health)
│   │   │   └── qr/                    # Printable QR placard generator
│   │   ├── hooks/                     # useAuth, useSocket, useTickets, useIdleTimeout
│   │   ├── lib/                       # Axios instance (custom headers), queryClient, utils (cn helper)
│   │   ├── pages/
│   │   │   ├── Login.tsx              # SSO login with institutional disclaimer (SRS 6.2)
│   │   │   ├── ReportComplaint.tsx    # Mobile-first QR entry point (/report?lab=:labCode)
│   │   │   ├── TicketDetails.tsx      # Unified ticket view with role-scoped actions
│   │   │   ├── student/               # My Complaints list & tracker
│   │   │   ├── assistant/             # Assistant Workbench (Assigned, In Progress, Escalate, Close)
│   │   │   ├── authority/             # Department Authority Console (Escalations, Approvals)
│   │   │   ├── hod/                   # HOD Read-Only Analytics Dashboard
│   │   │   └── admin/                 # Admin Dashboard (Users, Labs, Computers, Inventory, Audits, Backups)
│   │   ├── routes/                    # React Router configuration
│   │   ├── types/                     # Shared TypeScript frontend models
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css                  # Tailwind styles & theme variables
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml                     # Continuous integration (lint, typecheck, test, build)
├── .gitignore
├── .prettierrc
├── .eslintrc.cjs
└── package.json                       # Monorepo root workspaces package.json
```

---

## 2. Environment Variables Specification

### Server (`server/.env.example`)
```env
# Application & Server Configuration
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Database Connection (Replica Set required for multi-document ACID transactions)
MONGODB_URI=mongodb://127.0.0.1:27017/fixify?replicaSet=rs0

# Authentication & Session Security (SRS 5.3, BR-10)
JWT_SECRET=replace_with_a_secure_random_key_of_32_characters_or_more
JWT_EXPIRES_IN=15m
COOKIE_SECRET=replace_with_a_secure_cookie_signing_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Institutional Access Rules (BR-10, TBD-1)
# Production strictly forbids public domains (gmail, yahoo, outlook, etc.)
ALLOWED_EMAIL_DOMAINS=pccoe.org,student.pccoe.org,faculty.pccoe.org
ADMIN_EMAIL=admin@pccoe.org

# Business Policy Defaults (BR-5, TBD-4)
ESCALATION_TIMEOUT_HOURS=24
DEFAULT_LOW_STOCK_THRESHOLD=5

# Media Uploads (REQ-1.6: Cloudinary SDK with local filesystem fallback)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email Notifications (Nodemailer SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=Fixify Alerts <notifications@fixify.campus.edu>

# Rate Limiting (Campus NAT-safe; keyed by userId for authenticated routes)
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=1000
RATE_LIMIT_UNAUTH_WINDOW_MS=900000
RATE_LIMIT_UNAUTH_MAX=300
```

### Client (`client/.env.example`)
```env
# API & Socket Endpoints
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000

# Google OAuth Client
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# Institutional Branding & Settings
VITE_APP_NAME="Fixify"
VITE_COLLEGE_NAME="PCCoE IT Maintenance"
```

---

## 3. Database Modeling, Invariants & Indexes

### Full Ticket Status Enum & Active State
- **Status Enum (10 statuses)**:
  `OPEN`, `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `ESCALATED`, `AWAITING_PARTS`, `RESOLVED`, `CLOSED`, `REJECTED`, `CANCELLED`
- **Active State (`isActive: boolean`)**:
  - `isActive === true` for: `OPEN`, `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `ESCALATED`, `AWAITING_PARTS`, `RESOLVED`.
  - `isActive === false` for: `CLOSED`, `REJECTED`, `CANCELLED`, or when soft-deleted (`deletedAt !== null`).
  - Synchronized in ticket state machine transitions and Mongoose pre-save hook.
- **BR-3 MongoDB Compound Partial Unique Index**:
  Because MongoDB `partialFilterExpression` does not support `$nin`, the index is defined as:
  ```ts
  TicketSchema.index(
    { computer: 1 },
    {
      unique: true,
      partialFilterExpression: { isActive: true },
    }
  );
  ```

### Annual Counter (`ticket-YYYY`)
- Sequential ticket numbering uses annual keys: `ticket-YYYY` (e.g. `ticket-2026`).
- Atomically increments sequence numbers via `findOneAndUpdate` on `Counter`, generating ticket IDs formatted as `FIX-YYYY-000001`.

### Data Models Summary
- **User**: `name`, `email` (unique), `picture`, `role` (enum: `STUDENT | FACULTY | LAB_ASSISTANT | DEPT_AUTHORITY | HOD | ADMIN`), `department` (ref), `assignedLabs` ([ref]), `isActive`, `lastLoginAt`, `deletedAt`.
- **Department**: `name`, `code` (unique), `hod` (ref User), `authorities` ([ref User]).
- **Laboratory**: `name`, `code` (unique nanoid slug), `building`, `department` (ref), `assistants` ([ref User]), `isActive`, `qrGeneratedAt`.
- **Computer**: `assetTag` (unique), `lab` (ref), `label`, `processor`, `ram`, `storage`, `purchaseDate`, `warrantyExpiry`, `vendor`, `status` (`ACTIVE | UNDER_MAINTENANCE | RETIRED`), `installedComponents` ([{ type, inventoryItem: ref, installedAt, replacedRecord: ref }]), `deletedAt`.
- **Ticket**: `ticketId` (`FIX-YYYY-000001`), `computer` (ref), `lab` (ref), `reportedBy` (ref), `category` (enum), `description`, `images` ([string]), `priority` (`LOW | MEDIUM | HIGH | CRITICAL`), `status` (10-value enum), `isActive` (boolean), `assignedTo` (ref), `escalations` ([{ from, to, reason, at, resolvedAt }]), `partRequests` ([{ item: ref, quantity: number, requestedBy: ref, status: enum, approvedBy: ref, rejectionReason?: string, requestedAt: Date, resolvedAt?: Date }]), `timeline` ([{ status, by, at, note }]), `repairNotes` ([{ by, at, note }]), `resolutionNotes`, `testedOk` (boolean), `createdAt`, `acceptedAt`, `resolvedAt`, `closedAt`, `escalatedAt`, `dueAt`, `deletedAt`.
- **InventoryItem**: `type` (enum), `name`, `quantity` (number >= 0), `lowStockThreshold` (number, default 5), `deletedAt`.
- **PartRequest / ReplacementRecord**: `ticket` (ref), `computer` (ref), `item` (ref), `quantity`, `requestedBy` (ref), `approvedBy` (ref), `status` (`REQUESTED | APPROVED | REJECTED | FULFILLED`), `fulfilledAt`, `rejectionReason`.
- **Notification**: `user` (ref), `type` (enum), `title`, `body`, `ticket` (ref), `readAt`, `createdAt`.
- **AuditLog**: `actor` (ref User), `action` (string), `entityType` (string), `entityId` (ObjectId), `before` (Mixed), `after` (Mixed), `ip` (string), `at` (Date). Append-only (no update/delete routes or model methods).
- **Counter**: `key` (string: `ticket-YYYY`), `seq` (number).
- **Setting**: `key` (string, unique), `value` (Mixed).

---

## 4. Complete Ticket Lifecycle & Business Rules Engine

```text
               [Student Scans QR & Submits]
                             │
                             ▼
                          (OPEN) ◄──────────────────── (No assistant assigned to Lab)
                       │         │                                   │
      [Auto-Assign BR-4]         │                                   │
              │                  │                                   │
              ▼                  │                                   │
          (ASSIGNED)             │                                   │
              │                  │                                   │
     [Assistant Accepts]         │                                   │
              │                  │                                   │
              ▼                  │                                   │
          (ACCEPTED)             │                                   │
              │                  │                                   │
    [Assistant Starts Repair]    │                                   │
              │                  │                                   │
              ▼                  │                                   │
        (IN_PROGRESS)            │                                   │
         │          │            │                                   │
         │    [Part Request]     │ [Auto-Escalate Cron REQ-4.1]      │
         │          │            │ (OPEN, ASSIGNED, ACCEPTED,        │
         │          ▼            │  or IN_PROGRESS past timeout)     │
         │     (ESCALATED) ◄─────┴───────────────────────────────────┘
         │          │
         │   [Authority Review BR-6]
         │   (Only DEPT_AUTHORITY of Lab's Dept or ADMIN)
         │          ├──► [Reject Part] ──► (IN_PROGRESS) (with rejectionReason)
         │          ├──► [Reassign Tech] ─► (ASSIGNED)
         │          ├──► [Close Escalated] (BR-8 check) ──► (CLOSED)
         │          │
         │          └──► [Approve Part]
         │                     │
         │                     ▼
         │              (AWAITING_PARTS)
         │                     │
         │             [Fulfil Part BR-7]
         │        (Atomic Transaction: decrement stock,
         │         record ReplacementRecord, update PC)
         │                     │
         │                     ▼
         └──────────────► (IN_PROGRESS)
                               │
                      [Repair Completed]
                               │
                               ▼
                           (RESOLVED)
                               │
                 [Mandatory Closure Check BR-8]
              (testedOk === true && resolutionNotes)
                               │
                               ▼
                            (CLOSED)

    * Inactive Terminal / Cancel States: (CLOSED), (REJECTED), (CANCELLED) -> isActive = false
```

---

## 5. Phase-by-Phase Roadmap

### Phase 0: Monorepo Foundation & Tooling
- Initialize root monorepo with `workspaces: ["server", "client"]`.
- Configure TypeScript strict configurations (`tsconfig.json`), ESLint (with module boundary rules), Prettier, Husky pre-commit hooks.
- Create `/server` and `/client` directories with dependencies.
- Build test harness: Vitest + Supertest + `mongodb-memory-server` in replica-set mode.
- Setup GitHub Actions CI workflow (`.github/workflows/ci.yml`).

### Phase 1: Server Core Infrastructure & Decoupled Foundation
- Zod-validated environment config at startup (`server/src/common/config/env.ts`):
  - Refuses placeholder secrets in production.
  - Rejects public email domains (gmail, yahoo, etc.) in `ALLOWED_EMAIL_DOMAINS` when `NODE_ENV=production`.
- Database connection module with MongoDB replica-set detection and transaction runner (`runInTransaction`).
- Central error handler and standardized API Envelope `{ success, data, error: { code, message, details } }`.
- Append-only `AuditLog` module and atomic annual `Counter` model (`ticket-YYYY`).
- Campus-safe rate limiting: keyed by authenticated user ID (`req.user.id`), falling back to IP on unauthenticated endpoints.
- CSRF protection middleware: double-submit/custom header check (`X-Requested-With` or `X-CSRF-Token`).
- Fully decoupled `auth` module (`server/src/modules/auth`):
  - Google OAuth token verification (`google-auth-library`).
  - Domain validation (`ALLOWED_EMAIL_DOMAINS` + `hd` check).
  - JWT issuance in `httpOnly`, `Secure`, `SameSite=Lax` cookie.
  - Sliding session refresh middleware and 15-minute inactivity expiry.
  - Initial `ADMIN` bootstrapping via `ADMIN_EMAIL`.
- Fully decoupled `qr` module (`server/src/modules/qr`):
  - Generates URL `${CLIENT_URL}/report?lab=<labCode>`.
  - SVG/PNG data URL generation with printable placard metadata.
  - Zero imports from domain modules.
- Socket.IO server initialization with cookie-based JWT handshake authentication.
- Full test suites for Phase 0 & 1 (env validation, auth, QR, CSRF, rate limit, audit log, transactions).
- **STOP for user review with lint, typecheck, and tests passing.**

### Phase 2: Vertical Slice (End-to-End Core Workflow)
- Build minimal end-to-end slice:
  1. Login with Google SSO & domain check.
  2. Mobile-first complaint submission (`/report?lab=<labCode>` → pick PC → select category & describe → submit ticket with `FIX-YYYY-000001` ID).
  3. Lab Assistant accepts ticket, starts repair, resolves (`testedOk === true`, `resolutionNotes`), and closes.
  4. Student views real-time status and timeline updates.
- Verify end-to-end integration and tests before continuing to remaining modules.

### Phase 3: Domain Entities & IT Asset Management
- `Department` module (CRUD, assign HOD and authorities).
- `User` module (RBAC `requireRole`, assistant assignments, profile management).
- `Laboratory` module (nanoid slug generation, assistant associations).
- `Computer` module (Asset tracking, hardware specs, installedComponents, soft-deletes).
- `Inventory` module (Spare parts stock, low-stock threshold triggers).

### Phase 4: Full Ticket Lifecycle, Escalations & Business Rules
- Ticket state machine with all 10 statuses and `isActive: true` partial unique index (BR-3).
- REQ-1.9 safety keyword detector & electrical alert trigger.
- BR-4 auto-assignment engine (least-active-tickets round-robin).
- BR-5 assistant escalation & REQ-4.1 hourly `node-cron` auto-escalation.
- BR-6 part request escalation & department authority approval/rejection.
- BR-7 atomic inventory replacement transaction (`session.withTransaction()`).
- BR-8 ticket closure verification.

### Phase 5: Notifications, Sockets & Background Jobs
- In-app notification module with Socket.IO room segregation (`user:<id>`, `lab:<id>`, `dept:<id>`, `role:<role>`).
- Nodemailer email dispatch service with resilient error catching and logging.
- Background cron tasks: hourly auto-escalation check and daily database backup runner (`scripts/backup.ts`).

### Phase 6: Role-Based Dashboards & Workflows
- Student/Faculty portal (My Complaints, live status stepper).
- Lab Assistant Workbench (Assigned, In Progress, Escalate, Close).
- Department Authority Console (Escalated tickets, technician reassign, part approval).
- HOD Dashboard (Read-only departmental analytics).
- Admin Management Console (Users, Labs, Computers, Inventory, Audits, Backups).

### Phase 7: Analytics, Reports, Audit Explorer & Maintenance
- Recharts visualizations (MTTR, failure frequency, lab health).
- Read-only Audit Log viewer for Admin.
- Database backup and restore utilities (`scripts/backup.ts`, `scripts/restore.ts`).

### Phase 8: Verification, E2E Testing & Release
- Vitest unit & integration test suites (BR-1 through BR-10, role matrix denial tests).
- Playwright critical E2E flows (QR report, repair/approval/close, electrical safety alert).
- OpenAPI / REST documentation in `docs/API.md`.
- Final production build verification.
