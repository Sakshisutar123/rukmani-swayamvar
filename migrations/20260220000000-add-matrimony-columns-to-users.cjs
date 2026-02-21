'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'users';
    const cols = await queryInterface.describeTable(table);
    const has = (name) => Object.prototype.hasOwnProperty.call(cols, name);

    const addIfMissing = async (columnName, definition) => {
      if (!has(columnName)) {
        await queryInterface.addColumn(table, columnName, definition);
      }
    };

    await addIfMissing('isVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    await addIfMissing('gender', {
      type: Sequelize.ENUM('Male', 'Female', 'Other'),
      allowNull: true
    });
    await addIfMissing('dateOfBirth', { type: Sequelize.DATE, allowNull: true });
    await addIfMissing('age', { type: Sequelize.INTEGER, allowNull: true });
    await addIfMissing('height', { type: Sequelize.FLOAT, allowNull: true });
    await addIfMissing('weight', { type: Sequelize.FLOAT, allowNull: true });
    await addIfMissing('skinTone', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('doSmoke', { type: Sequelize.BOOLEAN, allowNull: true });
    await addIfMissing('doDrink', { type: Sequelize.BOOLEAN, allowNull: true });
    await addIfMissing('diet', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('religion', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('caste', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('subCaste', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('city', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('state', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('country', {
      type: Sequelize.STRING,
      defaultValue: 'India',
      allowNull: true
    });
    await addIfMissing('address', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('profession', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('occupation', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('education', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('workExperience', { type: Sequelize.INTEGER, allowNull: true });
    await addIfMissing('income', { type: Sequelize.INTEGER, allowNull: true });
    await addIfMissing('companyName', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('workLocation', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('maritalStatus', {
      type: Sequelize.ENUM('Single', 'Married', 'Divorced', 'Widowed', 'Separated'),
      allowNull: true
    });
    await addIfMissing('profilePicture', { type: Sequelize.STRING(500), allowNull: true });
    await addIfMissing('bio', { type: Sequelize.TEXT, allowNull: true });
    await addIfMissing('aboutMe', { type: Sequelize.TEXT, allowNull: true });
    await addIfMissing('whoUses', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('haveChildren', { type: Sequelize.BOOLEAN, allowNull: true });
    await addIfMissing('motherTongue', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('manglikStatus', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('familyStatus', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('familyValues', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('familyType', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('familyIncome', { type: Sequelize.INTEGER, allowNull: true });
    await addIfMissing('motherOccupation', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('fatherOccupation', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });

    // Make email/phone nullable if app allows (old migration had allowNull: true for both)
    // No change needed if already nullable; uniqueId may exist from old schema - leave as is
  },

  async down(queryInterface, Sequelize) {
    const table = 'users';
    const cols = await queryInterface.describeTable(table);
    const removeIfExists = async (columnName) => {
      if (Object.prototype.hasOwnProperty.call(cols, columnName)) {
        await queryInterface.removeColumn(table, columnName);
      }
    };
    const names = [
      'isVerified', 'gender', 'dateOfBirth', 'age', 'height', 'weight', 'skinTone',
      'doSmoke', 'doDrink', 'diet', 'religion', 'caste', 'subCaste', 'city', 'state',
      'country', 'address', 'profession', 'occupation', 'education', 'workExperience',
      'income', 'companyName', 'workLocation', 'maritalStatus', 'profilePicture', 'bio',
      'aboutMe', 'whoUses', 'haveChildren', 'motherTongue', 'manglikStatus', 'familyStatus',
      'familyValues', 'familyType', 'familyIncome', 'motherOccupation', 'fatherOccupation', 'isActive'
    ];
    for (const name of names) {
      await removeIfExists(name);
    }
  }
};
