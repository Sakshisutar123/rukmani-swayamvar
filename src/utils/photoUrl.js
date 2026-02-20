/**
 * Convert stored photo value (image name or path) to a full URL for display.
 * - Stored value is either: unique image name (e.g. profile_1739_abc12.jpg) or full path/URL.
 * - Set API_BASE_URL in .env for full absolute URLs.
 */

import { PROFILES_PHOTOS_URL_PREFIX } from '../config/uploadPaths.js';

function getBaseUrl() {
  const base = process.env.API_BASE_URL || process.env.BASE_URL || '';
  return typeof base === 'string' ? base.trim().replace(/\/$/, '') : '';
}

/**
 * @param {string} url - Stored value: image name (e.g. profile_1739_abc.jpg), or path (/uploads/profiles/...), or full URL
 * @returns {string} - Path or full URL the client can use to display the image
 */
export function toFullImageUrl(url) {
  if (!url || typeof url !== 'string') return url || '';
  const u = url.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
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
 * Build profilePicture string from array of image names (or photo objects with .url).
 * @param {string[]|{ url: string }[]} namesOrPhotos
 * @returns {string}
 */
export function formatProfilePictureFromPhotos(namesOrPhotos) {
  if (!Array.isArray(namesOrPhotos) || namesOrPhotos.length === 0) return '';
  const names = namesOrPhotos.map((p) => (typeof p === 'string' ? p : (p && p.url) || '').trim()).filter(Boolean);
  return names.join(',');
}
