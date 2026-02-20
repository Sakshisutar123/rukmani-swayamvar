// Sequelize CLI Configuration (CommonJS)
// This file is used by sequelize-cli for migrations
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'vescript',
    database: process.env.DB_NAME || 'matrimony',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'vescript',
    database: process.env.DB_NAME_TEST || 'matrimony_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    // If DATABASE_URL is provided, parse it
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: process.env.DATABASE_URL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    // Fallback to individual env vars if DATABASE_URL not set
    ...(process.env.DATABASE_URL ? {} : {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432
    })
  }
};

