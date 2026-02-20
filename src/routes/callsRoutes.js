import express from 'express';
import { createCallSession, endCall, listCallLogs } from '../controllers/callsController.js';

const router = express.Router();

// POST /api/calls/session – create or join call (returns Agora channelId + token)
router.post('/session', createCallSession);

// POST /api/calls/end – mark call ended and record duration
router.post('/end', endCall);

// POST /api/calls/logs – list call history for user
router.post('/logs', listCallLogs);

export default router;
