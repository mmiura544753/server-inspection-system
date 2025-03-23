// server/utils/db.js - SQLクライアント
const mariadb = require("mariadb");
const dotenv = require("dotenv");
const config = require('../config/database');

// 環境変数の読み込み
dotenv.config();

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

// データベース接続プール
const pool = mariadb.createPool({
  host: process.env.DB_HOST || dbConfig.host,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || dbConfig.username,
  password: process.env.DB_PASSWORD || dbConfig.password,
  database: databaseName,
  connectionLimit: 10,
  idleTimeout: 60000, // 接続のアイドルタイムアウト
  timezone: "+09:00",
});

// データベースクエリを実行するヘルパー関数
const query = async (sql, params = []) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // 開発環境でのみSQLログを出力
    if (process.env.NODE_ENV === 'development') {
      console.log(`SQL実行: ${sql}`);
      if (params.length > 0) {
        console.log(`パラメータ: ${JSON.stringify(params)}`);
      }
    }

    const result = await conn.query(sql, params);
    return result;
  } catch (error) {
    console.error("データベースエラー:", error);
    throw error;
  } finally {
    if (conn) {
      conn.release(); // 接続をプールに返却
    }
  }
};

// 単一行を取得するヘルパー関数
const queryOne = async (sql, params = []) => {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
};

// データベース接続のテスト
const testConnection = async () => {
  try {
    const result = await query("SELECT 1 as test");
    console.log("データベース接続成功:", result);
    return true;
  } catch (error) {
    console.error("データベース接続エラー:", error);
    return false;
  }
};

// トランザクション実行ヘルパー
const transaction = async (callback) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const result = await callback(conn);

    await conn.commit();
    return result;
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
        console.error("トランザクションがロールバックされました");
      } catch (rollbackError) {
        console.error("ロールバック中にエラーが発生しました:", rollbackError);
      }
    }
    console.error("トランザクションエラー:", error);
    throw error;
  } finally {
    if (conn) {
      try {
        conn.release();
      } catch (releaseError) {
        console.error("接続のリリース中にエラーが発生しました:", releaseError);
      }
    }
  }
};

module.exports = {
  query,
  queryOne,
  testConnection,
  transaction,
};
