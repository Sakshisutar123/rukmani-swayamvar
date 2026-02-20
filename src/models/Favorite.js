import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  favoriteUserId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  isShortlisted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'user_favorites',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['favoriteUserId'] },
    { unique: true, fields: ['userId', 'favoriteUserId'] },
    { fields: ['userId', 'isShortlisted'] }
  ]
});

Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Favorite.belongsTo(User, { foreignKey: 'favoriteUserId', as: 'favoriteProfile' });

export default Favorite;
