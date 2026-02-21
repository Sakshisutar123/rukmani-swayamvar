# Deploy Code Changes to Render — Step-by-Step

Use this guide when you’ve made code changes (e.g. gender filter on `/api/profiles/all`) and want them live on your Render backend.

---

## Prerequisites

- Backend repo is **connected to GitHub** and Render Web Service is created (see [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) if not).
- You have **Git** installed and your GitHub credentials set up (HTTPS or SSH).

---

## Step 1: Open terminal in the backend project

```bash
cd f:\Matrimony\rukmani-matri\rukmani-swayamvar-matrimony
```

(Or navigate to wherever your `rukmani-swayamvar-matrimony` folder lives.)

---

## Step 2: Check Git status

```bash
git status
```

- If you see **"not a git repository"**: run `git init`, then add your GitHub remote (Step 3b below).
- If you see **modified files** (e.g. `src/controllers/profileController.js`): proceed to Step 3.

---

## Step 3: Commit and push to GitHub

### 3a. If you already have a remote (e.g. `origin`)

```bash
git add src/controllers/profileController.js
git commit -m "Add gender filter to /api/profiles/all - female sees males, male sees females"
git push origin main
```

If your default branch is **master** instead of **main**:

```bash
git push origin master
```

### 3b. If you don’t have a remote yet

1. Create a **new repository** on GitHub (e.g. `rukmani-swayamvar-backend`). Do **not** add a README or .gitignore if the folder already has content.

2. Add the remote and push (replace with your GitHub username and repo name):

```bash
git add .
git commit -m "Add gender filter to /api/profiles/all"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## Step 4: Deploy on Render

### Option A: Auto-Deploy (recommended)

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in.
2. Open your **Web Service** (the one that runs this backend).
3. Go to **Settings** → **Build & Deploy**.
4. Ensure **Auto-Deploy** is **Yes** (deploys on every push to the connected branch).
5. After you pushed in Step 3, Render will **automatically** start a new deploy. Go to the **Events** or **Logs** tab to watch progress.

### Option B: Manual deploy

1. Go to [https://dashboard.render.com](https://dashboard.render.com) → your **Web Service**.
2. Click **Manual Deploy** (top right).
3. Choose **Deploy latest commit** (or the branch you pushed).
4. Click **Deploy**. Wait until the deploy status is **Live** (green).

---

## Step 5: Verify the deployment

1. In Render, open **Logs** and confirm there are no startup errors (e.g. “Listening on port …”).
2. Test the API in Postman or browser:
   - **URL:** `https://YOUR-SERVICE-NAME.onrender.com/api/profiles/all`
   - **Method:** POST  
   - **Body (JSON):** `{ "userId": "175d9b42-5fe1-4c50-8821-79e30696918f" }`
3. If that user is **Female**, the response `data` array should contain **only Male** profiles. If the user is **Male**, only **Female** profiles.

---

## Quick checklist

| Step | Action |
|------|--------|
| 1 | `cd` into `rukmani-swayamvar-matrimony` |
| 2 | `git status` — confirm you’re in a git repo and see your changes |
| 3 | `git add` → `git commit` → `git push origin main` (or `master`) |
| 4 | Render: Auto-Deploy runs, or use **Manual Deploy** |
| 5 | Check **Logs**, then test `POST /api/profiles/all` with a `userId` |

---

## Troubleshooting

- **“Nothing to commit”**  
  Run `git status`. If the file is listed as modified, run `git add` again with the full path. If it’s not listed, the file may be unchanged or ignored.

- **Push rejected (e.g. “failed to push”)**  
  Someone else may have pushed first. Run `git pull origin main --rebase`, fix any conflicts, then `git push origin main` again.

- **Render build fails**  
  Check the **Build Logs** in Render. Common issues: wrong **Root Directory** (should be the folder that contains `package.json`), or **Build Command** (often `npm install`; Start Command `npm start`).

- **API still returns all genders**  
  1. Confirm the deploy finished and is **Live**.  
  2. Confirm the `userId` you send has **gender** set to `Male` or `Female` in the database (null or `Other` means no gender filter).
