/**
 * Minimal Socket.io client to test real-time events.
 * Usage:
 *   npm install socket.io-client   (if not already installed)
 *   node test/socket-client-test.js
 * Set env USER_ID and optionally CONV_ID and SERVER_URL:
 *   USER_ID=<recipient-uuid> CONV_ID=<conversation-uuid> node test/socket-client-test.js
 * Then send a message via Postman (POST /api/conversations/messages) to see new_message here.
 */
import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const USER_ID = process.env.USER_ID || '';
const CONV_ID = process.env.CONV_ID || '';

if (!USER_ID) {
  console.log('Usage: USER_ID=<uuid> [CONV_ID=<uuid>] [SERVER_URL=http://localhost:5000] node test/socket-client-test.js');
  console.log('Example: USER_ID=abc-123 CONV_ID=def-456 node test/socket-client-test.js');
  process.exit(1);
}

const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });

socket.on('connect', () => {
  console.log('[connected]', socket.id);
  socket.emit('auth', { userId: USER_ID });
  if (CONV_ID) {
    socket.emit('join_conversation', { conversationId: CONV_ID });
    console.log('[joined conversation]', CONV_ID);
  }
  console.log('Listening for new_message and typing. Send a message via Postman to trigger new_message.\n');
});

socket.on('new_message', (data) => {
  console.log('[new_message]', JSON.stringify(data, null, 2));
});

socket.on('typing', (data) => {
  console.log('[typing]', data.userId, data.isTyping ? 'is typing...' : 'stopped');
});

socket.on('disconnect', (reason) => {
  console.log('[disconnected]', reason);
});

socket.on('connect_error', (err) => {
  console.error('[connect_error]', err.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  socket.disconnect();
  process.exit(0);
});
