// server/config/db.js
const { Sequelize } = require("sequelize");
const config = require('./database');
const path = require('path');
const fs = require('fs');
const { Umzug, SequelizeStorage } = require('umzug');

// 環境を取得
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 使用するデータベース名を決定（優先順位に基づいて）
let databaseName;
if (process.env.DB_NAME) {
  // 明示的に指定されたデータベース名を最優先
  databaseName = process.env.DB_NAME;
} else {
  // 環境ごとに設定されたデータベース名
  switch (env) {
    case 'development':
      databaseName = process.env.DEV_DB_NAME || dbConfig.database;
      break;
    case 'test':
      databaseName = process.env.TEST_DB_NAME || dbConfig.database;
      break;
    case 'production':
      databaseName = process.env.PROD_DB_NAME || dbConfig.database;
      break;
    default:
      databaseName = dbConfig.database;
  }
}

// データベース接続設定
const sequelize = new Sequelize(
  databaseName,
  process.env.DB_USER || dbConfig.username,
  process.env.DB_PASSWORD || dbConfig.password,
  {
    host: process.env.DB_HOST || dbConfig.host,
    port: process.env.DB_PORT || 3306,
    dialect: "mariadb",
    dialectOptions: {
      useUTC: false, // UTCに変換せずにそのまま扱う
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    },
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Umzugマイグレーションの設定
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, '../migrations'),
    params: [sequelize.getQueryInterface(), Sequelize]
  },
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

// データベース接続とマイグレーション
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MariaDBに接続しました (データベース: ${databaseName}, 環境: ${env})`);

    // マイグレーションの自動実行（オプション）
    if (process.env.AUTO_MIGRATE === 'true') {
      console.log("マイグレーションを実行しています...");
      await umzug.up();
      console.log("マイグレーションが完了しました");
    }

    // 開発環境の場合のみ、モデルと一致するようにテーブルを同期（非推奨）
    if (
      process.env.NODE_ENV === "development" &&
      process.env.DB_SYNC === "true"
    ) {
      console.log("警告: データベースのテーブルを同期しています (本番環境では使用しないでください)");
      await sequelize.sync({ alter: true });
      console.log("データベースの同期が完了しました");
    }
  } catch (error) {
    console.error("データベース接続エラー:", error.message);
    process.exit(1);
  }
};

// マイグレーション関数をエクスポート
const runMigrations = async () => {
  try {
    console.log("マイグレーションを実行しています...");
    await umzug.up();
    console.log("マイグレーションが完了しました");
    return true;
  } catch (error) {
    console.error("マイグレーションエラー:", error);
    return false;
  }
};

// ロールバック関数をエクスポート
const rollbackMigration = async () => {
  try {
    console.log("最後のマイグレーションをロールバックしています...");
    await umzug.down();
    console.log("ロールバックが完了しました");
    return true;
  } catch (error) {
    console.error("ロールバックエラー:", error);
    return false;
  }
};

module.exports = { 
  sequelize, 
  connectDB,
  runMigrations,
  rollbackMigration 
};
