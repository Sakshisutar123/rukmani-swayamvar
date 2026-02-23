/**
 * Cloudinary configuration for persistent profile photo storage.
 * When set, profile photos are uploaded to Cloudinary instead of local disk or R2.
 * Use this on Render so images persist when the service sleeps.
 *
 * Required env (all must be set to enable Cloudinary):
 * - CLOUDINARY_CLOUD_NAME  – from Cloudinary dashboard
 * - CLOUDINARY_API_KEY     – API key
 * - CLOUDINARY_API_SECRET  – API secret
 */

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY?.trim() || '';
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim() || '';

export const isCloudinaryConfigured = () =>
  Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
