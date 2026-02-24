import ConnectionRequest from '../models/ConnectionRequest.js';
import User from '../models/User.js';

/**
 * Get connection status between userId and otherUserId.
 * Returns: { status: 'none'|'pending_sent'|'pending_received'|'accepted'|'rejected', connection?: ConnectionRequest }
 */
export async function getConnectionStatus(userId, otherUserId) {
  if (!userId || !otherUserId || userId === otherUserId) {
    return { status: 'none' };
  }
  const { Op } = await import('sequelize');
  const conn = await ConnectionRequest.findOne({
    where: {
      [Op.or]: [
        { requesterId: userId, requestedId: otherUserId },
        { requesterId: otherUserId, requestedId: userId }
      ]
    }
  });
  if (!conn) return { status: 'none' };
  if (conn.status === 'accepted') return { status: 'accepted', connection: conn };
  if (conn.status === 'rejected') return { status: 'rejected', connection: conn };
  // pending
  if (conn.requesterId === userId) return { status: 'pending_sent', connection: conn };
  return { status: 'pending_received', connection: conn };
}

/**
 * POST /api/connections/request - body: { userId, otherUserId }
 * Send a connection request (creates pending). Idempotent if already pending.
 */
export const sendConnectionRequest = async (req, res) => {
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
        error: 'Cannot send connection request to yourself'
      });
    }

    let conn = await ConnectionRequest.findOne({
      where: {
        requesterId: userId,
        requestedId: otherUserId
      }
    });
    if (conn) {
      if (conn.status === 'pending') {
        return res.status(200).json({
          success: true,
          connection: {
            id: conn.id,
            requesterId: conn.requesterId,
            requestedId: conn.requestedId,
            status: conn.status,
            createdAt: conn.createdAt
          },
          message: 'Request already sent'
        });
      }
      if (conn.status === 'rejected') {
        return res.status(400).json({
          success: false,
          error: 'Connection was rejected. You cannot send another request.'
        });
      }
      if (conn.status === 'accepted') {
        return res.status(200).json({
          success: true,
          connection: {
            id: conn.id,
            requesterId: conn.requesterId,
            requestedId: conn.requestedId,
            status: conn.status,
            createdAt: conn.createdAt
          },
          message: 'Already connected'
        });
      }
    }

    // Check if the other user already sent us a request - then we could auto-accept or just return that
    const existingFromOther = await ConnectionRequest.findOne({
      where: {
        requesterId: otherUserId,
        requestedId: userId
      }
    });
    if (existingFromOther && existingFromOther.status === 'pending') {
      return res.status(400).json({
        success: false,
        error: 'They have already sent you a connection request. Accept it from your requests list.'
      });
    }

    conn = await ConnectionRequest.create({
      requesterId: userId,
      requestedId: otherUserId,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      connection: {
        id: conn.id,
        requesterId: conn.requesterId,
        requestedId: conn.requestedId,
        status: conn.status,
        createdAt: conn.createdAt
      }
    });
  } catch (err) {
    console.error('sendConnectionRequest error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send connection request'
    });
  }
};

/**
 * POST /api/connections/accept - body: { userId, otherUserId }
 * Accept a connection request (only the requested user can accept).
 */
export const acceptConnection = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId; // the one accepting (requestedId)
    const otherUserId = body.otherUserId; // the requester

    if (!userId || !otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'userId and otherUserId are required'
      });
    }

    const conn = await ConnectionRequest.findOne({
      where: {
        requesterId: otherUserId,
        requestedId: userId,
        status: 'pending'
      }
    });
    if (!conn) {
      return res.status(404).json({
        success: false,
        error: 'No pending connection request found'
      });
    }

    await conn.update({ status: 'accepted' });

    return res.status(200).json({
      success: true,
      connection: {
        id: conn.id,
        requesterId: conn.requesterId,
        requestedId: conn.requestedId,
        status: conn.status,
        updatedAt: conn.updatedAt
      }
    });
  } catch (err) {
    console.error('acceptConnection error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to accept connection'
    });
  }
};

/**
 * POST /api/connections/reject - body: { userId, otherUserId }
 * Reject a connection request (only the requested user can reject).
 */
export const rejectConnection = async (req, res) => {
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

    const conn = await ConnectionRequest.findOne({
      where: {
        requesterId: otherUserId,
        requestedId: userId,
        status: 'pending'
      }
    });
    if (!conn) {
      return res.status(404).json({
        success: false,
        error: 'No pending connection request found'
      });
    }

    await conn.update({ status: 'rejected' });

    return res.status(200).json({
      success: true,
      connection: {
        id: conn.id,
        requesterId: conn.requesterId,
        requestedId: conn.requestedId,
        status: conn.status,
        updatedAt: conn.updatedAt
      }
    });
  } catch (err) {
    console.error('rejectConnection error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to reject connection'
    });
  }
};

/**
 * POST /api/connections/status - body: { userId, otherUserId }
 * Get connection status between two users.
 */
export const getStatus = async (req, res) => {
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

    const { status, connection } = await getConnectionStatus(userId, otherUserId);

    return res.status(200).json({
      success: true,
      status,
      connection: connection ? {
        id: connection.id,
        requesterId: connection.requesterId,
        requestedId: connection.requestedId,
        status: connection.status,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
      } : null
    });
  } catch (err) {
    console.error('getConnectionStatus error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to get connection status'
    });
  }
};

/**
 * POST /api/connections/list-pending - body: { userId }
 * List pending connection requests received by the user (for Accept/Reject UI).
 */
export const listPendingReceived = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const requests = await ConnectionRequest.findAll({
      where: {
        requestedId: userId,
        status: 'pending'
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'fullName', 'profilePicture']
        }
      ]
    });

    const list = requests.map(r => ({
      id: r.id,
      requesterId: r.requesterId,
      requestedId: r.requestedId,
      status: r.status,
      createdAt: r.createdAt,
      requester: r.requester ? {
        id: r.requester.id,
        fullName: r.requester.fullName,
        profilePicture: r.requester.profilePicture
      } : null
    }));

    return res.status(200).json({
      success: true,
      requests: list
    });
  } catch (err) {
    console.error('listPendingReceived error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to list pending requests'
    });
  }
};
