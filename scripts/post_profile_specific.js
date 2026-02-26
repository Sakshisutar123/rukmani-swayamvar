
import { sequelize } from '../src/config/database.js';
import fetch from 'node-fetch';

(async () => {
  try {
    await sequelize.authenticate();

    const body = {
    "userId": "e1723c6c-a4e7-4926-b972-ceca92289e05",
    "phone": "+919876543210",
    "fullName": "John Doe",
    "whoUses": "self",
    "gender": "Male",
    "dateOfBirth": "1995-01-01",
    "age": 28,
    "height": 175.5,
    "weight": 72.0,
    "skinTone": "Wheatish",
    "doSmoke": false,
    "doDrink": false,
    "diet": "Vegetarian",
    "religion": "Hindu",
    "caste": "Marathi",
    "subCaste": "",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "address": "123 Example Street",
    "profession": "Software Engineer",
    "occupation": "Developer",
    "education": "B.Tech",
    "workExperience": 5,
    "income": 1200000,
    "companyName": "Acme Corp",
    "workLocation": "Mumbai",
    "maritalStatus": "Single",
    "haveChildren": false,
    "motherTongue": "Marathi",
    "manglikStatus": "No",
    "aboutMe": "Short bio here",
    "familyStatus": "Middle class",
    "familyValues": "Traditional",
    "familyType": "Nuclear",
    "familyIncome": 500000,
    "motherOccupation": "Teacher",
    "fatherOccupation": "Retired",
    "profilePicture": "",
    "bio": "Profile bio text"
    };

    const res = await fetch('http://localhost:5000/api/auth/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    console.log('HTTP', res.status);
    console.log(text);

    const [rows] = await sequelize.query(`SELECT * FROM users WHERE id = '${body.userId}' LIMIT 1;`);
    console.log('DB row:', JSON.stringify(rows[0], null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
