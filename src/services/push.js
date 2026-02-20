/**
 * Push notifications (FCM / APNs) for new message when app is in background.
 * Configure FCM_SERVER_KEY or firebase-admin, then implement sendPushToUser using
 * device tokens stored per user (add a device_tokens table or column).
 */

// TODO: Store device tokens per user (e.g. device_tokens table: userId, token, platform: 'android'|'ios').
// TODO: Use firebase-admin (FCM) and/or node-apn (APNs) to send. FCM can target iOS too.

/**
 * Send a push notification to a user (all registered devices).
 * No-op if push is not configured or user has no tokens.
 * @param {string} userId
 * @param {{ title: string, body: string, data?: object }} payload - data can include conversationId, messageId, etc.
 */
export async function sendPushToUser(userId, payload) {
  if (!process.env.FCM_SERVER_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Push] Not configured – set FCM_SERVER_KEY or GOOGLE_APPLICATION_CREDENTIALS. Payload:', payload);
    }
    return;
  }
  // 1. Load device tokens for userId from DB
  // 2. Send via FCM / APNs
  console.log('[Push] TODO: send to user', userId, payload);
}
