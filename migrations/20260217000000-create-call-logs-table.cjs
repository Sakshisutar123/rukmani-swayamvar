'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('call_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      channelId: {
        type: Sequelize.STRING(128),
        allowNull: false,
        comment: 'Agora channel name used for this call'
      },
      callerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      calleeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('voice', 'video'),
        allowNull: false,
        defaultValue: 'voice'
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      endedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      durationSeconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Call duration in seconds (set when call ends)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('call_logs', ['callerId']);
    await queryInterface.addIndex('call_logs', ['calleeId']);
    await queryInterface.addIndex('call_logs', ['channelId']);
    await queryInterface.addIndex('call_logs', ['startedAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('call_logs');
  }
};
