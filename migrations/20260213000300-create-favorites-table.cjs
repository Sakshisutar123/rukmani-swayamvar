'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_favorites', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      favoriteUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Add indexes only if they don't exist (MySQL may already create them via FK)
    const addIndexIfMissing = async (columns, options = {}) => {
      try {
        await queryInterface.addIndex('user_favorites', columns, options);
      } catch (err) {
        if (err.message && !err.message.includes('Duplicate key name')) throw err;
      }
    };
    await addIndexIfMissing(['userId']);
    await addIndexIfMissing(['favoriteUserId']);
    await addIndexIfMissing(['userId', 'favoriteUserId'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_favorites');
  }
};
