import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Conversation from './Conversation.js';
import User from './User.js';

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { fields: ['conversationId'] },
    { fields: ['senderId'] },
    { fields: ['receiverId'] },
    { fields: ['conversationId', 'createdAt'] }
  ]
});

Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

export default Message;
