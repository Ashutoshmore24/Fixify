# Fixify - Assumptions and Institutional Resolutions (docs/ASSUMPTIONS.md)

This document records architectural decisions, institutional assumptions, deployment requirements, and resolutions for items marked as To Be Determined (TBD) in `docs/SRS.md`.

---

## 1. Resolution of SRS Appendix C (To Be Determined List)

### TBD-1: Institutional Email Domains & Public Domain Restriction
- **SRS Question**: Final approved list of acceptable institutional email domains for Single Sign-On (SSO).
- **Resolution**:
  - Configured through environment variable `ALLOWED_EMAIL_DOMAINS` as a comma-separated list of institutional domains (e.g., `pccoe.org,student.pccoe.org,faculty.pccoe.org`).
  - **Strict Production Check**: Public email providers (such as `gmail.com`, `yahoo.com`, `outlook.com`, `hotmail.com`, `icloud.com`) are strictly prohibited in production. If `NODE_ENV=production` and any public domain is present in `ALLOWED_EMAIL_DOMAINS`, server startup fails immediately with a descriptive configuration error.
  - In `NODE_ENV=development` only, test accounts and development domains may be used.
  - Validation checks Google token payload `hd` (hosted domain) or verifies email suffix matches `ALLOWED_EMAIL_DOMAINS`.
  - Also requires `email_verified: true` from Google OAuth payload. Non-matching domains receive HTTP 403 Forbidden with a clear institutional guidance message.

### TBD-2: Physical QR Code Format & Mobile Scanning
- **SRS Question**: Physical dimensions, material durability, and adhesive specifications for physical lab placement.
- **Resolution**:
  - Each laboratory features one official placard with a high-resolution QR code encoding `${CLIENT_URL}/report?lab=<labCode>`.
  - Users scan this QR code directly using their smartphone's native camera app (no custom in-app camera scanner required).
  - The system provides administrators with printable SVG/PNG placards containing the QR code, lab name, room number, building, and reporting instructions.

### TBD-3: Hosting, Deployment & Same-Site Cookie/CSRF Architecture
- **SRS Question**: Cloud hosting environment and budgetary constraints.
- **Resolution**:
  - **Deployment Architecture**: The client SPA and backend API are assumed to be deployed **same-site** (e.g., sharing a parent domain such as `fixify.pccoe.org` / `api.fixify.pccoe.org` with `SameSite=Lax`, or behind an institutional reverse proxy / ingress where the API is routed under `/api`).
  - **CSRF Protection**: Because authentication uses `httpOnly`, `Secure` cookies, CSRF protection is implemented via custom header checks (e.g., verifying `X-Requested-With: XMLHttpRequest` or an anti-CSRF double-submit token header) on all state-changing HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`).
  - **Socket.IO Authentication**: The Socket.IO connection handshake extracts and verifies the exact same `httpOnly` JWT cookie as the REST endpoints, ensuring consistent session validation.

### TBD-4: Automatic Escalation Timeframe & Triggers
- **SRS Question**: Unacknowledged ticket escalation timeframe rules (24 vs 48 hours).
- **Resolution**:
  - Configurable via `Setting` collection key `escalation_timeout_hours` with environment variable fallback `ESCALATION_TIMEOUT_HOURS` (default: 24 hours).
  - A scheduled `node-cron` background worker runs periodically, identifying tickets in `OPEN`, `ASSIGNED`, or `ACCEPTED` status that have exceeded this threshold, and automatically transitions them to `ESCALATED` to the department authority with system audit logging.

---

## 2. Additional Architectural & Business Assumptions

### 1. Initial Admin Provisioning & Role Hierarchy
- At startup, if no Administrator exists, the user corresponding to `ADMIN_EMAIL` is automatically granted the `ADMIN` role upon first login.
- When any new user logs in via Google OAuth for the first time:
  - If email matches `ADMIN_EMAIL`, they receive `ADMIN`.
  - If email matches faculty patterns (e.g. `faculty.pccoe.org`), they receive `FACULTY`.
  - Otherwise, they default to `STUDENT`.
- Elevated roles (`LAB_ASSISTANT`, `DEPT_AUTHORITY`, `HOD`, `ADMIN`) and lab assignments can only be assigned by an `ADMIN`.

### 2. Ticket Status Lifecycle & BR-3 Active Index
- **Full Status Enum**:
  `OPEN`, `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `ESCALATED`, `AWAITING_PARTS`, `RESOLVED`, `CLOSED`, `REJECTED`, `CANCELLED`.
