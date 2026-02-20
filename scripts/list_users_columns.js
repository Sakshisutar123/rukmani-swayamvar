import { sequelize } from '../src/config/database.js';

(async () => {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position;");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('DB query error:', err.message || err);
    process.exit(1);
  }
})();
