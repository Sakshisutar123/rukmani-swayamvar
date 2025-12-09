import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  uniqueId: { type: DataTypes.STRING, allowNull: false, unique: true },
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  passwordHash: { type: DataTypes.STRING },
  otp: { type: DataTypes.STRING },
  otpExpiry: { type: DataTypes.DATE },
  isRegistered: { type: DataTypes.BOOLEAN, defaultValue: false },
  registration_type: { type: DataTypes.STRING },
  qualification: { type: DataTypes.STRING },
  college_name: { type: DataTypes.STRING },
}, {
  timestamps: true,
  tableName: 'users',
});

export default User;
