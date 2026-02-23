import multer from 'multer';
import path from 'path';
import { PROFILES_PHOTOS_DIR, ensureUploadDirs } from '../config/uploadPaths.js';
import { isR2Configured } from '../config/r2.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { R2_PROFILES_PREFIX } from '../services/r2Storage.js';

// Ensure base upload dirs exist (idempotent) when not using R2
ensureUploadDirs();
const UPLOAD_BASE = PROFILES_PHOTOS_DIR;

/** Allowed MIME types for profile photos (gallery/camera) */
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_COUNT = 10; // max photos per profile (including existing)

function getExt(mimetype, originalname) {
  const mt = (mimetype || '').toLowerCase();
  if (mt === 'image/jpeg' || mt === 'image/jpg') return '.jpg';
  if (mt === 'image/png') return '.png';
  if (mt === 'image/gif') return '.gif';
  if (mt === 'image/webp') return '.webp';
  if (mt === 'image/heic') return '.heic';
  const ext = path.extname(originalname || '');
  return ext && /\.(jpe?g|png|gif|webp|heic)$/i.test(ext) ? ext : '.jpg';
}

/** When Cloudinary or R2 is configured use memory storage (buffer); otherwise disk. */
function getStorage() {
  if (isCloudinaryConfigured() || isR2Configured()) {
    return multer.memoryStorage();
  }
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_BASE),
    filename: (_req, file, cb) => {
      const ext = getExt(file.mimetype, file.originalname);
      const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      cb(null, `profile_${unique}${ext}`);
    }
  });
}

/** Generate R2 object key for a profile photo (profiles/profile_ts_rand.ext). Used when R2 is enabled. */
export function getR2KeyForFile(file) {
  const ext = getExt(file.mimetype, file.originalname);
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${R2_PROFILES_PREFIX}profile_${unique}${ext}`;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic)$/i;

function fileFilter(_req, file, cb) {
  const mt = (file.mimetype || '').toLowerCase();
  let allowed = ALLOWED_MIMES.includes(mt) || mt.startsWith('image/');
  if (!allowed && (!mt || mt === 'application/octet-stream')) {
    const name = (file.originalname || '').toLowerCase();
    allowed = IMAGE_EXT.test(name);
  }
  if (!allowed) {
    return cb(new Error('Only images from gallery/camera are allowed (JPEG, PNG, GIF, WebP, HEIC)'), false);
  }
  cb(null, true);
}

/**
 * Multer for profile photos from device gallery/camera.
 * For multipart uploads, pass userId in query: POST /photos/upload?userId=...
 * Form fields: "photos" (multiple) and/or "photo" (single) - so app can send one or many from gallery.
 */
export function createProfilePhotoUpload() {
  return (req, res, next) => {
    const userId = req.query?.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required. Use query: ?userId=... for multipart upload.' });
    }
    const storage = getStorage();
    const upload = multer({
      storage,
      fileFilter,
      limits: { fileSize: MAX_FILE_SIZE, files: 6 }
    });
    upload.fields([
      { name: 'photos', maxCount: 6 },
      { name: 'photo', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, error: 'File too large. Max 5MB per image.' });
        if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ success: false, error: 'Maximum 6 photos per upload.' });
        if (err.message) return res.status(400).json({ success: false, error: err.message });
        return res.status(500).json({ success: false, error: 'Upload failed' });
      }
      next();
    });
  };
}

/** Single photo upload (field name: photo) */
export function createSinglePhotoUpload() {
  return (req, res, next) => {
    const userId = req.query?.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required. Use query: ?userId=... for multipart upload.' });
    }
    const storage = getStorage();
    const upload = multer({
      storage,
      fileFilter,
      limits: { fileSize: MAX_FILE_SIZE }
    });
    upload.single('photo')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, error: 'File too large. Max 5MB.' });
        if (err.message) return res.status(400).json({ success: false, error: err.message });
        return res.status(500).json({ success: false, error: 'Upload failed' });
      }
      next();
    });
  };
}

export { MAX_COUNT, UPLOAD_BASE, PROFILES_PHOTOS_DIR };
