import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const ConnectionRequest = sequelize.define('ConnectionRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  requestedId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  tableName: 'connection_requests',
  timestamps: true,
  indexes: [
    { fields: ['requesterId'] },
    { fields: ['requestedId'] },
    { unique: true, fields: ['requesterId', 'requestedId'] }
  ]
});

ConnectionRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
ConnectionRequest.belongsTo(User, { foreignKey: 'requestedId', as: 'requested' });

export default ConnectionRequest;
