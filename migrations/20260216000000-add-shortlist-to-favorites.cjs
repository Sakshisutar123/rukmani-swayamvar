'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('user_favorites');
    if (!tableInfo.isShortlisted) {
      await queryInterface.addColumn(
        'user_favorites',
        'isShortlisted',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }
      );
    }

    try {
      await queryInterface.addIndex('user_favorites', ['userId', 'isShortlisted']);
    } catch (err) {
      if (err.name !== 'SequelizeDatabaseError' && !/already exists/i.test(err.message)) throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('user_favorites', ['userId', 'isShortlisted']);
    } catch (err) {
      if (err.name !== 'SequelizeDatabaseError' && !/does not exist/i.test(err.message)) throw err;
    }
    const tableInfo = await queryInterface.describeTable('user_favorites');
    if (tableInfo.isShortlisted) {
      await queryInterface.removeColumn('user_favorites', 'isShortlisted');
    }
  }
};
