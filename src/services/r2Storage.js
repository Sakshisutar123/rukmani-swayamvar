/**
 * Cloudflare R2 storage service (S3-compatible API).
 * Uploads profile photos to R2 and returns public URL; supports delete by key.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  isR2Configured,
  getR2Endpoint
} from '../config/r2.js';

let _client = null;

function getClient() {
  if (!_client) {
    const endpoint = getR2Endpoint();
    if (!endpoint) throw new Error('R2 endpoint not configured');
    _client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      },
      forcePathStyle: true
    });
  }
  return _client;
}

/** Object key prefix for profile photos in the bucket */
export const R2_PROFILES_PREFIX = 'profiles/';

/**
 * Upload a buffer to R2 and return the public URL.
 * @param {Buffer} buffer - File buffer
 * @param {string} key - Object key (e.g. "profiles/profile_123_abc.jpg")
 * @param {string} contentType - MIME type (e.g. "image/jpeg")
 * @returns {Promise<string>} - Full public URL for the object
 */
export async function uploadToR2(buffer, key, contentType = 'image/jpeg') {
  if (!isR2Configured()) throw new Error('R2 is not configured');
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Delete an object from R2 by key.
 * @param {string} key - Object key (e.g. "profiles/profile_123_abc.jpg")
 */
export async function deleteFromR2(key) {
  if (!isR2Configured()) throw new Error('R2 is not configured');
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key
    })
  );
}

/**
 * Check if a stored value is an R2 key (to be resolved with R2_PUBLIC_URL).
 * We store keys like "profiles/profile_xxx.jpg" when using R2.
 */
export function isR2Key(stored) {
  if (!stored || typeof stored !== 'string') return false;
  const t = stored.trim();
  return t.startsWith(R2_PROFILES_PREFIX) && !t.startsWith('http');
}

/**
 * If the value is a full R2 public URL, return the object key; otherwise null.
 */
export function keyFromR2Url(url) {
  if (!url || !R2_PUBLIC_URL || typeof url !== 'string') return null;
  const u = url.trim();
  if (!u.startsWith(R2_PUBLIC_URL + '/') && u !== R2_PUBLIC_URL) return null;
  return u.slice(R2_PUBLIC_URL.length).replace(/^\//, '');
}

export { isR2Configured, R2_PUBLIC_URL };
