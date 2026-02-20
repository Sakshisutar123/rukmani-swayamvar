import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const PartnerPreference = sequelize.define('PartnerPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  fields: {
    type: DataTypes.JSON,
    allowNull: true
  },
  age_range: {
    type: DataTypes.JSON,
    allowNull: true
  },
  height_range: {
    type: DataTypes.JSON,
    allowNull: true
  },
  income_range: {
    type: DataTypes.JSON,
    allowNull: true
  },
  country_select: {
    type: DataTypes.JSON,
    allowNull: true
  },
  marital_status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  religion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  occupation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  education: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mother_tongue: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'partner_preferences',
  timestamps: true
});

PartnerPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default PartnerPreference;
