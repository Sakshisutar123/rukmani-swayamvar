# Deploy Backend API to Render (Free Tier) — Step-by-Step Guide

This document walks you through deploying the **Rukmani Swayamvar Matrimony** Node.js backend API on Render’s free tier, from scratch.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Prepare Your Repository](#2-prepare-your-repository)
3. [Create a Render Account & Connect GitHub](#3-create-a-render-account--connect-github)
4. [Create a Free PostgreSQL Database](#4-create-a-free-postgresql-database)
5. [Create the Web Service (Backend API)](#5-create-the-web-service-backend-api)
6. [Set Environment Variables](#6-set-environment-variables)
7. [Run Database Migrations](#7-run-database-migrations)
8. [Configure API Base URL and CORS](#8-configure-api-base-url-and-cors)
9. [Free Tier Limitations & Caveats](#9-free-tier-limitations--caveats)
10. [Troubleshooting](#10-troubleshooting)

---

## Next steps (Web Service + PostgreSQL already created)

If you already have both the **Web Service** (e.g. `rukmani-swayamvar`) and the **PostgreSQL** database created and deployed:

1. **Link the database to the Web Service** (recommended) — Open your **Web Service** → **Environment** → **Add Environment Variable** → choose **Add from Render** or **Link existing resource** and select your PostgreSQL service. That adds `DATABASE_URL` automatically. If you don’t see “Link”, add `DATABASE_URL` manually (see step 2).
2. **Set environment variables** — In the Web Service → **Environment**, add the variables from [Section 6](#6-set-environment-variables) (at least `NODE_ENV=production`, `JWT_SECRET`, and Brevo keys if you use email). Save; Render will redeploy.
3. **Run migrations** — Use [Section 7](#7-run-database-migrations) (Pre Deploy Command or one-off with `DATABASE_URL`).
4. **Set API_BASE_URL and CORS** — Use your service URL (e.g. `https://rukmani-swayamvar.onrender.com`) and your frontend origin. See [Section 8](#8-configure-api-base-url-and-cors).

Then open `https://<your-service-name>.onrender.com/` to confirm the API is running.

---

## 1. Prerequisites

- **Git** installed and a **GitHub** account.
- Your backend code in a **Git repository** (local and pushed to GitHub).
- **Node.js 18** — the project uses `"engines": { "node": "18.x" }` in `package.json`; Render will use this.
- (Optional) A **Brevo** account for email/SMS, and **Agora** credentials for video calls — you can add these later as env vars.

---

## 2. Prepare Your Repository

### 2.1 Ensure `.env` Is Not Committed

- Never commit `.env` (it contains secrets).  
- Confirm `.env` is in `.gitignore`. If you don’t have a `.gitignore`, create one with at least:

```gitignore
node_modules/
.env
.env.local
.env.*.local
uploads/
*.log
```

- All configuration for production will be set as **Environment Variables** in the Render dashboard.

### 2.2 Verify Build and Start Commands

From the project root:

- **Install:** `npm install`
- **Start:** `npm start` (runs `node src/server.js`)

The server reads `PORT` from the environment; Render sets `PORT` automatically. No code change needed.

### 2.3 Push Your Code to GitHub

If the repo is not on GitHub yet:

```bash
git init
git add .
git commit -m "Initial commit - backend API"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub details.

---

## 3. Create a Render Account & Connect GitHub

1. Go to **[https://render.com](https://render.com)** and sign up (e.g. with GitHub).
2. In the **Dashboard**, click **New +** → **Web Service** (you’ll configure it in Step 5).
3. When asked to connect a repository, choose **GitHub** and authorize Render to access your account/repos.
4. Select the repository that contains this backend (e.g. `rukmani-swayamvar-matrimony`).

You can also create the database first (Step 4) and then create the Web Service; the order below keeps “database first” so you can link it when creating the service.

---

## 4. Create a Free PostgreSQL Database

1. In the Render Dashboard, click **New +** → **PostgreSQL**.
2. Configure:
   - **Name:** e.g. `rukmani-matrimony-db`
   - **Region:** Choose one close to you or your users.
   - **PostgreSQL Version:** Keep default (e.g. 16).
   - **Instance Type:** **Free**.
3. Click **Create Database**.
4. Wait until the database is **Available**. Then open it and go to the **Info** or **Connections** section.
5. Copy the **Internal Database URL** (recommended for a Web Service in the same region) or **External Database URL** if your app will connect from outside Render.  
   It looks like:
   ```text
   postgres://USER:PASSWORD@HOST/DATABASE?option=value
   ```
   You will use this as `DATABASE_URL` in the Web Service.

**Important (Free tier):**

- Free Postgres has **1 GB** storage and **expires 30 days** after creation (Render may change this; check [Render Free Tier](https://render.com/docs/free)).
- Only **one** free Postgres instance per workspace.
- No backups on free tier. For real production, use a paid DB or external provider.

---

## 5. Create the Web Service (Backend API)

1. In the Dashboard, click **New +** → **Web Service**.
2. **Connect repository:** Select your GitHub account and the repo containing this backend. Click **Connect**.
3. Configure the service:

   | Field | Value |
   |-------|--------|
   | **Name** | e.g. `rukmani-matrimony-api` |
   | **Region** | Same as your Postgres (recommended) |
   | **Branch** | `main` (or your default branch) |
   | **Runtime** | **Node** |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | **Free** |

4. **Add environment variables** (you can do a few now and the rest in Step 6):
   - Click **Advanced** and add at least:
     - **Key:** `NODE_ENV` → **Value:** `production`
     - **Key:** `DATABASE_URL` → **Value:** paste the Internal (or External) Database URL from Step 4.
   - If you use Render’s “Link” feature for the Postgres database, Render can add `DATABASE_URL` for you when you link the DB to this Web Service.

5. (Optional) **Pre-deploy command** (for running migrations before each deploy):
   - **Key:** Pre Deploy Command  
   - **Value:** `npx sequelize-cli db:migrate`
   - This requires `NODE_ENV=production` and `DATABASE_URL` (or `DB_*`) so Sequelize uses the production config.  
   - If you prefer to run migrations manually once, skip this and use Step 7.

6. Click **Create Web Service**. Render will clone the repo, run `npm install`, then `npm start`. The first deploy may take a few minutes.

7. When the deploy succeeds, your API will be available at:
   ```text
   https://<your-service-name>.onrender.com
   ```
   Test: `https://<your-service-name>.onrender.com/` should return something like “Auth API is running...”.

---

## 6. Set Environment Variables

In the Render Dashboard, open your **Web Service** → **Environment** tab and set these. Values from your local `.env` are only for reference; never paste production secrets from here into the doc.

### Required for basic run

| Key | Description | Example / Note |
|-----|-------------|----------------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | Leave **empty**; Render sets it automatically. |
| `DATABASE_URL` | Postgres connection string | From Step 4 (or add via “Link” to Postgres). |

### Required for auth and core features

| Key | Description | Example / Note |
|-----|-------------|----------------|
| `JWT_SECRET` | Secret for JWT signing | Long random string (e.g. 32+ chars). **Do not** use the example from `.env`. |

### Required for email (Brevo)

| Key | Description | Example / Note |
|-----|-------------|----------------|
| `BREVO_API_KEY` | Brevo API key | From Brevo dashboard. |
| `MAIL_FROM` | Sender email | Must be a verified sender in Brevo. |
| `MAIL_FROM_NAME` | Sender name | e.g. `Matrimony` |

### Optional but recommended

| Key | Description | Example / Note |
|-----|-------------|----------------|
| `API_BASE_URL` | Base URL of this API (for photo/asset URLs) | `https://<your-service-name>.onrender.com` |
| `CORS_ORIGIN` | Allowed origin for CORS | Your frontend URL, e.g. `https://your-frontend.vercel.app` or `*` for dev. |
| `SMS_SENDER` | SMS sender name (if using Brevo SMS) | e.g. `Matrimony` (max 11 chars). |

### Optional (video calls – Agora)

| Key | Description |
|-----|-------------|
| `AGORA_APP_ID` | Agora application ID |
| `AGORA_APP_CERTIFICATE` | Agora app certificate |

### Recommended (persistent profile photos – Cloudinary)

On Render’s free tier the filesystem is **ephemeral**: anything under `uploads/` is lost when the service sleeps or redeploys. To keep profile photos persistent, use **Cloudinary** (recommended):

| Key | Description |
|-----|-------------|
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard (Dashboard → Product credentials) |
| `CLOUDINARY_API_KEY` | API key |
| `CLOUDINARY_API_SECRET` | API secret |

When all three are set, new uploads go to Cloudinary and photos survive sleep/redeploys. See **[docs/CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md)** for setup steps.

### Optional (persistent profile photos – Cloudflare R2)

Alternatively you can use **Cloudflare R2** instead of Cloudinary. If **both** Cloudinary and R2 are configured, **Cloudinary is used**. To use only R2, set all of:

| Key | Description |
|-----|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name (e.g. `matrimony-profiles`) |
| `R2_PUBLIC_URL` | Public URL for the bucket (e.g. `https://pub-xxxx.r2.dev`) |

See **[docs/R2_SETUP.md](R2_SETUP.md)** for step-by-step R2 setup.

### Optional (database sync)

| Key | Description |
|-----|-------------|
| `SYNC_DB` | Set to `true` only if you want the app to run `sequelize.sync({ alter: true })` on startup (e.g. for dev). Prefer migrations in production. |

After saving, Render will redeploy the service. Ensure **DATABASE_URL** (or linked DB) is set before the first deploy so the app can connect to Postgres.

---

## 7. Run Database Migrations

Migrations are run with Sequelize CLI and use `src/config/database.config.cjs` (production uses `DATABASE_URL` from env).

**Option A — Pre-deploy command (automatic on every deploy)**  
- In the Web Service → **Settings** → **Build & Deploy**, set **Pre Deploy Command** to:
  ```bash
  npx sequelize-cli db:migrate
  ```
- Ensure `NODE_ENV=production` and `DATABASE_URL` are set so the CLI uses the production config.

**Option B — One-off from your machine**  
- Install dependencies and run migrations locally, pointing at the Render DB:
  ```bash
  npm install
  export NODE_ENV=production
  export DATABASE_URL="<paste External Database URL from Render Postgres>"
  npx sequelize-cli db:migrate
  ```
- Use the **External** Database URL from the Render Postgres dashboard (Info/Connections). Keep this URL secret.

**Option C — Render Shell (if available on your plan)**  
- If your plan includes Shell access, open a shell for the Web Service and run:
  ```bash
  npx sequelize-cli db:migrate
  ```

After migrations, your API should be able to read/write users, profiles, conversations, etc.

---

## 8. Configure API Base URL and CORS

- **API_BASE_URL:** Set to your Render API URL, e.g. `https://rukmani-matrimony-api.onrender.com`.  
  The app uses this to build full URLs for profile photos and other assets (see `src/utils/photoUrl.js`). If not set, URLs may be relative and break from a different frontend origin.

- **CORS_ORIGIN:** Set to your frontend origin, e.g. `https://your-app.vercel.app`.  
  For development you can use `*`; for production prefer a single origin.

---

## 9. Free Tier Limitations & Caveats

- **Spindown:** Service spins down after **15 minutes** of no requests. The first request after that may take **~30–60 seconds** while the instance starts.
- **Ephemeral filesystem:** Anything written to disk (e.g. under `uploads/`) is **lost** on redeploy or restart. Profile photos stored locally will not persist. For production you’d need **Cloudinary** or **Cloudflare R2**—see [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md) or [R2_SETUP.md](R2_SETUP.md). When Cloudinary or R2 env vars are set, new uploads go there automatically. Prefer Cloudinary on Render so photos persist when the service sleeps (see CLOUDINARY_SETUP.md).
- **Free instance hours:** 750 hours/month per workspace. When exceeded, free services are suspended until the next month.
- **Postgres (free):** 1 GB, single instance, and (as of Render docs) limited lifetime (e.g. 90 days) unless upgraded.
- **SMTP ports:** Free web services **cannot** use outbound ports 25, 465, or 587. This app uses **Brevo’s HTTP API** for email, so email can still work. Direct SMTP from the app would not work on free tier.
- **No persistent disk** on free Web Services; only paid plans can attach a disk.

Use the free tier for testing and demos; for production, consider a paid instance and external DB/backups.

---

## 10. Troubleshooting

### Build fails

- Check the **Logs** tab for the build step. Common issues:
  - Wrong **Build Command** (must be `npm install`).
  - Node version: project expects **Node 18**; Render usually respects `engines` in `package.json`. If not, set **Environment** → `NODE_VERSION` = `18` (if your Render stack supports it) or add an `.nvmrc` with `18`.

### Application fails to start or “Application failed to respond”

- Check **Logs** for the running service. Typical causes:
  - **Database:** `DATABASE_URL` not set or wrong. If you linked Postgres, ensure the link is created and `DATABASE_URL` appears under Environment.
  - **Missing env:** e.g. `JWT_SECRET` or Brevo keys; the app may still start but auth or email will fail. Set all required variables from Step 6.
  - **Port:** The app must listen on `process.env.PORT`. This codebase already uses `const PORT = process.env.PORT || 5000` and `server.listen(PORT, ...)` — no change needed.

### “Database connection failed” or Sequelize errors

- Confirm `DATABASE_URL` is the full URL (including password) from the Render Postgres **Info** page.
- For **External** URL, ensure your Web Service is allowed to reach it (e.g. no IP allowlist that blocks Render).
- Production config uses SSL; the app’s `database.js` enables `rejectUnauthorized: false` for `DATABASE_URL` (suitable for Render’s managed Postgres).

### Migrations not applied

- Run them manually (Step 7, Option B) with `DATABASE_URL` and `NODE_ENV=production`, or add the Pre Deploy Command and redeploy.
- Check `database.config.cjs` production block uses `url: process.env.DATABASE_URL` and that `DATABASE_URL` is set in the Render Environment.

### CORS errors from the frontend

- Set `CORS_ORIGIN` to your frontend’s exact origin (e.g. `https://your-app.vercel.app`). No trailing slash.

### Socket.io or real-time features

- The app uses Socket.io on the same server and port. On Render, the same URL is used for HTTP and WebSockets. Ensure your frontend connects to `https://<your-service-name>.onrender.com` (wss is typically over the same host). If you use a reverse proxy or CDN in front, it must support WebSockets.

---

## Quick Checklist

- [ ] Repo on GitHub; `.env` in `.gitignore`, not committed.
- [ ] Render account created; GitHub connected.
- [ ] PostgreSQL (free) created; **Internal** (or External) URL copied.
- [ ] Web Service created: Build `npm install`, Start `npm start`, Instance Type **Free**.
- [ ] Environment variables set: `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, and Brevo keys at minimum.
- [ ] Migrations run (Pre Deploy Command or one-off with `DATABASE_URL`).
- [ ] `API_BASE_URL` and `CORS_ORIGIN` set for your frontend.
- [ ] Health check: open `https://<your-service-name>.onrender.com/` in a browser and test one API route (e.g. login or register).

Once these are done, your backend API is deployed on Render’s free tier end-to-end.
