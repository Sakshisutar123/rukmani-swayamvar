'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'users';
    const cols = await queryInterface.describeTable(table);
    if (!Object.prototype.hasOwnProperty.call(cols, 'uniqueId')) return;
    await queryInterface.changeColumn(table, 'uniqueId', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'uniqueId', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
