import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getConnectionStatus } from './connectionController.js';
import { emitNewMessage } from '../services/realtime.js';
import { sendPushToUser } from '../services/push.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Normalize conversation pair so user1Id <= user2Id (string compare) for unique lookup. */
function orderedUserIds(userId, otherUserId) {
  const a = String(userId);
  const b = String(otherUserId);
  return a <= b ? [a, b] : [b, a];
}

/**
 * POST /api/conversations - body: { userId, otherUserId }
 * Create or get conversation between two users.
 */
export const createOrGetConversation = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;
    const otherUserId = body.otherUserId;

    if (!userId || !otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'userId and otherUserId are required'
      });
    }
    if (userId === otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create conversation with yourself'
      });
    }

    const [user1Id, user2Id] = orderedUserIds(userId, otherUserId);

    let conversation = await Conversation.findOne({
      where: { user1Id, user2Id }
    });
    if (!conversation) {
      conversation = await Conversation.create({ user1Id, user2Id });
    }

    const otherId = userId === user1Id ? user2Id : user1Id;
    const other = await User.findByPk(otherId, {
      attributes: ['id', 'fullName', 'profilePicture']
    });

    const { status: connectionStatus } = await getConnectionStatus(userId, otherId);

    return res.status(200).json({
      success: true,
      conversation: {
        id: conversation.id,
        user1Id: conversation.user1Id,
        user2Id: conversation.user2Id,
        createdAt: conversation.createdAt,
        connectionStatus,
        otherUser: other ? {
          id: other.id,
          fullName: other.fullName,
          profilePicture: other.profilePicture
        } : null
      }
    });
  } catch (err) {
    console.error('createOrGetConversation error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to create or get conversation'
    });
  }
};

/**
 * POST /api/conversations/list - body: { userId, page?, limit? }
 * List conversations for the user (with last message preview).
 */
export const listConversations = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;
    const page = Math.max(1, parseInt(body.page, 10) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(body.limit, 10) || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const { Op } = await import('sequelize');
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
      },
      order: [['updatedAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'fullName', 'profilePicture']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'fullName', 'profilePicture']
        }
      ]
    });

    const list = await Promise.all(
      conversations.map(async (conv) => {
        const other = conv.user1Id === userId ? conv.user2 : conv.user1;
        const otherId = other?.id;
        const { status: connectionStatus } = otherId
          ? await getConnectionStatus(userId, otherId)
          : { status: 'none' };
        const lastMessage = await Message.findOne({
          where: { conversationId: conv.id },
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'content', 'senderId', 'createdAt', 'readAt']
        });
        return {
          id: conv.id,
          connectionStatus,
          otherUser: other ? { id: other.id, fullName: other.fullName, profilePicture: other.profilePicture } : null,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
                readAt: lastMessage.readAt
              }
            : null,
          updatedAt: conv.updatedAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      conversations: list
    });
  } catch (err) {
    console.error('listConversations error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to list conversations'
    });
  }
};

/**
 * POST /api/conversations/messages - body: { userId, conversationId, content }
 * Send a message and emit real-time event to recipient.
 */
export const sendMessage = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;
    const conversationId = body.conversationId;
    const content = body.content;

    if (!userId || !conversationId || content == null || String(content).trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'userId, conversationId, and content are required'
      });
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const isParticipant =
      conversation.user1Id === userId || conversation.user2Id === userId;
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Not a participant in this conversation' });
    }

    const receiverId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
    const { status: connectionStatus } = await getConnectionStatus(userId, receiverId);

    if (connectionStatus === 'none') {
      return res.status(403).json({
        success: false,
        error: 'Send a connection request first to message this user.'
      });
    }
    if (connectionStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        error: 'Connection was rejected. You cannot message this user.'
      });
    }
    if (connectionStatus === 'pending_received') {
      return res.status(403).json({
        success: false,
        error: 'Accept their connection request first to start messaging.'
      });
    }
    if (connectionStatus === 'pending_sent') {
      const count = await Message.count({
        where: {
          conversationId,
          senderId: userId
        }
      });
      if (count >= 1) {
        return res.status(403).json({
          success: false,
          error: 'You can send only one message until they accept your connection request.'
        });
      }
    }

    const message = await Message.create({
      conversationId,
      senderId: userId,
      receiverId,
      content: String(content).trim()
    });

    // Real-time: notify recipient so UI updates without polling
    emitNewMessage(receiverId, {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      createdAt: message.createdAt,
      readAt: message.readAt
    });

    // Push: when app is in background, FCM/APNs will notify (no-op if not configured)
    const contentPreview = message.content.length > 80 ? message.content.slice(0, 77) + '...' : message.content;
    sendPushToUser(receiverId, {
      title: 'New message',
      body: contentPreview,
      data: { conversationId: message.conversationId, messageId: message.id }
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        createdAt: message.createdAt,
        readAt: message.readAt
      }
    });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send message'
    });
  }
};

/**
 * POST /api/conversations/messages/list - body: { userId, conversationId, page?, limit?, markRead? }
 * List messages in a conversation; optionally mark as read.
 */
export const listMessages = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;
    const conversationId = body.conversationId;
    const page = Math.max(1, parseInt(body.page, 10) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(body.limit, 10) || DEFAULT_LIMIT));
    const markRead = body.markRead !== false;
    const offset = (page - 1) * limit;

    if (!userId || !conversationId) {
      return res.status(400).json({
        success: false,
        error: 'userId and conversationId are required'
      });
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const isParticipant =
      conversation.user1Id === userId || conversation.user2Id === userId;
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Not a participant in this conversation' });
    }

    if (markRead) {
      await Message.update(
        { readAt: new Date() },
        {
          where: {
            conversationId,
            receiverId: userId,
            readAt: null
          }
        }
      );
    }

    const { rows, count } = await Message.findAndCountAll({
      where: { conversationId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'conversationId', 'senderId', 'receiverId', 'content', 'createdAt', 'readAt']
    });

    return res.status(200).json({
      success: true,
      messages: rows.reverse(),
      pagination: {
        page,
        limit,
        total: count
      }
    });
  } catch (err) {
    console.error('listMessages error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to list messages'
    });
  }
};
