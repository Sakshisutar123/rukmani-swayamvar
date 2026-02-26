-- Use your database
USE matrimony;

-- 1. users (no foreign keys)
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(255) UNIQUE,
  passwordHash VARCHAR(255),
  otp VARCHAR(255),
  otpExpiry DATETIME,
  isVerified TINYINT(1) DEFAULT 0,
  fullName VARCHAR(255),
  gender ENUM('Male', 'Female', 'Other'),
  dateOfBirth DATE,
  age INT,
  height FLOAT,
  weight FLOAT,
  skinTone VARCHAR(255),
  doSmoke TINYINT(1),
  doDrink TINYINT(1),
  diet VARCHAR(255),
  religion VARCHAR(255),
  caste VARCHAR(255),
  subCaste VARCHAR(255),
  panth VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255) DEFAULT 'India',
  address VARCHAR(255),
  profession VARCHAR(255),
  occupation VARCHAR(255),
  education VARCHAR(255),
  workExperience INT,
  income INT,
  companyName VARCHAR(255),
  workLocation VARCHAR(255),
  maritalStatus ENUM('Single','Married','Divorced','Widowed','Separated'),
  profilePicture VARCHAR(500),
  bio TEXT,
  aboutMe TEXT,
  whoUses VARCHAR(255),
  haveChildren TINYINT(1),
  motherTongue VARCHAR(255),
  manglikStatus VARCHAR(255),
  familyStatus VARCHAR(255),
  familyValues VARCHAR(255),
  familyType VARCHAR(255),
  familyIncome INT,
  motherOccupation VARCHAR(255),
  fatherOccupation VARCHAR(255),
  isRegistered TINYINT(1) DEFAULT 0,
  isActive TINYINT(1) DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. partner_preferences
CREATE TABLE IF NOT EXISTS partner_preferences (
  id CHAR(36) PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  fields JSON,
  age_range JSON,
  height_range JSON,
  income_range JSON,
  country_select JSON,
  marital_status VARCHAR(255),
  religion VARCHAR(255),
  occupation VARCHAR(255),
  education VARCHAR(255),
  mother_tongue VARCHAR(255),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY (userId)
);

-- 3. user_favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id CHAR(36) PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  favoriteUserId CHAR(36) NOT NULL,
  isShortlisted TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (userId, favoriteUserId),
  KEY (userId),
  KEY (favoriteUserId),
  KEY (userId, isShortlisted)
);

-- 4. conversations
CREATE TABLE IF NOT EXISTS conversations (
  id CHAR(36) PRIMARY KEY,
  user1Id CHAR(36) NOT NULL,
  user2Id CHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (user1Id, user2Id),
  KEY (user1Id),
  KEY (user2Id)
);

-- 5. messages
CREATE TABLE IF NOT EXISTS messages (
  id CHAR(36) PRIMARY KEY,
  conversationId CHAR(36) NOT NULL,
  senderId CHAR(36) NOT NULL,
  receiverId CHAR(36) NOT NULL,
  content TEXT NOT NULL,
  readAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY (conversationId),
  KEY (senderId),
  KEY (receiverId),
  KEY (conversationId, createdAt)
);

-- 6. call_logs
CREATE TABLE IF NOT EXISTS call_logs (
  id CHAR(36) PRIMARY KEY,
  channelId VARCHAR(128) NOT NULL,
  callerId CHAR(36) NOT NULL,
  calleeId CHAR(36) NOT NULL,
  type ENUM('voice', 'video') NOT NULL DEFAULT 'voice',
  startedAt DATETIME NOT NULL,
  endedAt DATETIME,
  durationSeconds INT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY (callerId),
  KEY (calleeId),
  KEY (channelId),
  KEY (startedAt)
);

-- 7. connection_requests
CREATE TABLE IF NOT EXISTS connection_requests (
  id CHAR(36) PRIMARY KEY,
  requesterId CHAR(36) NOT NULL,
  requestedId CHAR(36) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (requesterId, requestedId),
  KEY (requesterId),
  KEY (requestedId)
);
