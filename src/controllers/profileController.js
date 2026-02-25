import User from '../models/User.js';
import PartnerPreference from '../models/PartnerPreference.js';
import Favorite from '../models/Favorite.js';
import { withFullPhotoUrls, parseProfilePictureToPhotos, formatProfilePictureFromPhotos, getFirstPhotoUrl } from '../utils/photoUrl.js';
import { MAX_COUNT } from '../middleware/uploadPhotos.js';
import { Op } from 'sequelize';

/** Attributes to expose in profile listing (exclude sensitive and heavy fields) */
const PROFILE_LIST_ATTRIBUTES = [
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
  'panth',
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

/** All user fields to show in full profile details (exclude passwordHash, otp, otpExpiry) */
const PROFILE_DETAIL_ATTRIBUTES = [
  'id',
  'email',
  'phone',
  'fullName',
  'gender',
  'dateOfBirth',
  'age',
  'height',
  'weight',
  'skinTone',
  'doSmoke',
  'doDrink',
  'diet',
  'religion',
  'caste',
  'subCaste',
  'panth',
  'city',
  'state',
  'country',
  'address',
  'profession',
  'occupation',
  'education',
  'workExperience',
  'income',
  'companyName',
  'workLocation',
  'maritalStatus',
  'profilePicture',
  'bio',
  'aboutMe',
  'whoUses',
  'haveChildren',
  'motherTongue',
  'manglikStatus',
  'familyStatus',
  'familyValues',
  'familyType',
  'familyIncome',
  'motherOccupation',
  'fatherOccupation',
  'isRegistered',
  'isActive',
  'createdAt',
  'updatedAt'
];

/**
 * Normalize range from partner preferences: supports [min, max] or { min, max }.
 * Returns { min, max } or null if invalid.
 */
function parseRange(value) {
  if (value == null) return null;
  if (Array.isArray(value) && value.length >= 2) {
    const min = Number(value[0]);
    const max = Number(value[1]);
    if (!Number.isNaN(min) && !Number.isNaN(max)) return { min, max };
  }
  if (typeof value === 'object' && typeof value.min !== 'undefined' && typeof value.max !== 'undefined') {
    const min = Number(value.min);
    const max = Number(value.max);
    if (!Number.isNaN(min) && !Number.isNaN(max)) return { min, max };
  }
  return null;
}

/**
 * Build Sequelize where conditions from partner preferences.
 * Text fields use case-insensitive partial match (ILIKE) so "Hindu" matches "Hinduism", "Engineer" matches "Software Engineer".
 * Returns { where, appliedFilters } for response metadata.
 */
function buildWhereFromPreferences(prefs, currentUserId, currentUserGender, options = {}) {
  const { includeAllGenders = false } = options;
  const where = {
    id: { [Op.ne]: currentUserId },
    isActive: true,
    isRegistered: true
  };
  const appliedFilters = [];

  // Show only opposite gender (matrimony convention), unless includeAllGenders
  if (!includeAllGenders && currentUserGender && (currentUserGender === 'Male' || currentUserGender === 'Female')) {
    const wantGender = currentUserGender === 'Male' ? 'Female' : 'Male';
    where.gender = wantGender;
    appliedFilters.push({ key: 'gender', value: wantGender });
  }

  if (!prefs) return { where, appliedFilters };

  const ageRange = parseRange(prefs.age_range);
  if (ageRange) {
    where.age = { [Op.and]: [{ [Op.gte]: ageRange.min }, { [Op.lte]: ageRange.max }] };
    appliedFilters.push({ key: 'age', value: `${ageRange.min}-${ageRange.max}` });
  }

  const heightRange = parseRange(prefs.height_range);
  if (heightRange) {
    where.height = { [Op.and]: [{ [Op.gte]: heightRange.min }, { [Op.lte]: heightRange.max }] };
    appliedFilters.push({ key: 'height', value: `${heightRange.min}-${heightRange.max}` });
  }

  const incomeRange = parseRange(prefs.income_range);
  if (incomeRange) {
    where.income = { [Op.and]: [{ [Op.gte]: incomeRange.min }, { [Op.lte]: incomeRange.max }] };
    appliedFilters.push({ key: 'income', value: `${incomeRange.min}-${incomeRange.max}` });
  }

  if (prefs.country_select && Array.isArray(prefs.country_select) && prefs.country_select.length > 0) {
    const countries = prefs.country_select.map((c) => (typeof c === 'string' ? c.trim() : String(c))).filter(Boolean);
    if (countries.length > 0) {
      where.country = { [Op.in]: countries };
      appliedFilters.push({ key: 'country', value: countries });
    }
  }

  const addTextFilter = (prefValue, dbField, filterKey) => {
    if (!prefValue || typeof prefValue !== 'string' || !prefValue.trim()) return;
    const val = prefValue.trim();
    where[dbField] = { [Op.iLike]: `%${val.replace(/%/g, '\\%')}%` };
    appliedFilters.push({ key: filterKey, value: val });
  };

  // maritalStatus is a PostgreSQL ENUM - use exact match (ILIKE not supported on enum)
  if (prefs.marital_status && typeof prefs.marital_status === 'string' && prefs.marital_status.trim()) {
    where.maritalStatus = prefs.marital_status.trim();
    appliedFilters.push({ key: 'marital_status', value: prefs.marital_status.trim() });
  }

  addTextFilter(prefs.religion, 'religion', 'religion');
  addTextFilter(prefs.occupation, 'occupation', 'occupation');
  addTextFilter(prefs.education, 'education', 'education');
  addTextFilter(prefs.mother_tongue, 'motherTongue', 'mother_tongue');

  return { where, appliedFilters };
}

/**
 * POST /api/profiles/all - body: { userId }
 * Lists all user profiles from the users table, excluding the requesting user.
 * Gender filter: female sees only male profiles, male sees only female profiles (matrimony convention).
 */
export const listAllUsers = async (req, res) => {
  try {
    const source = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = source.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required in request body'
      });
    }

    const currentUser = await User.findByPk(userId, { attributes: ['id', 'gender'] });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const where = {
      id: { [Op.ne]: userId }
    };
    // Show only opposite gender: female sees males, male sees females (matrimony convention)
    const gender = currentUser.gender != null ? String(currentUser.gender).trim() : '';
    const genderLower = gender.toLowerCase();
    if (genderLower === 'male') {
      where.gender = 'Female';
    } else if (genderLower === 'female') {
      where.gender = 'Male';
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: PROFILE_LIST_ATTRIBUTES,
      order: [['createdAt', 'DESC']]
    });

    const favRows = await Favorite.findAll({
      where: { userId },
      attributes: ['favoriteUserId', 'isShortlisted']
    });
    const favSet = new Set(favRows.map((f) => f.favoriteUserId));
    const shortlistSet = new Set(favRows.filter((f) => f.isShortlisted).map((f) => f.favoriteUserId));

    const data = rows.map((r) => {
      const row = r.toJSON();
      row.photos = withFullPhotoUrls(parseProfilePictureToPhotos(row.profilePicture));
      row.firstPhotoUrl = getFirstPhotoUrl(row.profilePicture);
      row.isFavorite = favSet.has(row.id);
      row.isShortlisted = shortlistSet.has(row.id);
      return row;
    });

    res.json({
      success: true,
      data,
      total: count
    });
  } catch (err) {
    console.error('List all users error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * POST /api/profiles or POST /api/profiles/list - body: { userId, page?, limit?, includeAllGenders? }
 * Lists profiles that match the given user's partner preferences.
 * Requires userId in body. If no preferences are set, returns empty list with message.
 */
export const listProfilesByPreferences = async (req, res) => {
  try {
    const source = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = source.userId;
    const page = Math.max(1, parseInt(source.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(source.limit, 10) || 20));
    const offset = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required in request body'
      });
    }

    const currentUser = await User.findByPk(userId, {
      attributes: ['id', 'gender']
    });
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const partnerPref = await PartnerPreference.findOne({
      where: { userId }
    });

    if (!partnerPref) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
        filtersApplied: false,
        appliedFilters: [],
        message: 'Set your partner preferences to see matching profiles.'
      });
    }

    const includeAllGenders = source.includeAllGenders === true || source.includeAllGenders === 'true';
    const { where, appliedFilters } = buildWhereFromPreferences(
      partnerPref.toJSON(),
      userId,
      currentUser.gender,
      { includeAllGenders }
    );

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: PROFILE_LIST_ATTRIBUTES,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const favRows = await Favorite.findAll({
      where: { userId },
      attributes: ['favoriteUserId', 'isShortlisted']
    });
    const favSet = new Set(favRows.map((f) => f.favoriteUserId));
    const shortlistSet = new Set(favRows.filter((f) => f.isShortlisted).map((f) => f.favoriteUserId));

    const totalPages = Math.ceil(count / limit);
    const data = rows.map((r) => {
      const row = r.toJSON();
      row.photos = withFullPhotoUrls(parseProfilePictureToPhotos(row.profilePicture));
      row.firstPhotoUrl = getFirstPhotoUrl(row.profilePicture);
      row.isFavorite = favSet.has(row.id);
      row.isShortlisted = shortlistSet.has(row.id);
      return row;
    });

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      },
      filtersApplied: true,
      appliedFilters
    });
  } catch (err) {
    console.error('List profiles by preferences error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * POST /api/profiles/details or POST /api/profiles/get-details
 * Body: { userId }
 * Returns full profile details for the given user (all fields except passwordHash, otp, otpExpiry).
 * Use this to show a user's profile to other users.
 */
export const getProfileDetails = async (req, res) => {
  try {
    const source = req.method === 'POST' && req.body && typeof req.body === 'object' ? req.body : req.query;
    const userId = source.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required (in request body or query)'
      });
    }

    const user = await User.findByPk(userId, {
      attributes: PROFILE_DETAIL_ATTRIBUTES
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const profile = user.toJSON();
    profile.photos = withFullPhotoUrls(parseProfilePictureToPhotos(profile.profilePicture));
    res.json({
      success: true,
      profile
    });
  } catch (err) {
    console.error('Get profile details error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/** Allowed fields for profile update (edit my profile). Excludes id, email, passwordHash, otp, otpExpiry, isVerified, isRegistered, isActive, createdAt, updatedAt. */
const PROFILE_UPDATE_KEYS = [
  'phone', 'fullName', 'gender', 'dateOfBirth', 'age', 'height', 'weight', 'skinTone',
  'doSmoke', 'doDrink', 'diet', 'religion', 'caste', 'subCaste', 'panth', 'city', 'state', 'country', 'address',
  'profession', 'occupation', 'education', 'workExperience', 'income', 'companyName', 'workLocation',
  'maritalStatus', 'haveChildren', 'motherTongue', 'manglikStatus', 'aboutMe', 'familyStatus', 'familyValues',
  'familyType', 'familyIncome', 'motherOccupation', 'fatherOccupation', 'whoUses', 'bio', 'profilePicture'
];

/**
 * POST /api/profiles/me or POST /api/profiles/my-details
 * Body: { userId }
 * Returns full profile details for the current user ("my" profile). Same as get profile details.
 */
export const getMyProfile = getProfileDetails;

/**
 * POST /api/profiles/update or POST /api/profiles/edit
 * Body: { userId, ...profileFields, photoUrls? } - partial update.
 * Optional photoUrls: string[] appends new photos (e.g. add photos later if skipped at creation). Max 5 total.
 */
export const updateMyProfile = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required in request body'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const updateData = {};
    for (const key of PROFILE_UPDATE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updateData[key] = body[key];
      }
    }

    // Optional: add photos when editing (e.g. user skipped photos at creation and adds them later)
    const photoUrls = Array.isArray(body.photoUrls) ? body.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
    if (photoUrls.length > 0) {
      const currentPicture = updateData.profilePicture !== undefined ? updateData.profilePicture : user.profilePicture;
      const existing = parseProfilePictureToPhotos(currentPicture);
      const toAdd = photoUrls.slice(0, Math.max(0, MAX_COUNT - existing.length)).map((u) => u.trim());
      if (toAdd.length > 0) {
        const allNames = existing.map((p) => p.url).concat(toAdd);
        updateData.profilePicture = formatProfilePictureFromPhotos(allNames);
      }
    }

    if (Object.keys(updateData).length === 0) {
      const userJson = user.toJSON();
      const safe = {};
      PROFILE_DETAIL_ATTRIBUTES.forEach((attr) => {
        if (userJson[attr] !== undefined) safe[attr] = userJson[attr];
      });
      safe.photos = withFullPhotoUrls(parseProfilePictureToPhotos(safe.profilePicture));
      return res.json({
        success: true,
        message: 'No fields to update',
        profile: safe
      });
    }

    await user.update(updateData);
    await user.reload();

    const profile = {};
    PROFILE_DETAIL_ATTRIBUTES.forEach((attr) => {
      if (user[attr] !== undefined) profile[attr] = user[attr];
    });
    profile.photos = withFullPhotoUrls(parseProfilePictureToPhotos(profile.profilePicture));

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (err) {
    console.error('Update my profile error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
