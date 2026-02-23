/**
 * Cloudinary configuration for persistent profile photo storage.
 * When set, profile photos are uploaded to Cloudinary instead of local disk or R2.
 * Use this on Render so images persist when the service sleeps.
 *
 * Required env (all must be set to enable Cloudinary):
 * - CLOUDINARY_CLOUD_NAME  – from Cloudinary dashboard
 * - CLOUDINARY_API_KEY     – API key
 * - CLOUDINARY_API_SECRET  – API secret
 *
 * Values are read at runtime so they work even when dotenv loads after this module.
 */

function getEnv() {
  return {
    cloudName: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    apiKey: (process.env.CLOUDINARY_API_KEY || '').trim(),
    apiSecret: (process.env.CLOUDINARY_API_SECRET || '').trim()
  };
}

export const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = getEnv();
  return Boolean(cloudName && apiKey && apiSecret);
};

export function getCloudinaryConfig() {
  return getEnv();
}
