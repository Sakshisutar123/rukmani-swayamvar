import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import { PROFILES_PHOTOS_DIR, ensureUploadDirs } from '../config/uploadPaths.js';
import { isR2Configured } from '../config/r2.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { R2_PROFILES_PREFIX } from '../services/r2Storage.js';
import { parseProfilePictureToPhotos } from '../utils/photoUrl.js';

// Ensure base upload dirs exist (idempotent) when not using R2
ensureUploadDirs();
const UPLOAD_BASE = PROFILES_PHOTOS_DIR;

/** Allowed MIME types for profile photos (gallery/camera) */
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB per image
const MAX_COUNT = 5; // max profile images per user (including existing)

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
 * Validates: max 5 profile images per user (checks DB before accepting body), max 4MB per image.
 * For multipart uploads, pass userId in query: POST /photos/upload?userId=...
 * Form fields: "photos" (multiple) and/or "photo" (single) - so app can send one or many from gallery.
 */
export function createProfilePhotoUpload() {
  return async (req, res, next) => {
    const userId = req.query?.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required. Use query: ?userId=... for multipart upload.',
        code: 'MISSING_USER_ID'
      });
    }
    const user = await User.findByPk(userId, { attributes: ['id', 'profilePicture'] });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    const existing = parseProfilePictureToPhotos(user.profilePicture);
    if (existing.length >= MAX_COUNT) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${MAX_COUNT} profile images allowed. You already have ${existing.length}.`,
        code: 'MAX_PHOTOS_EXCEEDED',
        currentCount: existing.length,
        maxCount: MAX_COUNT,
        remainingSlots: 0
      });
    }
    const storage = getStorage();
    const upload = multer({
      storage,
      fileFilter,
      limits: { fileSize: MAX_FILE_SIZE, files: MAX_COUNT }
    });
    upload.fields([
      { name: 'photos', maxCount: MAX_COUNT },
      { name: 'photo', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'Each image must be 4MB or less.',
            code: 'FILE_TOO_LARGE',
            maxSizeBytes: MAX_FILE_SIZE
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: `Maximum ${MAX_COUNT} photos per upload.`,
            code: 'TOO_MANY_FILES',
            maxCount: MAX_COUNT
          });
        }
        if (err.message) {
          return res.status(400).json({ success: false, error: err.message, code: 'VALIDATION_ERROR' });
        }
        return res.status(500).json({ success: false, error: 'Upload failed', code: 'UPLOAD_ERROR' });
      }
      // Enforce 4MB per file after multer (cannot be bypassed; multer limit can fail in some setups)
      const fromFields = req.files
        ? [].concat(req.files.photos || [], req.files.photo || [])
        : [];
      const files = fromFields.length > 0 ? fromFields : (req.file ? [req.file] : []);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const size = file.size ?? file.buffer?.length ?? (file.path && fs.statSync(file.path, { throwIfNoEntry: false })?.size);
        if (size == null || size > MAX_FILE_SIZE) {
          // Remove uploaded file if on disk to avoid leaving large files
          if (file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch (_) {}
          }
          return res.status(413).json({
            success: false,
            error: size == null
              ? 'Could not verify file size. Each image must be 4MB or less.'
              : `Each image must be 4MB or less. File ${i + 1} is ${(size / (1024 * 1024)).toFixed(1)}MB.`,
            code: 'FILE_TOO_LARGE',
            maxSizeBytes: MAX_FILE_SIZE
          });
        }
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
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'Each image must be 4MB or less.',
            code: 'FILE_TOO_LARGE',
            maxSizeBytes: MAX_FILE_SIZE
          });
        }
        if (err.message) {
          return res.status(400).json({ success: false, error: err.message, code: 'VALIDATION_ERROR' });
        }
        return res.status(500).json({ success: false, error: 'Upload failed', code: 'UPLOAD_ERROR' });
      }
      const file = req.file;
      if (file) {
        const size = file.size ?? file.buffer?.length ?? (file.path && fs.statSync(file.path, { throwIfNoEntry: false })?.size);
        if (size == null || size > MAX_FILE_SIZE) {
          if (file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch (_) {}
          }
          return res.status(413).json({
            success: false,
            error: size != null && size > MAX_FILE_SIZE
              ? `Each image must be 4MB or less. File is ${(size / (1024 * 1024)).toFixed(1)}MB.`
              : 'Could not verify file size. Each image must be 4MB or less.',
            code: 'FILE_TOO_LARGE',
            maxSizeBytes: MAX_FILE_SIZE
          });
        }
      }
      next();
    });
  };
}

export { MAX_COUNT, MAX_FILE_SIZE, UPLOAD_BASE, PROFILES_PHOTOS_DIR };
