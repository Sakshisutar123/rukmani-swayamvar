/**
 * Calls (Agora) – create call session, optional call log, end call.
 * Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env.
 */
import { randomUUID } from 'crypto';
import CallLog from '../models/CallLog.js';
import User from '../models/User.js';
import { buildRtcToken, isAgoraConfigured, getAgoraAppId } from '../services/agora.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * POST /api/calls/session
 * Body: { userId, otherUserId, type?: 'voice'|'video', channelId?: string }
 * - If channelId is omitted: creates a new call (caller flow). Returns channelId + token. Optionally creates a call_log.
 * - If channelId is provided: callee joining. Returns same channelId + token for the callee.
 * Returns: { success, appId, channelId, token, expireAt, type }
 */
export const createCallSession = async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { userId, otherUserId, type = 'voice', channelId: existingChannelId } = body;

  if (!userId || !otherUserId) {
    return res.status(400).json({
      success: false,
      error: 'userId and otherUserId are required'
    });
  }

  if (userId === otherUserId) {
    return res.status(400).json({
      success: false,
      error: 'Cannot start a call with yourself'
    });
  }

  const callType = type === 'video' ? 'video' : 'voice';

  if (!isAgoraConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Calls not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env.'
    });
  }

  const appId = getAgoraAppId();
  const channelName = existingChannelId && String(existingChannelId).trim()
    ? String(existingChannelId).trim()
    : `call-${randomUUID()}`;

  const result = buildRtcToken(channelName, userId);
  if (!result) {
    return res.status(503).json({
      success: false,
      error: 'Failed to generate call token'
    });
  }

  // If caller (new channel), optionally create a call log
  if (!existingChannelId) {
    try {
      await CallLog.create({
        channelId: channelName,
        callerId: userId,
        calleeId: otherUserId,
        type: callType,
        startedAt: new Date()
      });
    } catch (err) {
      console.error('CallLog create error (non-fatal):', err.message);
    }
  }

  return res.status(200).json({
    success: true,
    appId,
    channelId: channelName,
    token: result.token,
    expireAt: result.expireAt,
    type: callType
  });
};

/**
 * POST /api/calls/end
 * Body: { userId, channelId }
 * Marks the call as ended and sets duration. Any participant can end.
 */
export const endCall = async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { userId, channelId } = body;

  if (!userId || !channelId) {
    return res.status(400).json({
      success: false,
      error: 'userId and channelId are required'
    });
  }

  const log = await CallLog.findOne({
    where: { channelId: String(channelId).trim(), endedAt: null }
  });

  if (!log) {
    return res.status(200).json({
      success: true,
      message: 'Call already ended or not found'
    });
  }

  const isParticipant = log.callerId === userId || log.calleeId === userId;
  if (!isParticipant) {
    return res.status(403).json({
      success: false,
      error: 'You are not a participant in this call'
    });
  }

  const endedAt = new Date();
  const durationSeconds = Math.max(0, Math.floor((endedAt - log.startedAt) / 1000));

  await log.update({ endedAt, durationSeconds });

  return res.status(200).json({
    success: true,
    message: 'Call ended',
    callLog: {
      id: log.id,
      channelId: log.channelId,
      durationSeconds: log.durationSeconds,
      endedAt: log.endedAt
    }
  });
};

/**
 * POST /api/calls/logs
 * Body: { userId, page?, limit? }
 * Returns call history for the user (as caller or callee).
 */
export const listCallLogs = async (req, res) => {
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
  const { rows, count } = await CallLog.findAndCountAll({
    where: {
      [Op.or]: [{ callerId: userId }, { calleeId: userId }]
    },
    order: [['startedAt', 'DESC']],
    limit,
    offset,
    include: [
      { model: User, as: 'caller', attributes: ['id', 'fullName', 'profilePicture'] },
      { model: User, as: 'callee', attributes: ['id', 'fullName', 'profilePicture'] }
    ]
  });

  const logs = rows.map((log) => {
    const isCaller = log.callerId === userId;
    const other = isCaller ? log.callee : log.caller;
    return {
      id: log.id,
      channelId: log.channelId,
      type: log.type,
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      durationSeconds: log.durationSeconds,
      role: isCaller ? 'caller' : 'callee',
      otherUser: other ? { id: other.id, fullName: other.fullName, profilePicture: other.profilePicture } : null
    };
  });

  return res.status(200).json({
    success: true,
    logs,
    pagination: { page, limit, total: count }
  });
};
