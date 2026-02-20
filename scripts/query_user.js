import { sequelize } from '../src/config/database.js';

(async () => {
  try {
    await sequelize.authenticate();
    const userId = 'e1723c6c-a4e7-4926-b972-ceca92289e05';
    const [rows] = await sequelize.query(`SELECT * FROM users WHERE id = '${userId}' LIMIT 1;`);
    if (!rows || rows.length === 0) {
      console.log('No row found for id:', userId);
      process.exit(0);
    }
    console.log(JSON.stringify(rows[0], null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err.message || err);
    process.exit(1);
  }
})();
