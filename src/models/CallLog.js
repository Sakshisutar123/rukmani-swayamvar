import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';

const CallLog = sequelize.define('CallLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  channelId: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  callerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  calleeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('voice', 'video'),
    allowNull: false,
    defaultValue: 'voice'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'call_logs',
  timestamps: true,
  indexes: [
    { fields: ['callerId'] },
    { fields: ['calleeId'] },
    { fields: ['channelId'] },
    { fields: ['startedAt'] }
  ]
});

CallLog.belongsTo(User, { foreignKey: 'callerId', as: 'caller' });
CallLog.belongsTo(User, { foreignKey: 'calleeId', as: 'callee' });

export default CallLog;
