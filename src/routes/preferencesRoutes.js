import express from 'express';
import { getPartnerPreferences, savePartnerPreferences } from '../controllers/dbController.js';

const router = express.Router();

// GET /api/preferences?userId=... - get partner preferences (or POST with body: { userId })
router.get('/', getPartnerPreferences);
// POST /api/preferences - body: { userId, age_range?, height_range?, ... } (set partner preferences)
router.post('/', savePartnerPreferences);

export default router;
