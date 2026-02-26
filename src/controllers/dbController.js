import User from '../models/User.js';
import PartnerPreference from '../models/PartnerPreference.js';
import { sequelize } from '../config/database.js';

// Database diagnostic endpoint
export const checkDatabase = async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Check if users table exists (MySQL: use table_schema = DATABASE())
    const [tableCheck] = await sequelize.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'users'
      ) as table_exists`
    );
    
    const tableExists = !!tableCheck[0]?.table_exists;
    
    let userCount = 0;
    let sampleUsers = [];
    let tableStructure = null;
    
    if (tableExists) {
      // Get user count
      userCount = await User.count();
      
      // Get sample users
      sampleUsers = await User.findAll({
        limit: 5,
        attributes: ['uniqueId', 'fullName', 'email', 'isRegistered'],
        raw: true
      });
      
      // Get table structure (MySQL: use table_schema = DATABASE())
      const [columns] = await sequelize.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_schema = DATABASE() AND table_name = 'users' 
         ORDER BY ordinal_position`
      );
      tableStructure = columns;
    }
    
    res.json({
      status: 'connected',
      database: {
        connected: true,
        tableExists: tableExists,
        userCount: userCount,
        sampleUsers: sampleUsers,
        tableStructure: tableStructure
      },
      recommendations: !tableExists ? [
        'Run: CREATE TABLE users (...)',
        'Or set SYNC_DB=true in environment variables',
        'See migrations/create-users-table-production.sql'
      ] : userCount === 0 ? [
        'Table exists but no users found',
        'Add a user: INSERT INTO users (uniqueId, fullName, email) VALUES (...)'
      ] : ['Database is ready']
    });
  } catch (err) {
    console.error('Database check error:', err);
    res.status(500).json({
      status: 'error',
      error: err.message,
      database: {
        connected: false
      }
    });
  }
};

// Get partner preferences. GET /api/preferences?userId=... or POST (body: { userId })
export const getPartnerPreferences = async (req, res) => {
  try {
    const userId = req.query?.userId ?? req.body?.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required (query or body)'
      });
    }
    const partnerPref = await PartnerPreference.findOne({ where: { userId } });
    if (!partnerPref) {
      return res.json({ success: true, partnerPreferences: null });
    }
    res.json({ success: true, partnerPreferences: partnerPref.toJSON() });
  } catch (err) {
    console.error('Get partner preferences error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Save or update partner preferences. POST /api/preferences with body: { userId, ...prefs }
export const savePartnerPreferences = async (req, res) => {
  try {
    const userId = req.body?.userId;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required in request body (e.g. POST /api/preferences with body: { userId, age_range?, ... })'
      });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { userId: _skip, ...prefs } = body;

    // Trim range values to integers so we never store floats like 175.20397 or 5.56838
    if (prefs.height_range && Array.isArray(prefs.height_range) && prefs.height_range.length >= 2) {
      prefs.height_range = [
        Math.round(Number(prefs.height_range[0])),
        Math.round(Number(prefs.height_range[1]))
      ];
    }
    if (prefs.income_range && Array.isArray(prefs.income_range) && prefs.income_range.length >= 2) {
      prefs.income_range = [
        Math.round(Number(prefs.income_range[0])),
        Math.round(Number(prefs.income_range[1]))
      ];
    }
    if (prefs.age_range && Array.isArray(prefs.age_range) && prefs.age_range.length >= 2) {
      prefs.age_range = [
        Math.round(Number(prefs.age_range[0])),
        Math.round(Number(prefs.age_range[1]))
      ];
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let partnerPref = await PartnerPreference.findOne({ where: { userId } });
    if (partnerPref) {
      await partnerPref.update(prefs);
    } else {
      partnerPref = await PartnerPreference.create({ userId, ...prefs });
    }

    res.json({ success: true, partnerPreferences: partnerPref });
  } catch (err) {
    console.error('Save partner preferences error:', err);
    res.status(500).json({ error: err.message });
  }
};

