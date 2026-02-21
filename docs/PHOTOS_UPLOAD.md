# Profile Photos – Upload API, Localhost & Server

This doc describes how profile photo upload works, how to run it on both **localhost** and **server**, and how to display the **first photo on profile cards** and a **photo slider on full profile**.

---

## 1. Upload API (one or more photos)

- **Endpoint:** `POST /api/profiles/photos/upload?userId=<userId>`
- **Content-Type:** `multipart/form-data`
- **Form fields:**
  - `photos` – multiple files (up to 6 per request)
  - `photo` – single file (alternative)
- **Limits:** 5 MB per image; max **10 photos** per profile total; up to 6 files per upload.

**Example (multiple):**  
Send form with field `photos` and multiple files.  
**Example (single):**  
Send form with field `photo` and one file.

Other endpoints:

- `GET /api/profiles/photos?userId=...` – list my photos
- `DELETE /api/profiles/photos/:photoId?userId=...` – delete one photo (photoId = image name)
- `PATCH /api/profiles/photos/reorder` – body: `{ userId, photoNames: string[] }` – reorder photos

---

## 2. Localhost vs server

Photos are stored under **uploads/profiles/** (or custom path via env). The API returns **URLs** so the app can show images.

### Localhost

- In `.env` set:
  - `API_BASE_URL=http://localhost:5000` (or your local port).
- Images are served at `http://localhost:5000/uploads/profiles/<filename>`.
- No need to set `UPLOADS_DIR`; default is project `uploads/`.

### Server (production)

- In the server’s environment set:
  - **`API_BASE_URL`** = your **public API base URL** (e.g. `https://api.yoursite.com`).
  - Then all photo URLs in API responses will be absolute (e.g. `https://api.yoursite.com/uploads/profiles/profile_123_abc.jpg`), so web/mobile clients can load them from anywhere.
- Ensure the app serves the `uploads` folder at `/uploads` (this project does via `express.static(UPLOADS_DIR)`).
- **Optional:** if uploads must go to another disk/path, set:
  - **`UPLOADS_DIR`** = absolute path (e.g. `/var/app/uploads`).
  - `PROFILES_PHOTOS_DIR` is derived from `UPLOADS_DIR` (e.g. `.../uploads/profiles`).

See `.env.example` for the variables.

---

## 3. Display first photo on profile cards

Profile **list** APIs return, for each profile:

- **`firstPhotoUrl`** – full URL of the **first** photo (or `null` if none). Use this on the profile card.
- **`photos`** – array of all photos `[{ id, url, sortOrder }, ...]` (each `url` is already full).

**List endpoints:**

- `POST /api/profiles` (or `/api/profiles/list`) – list by preferences
- `POST /api/profiles/all` – list all (with gender filter)

**In the app:**  
Use `profile.firstPhotoUrl` for the card image. If missing, you can fallback to `profile.photos[0]?.url`.

---

## 4. Photo slider on full profile (view full profile)

Full profile API returns a **`photos`** array suitable for a slider:

- **Endpoint:** `POST /api/profiles/details` or `POST /api/profiles/get-details`  
  Body: `{ userId: "<profileUserId>" }`
- **Response:** `{ success: true, profile: { ...profileFields, photos: [{ id, url, sortOrder }, ...] } }`

**In the app:**  
Use `profile.photos` in your “View full profile” screen to drive an image slider/carousel (order by `sortOrder` or array index).

---

## 5. Summary

| Need | Where | What to use |
|------|--------|-------------|
| Upload 1 or more photos | `POST /api/profiles/photos/upload?userId=...` | Form fields `photos` (multiple) or `photo` (single) |
| Localhost | `.env` | `API_BASE_URL=http://localhost:5000` |
| Server | Server env | `API_BASE_URL=https://your-api-domain.com`, optional `UPLOADS_DIR` |
| First photo on profile card | List APIs | `profile.firstPhotoUrl` (or `profile.photos[0]?.url`) |
| Slider on full profile | Details API | `profile.photos` (array of `{ id, url, sortOrder }`) |
