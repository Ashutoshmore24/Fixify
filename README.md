<div align="center">

# 🛠️ Fixify

### IT Asset & Maintenance Management System for College Computer Labs

![Status](https://img.shields.io/badge/Status-Active_Development-orange)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Node.js%20%7C%20MongoDB-blue)

Fixify is an academic software engineering project designed to improve how educational institutions report, track, and manage computer-lab maintenance issues. The goal is to bring complaint reporting, ticket tracking, asset records, escalation workflows, and maintenance accountability into one web application.

**Project status:** Active development. The application currently runs locally; public deployment is not yet available. Features and workflows may be incomplete or change as development continues.

</div>

---

## 📋 Table of Contents

- [The Problem](#the-problem)
- [The Proposed Solution](#the-proposed-solution)
- [Planned Capabilities](#planned-capabilities)
- [User Roles](#user-roles)
- [Ticket Workflow](#ticket-workflow)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Development Roadmap](#development-roadmap)
- [Known Limitations](#known-limitations)
- [Team](#team)
- [License](#license)

---

## 🔴 The Problem

Computer laboratories depend on working equipment for practical sessions, coursework, and examinations. When maintenance requests are handled informally, institutions can face:

- Complaints that are missed or difficult to track.
- Duplicate reports for the same computer.
- Unclear ownership of repair requests.
- Limited maintenance history for individual assets.
- Delays when an issue requires escalation or replacement parts.
- Little reliable data for understanding recurring failures and repair times.

## 💡 The Proposed Solution

Fixify is being developed as a centralized IT asset and maintenance management platform for college computer laboratories.

The intended workflow allows a student or faculty member to scan a laboratory QR code, select the affected computer, describe the issue, and submit a report. Maintenance staff can then track the ticket, record repair progress, and escalate issues that require additional attention.

The project also aims to support asset records, spare-parts inventory, notifications, audit history, and departmental reporting.

> **Development note:** The capabilities below describe the project scope. They should not be interpreted as confirmation that every feature is complete or production-ready.

---

## ✨ Planned Capabilities

### QR-Based Complaint Reporting

- Laboratory-level QR codes that open the complaint reporting page.
- Selection of a registered computer and issue category.
- Description of the problem and optional image attachments.
- Clear status tracking for submitted reports.

### Ticket Management

- Unique maintenance ticket identifiers.
- Ticket assignment to laboratory assistants.
- Defined ticket statuses and controlled status transitions.
- Prevention of duplicate active tickets for the same computer.
- Repair notes and verification before ticket closure.

### Safety and Escalation

- Detection of configured electrical-safety keywords.
- Prominent safety guidance for potentially hazardous reports.
- Manual escalation and configurable automatic escalation rules.

### Asset and Inventory Management

- Records for laboratories and computer workstations.
- Hardware specifications and maintenance history.
- Planned spare-part requests, approvals, stock tracking, and replacement records.

### Administration and Reporting

- Role-based access for students, faculty, laboratory staff, authorities, HODs, and administrators.
- Administrative management of users, departments, laboratories, and computers.
- Audit history for important system actions.
- Planned analytics for maintenance activity and equipment reliability.

---

## 👥 User Roles

The system is designed around the following roles:

| Role             | Intended Responsibilities                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `STUDENT`        | Submit complaints and track personal tickets.                                               |
| `FACULTY`        | Report laboratory issues and follow their status.                                           |
| `LAB_ASSISTANT`  | Review assigned tickets, diagnose problems, record repairs, and escalate unresolved issues. |
| `DEPT_AUTHORITY` | Review escalations and handle decisions requiring departmental authority.                   |
| `HOD`            | Review departmental maintenance and performance information.                                |
| `ADMIN`          | Manage users, departments, laboratories, computers, and system settings.                    |

Access is intended to be enforced by the backend as well as the frontend. The completeness of each role-specific workflow is still subject to implementation and testing.

---

## 🔄 Ticket Workflow

The intended ticket lifecycle uses these statuses:

`OPEN` → `ASSIGNED` → `ACCEPTED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`

Additional states support escalation, waiting for parts, rejection, and cancellation. Valid transitions depend on the ticket's current state and the user's permissions.

The design also includes safeguards such as preventing duplicate active tickets for one computer and requiring repair verification and resolution notes before closure. These rules must be verified against the current implementation before being relied on operationally.

---

## 🛠️ Technology Stack

| Area                      | Technologies                                                     |
| ------------------------- | ---------------------------------------------------------------- |
| Frontend                  | React, TypeScript, Vite                                          |
| Styling and UI            | Tailwind CSS, Radix UI, Lucide React                             |
| Routing and Data Fetching | React Router, TanStack Query                                     |
| Forms and Validation      | React Hook Form, Zod                                             |
| Backend                   | Node.js, Express, TypeScript                                     |
| Database                  | MongoDB, Mongoose                                                |
| Authentication            | Firebase Authentication, Firebase Admin SDK, JWT session cookies |
| Real-Time Updates         | Socket.IO                                                        |
| File Uploads              | Multer, Cloudinary integration                                   |
| Background Jobs           | `node-cron`                                                      |
| Testing                   | Vitest, Supertest, Playwright                                    |

Refer to the package manifests for the exact dependency versions used by the current checkout.

---

## 🏗️ Folder Structure

Fixify is organized as a monorepo with a React client and an Express API.

```
Fixify/
├── .github/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── features/
│       ├── lib/
│       ├── pages/
│       ├── types/
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       └── vite-env.d.ts
│
│   ├── .env.example
│   ├── .eslintrc.cjs
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── docs/
│   ├── ui/
│   ├── ASSUMPTIONS.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── RUN.md
│   ├── SRS.md
│   └── TRACEABILITY.md
│
├── e2e/
│
├── scripts/
│
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
│   │   │
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
│   │   │
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── test/
│   ├── .env.example
│   ├── .eslintrc.cjs
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── .gitignore
├── .prettierrc
├── package-lock.json
├── package.json
└── playwright.config.ts

```

The backend is organized by domain, with modules intended for authentication, tickets, users, departments, laboratories, computers, QR codes, notifications, inventory, audit logs, and administration.

### Project Documentation

- [`docs/SRS.md`](docs/SRS.md) — Software Requirements Specification.
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — Implementation plan, if present in the repository.
- [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) — Architecture decisions and resolved assumptions.
- [`docs/TRACEABILITY.md`](docs/TRACEABILITY.md) — Requirement-to-implementation traceability.

---

## 🚀 Getting Started

These instructions describe the intended local development setup. Commands and configuration may need adjustment to match the current repository state.

### Prerequisites

Ensure the following tools and services are available:

- **Node.js:** `20.12.0` or later.
- **npm:** `10` or later.
- **MongoDB:** `7` or later, configured as a replica set if the features you run use multi-document transactions.
- **Firebase:** A project with the required Authentication providers enabled.
- **Cloudinary:** Optional for basic local testing; required for image-upload implementation.

### Step 1: Clone the Repository

```bash
git clone https://github.com/Ashutoshmore24/Fixify.git
cd Fixify
npm install
```

### Step 2: Configure MongoDB

Use a local MongoDB replica set or a replica-set-enabled MongoDB Atlas deployment if required by the workflows you are testing.

**Option A: Local MongoDB using Docker**

```bash
docker run -d -p 27017:27017 --name fixify-mongo mongo:7.0 --replSet rs0
```

Initialize the replica set:

```bash
docker exec -it fixify-mongo mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })"
```

If the container already exists, start it rather than creating another container with the same name.

**Option B: MongoDB Atlas**

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/).
2. Configure database access and network access.
3. Copy the MongoDB connection URI.
4. Add the URI to `server/.env`.

### Step 3: Configure Firebase Authentication

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a Firebase project.
3. Enable the authentication providers used by the application.
4. Register a web application and obtain its Firebase configuration.
5. Add the configuration to `client/.env`.
6. Generate a Firebase Admin service-account key for local backend development.
7. Save the service-account file securely in the server directory.

### Step 4: Configure Cloudinary

For image-upload implementation uses Cloudinary:

1. Create an account at [Cloudinary](https://cloudinary.com/).
2. Obtain your cloud name, API key, and API secret.
3. Add these values to `server/.env`.

### Step 5: Configure Environment Variables

Create local environment files from the examples :

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

On Windows Command Prompt or PowerShell, use the equivalent file-copy command if `cp` is unavailable.

Update both files with your configuration values.

### Step 6: Start the Application

Open two terminals from the repository root.

**Terminal 1 — Backend**

```bash
npm run dev:server
```

**Terminal 2 — Frontend**

```bash
npm run dev:client
```

The documented local defaults are:

- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:5000`

If a command is unavailable in the current checkout, inspect the root and workspace `package.json` files for the actual scripts.

---

## 🔐 Environment Configuration

The exact required variables depend on the current implementation. Common settings documented for Fixify include the following.

### Server Environment Variables

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/service-account.json
ALLOWED_EMAIL_DOMAINS=college.edu
ADMIN_EMAIL=admin@college.edu
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ESCALATION_TIMEOUT_HOURS=24
```

### Client Environment Variables

```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
```

---

## 📜 Available Scripts

The following scripts are documented for the repository. Check `package.json` to confirm which are available in your current checkout.

| Command                 | Purpose                                           |
| ----------------------- | ------------------------------------------------- |
| `npm run dev:server`    | Start the backend in development mode.            |
| `npm run dev:client`    | Start the Vite frontend.                          |
| `npm run build`         | Build the application workspaces.                 |
| `npm run lint`          | Run lint checks.                                  |
| `npm run typecheck`     | Run TypeScript checks.                            |
| `npm run test`          | Run configured tests.                             |
| `npm run seed`          | Seed local development data, if configured.       |
| `npm run docs:diagrams` | Regenerate documentation diagrams, if configured. |

Before treating a feature as complete, run the relevant tests and verify the workflow in the application.

---

## 🧰 Known Limitations

- Fixify currently runs locally and does not have a public deployment.
- Development is ongoing; not all planned features are necessarily implemented or tested.
- The current development version is not intended for production use without appropriate testing, security review, and deployment preparation.

---

## 🤝 Contributing

Contributions and feedback are welcome.

1. Create a branch for your change.
2. Keep changes focused and follow the existing code style.
3. Add or update tests for behavior changes.
4. Update documentation when workflows or configuration change.
5. Run the applicable lint, typecheck, build, and test commands before opening a pull request.

---

## 👨‍💻 Team

Fixify is being developed as an academic software engineering project at **Pimpri Chinchwad College of Engineering (PCCOE), Pune, India**.

| Team Member             | Focus Area                                                      |
| ----------------------- | --------------------------------------------------------------- |
| Ashutosh Sanjay More    | Backend architecture, ticket lifecycle, and access control      |
| Aniket Ashokrao Gawande | Database modeling, asset management, and data integrity         |
| Atharv Sampat Shinde    | Frontend architecture, real-time interfaces, and QR integration |

---

## 📄 License

This project is distributed under the [MIT License](LICENSE), subject to the license file included in the repository.
