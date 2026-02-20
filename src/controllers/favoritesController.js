import User from '../models/User.js';
import Favorite from '../models/Favorite.js';

/** Profile fields to return when listing favorite profiles (same as profile listing) */
const FAVORITE_PROFILE_ATTRIBUTES = [
  'id',
  'fullName',
  'gender',
  'dateOfBirth',
  'age',
  'height',
  'weight',
  'skinTone',
  'diet',
  'religion',
  'caste',
  'subCaste',
  'city',
  'state',
  'country',
  'profession',
  'occupation',
  'education',
  'income',
  'maritalStatus',
  'motherTongue',
  'aboutMe',
  'profilePicture',
  'bio',
  'isRegistered'
];

/**
 * POST /api/favorites - body: { userId, profileId } or { userId, favoriteUserId }
 * Add a profile to the user's favorites. Idempotent (already added returns success).
 */
export const addToFavorites = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;
    const profileId = body.profileId ?? body.favoriteUserId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required in request body'
      });
    }
    if (!profileId) {
      return res.status(400).json({
        success: false,
        error: 'profileId (or favoriteUserId) is required in request body'
      });
    }

    if (userId === profileId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot add yourself to favorites'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const favoriteProfile = await User.findByPk(profileId);
    if (!favoriteProfile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    const [favorite, created] = await Favorite.findOrCreate({
      where: { userId, favoriteUserId: profileId },
      defaults: { userId, favoriteUserId: profileId }
    });

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Added to favorites' : 'Already in favorites',
      favorite: {
        id: favorite.id,
        userId: favorite.userId,
        favoriteUserId: favorite.favoriteUserId,
        isShortlisted: favorite.isShortlisted ?? false,
        createdAt: favorite.createdAt
      }
    });
  } catch (err) {
    console.error('Add to favorites error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/favorites/list - body: { userId, page?, limit? }
 * List all profiles the user has added to favorites (with profile data and addedAt).
 */
export const listMyFavorites = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;
    const page = Math.max(1, parseInt(body.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(body.limit, 10) || 20));
    const offset = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required in request body'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { count, rows: favorites } = await Favorite.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'favoriteProfile',
          attributes: FAVORITE_PROFILE_ATTRIBUTES,
          required: true
        }
      ]
    });

    const data = favorites.map((f) => ({
      addedAt: f.createdAt,
      favoriteId: f.id,
      isShortlisted: f.isShortlisted ?? false,
      profile: f.favoriteProfile ? f.favoriteProfile.toJSON() : null
    }));

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      }
    });
  } catch (err) {
    console.error('List my favorites error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/favorites/shortlist - body: { userId, profileId }
 * Shortlist a profile. Profile must already be in the user's favorites.
 */
export const addToShortlist = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;
    const profileId = body.profileId ?? body.favoriteUserId;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required in request body' });
    }
    if (!profileId) {
      return res.status(400).json({ success: false, error: 'profileId (or favoriteUserId) is required in request body' });
    }

    const favorite = await Favorite.findOne({
      where: { userId, favoriteUserId: profileId }
    });

    if (!favorite) {
      return res.status(400).json({
        success: false,
        error: 'Profile must be in your favorites before you can shortlist it. Add to favorites first.'
      });
    }

    if (favorite.isShortlisted) {
      return res.status(200).json({
        success: true,
        message: 'Already shortlisted',
        shortlist: { favoriteId: favorite.id, favoriteUserId: favorite.favoriteUserId, isShortlisted: true }
      });
    }

    await favorite.update({ isShortlisted: true });

    res.json({
      success: true,
      message: 'Added to shortlist',
      shortlist: { favoriteId: favorite.id, favoriteUserId: favorite.favoriteUserId, isShortlisted: true }
    });
  } catch (err) {
    console.error('Add to shortlist error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/favorites/shortlist/remove - body: { userId, profileId }
 * Remove a profile from shortlist (stays in favorites).
 */
export const removeFromShortlist = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;
    const profileId = body.profileId ?? body.favoriteUserId;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required in request body' });
    }
    if (!profileId) {
      return res.status(400).json({ success: false, error: 'profileId (or favoriteUserId) is required in request body' });
    }

    const favorite = await Favorite.findOne({
      where: { userId, favoriteUserId: profileId }
    });

    if (!favorite) {
      return res.status(404).json({ success: false, error: 'Favorite not found' });
    }

    await favorite.update({ isShortlisted: false });

    res.json({
      success: true,
      message: 'Removed from shortlist',
      shortlist: { favoriteId: favorite.id, favoriteUserId: favorite.favoriteUserId, isShortlisted: false }
    });
  } catch (err) {
    console.error('Remove from shortlist error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/favorites/shortlist/list - body: { userId, page?, limit? }
 * List only shortlisted profiles (subset of favorites, with profile data).
 */
export const listMyShortlist = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;
    const page = Math.max(1, parseInt(body.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(body.limit, 10) || 20));
    const offset = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required in request body'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { count, rows: favorites } = await Favorite.findAndCountAll({
      where: { userId, isShortlisted: true },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'favoriteProfile',
          attributes: FAVORITE_PROFILE_ATTRIBUTES,
          required: true
        }
      ]
    });

    const data = favorites.map((f) => ({
      addedAt: f.createdAt,
      favoriteId: f.id,
      profile: f.favoriteProfile ? f.favoriteProfile.toJSON() : null
    }));

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data,
      pagination: { page, limit, total: count, totalPages }
    });
  } catch (err) {
    console.error('List my shortlist error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