- **Active State Definition**:
  - `isActive = true` for: `OPEN`, `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `ESCALATED`, `AWAITING_PARTS`, `RESOLVED`.
  - `isActive = false` for: `CLOSED`, `REJECTED`, `CANCELLED`, or when soft-deleted (`deletedAt !== null`).
- **BR-3 MongoDB Partial Unique Index**:
  MongoDB `partialFilterExpression` does not support `$nin`. Therefore, `Ticket.isActive` is maintained synchronously in the ticket state machine and pre-save hooks, and the partial unique index is defined as:
  `{ computer: 1 }, { unique: true, partialFilterExpression: { isActive: true } }`.

### 3. BR-6 Spare Part Requisition & Approval Workflow
- When a Lab Assistant requires a spare part:
  1. The assistant creates a Part Request on the ticket.
  2. The ticket transitions from `IN_PROGRESS` to `ESCALATED` (pending approval).
  3. Only a `DEPT_AUTHORITY` (scoped to the ticket's laboratory department) or `ADMIN` can approve or reject the request.
  4. **Approved**: The ticket transitions from `ESCALATED` to `AWAITING_PARTS`.
  5. **Fulfilled (BR-7)**: Once parts are available/installed, fulfilling the request runs a MongoDB multi-document transaction (decrements inventory, updates `Computer.installedComponents`, logs replacement record) and transitions the ticket from `AWAITING_PARTS` to `IN_PROGRESS`.
  6. **Rejected**: If the authority rejects the request, a mandatory `rejectionReason` is recorded, and the ticket transitions from `ESCALATED` back to `IN_PROGRESS`.

### 4. Valid Transitions to ESCALATED (BR-5, REQ-4.1)
- The state machine permits transitions to `ESCALATED` from:
  - `OPEN` (auto-escalation if unassigned/unacknowledged past timeout)
  - `ASSIGNED` (auto-escalation if unacknowledged past timeout)
  - `ACCEPTED` (assistant escalation or auto-escalation)
  - `IN_PROGRESS` (assistant escalation or part request)

### 5. Critical Electrical & Safety Keyword Engine (REQ-1.9, SRS 5.2)
- Safety trigger terms: `burning`, `smoke`, `shock`, `short circuit`, `spark`, `exposed wire`, `fire`, `sparking`, `electric shock`.
- Trigger condition: If the user selects the category `Electrical/Safety` OR the description contains any safety keyword:
  - Ticket priority is automatically set to `CRITICAL`.
  - The UI immediately displays an urgent hazard modal: **"DANGER: Stop using this equipment immediately and step away from the workstation."**
  - Instant notifications are dispatched to both the Lab Assistant and Department Authority.

### 6. User-Aware & Campus-Safe Rate Limiting
- Rate limiting is keyed primarily by authenticated `userId` (`req.user.id`).
- Unauthenticated routes fall back to IP-based rate limiting with relaxed thresholds to prevent blocking institutional campus Wi-Fi networks where thousands of students share NAT gateway IPs.

### 7. Atomic Ticket Counters Per Year
- Sequential ticket numbering uses annual keys: `ticket-YYYY` (e.g. `ticket-2026`).
- Atomically increments sequence numbers via `findOneAndUpdate` on the `Counter` collection, yielding IDs formatted as `FIX-YYYY-000001`.

### 8. Strict Environment Validation (Zod)
- Environment variables are validated on server initialization using Zod.
- Placeholders (e.g. `replace_with...`, default passwords, strings containing `secret`) are rejected in `production`.
