import express from 'express';
import { savePartnerPreferences } from '../controllers/dbController.js';

const router = express.Router();

// POST /api/preferences - body: { userId, age_range?, height_range?, ... } (set partner preferences)
router.post('/', savePartnerPreferences);

export default router;
