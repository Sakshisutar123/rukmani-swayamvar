'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
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

  // Create index on uniqueId
  await queryInterface.addIndex('users', ['uniqueId'], {
    name: 'idx_users_uniqueId',
    unique: true
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('users');
}

