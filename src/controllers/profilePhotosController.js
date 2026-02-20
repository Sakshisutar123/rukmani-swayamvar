import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import { MAX_COUNT } from '../middleware/uploadPhotos.js';
import { getAbsolutePathFromStoredUrl } from '../config/uploadPaths.js';
import {
  withFullPhotoUrls,
  parseProfilePictureToPhotos,
  formatProfilePictureFromPhotos
} from '../utils/photoUrl.js';

/**
 * POST /api/profiles/photos/upload?userId=...
 * Upload images; saves to uploads/profiles/ and appends image names to users.profilePicture (comma-separated).
 */
export const uploadPhotos = async (req, res) => {
  try {
    const userId = req.query?.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required (query or form field)' });
    }

    const user = await User.findByPk(userId, { attributes: ['id', 'profilePicture'] });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const fromFields = req.files
      ? [].concat(req.files.photos || [], req.files.photo || [])
      : [];
    const files = fromFields.length > 0 ? fromFields : (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'No image file sent. Pick from gallery and use form field "photos" (multiple) or "photo" (single).' });
    }

    const existing = parseProfilePictureToPhotos(user.profilePicture);
    const remaining = Math.max(0, MAX_COUNT - existing.length);
    if (files.length > remaining) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${MAX_COUNT} photos per profile. You have ${existing.length}; can add ${remaining} more.`
      });
    }

    const newNames = files.map((file) => path.basename(file.path));
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
    res.status(500).json({ success: false, error: err.message });
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
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    const urls = Array.isArray(photoUrls) ? photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
    if (urls.length === 0) {
      return res.status(400).json({ success: false, error: 'photoUrls array with at least one URL is required' });
    }

    const user = await User.findByPk(userId, { attributes: ['id', 'profilePicture'] });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const existing = parseProfilePictureToPhotos(user.profilePicture);
    const remaining = Math.max(0, MAX_COUNT - existing.length);
    if (urls.length > remaining) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${MAX_COUNT} photos per profile. You have ${existing.length}; can add ${remaining} more.`
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
    res.status(500).json({ success: false, error: err.message });
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
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const user = await User.findByPk(userId, { attributes: ['id', 'profilePicture'] });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const photos = parseProfilePictureToPhotos(user.profilePicture);

    res.json({
      success: true,
      photos: withFullPhotoUrls(photos)
    });
  } catch (err) {
    console.error('List my photos error:', err);
    res.status(500).json({ success: false, error: err.message });
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
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    if (!imageName) {
      return res.status(400).json({ success: false, error: 'Image name (photoId) is required' });
    }

    const user = await User.findByPk(userId, { attributes: ['id', 'profilePicture'] });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const photos = parseProfilePictureToPhotos(user.profilePicture);
    const filtered = photos.filter((p) => p.url !== imageName && p.id !== imageName);
    if (filtered.length === photos.length) {
      return res.status(404).json({ success: false, error: 'Photo not found or not yours' });
    }

    await user.update({ profilePicture: formatProfilePictureFromPhotos(filtered) });

    if (!imageName.startsWith('http')) {
      const fullPath = getAbsolutePathFromStoredUrl(imageName);
      if (fullPath && fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn('Could not delete file:', fullPath, e.message);
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
    res.status(500).json({ success: false, error: err.message });
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
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    const names = Array.isArray(photoNames) ? photoNames.filter((n) => n) : [];
    if (names.length === 0) {
      return res.status(400).json({ success: false, error: 'photoNames array is required' });
    }

    const user = await User.findByPk(userId, { attributes: ['id', 'profilePicture'] });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const current = parseProfilePictureToPhotos(user.profilePicture);
    const currentSet = new Set(current.map((p) => p.url));
    const valid = names.filter((n) => currentSet.has(n));
    if (valid.length !== current.length) {
      return res.status(400).json({ success: false, error: 'Some photo names are invalid or not yours' });
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
    res.status(500).json({ success: false, error: err.message });
  }
};
