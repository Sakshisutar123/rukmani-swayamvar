import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const User = sequelize.define('User', {
  // Primary Key
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },

  // Authentication & Contact
  email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true 
  },
  phone: { 
    type: DataTypes.STRING, 
    allowNull: true, 
    unique: true 
  },
  passwordHash: { 
    type: DataTypes.STRING 
  },
  
  // OTP Verification
  otp: { 
    type: DataTypes.STRING 
  },
  otpExpiry: { 
    type: DataTypes.DATE 
  },
  isVerified: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  }, // OTP verified
  
  // Personal Information
  fullName: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  gender: { 
    type: DataTypes.ENUM('Male', 'Female', 'Other'), 
    allowNull: true 
  },
  dateOfBirth: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
  age: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },
  height: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  skinTone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  doSmoke: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  doDrink: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  diet: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Religious/Cultural Information
  religion: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  caste: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  subCaste: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  
  // Location Information
  city: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  state: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  country: { 
    type: DataTypes.STRING, 
    defaultValue: 'India',
    allowNull: true 
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Professional & Education Information
  profession: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  occupation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  education: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  workExperience: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  income: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  workLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  maritalStatus: {
    type: DataTypes.ENUM('Single','Married','Divorced','Widowed','Separated'),
    allowNull: true
  },
  
  // Profile Information (comma-separated image names, e.g. "profile_1.jpg,profile_2.jpg")
  profilePicture: { 
    type: DataTypes.STRING(500), 
    allowNull: true 
  },
  bio: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  aboutMe: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  whoUses: {
    type: DataTypes.STRING,
    allowNull: true
  },
  haveChildren: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  motherTongue: {
    type: DataTypes.STRING,
    allowNull: true
  },
  manglikStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  familyStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  familyValues: {
    type: DataTypes.STRING,
    allowNull: true
  },
  familyType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  familyIncome: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  motherOccupation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fatherOccupation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Account Status
  isRegistered: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  }, // Full profile completed
  isActive: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  },
}, {
  timestamps: true,
  tableName: 'users',
});

export default User;
