import { sequelize } from '../src/config/database.js';

(async () => {
  try {
    await sequelize.authenticate();

    // Try to find a registered user; fallback to any user
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
      fullName: 'Test User',
      phone: '+911234567890',
      whoUses: 'self',
      gender: 'Other',
      dateOfBirth: '1990-01-01',
      age: 36,
      height: 165.5,
      weight: 65.2,
      skinTone: 'Fair',
      doSmoke: false,
      doDrink: false,
      diet: 'Vegetarian',
      religion: 'Hindu',
      caste: 'TestCaste',
      subCaste: 'Sub',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      address: 'Test address',
      profession: 'Engineer',
      occupation: 'Software Engineer',
      education: 'B.Tech',
      workExperience: 5,
      income: 1200000,
      companyName: 'Acme',
      workLocation: 'Mumbai',
      maritalStatus: 'Single',
      haveChildren: false,
      motherTongue: 'Marathi',
      manglikStatus: 'No',
      aboutMe: 'Automated test profile',
      familyStatus: 'Middle class',
      familyValues: 'Traditional',
      familyType: 'Nuclear',
      familyIncome: 500000,
      motherOccupation: 'Teacher',
      fatherOccupation: 'Retired',
      profilePicture: null,
      bio: 'Bio text'
    };

    const res = await fetch('http://localhost:5000/api/auth/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    console.log('HTTP', res.status);
    console.log(text);
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err.message || err);
    process.exit(1);
  }
})();
