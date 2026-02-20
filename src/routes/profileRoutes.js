import express from 'express';
import { listProfilesByPreferences, listAllUsers, getProfileDetails, getMyProfile, updateMyProfile } from '../controllers/profileController.js';
import {
  uploadPhotos,
  addPhotoUrls,
  listMyPhotos,
  deletePhoto,
  reorderPhotos
} from '../controllers/profilePhotosController.js';
import { createProfilePhotoUpload } from '../middleware/uploadPhotos.js';

const router = express.Router();

// GET /api/profiles/ping - health check to verify profiles route is mounted
router.get('/ping', (req, res) => res.json({ ok: true, message: 'Profiles API is mounted' }));

// POST /api/profiles/details or POST /api/profiles/get-details - body: { userId }
// Returns full profile details for that user (to show to other users)
router.post('/details', getProfileDetails);
router.post('/get-details', getProfileDetails);

// POST /api/profiles/me or POST /api/profiles/my-details - body: { userId }
// Get my profile (full details for the logged-in user)
router.post('/me', getMyProfile);
router.post('/my-details', getMyProfile);

// POST /api/profiles/update or POST /api/profiles/edit - body: { userId, ...fields to update }
// Edit my profile (partial update)
router.post('/update', updateMyProfile);
router.post('/edit', updateMyProfile);

// POST /api/profiles/all - body: { userId }
// Lists all user profiles (excluding the requesting user), no filters
router.post('/all', listAllUsers);

// POST /api/profiles or POST /api/profiles/list - body: { userId, page?, limit?, includeAllGenders? }
// Lists profiles matching the user's partner preferences (includes photos)
router.post('/', listProfilesByPreferences);
router.post('/list', listProfilesByPreferences);

// ---------- Profile photos (upload, list, delete, reorder) ----------
// POST /api/profiles/photos/upload?userId=... - multipart form: field "photos" (multiple) or "photo" (single)
router.post('/photos/upload', createProfilePhotoUpload(), uploadPhotos);
// POST /api/profiles/photos/add-urls - body: { userId, photoUrls: string[] }
router.post('/photos/add-urls', addPhotoUrls);
// GET /api/profiles/photos?userId=... - list my photos
router.get('/photos', listMyPhotos);
router.post('/photos/list', listMyPhotos);
// DELETE /api/profiles/photos/:photoId?userId=... (photoId = image name, e.g. profile_1739_abc.jpg)
router.delete('/photos/:photoId', deletePhoto);
// PATCH /api/profiles/photos/reorder - body: { userId, photoNames: string[] } (image names in desired order)
router.patch('/photos/reorder', reorderPhotos);

export default router;
