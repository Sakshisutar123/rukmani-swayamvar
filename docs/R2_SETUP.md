# Cloudflare R2 for Persistent Profile Photos

On Render’s free tier, the filesystem is **ephemeral**: anything under `uploads/` is lost on redeploy or restart. To keep profile photos persistent, this project supports **Cloudflare R2** (S3-compatible object storage) with a **free tier** (10 GB storage, no egress fees).

When R2 is configured, profile photo uploads go to R2 instead of local disk. The app stores object keys in the database and resolves them to public URLs using `R2_PUBLIC_URL`.

---

## 1. Create an R2 bucket in Cloudflare

1. Log in at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Select your account (or create one).
3. In the left sidebar, go to **R2 Object Storage**.
4. Click **Create bucket**.
5. **Bucket name:** e.g. `matrimony-profiles`.
6. **Location:** choose a region (e.g. Automatic).
7. Click **Create bucket**.

Note your **Account ID** (in the R2 overview or in the right sidebar under “Account ID”).

---

## 2. Create R2 API tokens

1. In **R2** → **Overview**, click **Manage R2 API Tokens** (or go to **Account** → **R2** → **API Tokens**).
2. Click **Create API token**.
3. **Token name:** e.g. `matrimony-uploads`.
4. **Permissions:** **Object Read & Write**.
5. **Specify bucket(s):** restrict to your bucket (e.g. `matrimony-profiles`) or leave “Apply to all buckets”.
6. Click **Create API Token**.
7. Copy and save the **Access Key ID** and **Secret Access Key** (the secret is shown only once).

---

## 3. Enable public access for the bucket

So the app can serve images via a public URL:

1. Open your bucket → **Settings**.
2. Under **Public access**, click **Allow Access** (or “Connect domain” if you prefer a custom domain).
3. Cloudflare will show a **Public bucket URL**, e.g. `https://pub-xxxxxxxxxxxxx.r2.dev`. Copy this; you’ll use it as `R2_PUBLIC_URL`.

If you use a **custom domain** (e.g. `images.yoursite.com`), set that up in the bucket settings and use that URL as `R2_PUBLIC_URL` (e.g. `https://images.yoursite.com`).

---

## 4. Set environment variables

Set these **on Render** (Web Service → **Environment**) or in your local `.env`. **All five** must be set for R2 to be used:

| Variable | Description | Example |
|----------|-------------|---------|
| `R2_ACCOUNT_ID` | Cloudflare account ID | `a1b2c3d4e5f6...` |
| `R2_ACCESS_KEY_ID` | R2 API token access key | From step 2 |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret | From step 2 |
| `R2_BUCKET_NAME` | Bucket name | `matrimony-profiles` |
| `R2_PUBLIC_URL` | Public URL for the bucket (no trailing slash) | `https://pub-xxxx.r2.dev` or `https://images.yoursite.com` |

Example (do not commit real values):

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=matrimony-profiles
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev
```

After saving env vars on Render, the service will redeploy. New profile photo uploads will go to R2 and persist across deploys.

---

## 5. Behavior summary

- **When R2 is configured:**  
  - Uploads go to R2; the app stores object keys (e.g. `profiles/profile_123_abc.jpg`) in `users.profilePicture`.  
  - Photo URLs in API responses are full URLs (e.g. `https://pub-xxx.r2.dev/profiles/profile_123_abc.jpg`).  
  - Delete removes the object from R2.

- **When R2 is not configured:**  
  - Uploads go to local `uploads/profiles/` (same as before).  
  - Stored values are filenames; URLs are built with `API_BASE_URL` + `/uploads/profiles/...`.

- **Existing local photos** are unchanged. Only **new** uploads use R2 once it’s configured. Old entries in `profilePicture` that are filenames (no `profiles/` prefix) still resolve to your API’s `/uploads/profiles/` URL until you re-upload or migrate.

---

## 6. Optional: migrate existing local photos to R2

If you had photos in `uploads/profiles/` and want them in R2:

1. Configure R2 as above and deploy.
2. Use a one-off script (or manual process) that:
   - Reads each user’s `profilePicture` (comma-separated filenames).
   - For each file that exists on disk: read file, upload to R2 with key `profiles/<filename>`, then update `profilePicture` to use the new key (`profiles/...`) instead of the filename.
3. After migration, local files can be removed; the app will serve from R2.

This repo does not include a migration script; you can add one under `scripts/` if needed.
