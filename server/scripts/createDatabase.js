// server/scripts/createDatabase.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

// 環境を取得（コマンドライン引数から環境を取得可能に）
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const env = envArg ? envArg.split('=')[1] : (process.env.NODE_ENV || 'development');

console.log(`実行環境: ${env}`);

const dbConfig = config[env];

// データベース接続に使用するユーザー情報
const username = process.env.DB_USER || dbConfig.username;
const password = process.env.DB_PASSWORD || dbConfig.password; 
const host = process.env.DB_HOST || dbConfig.host;

// 使用するデータベース名を決定（優先順位に基づいて）
let dbName;
if (process.env.DB_NAME) {
  // 明示的に指定されたデータベース名を最優先
  dbName = process.env.DB_NAME;
} else {
  // 環境ごとに設定されたデータベース名
  switch (env) {
    case 'development':
      dbName = process.env.DEV_DB_NAME || dbConfig.database;
      break;
    case 'test':
      dbName = process.env.TEST_DB_NAME || dbConfig.database;
      break;
    case 'production':
      dbName = process.env.PROD_DB_NAME || dbConfig.database;
      break;
    default:
      dbName = dbConfig.database;
  }
}

// MariaDBに接続（データベース指定なし）
const sequelize = new Sequelize('', username, password, {
  host: host,
  dialect: 'mariadb',
  logging: false
});

async function createDatabase() {
  try {
    // データベースを作成するSQL
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
                         CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
    
    console.log(`データベース '${dbName}' を作成しました（存在しない場合）`);
    
    // 権限設定（必要に応じて）
    console.log(`ユーザー '${username}' に '${dbName}' への権限を付与しています...`);
    await sequelize.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${username}'@'%';`);
    await sequelize.query(`FLUSH PRIVILEGES;`);
    
    console.log('データベースのセットアップが完了しました');
    
  } catch (error) {
    console.error('データベース作成エラー:', error);
  } finally {
    await sequelize.close();
  }
}

// スクリプトの実行
createDatabase();