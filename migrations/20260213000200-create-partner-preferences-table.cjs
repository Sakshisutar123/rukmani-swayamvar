'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('partner_preferences', {
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
      fields: {
        type: Sequelize.JSON,
        allowNull: true
      },
      age_range: {
        type: Sequelize.JSON,
        allowNull: true
      },
      height_range: {
        type: Sequelize.JSON,
        allowNull: true
      },
      income_range: {
        type: Sequelize.JSON,
        allowNull: true
      },
      country_select: {
        type: Sequelize.JSON,
        allowNull: true
      },
      marital_status: {
        type: Sequelize.STRING,
        allowNull: true
      },
      religion: {
        type: Sequelize.STRING,
        allowNull: true
      },
      occupation: {
        type: Sequelize.STRING,
        allowNull: true
      },
      education: {
        type: Sequelize.STRING,
        allowNull: true
      },
      mother_tongue: {
        type: Sequelize.STRING,
        allowNull: true
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

    try {
      await queryInterface.addIndex('partner_preferences', ['userId']);
    } catch (err) {
      if (err.message && !err.message.includes('Duplicate key name')) throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('partner_preferences');
  }
};
