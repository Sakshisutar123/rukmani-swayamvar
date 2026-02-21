import express from 'express';
import {
  addToFavorites,
  removeFromFavorites,
  listMyFavorites,
  addToShortlist,
  removeFromShortlist,
  listMyShortlist
} from '../controllers/favoritesController.js';

const router = express.Router();

// POST /api/favorites - body: { userId, profileId } - add a profile to favorites
router.post('/', addToFavorites);

// POST /api/favorites/remove - body: { userId, profileId } - remove from favorites
router.post('/remove', removeFromFavorites);

// POST /api/favorites/list - body: { userId, page?, limit? } - list my favorite profiles
router.post('/list', listMyFavorites);

// Shortlist (only amongst favorites)
// POST /api/favorites/shortlist - body: { userId, profileId } - add to shortlist (must be in favorites first)
router.post('/shortlist', addToShortlist);

// POST /api/favorites/shortlist/remove - body: { userId, profileId } - remove from shortlist
router.post('/shortlist/remove', removeFromShortlist);

// POST /api/favorites/shortlist/list - body: { userId, page?, limit? } - list my shortlisted profiles
router.post('/shortlist/list', listMyShortlist);

export default router;
