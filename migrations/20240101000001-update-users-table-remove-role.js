'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // Remove role column if it exists
  const tableDescription = await queryInterface.describeTable('users');
  
  if (tableDescription.role) {
    await queryInterface.removeColumn('users', 'role');
  }

  // Add missing columns if they don't exist
  if (!tableDescription.registration_type) {
    await queryInterface.addColumn('users', 'registration_type', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  if (!tableDescription.qualification) {
    await queryInterface.addColumn('users', 'qualification', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  if (!tableDescription.college_name) {
    await queryInterface.addColumn('users', 'college_name', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
}

export async function down(queryInterface, Sequelize) {
  // Add role column back (if needed for rollback)
  const tableDescription = await queryInterface.describeTable('users');
  
  if (!tableDescription.role) {
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('student', 'staff', 'admin'),
      allowNull: true
    });
  }

  // Remove columns (rollback)
  if (tableDescription.registration_type) {
    await queryInterface.removeColumn('users', 'registration_type');
  }

  if (tableDescription.qualification) {
    await queryInterface.removeColumn('users', 'qualification');
  }

  if (tableDescription.college_name) {
    await queryInterface.removeColumn('users', 'college_name');
  }
}

