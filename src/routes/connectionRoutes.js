import express from 'express';
import {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getStatus,
  listPendingReceived
} from '../controllers/connectionController.js';

const router = express.Router();

// POST /api/connections/request - body: { userId, otherUserId }
router.post('/request', sendConnectionRequest);

// POST /api/connections/accept - body: { userId, otherUserId }
router.post('/accept', acceptConnection);

// POST /api/connections/reject - body: { userId, otherUserId }
router.post('/reject', rejectConnection);

// POST /api/connections/status - body: { userId, otherUserId }
router.post('/status', getStatus);

// POST /api/connections/list-pending - body: { userId }
router.post('/list-pending', listPendingReceived);

export default router;
