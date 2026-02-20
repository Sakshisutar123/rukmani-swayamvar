import { sequelize } from '../src/config/database.js';
import fetch from 'node-fetch';

(async () => {
  try {
    await sequelize.authenticate();

    // Find a registered user; fallback to any user
    let [rows] = await sequelize.query("SELECT id FROM users WHERE \"isRegistered\" = true LIMIT 1;");
    let userId;
    if (rows && rows.length) userId = rows[0].id;
    else {
      [rows] = await sequelize.query("SELECT id FROM users LIMIT 1;");
      if (rows && rows.length) userId = rows[0].id;
    }

    if (!userId) {
      console.error('No user found in users table. Create one via /send-otp flow first.');
      process.exit(1);
    }

    const body = {
      userId,
      fullName: 'Sample User 2',
      phone: '+919000111222',
      whoUses: 'self',
      gender: 'Female',
      dateOfBirth: '1992-05-10',
      age: 33,
      height: 162.5,
      weight: 58.0,
      skinTone: 'Fair',
      doSmoke: false,
      doDrink: false,
      diet: 'Non-Vegetarian',
      religion: 'Hindu',
      caste: 'General',
      subCaste: '',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      address: '456 Sample Lane',
      profession: 'Designer',
      occupation: 'UI/UX Designer',
      education: 'M.Des',
      workExperience: 7,
      income: 900000,
      companyName: 'DesignCo',
      workLocation: 'Pune',
      maritalStatus: 'Single',
      haveChildren: false,
      motherTongue: 'Marathi',
      manglikStatus: 'No',
      aboutMe: 'Another automated test profile',
      familyStatus: 'Upper Middle',
      familyValues: 'Moderate',
      familyType: 'Joint',
      familyIncome: 1200000,
      motherOccupation: 'Homemaker',
      fatherOccupation: 'Business',
      profilePicture: '',
      bio: 'Second profile bio'
    };

    const res = await fetch('http://localhost:5000/api/auth/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    console.log('HTTP', res.status);
    console.log(JSON.stringify(json, null, 2));

    // Print the user row from DB
    const [userRows] = await sequelize.query(`SELECT * FROM users WHERE id = '${userId}' LIMIT 1;`);
    console.log('DB row:', JSON.stringify(userRows[0], null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
