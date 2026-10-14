# Cloudflare frontend and Render backend

The React application runs on Cloudflare Workers static assets. The Worker forwards `/api`, `/socket.io`, `/labs`, and `/uploads` to the Express service on Render. Cookies are issued on the Cloudflare website, avoiding third-party-cookie requirements. MongoDB Atlas stores application data, Firebase handles authentication and verification emails, and Cloudinary stores uploads.

## Preparation

Use Node.js 24. From the repository root:

```powershell
npm ci
npm run build:cloudflare
npx wrangler login
npm run deploy:cloudflare
```

Wrangler prints the public `workers.dev` address. The frontend is available immediately, but API requests remain unavailable until the backend is configured. No backend credentials belong in the client build. Firebase web configuration is public; the Firebase service-account JSON is private.

## Backend

Create a free Render Web Service from the deployment branch of the GitHub repository, using `render.yaml` as a Blueprint, or enter:

- Runtime: Node
- Plan: Free
- Build command: `npm ci --include=dev && npm run build --workspace=server`
- Start command: `npm run start --workspace=server`
- Health-check path: `/health`

Generate a local environment-import file after you know the Cloudflare address:

```powershell
node scripts/prepare-hosting-env.mjs https://YOUR-SITE.workers.dev
```

Import `deploy/render.env` into Render's environment settings. This file is Git-ignored and contains private credentials. It generates fresh deployment session keys and a shared gateway key without changing local credentials. Do not commit or share it publicly. Keep the Render-generated `PORT`; `SERVER_URL` defaults to Render's injected `RENDER_EXTERNAL_URL`. Set the MongoDB Atlas network access list to allow the outbound IP ranges shown for your Render service. Reuse the already-provisioned Firebase staff accounts and MongoDB data; do not seed the hosted service automatically.

## Connect the services

Set `BACKEND_ORIGIN` in Cloudflare to the Render HTTPS origin. Set the Cloudflare secret `EDGE_PROXY_SECRET` to the same value as Render's environment variable:

```powershell
npx wrangler secret put BACKEND_ORIGIN
npx wrangler secret put EDGE_PROXY_SECRET
```

Paste each value when prompted. The shared key prevents access to API and Socket.IO routes directly through the Render origin. The health endpoint remains public for Render health checks. The gateway also forwards the trusted visitor IP for campus-aware rate limiting.

Add your exact `workers.dev` hostname to Firebase Authentication's Authorized domains. Keep the web SDK's existing Firebase `authDomain`. Verification emails now include a return URL on the public website. Sign in using an existing staff account and verify the API session cookie, dashboard data, and real-time socket connection. Test a student signup and email verification using an address you own.

## Free-plan behavior

Cloudflare serves the frontend without waiting for the Render process. Render's free backend sleeps after inactivity and can take about a minute to wake. Socket.IO reconnects after restart; overdue ticket escalation checks run at startup and hourly while the service is running. They cannot run at an exact time while Render is asleep. Free Render disks are ephemeral, so production uploads require Cloudinary and never fall back to local disk.

Render Free blocks outbound SMTP ports. Firebase sends authentication emails separately, and in-app notifications work through the API and Socket.IO. Other transactional email alerts need a separately configured HTTPS email provider. Hosting cannot guarantee Firebase email delivery speed or prevent Gmail spam filtering.

References: [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/), [Render free-plan limits](https://render.com/docs/free), [Firebase authorized email-action domains](https://firebase.google.com/docs/auth/web/passing-state-in-email-actions).
