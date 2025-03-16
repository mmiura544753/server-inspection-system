// server/utils/db.js - SQLクライアント
const mariadb = require('mariadb');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

// データベース接続プール
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'server_inspection_system',
  connectionLimit: 10,
  idleTimeout: 60000, // 接続のアイドルタイムアウト
  timezone: 'Asia/Tokyo' // JSTタイムゾーン
});

// データベースクエリを実行するヘルパー関数
const query = async (sql, params = []) => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log(`SQL実行: ${sql}`);
    if (params.length > 0) {
      console.log(`パラメータ: ${JSON.stringify(params)}`);
    }
    
    const result = await conn.query(sql, params);
    return result;
  } catch (error) {
    console.error('データベースエラー:', error);
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
    const result = await query('SELECT 1 as test');
    console.log('データベース接続成功:', result);
    return true;
  } catch (error) {
    console.error('データベース接続エラー:', error);
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
      await conn.rollback();
    }
    console.error('トランザクションエラー:', error);
    throw error;
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

module.exports = {
  query,
  queryOne,
  testConnection,
  transaction
};
