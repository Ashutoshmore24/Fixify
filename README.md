<div align="center">

# 🛠️ Fixify

### IT Asset & Maintenance Management System for College Computer Labs

![Status](https://img.shields.io/badge/Status-Active%20Develoyed-brightgreen)
![Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Node.js%2024%20%7C%20MongoDB%20%7C%20Cloudflare-blue)
![Testing](https://img.shields.io/badge/Tests-Vitest%20%7C%20Playwright-orange)
![License](https://img.shields.io/badge/License-MIT-green)

Fixify is an enterprise-grade academic software engineering platform designed to modernize how educational institutions report, track, resolve, and audit computer-lab maintenance issues. The system unifies QR-based mobile complaint logging, interactive 2D laboratory floorplans, automated SLA escalation, ticket lifecycle management, computer workstation inventory, and tamper-proof audit trails into a cohesive, secure web application.

**Project Status:** Active development & production deployable. Fixify supports both **instant local development** (with salted scrypt password authentication) and **hybrid cloud deployment** (Cloudflare Workers reverse-proxy gateway + Render Node 24 Web Service + MongoDB Atlas replica set + Cloudinary + Firebase Authentication).

</div>

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [Core Capabilities](#-core-capabilities)
- [User Roles](#-user-roles)
- [Ticket Workflow & Lifecycle](#-ticket-workflow--lifecycle)
- [System Architecture & Deployment](#-system-architecture--deployment)
- [Technology Stack](#-technology-stack)
- [Folder Structure](#-folder-structure)
- [Project Documentation](#-project-documentation)
- [Getting Started](#-getting-started)
  - [Mode 1: Quickstart Local Setup (No Firebase Required)](#mode-1-quickstart-local-setup-no-firebase-required)
  - [Mode 2: Local Setup with Firebase Authentication](#mode-2-local-setup-with-firebase-authentication)
  - [Mode 3: Production Cloud Deployment](#mode-3-production-cloud-deployment)
- [Environment Configuration](#-environment-configuration)
- [Available Scripts](#-available-scripts)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Operational Notes & Considerations](#-operational-notes--considerations)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🔴 The Problem

Educational computer laboratories support hundreds of students daily for coursework, practical examinations, programming labs, and research. Traditional informal maintenance reporting (paper registers, verbal notices, unsorted emails) creates critical operational bottlenecks:

- **Lost & Untracked Complaints:** Requests are forgotten, neglected, or left without assigned ownership.
- **Duplicate Reports:** Multiple students submit separate complaints for the same broken computer workstation.
- **Downtime & SLA Breaches:** Broken machines remain out of service for weeks with no automated escalation or visibility.
- **Safety Hazards:** Serious electrical faults (sparks, burning smells, damaged wiring) are treated as routine tickets rather than urgent emergencies.
- **Lack of Asset History:** Technicians cannot review previous component failures or recurring hardware issues for a workstation.
- **Absence of Accountability:** Administrators lack reliable data on repair resolution times, laboratory failure frequencies, or staff workloads.

---

## 💡 The Solution

Fixify delivers a centralized, responsive, role-based IT maintenance ecosystem tailored to college laboratory environments:

1. **Instant QR Code Entry:** Students scan a physical QR code mounted in any computer lab, instantly opening the mobile reporting interface with the laboratory context preloaded.
2. **Interactive 2D Lab Floorplans:** Users select the exact physical workstation via interactive floorplan hotspot maps reflecting real PCCOE laboratory layouts.
3. **Automated Safety Shield:** Real-time keyword analysis flags hazardous electrical faults, displays immediate user safety guidance, and auto-elevates tickets to `CRITICAL` priority.
4. **Intelligent Auto-Assignment:** Tickets route automatically to the designated lab assistant with the lowest active workload.
5. **Enforced State Machine:** Multi-step ticket progression requires diagnostic notes and mandatory physical testing verification (`testedOk === true`) before closure.
6. **Automated SLA Escalation:** Background cron workers continuously monitor unacknowledged tickets and escalate overdue issues directly to departmental authorities.
7. **Tamper-Proof Audit History:** Append-only database logging records all state changes, administrative overrides, and authentication events.

---

## ✨ Core Capabilities

### 📱 QR-Based Mobile Complaint Reporting
- **Lab-Specific Placards:** High-resolution SVG/PNG printable placards encoding `${CLIENT_URL}/report?lab=<labCode>`.
- **Interactive Visual Floorplans:** Integrated 2D map views (`LabInteractiveMap`) with real laboratory floorplans from `/labs/` (e.g. LAB-5401, LAB-5305, LAB-5308, etc.) and clickable workstation hotspots.
- **Streamlined Submission Flow:** Mobile-first, four-step reporting workflow: select workstation, pick issue category (`HARDWARE`, `SOFTWARE`, `NETWORK`, `ELECTRICAL`, `OTHER`), provide description, and optionally upload photo evidence.
- **Collision Protection (BR-3):** MongoDB partial unique index prevents concurrent or duplicate active tickets on the same computer until the existing ticket is closed.

### ⚡ Urgent Safety & Hazard Detection
- **Real-Time Keyword Engine:** Scans descriptions for hazard terms (`burning`, `smoke`, `shock`, `short circuit`, `spark`, `exposed wire`, `fire`, `blast`, `heat`).
- **Emergency Modal Warning:** Instantly triggers an intrusive safety dialog (`ElectricalSafetyModal`) directing students to immediately step away from the equipment.
- **Priority Escalation:** Automatically marks the incident as `CRITICAL` priority and dispatches urgent notifications to lab staff.

### 🎫 Robust Ticket Lifecycle & Workflows
- **Standardized Identification:** Sequential annual ticket identifiers (`FIX-YYYY-000001`) generated atomically via database counters.
- **Strict 10-State Machine:** Explicit state transitions prevent unauthorized jumps (`OPEN` → `ASSIGNED` → `ACCEPTED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`, with branching for `ESCALATED`, `AWAITING_PARTS`, `REJECTED`, and `CANCELLED`).
- **Workload-Aware Auto-Assignment (BR-4):** Automatically identifies lab assistants assigned to the lab and delegates tickets to the assistant with the lowest active ticket volume.
- **Quality-Guaranteed Closure (BR-8):** Closing a ticket strictly requires assistant confirmation that the workstation tested OK (`testedOk === true`) and non-empty resolution notes.
- **Live Ticket Timeline:** Full audit history of status updates, actor identities, timestamps, and technician notes (`TicketTimelineModal`).

### ⏰ Automated Escalation & SLA Management
- **Background Cron Engine:** Periodically evaluates unacknowledged and pending tickets past the institutional SLA threshold (default: 24 hours).
- **Free-Host Idle Wake Recovery:** Automatically runs an escalation check on server startup to catch overdue tickets after waking from cloud hosting idle sleep.
- **Departmental Escalation:** Transitions overdue tickets to `ESCALATED` status with system alerts routed to Department Authorities.

### 🖥️ IT Asset & Workstation Management
- **Official 12-Lab Roster:** Pre-configured roster (`OFFICIAL_LAB_ROSTER`) mapped to the PCCOE IT Engineering building, complete with laboratory codes, room numbers, and workstation layouts.
- **Granular Computer Records:** Asset tags, labels, hardware specifications (CPU, RAM, storage, GPU, OS), warranty tracking, operational status (`ACTIVE`, `UNDER_MAINTENANCE`, `RETIRED`), and full repair histories.
- **Admin Management Consoles:** Dedicated interfaces for managing computers (`AdminComputers`), laboratories (`AdminLabs`), and academic departments (`AdminDepartments`).

### 🛡️ Security, RBAC & Institutional Access
- **Dual Authentication Modes:**
  - **Firebase Authentication:** Google OAuth + Email/Password with email verification and institutional domain gating.
  - **Local Development Mode:** Salted scrypt password hashing for rapid offline development without third-party cloud dependencies.
- **Strict Institutional Domain Whitelist (BR-10):** Restricts access to authorized college domains (e.g., `pccoepune.org`, `pccoe.org`), rejecting public email domains in production.
- **Student PRN Validation:** Enforces institutional permanent registration numbers using regex validation.
- **Sliding Session Security:** Signed `httpOnly` JWT session cookies (15-minute sliding expiry + 8-hour maximum session ceiling).
- **Inactivity Guard:** Interactive idle timer modal (`IdleTimeoutModal`) displaying a 2-minute countdown before automatic logout.
- **Reverse-Proxy Gateway Verification:** Backend routes are guarded by a shared gateway secret (`x-fixify-gateway` / `EDGE_PROXY_SECRET`) to prevent origin bypass.
- **Campus NAT-Friendly Rate Limiting:** Keyed primarily by authenticated user ID (`req.user.id`), preserving accessibility on shared campus networks.
- **CSRF Defense:** Custom header verification (`X-Requested-With: XMLHttpRequest` / `X-CSRF-Token`) on all mutating endpoints.

### 📊 Administration & Auditability
- **KPI Dashboard:** Real-time visibility into open complaints, resolution statistics, user distribution, and equipment maintenance warnings.
- **Tamper-Proof Audit Logging:** Append-only collection (`AuditLog`) protected against modifications and deletions at schema, middleware, and query levels.
- **Staff Provisioning Pipeline:** CLI script (`scripts/provision-staff.ts`) and secured API (`/api/v1/provision-staff`) to bootstrap or synchronize staff accounts from `credentials.env`.
- **Dynamic Institutional Settings:** Configurable escalation timeouts and inventory warning thresholds.

---

## 👥 User Roles

Fixify implements role-based access control (RBAC) enforced on both client routes and backend middleware:

| Role | Access Scope & Responsibilities |
| :--- | :--- |
| `STUDENT` | Report lab complaints via QR or portal, select workstations on 2D map, track personal complaint history and timeline updates. |
| `FACULTY` | Report lab issues, track department complaints, access expedited review workflows. |
| `LAB_ASSISTANT` | Access Assistant Dashboard, accept assigned tickets, diagnose issues, log repair notes, verify workstation testing, and close tickets. |
| `HOD` | High-level departmental overview, read-only analytics, maintenance performance indicators, and equipment reliability reports. |
| `ADMIN` | Manage users, departments, laboratories, computer inventory, system settings, staff provisioning, and audit logs. |

---

## 🔄 Ticket Workflow & Lifecycle

Tickets follow a finite state machine ensuring complete traceability from initial scan to final closure:
<img width="1536" height="915" alt="ticket_lifecycle" src="https://github.com/user-attachments/assets/5a065c32-d76a-4fba-92db-2f96719c27eb" />



### Ticket Status Definitions
- `OPEN`: Newly submitted complaint awaiting assignment (fallback when no assistant is configured).
- `ASSIGNED`: Assigned to a specific lab assistant based on least active workload.
- `ACCEPTED`: Acknowledged by the lab assistant.
- `IN_PROGRESS`: Physical diagnostics, software remediation, or component replacement underway.
- `ESCALATED`: Escalated to Department Authority due to SLA timeout, complexity, or component requirements.
- `AWAITING_PARTS`: Hardware requisition approved and waiting for inventory fulfillment.
- `RESOLVED`: Repair completed; awaiting final workstation operational testing.
- `CLOSED`: Fully resolved and verified with physical testing confirmation and resolution notes.
- `REJECTED`: Declared non-actionable or invalid with mandatory explanatory justification.
- `CANCELLED`: Withdrawn by the reporting student or administrator prior to repair commencement.

---

## 🌐 System Architecture & Deployment

Fixify is architected for seamless local operation and high-availability cloud deployment:
<img width="1536" height="1024" alt="system_arch" src="https://github.com/user-attachments/assets/f863b022-e3a2-42ae-814f-4c4afe61bbb1" />


### Cloud Architecture Highlights
- **Cloudflare Workers:** Serves the frontend single-page application from edge storage with client-side routing fallback. Reverse-proxies `/api`, `/socket.io`, `/labs`, `/uploads`, and `/health` to the backend.
- **Gateway Secret Defense:** The Cloudflare Worker injects a shared `x-fixify-gateway` header (`EDGE_PROXY_SECRET`). The Express backend rejects any direct traffic bypassing the proxy.
- **Same-Site Cookie Security:** Because requests route through the shared Cloudflare domain, session cookies operate as first-party `SameSite=Lax` cookies, avoiding third-party cookie restrictions across modern mobile browsers.
- **Wake-Up Detection:** The Cloudflare worker gracefully detects cold starts on free Render instances, returning structured retry responses rather than raw timeouts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript, Vite |
| **Styling & UI Primitives** | Tailwind CSS, Radix UI Primitives, Lucide Icons |
| **State & Data Fetching** | TanStack Query (React Query v5), Axios |
| **Form Management** | React Hook Form, Zod Validation |
| **Data Visualization** | Recharts (Admin analytics & metrics) |
| **Backend Runtime** | Node.js (20+ local, Node 24 on Render), Express, TypeScript, `tsx` |
| **Database & ODM** | MongoDB 7+ (Replica Set required for ACID transactions), Mongoose 8 |
| **Authentication** | Firebase Authentication (Web & Admin SDK), Local Scrypt Password Engine |
| **Real-Time Engine** | Socket.IO (room segregation by user, lab, department, and role) |
| **Media Storage** | Cloudinary SDK (cloud storage), Multer (multipart upload handling) |
| **Logging & Utilities** | Pino, Pino-Pretty, NanoID, QRCode |
| **Scheduled Tasks** | `node-cron` (automated SLA escalation checking) |
| **Cloud Deployment** | Cloudflare Workers (`wrangler`), Render Web Service (`render.yaml`) |
| **Testing Suites** | Vitest, Supertest, `mongodb-memory-server`, Playwright |

---

## 🏗️ Folder Structure

```
Fixify.git/
├── .github/
│   └── workflows/
│       └── ci.yml
├── client/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── labs/                  # All laboratory layout references
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   ├── profile/
│   │   │   ├── ui/
│   │   │   ├── LabInteractiveMap.tsx
│   │   │   ├── ElectricalSafetyModal.tsx
│   │   │   ├── IdleTimeoutModal.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── TicketTimelineModal.tsx
│   │   ├── config/
│   │   │   └── lab-layouts.config.ts
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── SocketContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── features/
│   │   │   └── complaints/
│   │   ├── lib/
│   │   │   ├── axios.ts
│   │   │   ├── email-verification.ts
│   │   │   ├── firebase.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── AssistantDashboard.tsx
│   │   │   ├── CompleteProfile.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── MyComplaints.tsx
│   │   │   ├── PendingApproval.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── ReportComplaint.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── VerifyEmail.tsx
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── common/
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   ├── errors/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── socket/
│   │   │   └── utils/
│   │   ├── modules/
│   │   │   ├── admin/
│   │   │   ├── audit/
│   │   │   ├── auth/
│   │   │   ├── computers/
│   │   │   ├── departments/
│   │   │   ├── laboratories/
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   ├── qr/
│   │   │   ├── settings/
│   │   │   ├── tickets/
│   │   │   ├── upload/
│   │   │   └── users/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── test/                      # Backend unit and integration tests
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── diagrams/                  # Mermaid architecture and workflow diagrams
│   ├── images/                    # Generated architecture diagram images
│   ├── ui/                        # UI screenshots and design references
│   ├── ASSUMPTIONS.md
│   ├── DEPLOY.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── RUN.md
│   ├── SRS.md
│   └── TRACEABILITY.md
├── labs/                           # Original laboratory layout references
├── deploy/
│   └── cloudflare-worker.mjs
├── e2e/                            # End-to-end tests
├── scripts/
│   ├── build-cloudflare.mjs
│   ├── dev.mjs
│   ├── e2e-server.ts
│   ├── prepare-hosting-env.mjs
│   ├── provision-staff.ts
│   ├── render-diagrams.mjs
│   └── seed.ts
├── .gitignore
├── .prettierrc
├── credentials.env.example
├── LICENSE
├── README.md
├── package.json
├── package-lock.json
├── playwright.config.ts
├── playwright.verification.config.ts
├── render.yaml
└── wrangler.jsonc
```

---

## 📚 Project Documentation

The `docs/` directory contains full engineering specifications and guides:

- [`docs/SRS.md`](docs/SRS.md) — Complete **Software Requirements Specification** conforming to IEEE 29148-2018.
- [`docs/TRACEABILITY.md`](docs/TRACEABILITY.md) — **Requirement Traceability Matrix** mapping REQ-1.1 through BR-10 to code and tests.
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — Complete **Production Deployment Guide** for Cloudflare Workers and Render.
- [`docs/RUN.md`](docs/RUN.md) — Comprehensive **Local Setup Guide** for both Local Password and Firebase Auth modes.
- [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) — Architectural invariants, security resolutions, and resolved assumptions.
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — Phase-by-phase implementation blueprint.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed:
- **Node.js:** `20.12.0` or higher (`v24` recommended for production).
- **npm:** `10.x` or higher.
- **MongoDB:** `7.x` or higher (configured with a replica set for multi-document ACID transactions), or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/) cluster.

---

### Mode 1: Quickstart Local Setup (No Firebase Required)

Fixify supports an offline development mode using salted scrypt password authentication.

1. **Clone and Install Dependencies:**
   ```bash
   git clone https://github.com/Ashutoshmore24/Fixify.git
   cd Fixify
   npm install
   ```

2. **Configure Environment Files:**
   ```bash
   # Copy environment templates
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   cp credentials.env.example credentials.env
   ```
   *(On Windows Command Prompt, use `copy`; on PowerShell, use `Copy-Item`)*

3. **Set Local Auth Mode:**
   - In `server/.env`:
     ```ini
     AUTH_MODE=local
     MONGODB_URI=yourmongodb_uri_string
     JWT_SECRET=super_secret_local_dev_key_at_least_32_chars_long
     ```
   - In `client/.env`:
     ```ini
     VITE_AUTH_MODE=local
     VITE_API_BASE_URL=http://localhost:5000/api/v1
     VITE_SOCKET_URL=http://localhost:5000
     ```

4. **Set Staff Passwords:**
   Open `credentials.env` and supply passwords for the administrator and lab assistants.

5. **Seed Database & Laboratories:**
   ```bash
   npm run seed
   ```
   *This provisions the 7 default staff accounts, creates the official 12 laboratories, and registers their workstation computers.*

6. **Start Development Servers:**
   ```bash
   npm run dev
   ```
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:5000](http://localhost:5000)
   

---

### Mode 2: Local Setup with Firebase Authentication

To run Fixify with Google Sign-In and email verification:

1. Follow steps 1 and 2 above.
2. In `server/.env` and `client/.env`, set `AUTH_MODE=firebase` and `VITE_AUTH_MODE=firebase`.
3. Create a project in the [Firebase Console](https://console.firebase.google.com/) and enable **Email/Password** and **Google** providers.
4. Download your Firebase Admin private key, save it as `server/serviceAccountKey.json`, and reference it in `server/.env`:
   ```ini
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   ```
5. Add your Firebase web configuration values to `client/.env`.
6. Run `npm run seed` and `npm run dev`.

---

### Mode 3: Production Cloud Deployment

Fixify is configured for seamless deployment on Cloudflare Workers and Render:

1. **Deploy Frontend to Cloudflare Workers:**
   ```bash
   npm run build:cloudflare
   npx wrangler login
   npm run deploy:cloudflare
   ```
   - Link : https://fixify.fixify-monorepo.workers.dev

2. **Deploy Backend to Render:**
   - Create a Web Service using `render.yaml` as a Blueprint.
   - Run the environment preparation utility:
     ```bash
     node scripts/prepare-hosting-env.mjs https://fixify.fixify-monorepo.workers.dev
     ```
   - Import the generated `deploy/render.env` into Render.

3. **Link Edge Gateway:**
   ```bash
   npx wrangler secret put BACKEND_ORIGIN
   npx wrangler secret put EDGE_PROXY_SECRET
   ```
   *For detailed instructions, consult [`docs/DEPLOY.md`](docs/DEPLOY.md).*

---

## 🔐 Environment Configuration

### Server Configuration (`server/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `development` |
| `AUTH_MODE` | Authentication provider (`firebase` or `local`) | `firebase` |
| `PORT` | Backend listening port | `5000` |
| `CLIENT_URL` | Allowed origin for CORS & cookie issuance | `http://localhost:5173` |
| `SERVER_URL` | Public API base address | `http://localhost:5000` |
| `MONGODB_URI` | MongoDB connection string (replica set required) | `mongodb://127.0.0.1:27017/fixify?replicaSet=rs0` |
| `JWT_SECRET` | Secret key for signed session JWTs (min 32 chars in prod) | `random_secret_string` |
| `COOKIE_SECRET` | Secret key for signed cookies | `cookie_secret_string` |
| `EDGE_PROXY_SECRET` | Gateway secret matching Cloudflare Worker proxy | `shared_proxy_secret` |
| `ALLOWED_EMAIL_DOMAINS` | Permitted institutional email domains | `institutional email domains` |
| `ADMIN_EMAIL` | Default administrator account email | `youradmin_email` |
| `ESCALATION_TIMEOUT_HOURS` | Unacknowledged ticket SLA timeout | `24` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier (optional locally) | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API access key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |

### Client Configuration (`client/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | REST API endpoint URL | `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |
| `VITE_AUTH_MODE` | Client authentication mode (`firebase` or `local`) | `firebase` |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | `fixify-pccoe.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `fixify-pccoe` |
| `VITE_APP_NAME` | Institutional branding application name | `Fixify` |

---

## 📜 Available Scripts

Run scripts from the monorepo root:

| Command | Workspace | Description |
| :--- | :--- | :--- |
| `npm run dev` | Root | Concurrently runs backend and Vite client using `scripts/dev.mjs`. |
| `npm run dev:server` | `server` | Starts backend server with `tsx watch` for auto-reloading. |
| `npm run dev:client` | `client` | Starts Vite development server for the React frontend. |
| `npm run build` | Workspaces | Builds TypeScript distribution bundles for client and server. |
| `npm run build:cloudflare` | Root | Prepares and bundles client distribution for Cloudflare Workers. |
| `npm run deploy:cloudflare` | Root | Deploys static assets and edge worker via Wrangler. |
| `npm run seed` | Root | Seeds official PCCOE departments, 12 labs, workstations, and staff accounts. |
| `npm run lint` | Workspaces | Executes ESLint across client and server workspaces. |
| `npm run typecheck` | Workspaces | Performs full TypeScript compilation checks (`tsc --noEmit`). |
| `npm run test` | `server` | Runs the Vitest test suite (unit, integration, and security tests). |
| `npm run test:e2e` | Root | Executes Playwright end-to-end browser tests. |
| `npm run test:verification` | Root | Runs the Playwright full verification test suite. |
| `npm run docs:diagrams` | Root | Re-renders Mermaid documentation diagrams to static media. |

---

## 🧪 Testing & Quality Assurance

Fixify maintains rigorous test coverage spanning all architectural boundaries:

- **Backend Testing with Vitest:** Over 27 test suites in `server/test/` verifying atomic counters, duplicate ticket prevention (BR-3), auto-assignment workloads (BR-4), closure requirements (BR-8), immutable audit logs, rate-limiting, and CORS policies.
- **In-Memory Replica Sets:** Integration tests run with `mongodb-memory-server` configured with multi-document transaction replica sets, avoiding external database dependencies during CI/CD.
- **End-to-End Testing with Playwright:** Browser tests in `e2e/` validate complete user journeys including QR scan navigation, complaint submission, assistant review, and email verification.

To run tests:
```bash
# Run unit and integration tests
npm test

# Run browser E2E tests
npm run test:e2e
```

---

## 🧰 Operational Notes & Considerations

- **MongoDB Replica Set Requirement:** Fixify uses multi-document ACID transactions for ticket assignment, inventory decrementing, and staff provisioning. Local MongoDB instances must be initiated as a replica set (`--replSet rs0`).
- **Free Cloud Tier Behavior:** When deployed on Render's free tier, the backend sleeps after inactivity and may require 45–60 seconds to wake on initial access. The Cloudflare edge worker catches waking responses and instructs clients to retry.
- **Persistent Media Storage:** Free cloud compute disks are ephemeral. Media attachments in production are uploaded to Cloudinary, ensuring persistence across server restarts.
- **Domain Gating:** When `NODE_ENV=production`, `ALLOWED_EMAIL_DOMAINS` strictly rejects public email providers (e.g. `gmail.com`, `yahoo.com`), ensuring only validated institutional accounts can authenticate.

---

## 🤝 Contributing

Contributions and issue reports are welcome.

1. Fork the repository and create a feature branch (`git checkout -b feature/improvement`).
2. Adhere to existing code conventions and formatting standards (`npm run lint`).
3. Ensure all tests and TypeScript compiler checks pass (`npm run typecheck && npm test`).
4. Update documentation in `docs/` and `README.md` if workflows or configuration parameters are modified.
5. Submit a pull request detailing the problem and proposed implementation.

---

## 👨‍💻 Team

Fixify was developed as a software engineering capstone project by :

| Team Member | Details | Focus Area |
| :--- | :--- | :--- |
| **Ashutosh Sanjay More** | B.Tech -IT, PCCoE | Backend architecture, ticket state machine, security & deployment |
| **Aniket Ashokrao Gawande** | B.Tech -IT, PCCoE | Database modeling, asset management & data integrity |
| **Atharv Sampat Shinde** | B.Tech -IT, PCCoE | Frontend architecture, real-time UI & 2D lab floorplans |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
