const config = require('./config.json');
const dotenv = require('dotenv');

dotenv.config();

// 環境変数からオーバーライドする可能性を追加
module.exports = {
  development: {
    username: process.env.DB_USER || config.development.username,
    password: process.env.DB_PASSWORD || config.development.password,
    database: process.env.DB_NAME || config.development.database,
    host: process.env.DB_HOST || config.development.host,
    dialect: 'mariadb',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    },
    define: {
      timestamps: true,
      underscored: true
    }
  },
  test: {
    username: process.env.TEST_DB_USER || config.test.username,
    password: process.env.TEST_DB_PASSWORD || config.test.password,
    database: process.env.TEST_DB_NAME || config.test.database,
    host: process.env.TEST_DB_HOST || config.test.host,
    dialect: 'mariadb',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    },
    define: {
      timestamps: true,
      underscored: true
    }
  },
  production: {
    username: process.env.PROD_DB_USER || config.production.username,
    password: process.env.PROD_DB_PASSWORD || config.production.password,
    database: process.env.PROD_DB_NAME || config.production.database,
    host: process.env.PROD_DB_HOST || config.production.host,
    dialect: 'mariadb',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
};