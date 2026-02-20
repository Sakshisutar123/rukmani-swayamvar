import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Project root (directory containing package.json) */
const PROJECT_ROOT = path.join(__dirname, '..', '..');

/** Base folder for all uploads (photos, files) */
export const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');

/** Profile photos: single folder uploads/profiles/ (all users; store only image name in DB) */
export const PROFILES_PHOTOS_DIR = path.join(UPLOADS_DIR, 'profiles');

/** General files: uploads/files/:userId/ (for future use) */
export const FILES_DIR = path.join(UPLOADS_DIR, 'files');

/** URL path prefix for profile photos (stored in DB and served by Express) */
export const PROFILES_PHOTOS_URL_PREFIX = '/uploads/profiles';

/** URL path prefix for general files */
export const FILES_URL_PREFIX = '/uploads/files';

/**
 * Ensures upload directories exist. Call at server startup.
 */
export function ensureUploadDirs() {
  for (const dir of [UPLOADS_DIR, PROFILES_PHOTOS_DIR, FILES_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created upload directory: ${path.relative(PROJECT_ROOT, dir)}`);
    }
  }
}

/**
 * Resolve stored value to absolute filesystem path.
 * - If stored value is a simple image name (no slash), resolves under PROFILES_PHOTOS_DIR.
 * - If stored value is a path (e.g. /uploads/profiles/...), resolves from project root (legacy).
 * Uses basename for image names to prevent path traversal.
 */
export function getAbsolutePathFromStoredUrl(storedUrl) {
  if (!storedUrl || typeof storedUrl !== 'string') return null;
  const u = storedUrl.trim();
  if (u.includes('/')) {
    const relativePath = u.replace(/^\//, '').replace(/\//g, path.sep);
    if (!relativePath.startsWith('uploads')) return null;
    return path.join(PROJECT_ROOT, relativePath);
  }
  const safeName = path.basename(u);
  if (!safeName) return null;
  return path.join(PROFILES_PHOTOS_DIR, safeName);
}

export default {
  PROJECT_ROOT,
  UPLOADS_DIR,
  PROFILES_PHOTOS_DIR,
  FILES_DIR,
  PROFILES_PHOTOS_URL_PREFIX,
  FILES_URL_PREFIX,
  ensureUploadDirs
};
