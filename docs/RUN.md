# Fixify - Setup and Execution Guide (docs/RUN.md)

This document provides setup instructions for running the Fixify platform with Firebase Authentication.

---

## 1. Firebase Project Setup

Fixify uses Firebase Authentication for:
- Email and Password sign-in / registration
- Google Sign-In (OAuth federated identity)
- Secure token verification via `firebase-admin` on the backend

### Step 1: Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and enter a project name (e.g., `fixify-pccoe`).
3. (Optional) Disable Google Analytics for development/testing.
4. Click **Create Project**.

### Step 2: Enable Authentication Providers
1. In the Firebase Console left sidebar, go to **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - **Email/Password**: Click Email/Password, toggle **Enable**, and save. (Email link is optional; Email/Password is primary).
   - **Google**: Click Google, toggle **Enable**, select the project support email, and save.
4. Under **Settings** > **Authorized domains**, ensure `localhost` is listed for local development.

### Step 3: Register a Web App (Client Credentials)
1. In Project Overview / Project Settings, click the **Web** icon (`</>`) to add an app.
2. Enter an app nickname (e.g., `Fixify Web`).
3. Copy the Firebase configuration object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "fixify-pccoe.firebaseapp.com",
     projectId: "fixify-pccoe",
     storageBucket: "fixify-pccoe.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef..."
   };
   ```
4. Populate `client/.env`:
   ```bash
   VITE_FIREBASE_API_KEY="AIzaSy..."
   VITE_FIREBASE_AUTH_DOMAIN="fixify-pccoe.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="fixify-pccoe"
   VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef..."
   VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
   ```

### Step 4: Generate Service Account Key (Server Credentials)
1. In Firebase Console, go to **Project Settings** (gear icon) > **Service accounts** tab.
2. Ensure **Node.js** is selected.
3. Click **Generate new private key**, then click **Generate key**.
4. A JSON file will download (e.g., `fixify-pccoe-firebase-adminsdk-xxxxx.json`).
5. Place this file in `server/` (e.g., `server/serviceAccountKey.json`).
   > **Note**: `.gitignore` is preconfigured to ignore `*serviceAccountKey*.json` and `*firebase-service-account*.json`. Never commit private keys to version control.
6. Populate `server/.env`:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_PATH="./serviceAccountKey.json"
   # Or alternatively set raw JSON string:
   # FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   PRN_REGEX="^[0-9]{8,12}[A-Za-z]?$"
   ```

---

## 2. Environment Variables Summary

### Client (`client/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend REST API URL | `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | Backend Socket.IO URL | `http://localhost:5000` |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `fixify.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `fixify-pccoe` |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | `1:123456789:web:abcdef` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging Sender ID | `123456789` |

### Server (`server/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | API Server listening port | `5000` |
| `CLIENT_URL` | Client frontend URL | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/fixify` |
| `JWT_SECRET` | Secret key for session cookies | `at-least-32-chars-long` |
| `ALLOWED_EMAIL_DOMAINS` | Allowed institutional domains | `pccoe.org,student.pccoe.org,faculty.pccoe.org` |
| `ADMIN_EMAIL` | Bootstrap admin email | `admin@pccoe.org` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON | `./serviceAccountKey.json` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Raw service account JSON string (optional) | `{"type":"service_account",...}` |
| `PRN_REGEX` | Regular expression for student PRN | `^[0-9]{8,12}[A-Za-z]?$` |

---

## 3. Local Development Commands

### Installation
```bash
# In repository root
npm install
```

### Starting Development Servers
```bash
# Backend server (port 5000)
npm run dev:server

# Frontend client (port 5173)
npm run dev:client
```

### Verification & Testing
```bash
# Typecheck workspaces
npm run typecheck

# Run backend test suite
npm run test --workspace=server

# Build production bundles
npm run build
```
