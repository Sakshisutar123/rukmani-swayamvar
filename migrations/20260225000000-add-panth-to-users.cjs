'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'users';
    const cols = await queryInterface.describeTable(table);
    if (!Object.prototype.hasOwnProperty.call(cols, 'panth')) {
      await queryInterface.addColumn(table, 'panth', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'users';
    const cols = await queryInterface.describeTable(table);
    if (Object.prototype.hasOwnProperty.call(cols, 'panth')) {
      await queryInterface.removeColumn(table, 'panth');
    }
  }
};
