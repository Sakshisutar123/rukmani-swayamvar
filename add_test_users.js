import User from './src/models/User.js';
import { sequelize } from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function addTestUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const users = [
      { uniqueId: 'student001', fullName: 'John Doe', email: 'john@example.com', phone: '9876543210' },
      { uniqueId: 'student002', fullName: 'Jane Smith', email: 'jane@example.com', phone: '9876543211' },
      { uniqueId: 'student003', fullName: 'Bob Wilson', email: 'bob@example.com', phone: '9876543212' }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ where: { uniqueId: userData.uniqueId } });
      if (!existingUser) {
        await User.create(userData);
        console.log(`✅ Added user: ${userData.uniqueId}`);
      } else {
        console.log(`⚠️  User already exists: ${userData.uniqueId}`);
      }
    }

    console.log('✅ Test users added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTestUsers();
