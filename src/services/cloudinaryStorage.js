/**
 * Cloudinary storage service for profile photos.
 * Uploads buffers to Cloudinary; we store "cloudinary:public_id" in DB for delete and URL resolution.
 */

import { v2 as cloudinary } from 'cloudinary';
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  isCloudinaryConfigured
} from '../config/cloudinary.js';

const FOLDER = 'matrimony-profiles';
const PREFIX = 'cloudinary:';

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
}

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {string} [contentType] - MIME type (e.g. "image/jpeg")
 * @returns {Promise<{ publicId: string, url: string }>}
 */
export async function uploadToCloudinary(buffer, contentType = 'image/jpeg') {
  if (!isCloudinaryConfigured()) throw new Error('Cloudinary is not configured');
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        resource_type: 'image'
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result || !result.public_id) return reject(new Error('Cloudinary upload returned no public_id'));
        resolve({
          publicId: result.public_id,
          url: result.secure_url || result.url
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public_id.
 * @param {string} publicId - Cloudinary public_id (e.g. "matrimony-profiles/xyz")
 */
export async function deleteFromCloudinary(publicId) {
  if (!isCloudinaryConfigured()) throw new Error('Cloudinary is not configured');
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Check if a stored value is a Cloudinary reference (cloudinary:public_id).
 */
export function isCloudinaryStored(stored) {
  if (!stored || typeof stored !== 'string') return false;
  return stored.trim().startsWith(PREFIX);
}

/**
 * Get public_id from stored value. Returns null if not a Cloudinary reference.
 */
export function getPublicIdFromStored(stored) {
  if (!isCloudinaryStored(stored)) return null;
  const s = stored.trim();
  return s.slice(PREFIX.length) || null;
}

/**
 * Build stored value for DB: "cloudinary:public_id"
 */
export function toStoredValue(publicId) {
  return publicId ? `${PREFIX}${publicId}` : '';
}

/**
 * Build full public URL for a Cloudinary public_id (for display).
 * Used when we store "cloudinary:public_id" in DB.
 */
export function getPublicUrl(publicId) {
  if (!publicId || !CLOUDINARY_CLOUD_NAME) return '';
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
}

/**
 * Extract public_id from a Cloudinary secure_url (for delete when we store full URL).
 * e.g. .../upload/v123/folder/file.jpg -> folder/file
 */
export function getPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  if (!u.includes('res.cloudinary.com') || !u.includes('/image/upload/')) return null;
  const match = u.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return null;
  const path = match[1];
  const lastDot = path.lastIndexOf('.');
  const withoutExt = lastDot > 0 ? path.slice(0, lastDot) : path;
  return withoutExt || null;
}

export { isCloudinaryConfigured };
