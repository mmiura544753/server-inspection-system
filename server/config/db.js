// server/config/db.js
const { Sequelize } = require('sequelize');

// データベース接続設定
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mariadb',
    dialectOptions: {
      timezone: 'Asia/Tokyo',
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
  }
);

// データベース接続テスト
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MariaDBに接続しました');
    
    // 開発環境の場合のみ、モデルと一致するようにテーブルを同期
    if (process.env.NODE_ENV === 'development' && process.env.DB_SYNC === 'true') {
      console.log('データベースのテーブルを同期しています...');
      await sequelize.sync({ alter: true });
      console.log('データベースの同期が完了しました');
    }
  } catch (error) {
    console.error('データベース接続エラー:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
