# Fixify - Assumptions and Institutional Resolutions (docs/ASSUMPTIONS.md)

This document records architectural decisions, institutional assumptions, deployment requirements, and resolutions for items marked as To Be Determined (TBD) in `docs/SRS.md`.

---

## 1. Resolution of SRS Appendix C (To Be Determined List)

### TBD-1: Institutional Email Domains & Public Domain Restriction
- **SRS Question**: Final approved list of acceptable institutional email domains and authentication architecture.
- **Resolution**:
  - **Firebase Authentication**: Client uses Firebase Web SDK (`firebase/auth`) for Email/Password and Google Sign-In. Client sends the resulting Firebase ID token to `POST /api/v1/auth/session`.
  - **Backend Token Verification**: The server verifies the token using `firebase-admin` (`verifyIdToken` with `checkRevoked: true`).
  - **Session Cookie**: After verifying the Firebase ID token, the server issues the existing `httpOnly` JWT session cookie (15-minute sliding session + 8-hour absolute maximum lifetime). CSRF protection, Socket.IO cookie auth, and rate limiting remain intact.
  - **Password Storage**: Passwords are encrypted and managed exclusively by Firebase Authentication; institutional application servers never store, log, or handle passwords.
  - **Domain Whitelist (BR-10)**: Configured through environment variable `ALLOWED_EMAIL_DOMAINS` as a comma-separated list of institutional domains (e.g., `pccoe.org,student.pccoe.org,faculty.pccoe.org`). Enforced on the server by exact match of the portion after `@`.
  - **Strict Production Check**: Public email providers (such as `gmail.com`, `yahoo.com`, `outlook.com`, `hotmail.com`, `icloud.com`) are strictly prohibited in production. If `NODE_ENV=production` and any public domain is present in `ALLOWED_EMAIL_DOMAINS`, server startup fails immediately with a descriptive configuration error. Public domains are allowed only in `NODE_ENV=development`.
  - **Email Verification**: Mandatory requirement of `email_verified: true` from the Firebase token. Non-verified emails and unauthorized domains receive HTTP 403 Forbidden with clear institutional guidance.

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

### 1. Initial Admin Provisioning, Public Registration & Role Hierarchy
- At startup or initial login, if a user's email matches `ADMIN_EMAIL`, they receive `ADMIN`.
- **Public Signup Rules**: Public self-registration permits creation of `STUDENT` or `FACULTY` accounts only. Any role field provided by the client attempting to claim other roles (`LAB_ASSISTANT`, `DEPT_AUTHORITY`, `HOD`, `ADMIN`) is strictly ignored and rejected.
- **Faculty Approval Rule**:
  - If a faculty member registers with an email matching the official faculty pattern (e.g., domain `faculty.pccoe.org` or containing `faculty` or `prof`), their account is auto-approved (`approvalStatus: 'APPROVED'`).
  - Otherwise, the faculty account is placed in `approvalStatus: 'PENDING_APPROVAL'` until an Administrator approves it. Users in `PENDING_APPROVAL` are restricted to a pending-approval informational screen.
- **Profile Completion**:
  - Students must complete their profile with `firstName`, `lastName`, `course`, `year`, `division`, and a unique `prn` matching `PRN_REGEX`.
  - Faculty must complete their profile with `firstName`, `lastName`, `department`, and optional `employeeId`.
  - Full application access is blocked until both `email_verified` is true and `profileComplete` is true.
- Elevated roles (`LAB_ASSISTANT`, `DEPT_AUTHORITY`, `HOD`, `ADMIN`) and lab assignments can only be assigned by an `ADMIN`.
- **Developer Impersonation**: Preserved for `NODE_ENV=development` only; permanently disabled and returning 404 in production.

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

---

## 3. Admin Module Architecture & Security Assumptions (Phase 3)

### 1. Non-Guessable Secret Lab Codes (`labCode`)
- Laboratories are assigned a 10-character URL-safe random string (`labCode`, using `nanoid(10)`) separate from their human-readable display code (e.g., `LAB-101`).
- QR codes encode `${CLIENT_URL}/report?lab=<labCode>`. This prevents students or malicious parties from guessing sequential QR URLs or spamming reports across laboratories without being physically present or possessing the QR link.
- Regenerating a `labCode` immediately renders previously printed physical QR placards invalid. The report page `/report?lab=...` resolves labs by `labCode` first, with graceful fallback to `code`.
- A seed migration automatically assigns random `labCode` values to any legacy laboratory documents lacking them.

### 2. Immediate Session Revocation on Role Changes & Deactivation
- In a decoupled JWT + Firebase architecture, changing a user's role or deactivating their account must instantly terminate existing sessions without requiring a heavy distributed token blacklist cache.
- Implemented via a dual mechanism:
  1. `firebase-admin.auth().revokeRefreshTokens(firebaseUid)` revokes Firebase tokens.
  2. `user.tokenVersion` is incremented in MongoDB, and the `authenticate` middleware verifies that the decoded JWT's `tokenVersion` matches the current `dbUser.tokenVersion`. Any mismatch immediately responds with HTTP 401 `SESSION_REVOKED`.

### 3. Self-Demotion, Self-Deactivation, and Last-Admin Guards
- An authenticated administrator is prohibited by server-side business guards from demoting their own role, deactivating their own account, or deleting themselves (`FORBIDDEN_SELF_MODIFICATION`).
- The system checks the count of active administrators before any demotion or deactivation; if only one active `ADMIN` exists, changes that would strip admin privileges are strictly rejected (`CANNOT_DEMOTE_LAST_ADMIN`).

### 4. Zero-Dependency PDF Placard Generation
- To ensure portability across diverse server operating systems (Windows, Linux containers) without native C++ compilation bindings (e.g., canvas or node-gyp) or external command-line binaries, physical laboratory placards (A4 format) are rendered using a standards-compliant PDF 1.4 vector generator.
- Both individual laboratory placards and multi-page concatenated placards ("Download All Labs") are supported natively.

### 5. Two-Step Bulk Computer CSV Import
- Admins importing computer batches upload a CSV file with up to 1,000 rows.
- The server performs a non-destructive **dry-run preflight check**, returning an array of valid rows and invalid rows (annotated with row numbers and exact validation failure reasons such as duplicate asset tag or unknown laboratory).
- The admin inspects the preview and confirms insertion, importing only validated rows in a single batch, accompanied by a single consolidated `AuditLog` entry.

