import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import { MAX_COUNT, MAX_FILE_SIZE, getR2KeyForFile } from '../middleware/uploadPhotos.js';
import { getAbsolutePathFromStoredUrl } from '../config/uploadPaths.js';
import { isR2Configured } from '../config/r2.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { uploadToR2, deleteFromR2, isR2Key, keyFromR2Url } from '../services/r2Storage.js';
import { uploadToCloudinary, toStoredValue, isCloudinaryStored, getPublicIdFromStored, getPublicIdFromUrl, deleteFromCloudinary } from '../services/cloudinaryStorage.js';
import {
  withFullPhotoUrls,
  parseProfilePictureToPhotos,
  formatProfilePictureFromPhotos
} from '../utils/photoUrl.js';

/**
 * POST /api/profiles/photos/upload?userId=...
 * Upload images: to Cloudinary (if configured), else R2, else uploads/profiles/; appends to users.profilePicture (comma-separated).
 */
export const uploadPhotos = async (req, res) => {
  try {
    const userId = req.query?.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required (query or form field)',
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

    const fromFields = req.files
      ? [].concat(req.files.photos || [], req.files.photo || [])
      : [];
    const files = fromFields.length > 0 ? fromFields : (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image file sent. Use form field "photos" (multiple) or "photo" (single).',
        code: 'NO_FILES'
      });
    }

    // Validate count before any save (cannot be bypassed)
    const existing = parseProfilePictureToPhotos(user.profilePicture);
    const remaining = Math.max(0, MAX_COUNT - existing.length);
    if (files.length > remaining) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${MAX_COUNT} profile images allowed. You have ${existing.length}; you can add ${remaining} more.`,
        code: 'MAX_PHOTOS_EXCEEDED',
        currentCount: existing.length,
        maxCount: MAX_COUNT,
        remainingSlots: remaining
      });
    }

    // Validate each file size server-side (cannot be bypassed; reject if size unknown or > 4MB)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const size = file.size ?? file.buffer?.length ?? (file.path && fs.statSync(file.path, { throwIfNoEntry: false })?.size);
      if (size == null) {
        return res.status(413).json({
          success: false,
          error: 'Could not verify file size. Each image must be 4MB or less.',
          code: 'FILE_TOO_LARGE',
          maxSizeBytes: MAX_FILE_SIZE
        });
      }
      if (size > MAX_FILE_SIZE) {
        return res.status(413).json({
          success: false,
          error: `Each image must be 4MB or less. File ${i + 1} is ${(size / (1024 * 1024)).toFixed(1)}MB.`,
          code: 'FILE_TOO_LARGE',
          maxSizeBytes: MAX_FILE_SIZE
        });
      }
    }

    const useCloudinary = isCloudinaryConfigured();
    const useR2 = isR2Configured();
    const newNames = [];

    if (useCloudinary) {
      for (const file of files) {
        const buffer = file.buffer;
        if (!buffer) {
          return res.status(400).json({
            success: false,
            error: 'File buffer missing (Cloudinary mode)',
            code: 'UPLOAD_ERROR'
          });
        }
        const contentType = file.mimetype || 'image/jpeg';
        const { publicId } = await uploadToCloudinary(buffer, contentType);
        newNames.push(toStoredValue(publicId));
      }
    } else if (useR2) {
      for (const file of files) {
        const buffer = file.buffer;
        if (!buffer) {
          return res.status(400).json({
            success: false,
            error: 'File buffer missing (R2 mode)',
            code: 'UPLOAD_ERROR'
          });
        }
        const key = getR2KeyForFile(file);
        const contentType = file.mimetype || 'image/jpeg';
        await uploadToR2(buffer, key, contentType);
        newNames.push(key);
      }
    } else {
      for (const file of files) {
        newNames.push(path.basename(file.path));
      }
    }

    const allNames = existing.map((p) => p.url).concat(newNames);
    await user.update({ profilePicture: formatProfilePictureFromPhotos(allNames) });

    const created = newNames.map((name, i) => ({
      id: name,
      url: name,
      sortOrder: existing.length + i
    }));

    res.status(201).json({
      success: true,
      message: `${created.length} photo(s) added`,
      photos: withFullPhotoUrls(created)
    });
  } catch (err) {
    console.error('Upload profile photos error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Upload failed',
      code: 'UPLOAD_ERROR'
    });
  }
};

/**
 * POST /api/profiles/photos/add-urls
 * Body: { userId, photoUrls: string[] } - appends to users.profilePicture (comma-separated).
 */
export const addPhotoUrls = async (req, res) => {
  try {
    const { userId, photoUrls } = req.body || {};
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
        code: 'MISSING_USER_ID'
      });
    }
    const urls = Array.isArray(photoUrls) ? photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
    if (urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'photoUrls array with at least one URL is required',
        code: 'INVALID_INPUT'
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
    const remaining = Math.max(0, MAX_COUNT - existing.length);
    if (urls.length > remaining) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${MAX_COUNT} profile images allowed. You have ${existing.length}; you can add ${remaining} more.`,
        code: 'MAX_PHOTOS_EXCEEDED',
        currentCount: existing.length,
        maxCount: MAX_COUNT,
        remainingSlots: remaining
      });
    }

    const toAdd = urls.map((u) => u.trim());
    const allNames = existing.map((p) => p.url).concat(toAdd);
    await user.update({ profilePicture: formatProfilePictureFromPhotos(allNames) });

    const created = toAdd.map((name, i) => ({
      id: name,
      url: name,
      sortOrder: existing.length + i
    }));

    res.status(201).json({
      success: true,
      message: `${created.length} photo(s) added`,
      photos: withFullPhotoUrls(created)
    });
  } catch (err) {
    console.error('Add photo URLs error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error',
      code: 'UPLOAD_ERROR'
    });
  }
};

