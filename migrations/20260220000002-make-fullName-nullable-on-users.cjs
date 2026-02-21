'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'users';
    await queryInterface.changeColumn(table, 'fullName', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'fullName', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
