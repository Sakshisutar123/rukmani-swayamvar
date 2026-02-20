/**
 * Real-time service: new message & typing events via Socket.io.
 * Call initRealtime(io) from server after attaching Socket.io to the HTTP server.
 */

let io = null;
/** @type {Map<string, Set<string>>} userId -> Set of socket ids */
const userSockets = new Map();

/**
 * Register Socket.io and auth. Clients should emit "auth" with { userId } after connect.
 * @param {import("socket.io").Server} ioInstance
 */
export function initRealtime(ioInstance) {
  io = ioInstance;

  io.on('connection', (socket) => {
    socket.on('auth', (data) => {
      const userId = data?.userId;
      if (!userId) return;
      const uid = String(userId);
      if (!userSockets.has(uid)) userSockets.set(uid, new Set());
      userSockets.get(uid).add(socket.id);
      socket.userId = uid;

      socket.join(`user:${uid}`);
    });

    socket.on('typing', (data) => {
      const { conversationId, userId: senderId } = data || {};
      if (!conversationId || !senderId) return;
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId: senderId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId, userId: senderId } = data || {};
      if (!conversationId || !senderId) return;
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId: senderId,
        isTyping: false
      });
    });

    socket.on('join_conversation', (data) => {
      const convId = data?.conversationId;
      if (convId) socket.join(`conversation:${convId}`);
    });

    socket.on('leave_conversation', (data) => {
      const convId = data?.conversationId;
      if (convId) socket.leave(`conversation:${convId}`);
    });

    socket.on('disconnect', () => {
      const uid = socket.userId;
      if (uid && userSockets.has(uid)) {
        userSockets.get(uid).delete(socket.id);
        if (userSockets.get(uid).size === 0) userSockets.delete(uid);
      }
    });
  });
}

/**
 * Emit "new_message" to a user (all their sockets). Call after saving a message.
 * @param {string} recipientUserId
 * @param {object} messagePayload
 */
export function emitNewMessage(recipientUserId, messagePayload) {
  if (!io) return;
  const uid = String(recipientUserId);
  io.to(`user:${uid}`).emit('new_message', messagePayload);
}

/**
 * Emit "typing" to the other user in a conversation (call from client or from server when forwarding typing).
 * Prefer having the client emit "typing" to the server and the server broadcast to conversation room.
 * This helper is for server-side use if needed.
 * @param {string} conversationId
 * @param {string} targetUserId - user who should see the typing indicator
 * @param {{ userId: string, isTyping: boolean }} payload
 */
export function emitTyping(conversationId, targetUserId, payload) {
  if (!io) return;
  io.to(`user:${String(targetUserId)}`).emit('typing', {
    conversationId,
    ...payload
  });
}
