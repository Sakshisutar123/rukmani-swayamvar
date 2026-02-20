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
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('Male', 'Female', 'Other'),
        allowNull: true
      },
      dateOfBirth: {
        type: Sequelize.DATE,
        allowNull: true
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      religion: {
        type: Sequelize.STRING,
        allowNull: true
      },
      caste: {
        type: Sequelize.STRING,
        allowNull: true
      },
      subCaste: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: 'India',
        allowNull: true
      },
      profession: {
        type: Sequelize.STRING,
        allowNull: true
      },
      education: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profilePicture: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isRegistered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
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

    // Create indexes for faster queries
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['phone']);
    await queryInterface.addIndex('users', ['isVerified']);
    await queryInterface.addIndex('users', ['isRegistered']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
