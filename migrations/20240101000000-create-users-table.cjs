'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      uniqueId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: true
      },
      otp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      otpExpiry: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isRegistered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      registration_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      qualification: {
        type: Sequelize.STRING,
        allowNull: true
      },
      college_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    // uniqueId already has unique: true above, so MySQL/Postgres create the unique index with the table
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};

