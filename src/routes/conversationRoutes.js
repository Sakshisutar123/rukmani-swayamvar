import express from 'express';
import {
  createOrGetConversation,
  listConversations,
  sendMessage,
  listMessages
} from '../controllers/conversationController.js';

const router = express.Router();

// POST /api/conversations - body: { userId, otherUserId } - create or get conversation
router.post('/', createOrGetConversation);

// POST /api/conversations/list - body: { userId, page?, limit? } - list my conversations
router.post('/list', listConversations);

// POST /api/conversations/messages - body: { userId, conversationId, content } - send message
router.post('/messages', sendMessage);

// POST /api/conversations/messages/list - body: { userId, conversationId, page?, limit?, markRead? } - list messages
router.post('/messages/list', listMessages);

export default router;
