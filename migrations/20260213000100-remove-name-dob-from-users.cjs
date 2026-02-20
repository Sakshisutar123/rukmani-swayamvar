'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Safely remove columns if they exist
    const table = 'users';
    const cols = await queryInterface.describeTable(table);
    if (cols.name) {
      await queryInterface.removeColumn(table, 'name');
    }
    if (cols.dob) {
      await queryInterface.removeColumn(table, 'dob');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'users';
    const cols = await queryInterface.describeTable(table);
    if (!cols.name) {
      await queryInterface.addColumn(table, 'name', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!cols.dob) {
      await queryInterface.addColumn(table, 'dob', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  }
};
