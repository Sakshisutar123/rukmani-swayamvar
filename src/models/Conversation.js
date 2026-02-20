import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user1Id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  user2Id: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  indexes: [
    { fields: ['user1Id'] },
    { fields: ['user2Id'] },
    { unique: true, fields: ['user1Id', 'user2Id'] }
  ]
});

Conversation.belongsTo(User, { foreignKey: 'user1Id', as: 'user1' });
Conversation.belongsTo(User, { foreignKey: 'user2Id', as: 'user2' });

export default Conversation;
