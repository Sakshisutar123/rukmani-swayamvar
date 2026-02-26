'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('messages');
    const hasReceiverId = table.receiverId !== undefined || table.receiverid !== undefined;
    if (!hasReceiverId) {
      await queryInterface.addColumn('messages', 'receiverId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });

      const [rows] = await queryInterface.sequelize.query(
        `SELECT m.id, m."conversationId", m."senderId", c."user1Id", c."user2Id"
         FROM messages m
         JOIN conversations c ON c.id = m."conversationId"
         WHERE m."receiverId" IS NULL`
      );
      for (const row of rows) {
        const receiverId = row.senderId === row.user1Id ? row.user2Id : row.user1Id;
        await queryInterface.sequelize.query(
          `UPDATE messages SET "receiverId" = :receiverId WHERE id = :id`,
          { replacements: { receiverId, id: row.id } }
        );
      }

      await queryInterface.changeColumn('messages', 'receiverId', {
        type: Sequelize.UUID,
        allowNull: false
      });
      try {
        await queryInterface.addIndex('messages', ['receiverId']);
      } catch (err) {
        if (err.message && !err.message.includes('Duplicate key name')) throw err;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('messages');
    const hasReceiverId = table.receiverId !== undefined || table.receiverid !== undefined;
    if (hasReceiverId) {
      try {
        await queryInterface.removeIndex('messages', ['receiverId']);
      } catch (_) {}
      await queryInterface.removeColumn('messages', 'receiverId');
    }
  }
};
