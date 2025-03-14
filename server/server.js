// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// データベース接続
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'server_inspector',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'server_inspection_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// テスト用エンドポイント
app.get('/', (req, res) => {
  res.json({ message: 'サーバー点検管理システムAPIへようこそ' });
});

// 顧客関連のAPIエンドポイント
// 顧客一覧取得
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT * FROM customers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('顧客一覧取得エラー:', err);
    res.status(500).json({ error: '顧客データの取得に失敗しました' });
  }
});

// 顧客詳細取得
app.get('/api/customers/:id', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error(`顧客ID:${req.params.id}の取得エラー:`, err);
    res.status(500).json({ error: '顧客データの取得に失敗しました' });
  }
});

// 顧客作成
app.post('/api/customers', async (req, res) => {
  try {
    const { customer_name } = req.body;
    
    if (!customer_name) {
      return res.status(400).json({ error: '顧客名は必須です' });
    }
    
    const [result] = await pool.promise().query(
      'INSERT INTO customers (customer_name) VALUES (?)',
      [customer_name]
    );
    
    res.status(201).json({
      id: result.insertId,
      customer_name,
      created_at: new Date()
    });
  } catch (err) {
    console.error('顧客作成エラー:', err);
    res.status(500).json({ error: '顧客の作成に失敗しました' });
  }
});

// 顧客更新
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { customer_name } = req.body;
    
    if (!customer_name) {
      return res.status(400).json({ error: '顧客名は必須です' });
    }
    
    const [result] = await pool.promise().query(
      'UPDATE customers SET customer_name = ? WHERE id = ?',
      [customer_name, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }
    
    res.json({ id: req.params.id, customer_name });
  } catch (err) {
    console.error(`顧客ID:${req.params.id}の更新エラー:`, err);
    res.status(500).json({ error: '顧客の更新に失敗しました' });
  }
});

// 顧客削除
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const [result] = await pool.promise().query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }
    
    res.json({ message: '顧客が削除されました' });
  } catch (err) {
    console.error(`顧客ID:${req.params.id}の削除エラー:`, err);
    res.status(500).json({ error: '顧客の削除に失敗しました' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

// データベース接続テスト
pool.getConnection((err, connection) => {
  if (err) {
    console.error('データベース接続エラー:', err);
  } else {
    console.log('データベースに正常に接続されました');
    connection.release();
  }
});
