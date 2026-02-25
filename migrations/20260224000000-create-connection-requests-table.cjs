'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'connection_requests';
    const tables = await queryInterface.showAllTables();
    const tableExists = Array.isArray(tables) && tables.some((t) => String(t).toLowerCase() === tableName);

    if (!tableExists) {
      await queryInterface.createTable(tableName, {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        requesterId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        requestedId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        status: {
          type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
          allowNull: false,
          defaultValue: 'pending'
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
    }

    const addIndexIfMissing = async (columns, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, columns, options);
      } catch (err) {
        if (err.message && !err.message.includes('already exists')) throw err;
      }
    };

    await addIndexIfMissing(['requesterId']);
    await addIndexIfMissing(['requestedId']);
    await addIndexIfMissing(['requesterId', 'requestedId'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('connection_requests');
  }
};
