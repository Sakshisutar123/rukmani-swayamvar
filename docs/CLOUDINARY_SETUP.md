# Cloudinary Setup for Profile Photos (Render / Node)

Use **Cloudinary** to store profile photos so they **persist** when your Render service sleeps or redeploys. When Cloudinary is configured, all new uploads go to Cloudinary instead of local disk.

---

## 1. Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com) and sign up (free tier is enough).
2. In the **Dashboard**, open **Product credentials** (or **Settings** → **Access keys**).
3. Note:
   - **Cloud name**
   - **API Key**
   - **API Secret** (click “Reveal” if needed).

---

## 2. Set Environment Variables

In your **Render** Web Service → **Environment**, add:

| Key | Value |
|-----|--------|
| `CLOUDINARY_CLOUD_NAME` | Your cloud name |
| `CLOUDINARY_API_KEY` | Your API key |
| `CLOUDINARY_API_SECRET` | Your API secret |

All three must be set for Cloudinary to be used. Save; Render will redeploy.

For **local** development, add the same variables to your `.env` file (do not commit `.env`).

---

## 3. Behavior

- **Upload:** New profile photos are uploaded to Cloudinary and the image URL is stored in the database.
- **Display:** Stored Cloudinary URLs are returned as-is to the client (no extra config needed).
- **Delete:** When a user removes a photo, the app deletes it from Cloudinary using the stored URL.
- **Priority:** If both Cloudinary and R2 are configured, **Cloudinary is used** for new uploads.

---

## 4. Optional: Cloud Name in URL

Photos are stored under the folder `matrimony-profiles` in your Cloudinary account. You can view and manage them in the Cloudinary **Media Library**.

No changes are required on the frontend: the API continues to return full image URLs in the same shape as before (e.g. `https://res.cloudinary.com/your-cloud/image/upload/...`).