/**
 * GET /api/profiles/photos?userId=...
 * List current user's profile photos from users.profilePicture (comma-separated).
 */
export const listMyPhotos = async (req, res) => {
  try {
    const userId = req.query?.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
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

    const photos = parseProfilePictureToPhotos(user.profilePicture);

    res.json({
      success: true,
      photos: withFullPhotoUrls(photos)
    });
  } catch (err) {
    console.error('List my photos error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * DELETE /api/profiles/photos/:imageName?userId=...
 * Removes one image by name from users.profilePicture; deletes file from disk if local.
 */
export const deletePhoto = async (req, res) => {
  try {
    const imageName = req.params.photoId;
    const userId = req.query?.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
        code: 'MISSING_USER_ID'
      });
    }
    if (!imageName) {
      return res.status(400).json({
        success: false,
        error: 'Image name (photoId) is required',
        code: 'INVALID_INPUT'
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

    const photos = parseProfilePictureToPhotos(user.profilePicture);
    const filtered = photos.filter((p) => p.url !== imageName && p.id !== imageName);
    if (filtered.length === photos.length) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found or not yours',
        code: 'PHOTO_NOT_FOUND'
      });
    }

    await user.update({ profilePicture: formatProfilePictureFromPhotos(filtered) });

    const cloudinaryPublicId = isCloudinaryStored(imageName)
      ? getPublicIdFromStored(imageName)
      : getPublicIdFromUrl(imageName);
    if (cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(cloudinaryPublicId);
      } catch (e) {
        console.warn('Could not delete from Cloudinary:', cloudinaryPublicId, e.message);
      }
    } else {
      const r2Key = isR2Key(imageName) ? imageName : keyFromR2Url(imageName);
      if (r2Key) {
        try {
          await deleteFromR2(r2Key);
        } catch (e) {
          console.warn('Could not delete from R2:', r2Key, e.message);
        }
      } else if (!imageName.startsWith('http')) {
        const fullPath = getAbsolutePathFromStoredUrl(imageName);
        if (fullPath && fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (e) {
            console.warn('Could not delete file:', fullPath, e.message);
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Photo removed',
      deletedId: imageName
    });
  } catch (err) {
    console.error('Delete photo error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * PATCH /api/profiles/photos/reorder
 * Body: { userId, photoNames: string[] } - new order (array of image names).
 */
export const reorderPhotos = async (req, res) => {
  try {
    const { userId, photoNames } = req.body || {};
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
        code: 'MISSING_USER_ID'
      });
    }
    const names = Array.isArray(photoNames) ? photoNames.filter((n) => n) : [];
    if (names.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'photoNames array is required',
        code: 'INVALID_INPUT'
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

    const current = parseProfilePictureToPhotos(user.profilePicture);
    const currentSet = new Set(current.map((p) => p.url));
    const valid = names.filter((n) => currentSet.has(n));
    if (valid.length !== current.length) {
      return res.status(400).json({
        success: false,
        error: 'Some photo names are invalid or not yours',
        code: 'INVALID_PHOTO_NAMES'
      });
    }

    await user.update({ profilePicture: formatProfilePictureFromPhotos(names) });

    const updated = parseProfilePictureToPhotos(formatProfilePictureFromPhotos(names));

    res.json({
      success: true,
      message: 'Order updated',
      photos: withFullPhotoUrls(updated)
    });
  } catch (err) {
    console.error('Reorder photos error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};
