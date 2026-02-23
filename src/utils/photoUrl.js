/**
 * Convert stored photo value (image name or path) to a full URL for display.
 * - Stored value: image name (profile_xxx.jpg), R2 key (profiles/profile_xxx.jpg), path (/uploads/profiles/...), or full URL.
 * - When R2 is configured, keys starting with "profiles/" are resolved to R2_PUBLIC_URL.
 * - Server: set API_BASE_URL to your public API URL (e.g. https://api.yoursite.com) so clients get absolute URLs.
 * - Localhost: leave API_BASE_URL empty or set to http://localhost:PORT for same-origin.
 */

import { PROFILES_PHOTOS_URL_PREFIX } from '../config/uploadPaths.js';
import { R2_PUBLIC_URL, isR2Configured } from '../config/r2.js';
import { isCloudinaryStored, getPublicIdFromStored, getPublicUrl } from '../services/cloudinaryStorage.js';

function getBaseUrl() {
  const base = process.env.API_BASE_URL || process.env.BASE_URL || '';
  return typeof base === 'string' ? base.trim().replace(/\/$/, '') : '';
}

/**
 * @param {string} url - Stored value: image name (e.g. profile_1739_abc.jpg), R2 key (profiles/profile_xxx.jpg), or full URL
 * @returns {string} - Full URL the client can use to display the image
 */
export function toFullImageUrl(url) {
  if (!url || typeof url !== 'string') return url || '';
  const u = url.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  // Cloudinary: stored as "cloudinary:public_id" (short form, ~45 chars vs ~95 for full URL)
  if (isCloudinaryStored(u)) {
    const publicId = getPublicIdFromStored(u);
    return publicId ? getPublicUrl(publicId) : u;
  }
  // R2: stored key like "profiles/profile_xxx.jpg"
  if (isR2Configured() && R2_PUBLIC_URL && u.startsWith('profiles/')) {
    return `${R2_PUBLIC_URL}/${u}`;
  }
  const base = getBaseUrl();
  const pathPart = u.includes('/') ? u : `${PROFILES_PHOTOS_URL_PREFIX}/${u}`;
  const pathWithLeadingSlash = pathPart.startsWith('/') ? pathPart : '/' + pathPart;
  return base ? base + pathWithLeadingSlash : pathWithLeadingSlash;
}

/**
 * Map photo object(s) to include full image URLs.
 * @param {Object|Object[]} photoOrPhotos - Single { id, url, sortOrder, ... } or array
 * @returns {Object|Object[]} - Same shape with url replaced by full image URL
 */
export function withFullPhotoUrls(photoOrPhotos) {
  if (Array.isArray(photoOrPhotos)) {
    return photoOrPhotos.map((p) => (p && typeof p === 'object' ? { ...p, url: toFullImageUrl(p.url) } : p));
  }
  if (photoOrPhotos && typeof photoOrPhotos === 'object') {
    return { ...photoOrPhotos, url: toFullImageUrl(photoOrPhotos.url) };
  }
  return photoOrPhotos;
}

/**
 * Parse users.profilePicture (comma-separated image names) into photos array.
 * @param {string|null|undefined} profilePicture - e.g. "profile_1.jpg,profile_2.jpg"
 * @returns {{ id: string, url: string, sortOrder: number }[]}
 */
export function parseProfilePictureToPhotos(profilePicture) {
  if (!profilePicture || typeof profilePicture !== 'string') return [];
  return profilePicture
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url, index) => ({ id: url, url, sortOrder: index }));
}

/**
 * Get the first profile photo as a full display URL (for profile cards).
 * @param {string|null|undefined} profilePicture - comma-separated image names
 * @returns {string|null} - Full URL of first photo, or null if none
 */
export function getFirstPhotoUrl(profilePicture) {
  const photos = parseProfilePictureToPhotos(profilePicture);
  if (photos.length === 0) return null;
  return toFullImageUrl(photos[0].url);
}

/**
 * Build profilePicture string from array of image names (or photo objects with .url).
 * @param {string[]|{ url: string }[]} namesOrPhotos
 * @returns {string}
 */
export function formatProfilePictureFromPhotos(namesOrPhotos) {
  if (!Array.isArray(namesOrPhotos) || namesOrPhotos.length === 0) return '';
  const names = namesOrPhotos.map((p) => (typeof p === 'string' ? p : (p && p.url) || '').trim()).filter(Boolean);
  return names.join(',');
}
