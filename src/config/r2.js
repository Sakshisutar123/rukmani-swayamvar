/**
 * Cloudflare R2 (S3-compatible) configuration.
 * When set, profile photos are uploaded to R2 instead of local disk (persistent on Render).
 *
 * Required env (all must be set to enable R2):
 * - R2_ACCOUNT_ID    – Cloudflare account ID (from dashboard)
 * - R2_ACCESS_KEY_ID – R2 API token access key
 * - R2_SECRET_ACCESS_KEY – R2 API token secret
 * - R2_BUCKET_NAME  – Bucket name (e.g. "matrimony-profiles")
 * - R2_PUBLIC_URL   – Public URL for the bucket (e.g. https://pub-xxxx.r2.dev or custom domain)
 */

export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.trim() || '';
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID?.trim() || '';
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME?.trim() || '';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.trim()?.replace(/\/$/, '') || '';

export const isR2Configured = () =>
  Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);

export const getR2Endpoint = () =>
  R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '';
