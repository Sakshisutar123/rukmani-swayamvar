/**
 * Agora RTC token generation for voice/video calls.
 * Requires: AGORA_APP_ID, AGORA_APP_CERTIFICATE
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

/** Default token validity in seconds (1 hour) */
const TOKEN_EXPIRY_SECONDS = 3600;

/**
 * Generate an RTC token for a user to join a channel.
 * @param {string} channelName - Agora channel name (use same for caller and callee)
 * @param {string} userAccount - User ID string (used as Agora "user account")
 * @param {number} expireSeconds - Token validity in seconds
 * @returns {{ token: string, expireAt: number } | null } - expireAt is Unix timestamp in seconds
 */
export function buildRtcToken(channelName, userAccount, expireSeconds = TOKEN_EXPIRY_SECONDS) {
  if (!APP_ID || !APP_CERTIFICATE) return null;

  const currentTs = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTs + expireSeconds;
  const role = RtcRole.PUBLISHER; // can publish and subscribe

  const token = RtcTokenBuilder.buildTokenWithAccount(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    String(userAccount),
    role,
    privilegeExpiredTs
  );

  return { token, expireAt: privilegeExpiredTs };
}

export function isAgoraConfigured() {
  return !!(APP_ID && APP_CERTIFICATE);
}

export function getAgoraAppId() {
  return APP_ID || null;
}
