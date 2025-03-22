const config = require('./config.json');
const dotenv = require('dotenv');

dotenv.config();

/**
 * データベース設定
 * 
 * 環境ごとに異なるデータベースを使用し、それぞれ環境変数で上書き可能
 * 
 * 優先順位:
 * 1. 環境に関わらず常に特定のDBを使用する場合: DB_NAME
 * 2. 環境ごとの専用環境変数: DEV_DB_NAME, TEST_DB_NAME, PROD_DB_NAME
 * 3. config.jsonの設定値
 */
module.exports = {
  development: {
    username: process.env.DB_USER || config.development.username,
    password: process.env.DB_PASSWORD || config.development.password,
    database: process.env.DB_NAME || process.env.DEV_DB_NAME || config.development.database,
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
    username: process.env.TEST_DB_USER || process.env.DB_USER || config.test.username,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || config.test.password,
    database: process.env.DB_NAME || process.env.TEST_DB_NAME || config.test.database,
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || config.test.host,
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
    username: process.env.PROD_DB_USER || process.env.DB_USER || config.production.username,
    password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD || config.production.password,
    database: process.env.DB_NAME || process.env.PROD_DB_NAME || config.production.database,
    host: process.env.PROD_DB_HOST || process.env.DB_HOST || config.production.host,
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