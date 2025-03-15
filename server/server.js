// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェア
// CORSの詳細設定
app.use(
  cors({
    origin: "*", // 開発中は全てのオリジンを許可。本番環境では'http://localhost:3000'など具体的に設定
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// CORSのプリフライトリクエスト対応
app.options("*", cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// データベース接続
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "server_inspector",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "server_inspection_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// テスト用エンドポイント
app.get("/", (req, res) => {
  res.json({ message: "サーバー点検管理システムAPIへようこそ" });
});

// 顧客関連のAPIエンドポイント
// 顧客一覧取得
app.get("/api/customers", async (req, res) => {
  try {
    const [rows] = await pool
      .promise()
      .query("SELECT * FROM customers ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("顧客一覧取得エラー:", err);
    res.status(500).json({ error: "顧客データの取得に失敗しました" });
  }
});

// 顧客詳細取得
app.get("/api/customers/:id", async (req, res) => {
  try {
    const [rows] = await pool
      .promise()
      .query("SELECT * FROM customers WHERE id = ?", [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "顧客が見つかりません" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(`顧客ID:${req.params.id}の取得エラー:`, err);
    res.status(500).json({ error: "顧客データの取得に失敗しました" });
  }
});

// 顧客作成
app.post("/api/customers", async (req, res) => {
  try {
    console.log("受信したリクエストボディ:", req.body);
    const { customer_name } = req.body;

    if (!customer_name) {
      console.log("顧客名が提供されていません");
      return res.status(400).json({ error: "顧客名は必須です" });
    }

    console.log("挿入しようとしている顧客名:", customer_name);

    const [result] = await pool
      .promise()
      .query("INSERT INTO customers (customer_name) VALUES (?)", [
        customer_name,
      ]);

    console.log("挿入結果:", result);

    res.status(201).json({
      id: result.insertId,
      customer_name,
      created_at: new Date(),
    });
  } catch (err) {
    console.error("顧客作成エラーの詳細:", err);
    res.status(500).json({ error: "顧客の作成に失敗しました" });
  }
});

// 顧客更新
app.put("/api/customers/:id", async (req, res) => {
  try {
    const { customer_name } = req.body;

    if (!customer_name) {
      return res.status(400).json({ error: "顧客名は必須です" });
    }

    const [result] = await pool
      .promise()
      .query("UPDATE customers SET customer_name = ? WHERE id = ?", [
        customer_name,
        req.params.id,
      ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "顧客が見つかりません" });
    }

    res.json({ id: req.params.id, customer_name });
  } catch (err) {
    console.error(`顧客ID:${req.params.id}の更新エラー:`, err);
    res.status(500).json({ error: "顧客の更新に失敗しました" });
  }
});

// 顧客削除
app.delete("/api/customers/:id", async (req, res) => {
  try {
    const [result] = await pool
      .promise()
      .query("DELETE FROM customers WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "顧客が見つかりません" });
    }

    res.json({ message: "顧客が削除されました" });
  } catch (err) {
    console.error(`顧客ID:${req.params.id}の削除エラー:`, err);
    res.status(500).json({ error: "顧客の削除に失敗しました" });
  }
});

// サーバー起動
const server = app.listen(PORT, "0.0.0.0", () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log(`サーバーが起動しました: http://${host}:${port}`);
  console.log("全てのネットワークインターフェースでリッスン中");
});

// データベース接続テスト
pool.getConnection((err, connection) => {
  if (err) {
    console.error("データベース接続エラー:", err);
  } else {
    console.log("データベースに正常に接続されました");
    connection.release();
  }
});

// server.js に追加、もしくは適切なルーターファイルに追加

// 機器一覧取得
app.get("/api/devices", async (req, res) => {
  try {
    const [rows] = await pool.promise().query(`
      SELECT d.*, c.customer_name 
      FROM devices d
      JOIN customers c ON d.customer_id = c.id
      ORDER BY d.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("機器一覧取得エラー:", err);
    res.status(500).json({ error: "機器データの取得に失敗しました" });
  }
});

// 機器詳細取得
app.get("/api/devices/:id", async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      `
      SELECT d.*, c.customer_name 
      FROM devices d
      JOIN customers c ON d.customer_id = c.id
      WHERE d.id = ?
    `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "機器が見つかりません" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(`機器ID:${req.params.id}の取得エラー:`, err);
    res.status(500).json({ error: "機器データの取得に失敗しました" });
  }
});

// 顧客に紐づく機器一覧取得
app.get("/api/customers/:customerId/devices", async (req, res) => {
  try {
    const [rows] = await pool
      .promise()
      .query("SELECT * FROM devices WHERE customer_id = ? ORDER BY id DESC", [
        req.params.customerId,
      ]);
    res.json(rows);
  } catch (err) {
    console.error(`顧客ID:${req.params.customerId}の機器一覧取得エラー:`, err);
    res.status(500).json({ error: "機器データの取得に失敗しました" });
  }
});

// 機器作成
app.post("/api/devices", async (req, res) => {
  try {
    const {
      customer_id,
      device_name,
      model,
      location,
      device_type,
      hardware_type,
    } = req.body;

    if (!customer_id || !device_name || !device_type || !hardware_type) {
      return res.status(400).json({
        error: "顧客ID、機器名、機器種別、ハードウェアタイプは必須です",
      });
    }

    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO devices (customer_id, device_name, model, location, device_type, hardware_type) VALUES (?, ?, ?, ?, ?, ?)",
        [customer_id, device_name, model, location, device_type, hardware_type]
      );

    res.status(201).json({
      id: result.insertId,
      customer_id,
      device_name,
      model,
      location,
      device_type,
      hardware_type,
    });
  } catch (err) {
    console.error("機器作成エラー:", err);
    res.status(500).json({ error: "機器の作成に失敗しました" });
  }
});

// 機器更新
app.put("/api/devices/:id", async (req, res) => {
  try {
    const { device_name, model, location, device_type, hardware_type } =
      req.body;

    if (!device_name || !device_type || !hardware_type) {
      return res
        .status(400)
        .json({ error: "機器名、機器種別、ハードウェアタイプは必須です" });
    }

    const [result] = await pool
      .promise()
      .query(
        "UPDATE devices SET device_name = ?, model = ?, location = ?, device_type = ?, hardware_type = ? WHERE id = ?",
        [
          device_name,
          model,
          location,
          device_type,
          hardware_type,
          req.params.id,
        ]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "機器が見つかりません" });
    }

    res.json({
      id: parseInt(req.params.id),
      device_name,
      model,
      location,
      device_type,
      hardware_type,
    });
  } catch (err) {
    console.error(`機器ID:${req.params.id}の更新エラー:`, err);
    res.status(500).json({ error: "機器の更新に失敗しました" });
  }
});

// 機器削除
app.delete("/api/devices/:id", async (req, res) => {
  try {
    const [result] = await pool
      .promise()
      .query("DELETE FROM devices WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "機器が見つかりません" });
    }

    res.json({ message: "機器が削除されました" });
  } catch (err) {
    console.error(`機器ID:${req.params.id}の削除エラー:`, err);
    res.status(500).json({ error: "機器の削除に失敗しました" });
  }
});

// 点検項目マスタ関連のAPI

// 点検項目一覧取得
app.get("/api/inspection-items", async (req, res) => {
  try {
    const [rows] = await pool.promise().query(`
      SELECT i.*, d.device_name, c.customer_name 
      FROM inspection_items i
      JOIN devices d ON i.device_id = d.id
      JOIN customers c ON d.customer_id = c.id
      ORDER BY i.id
    `);
    res.json(rows);
  } catch (err) {
    console.error("点検項目一覧取得エラー:", err);
    res.status(500).json({ error: "点検項目データの取得に失敗しました" });
  }
});

// 機器ごとの点検項目取得
app.get("/api/devices/:deviceId/inspection-items", async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      `
      SELECT * FROM inspection_items 
      WHERE device_id = ?
      ORDER BY id
    `,
      [req.params.deviceId]
    );
    res.json(rows);
  } catch (err) {
    console.error("機器別点検項目取得エラー:", err);
    res.status(500).json({ error: "点検項目データの取得に失敗しました" });
  }
});

// 点検項目作成
app.post("/api/inspection-items", async (req, res) => {
  try {
    const { device_id, item_name } = req.body;

    if (!device_id || !item_name) {
      return res.status(400).json({ error: "機器IDと項目名は必須です" });
    }

    const [result] = await pool
      .promise()
      .query(
        "INSERT INTO inspection_items (device_id, item_name) VALUES (?, ?)",
        [device_id, item_name]
      );

    res.status(201).json({
      id: result.insertId,
      device_id,
      item_name,
      created_at: new Date(),
    });
  } catch (err) {
    console.error("点検項目作成エラー:", err);
    res.status(500).json({ error: "点検項目の作成に失敗しました" });
  }
});

// 点検一覧取得
app.get("/api/inspections", async (req, res) => {
  try {
    const [rows] = await pool.promise().query(`
      SELECT i.*, ir.device_id, d.device_name, c.customer_name 
      FROM inspections i
      JOIN inspection_results ir ON i.id = ir.inspection_id
      JOIN devices d ON ir.device_id = d.id
      JOIN customers c ON d.customer_id = c.id
      GROUP BY i.id
      ORDER BY i.inspection_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("点検一覧取得エラー:", err);
    res.status(500).json({ error: "点検データの取得に失敗しました" });
  }
});

// 点検詳細取得
app.get("/api/inspections/:id", async (req, res) => {
  try {
    // 点検基本情報を取得
    const [inspections] = await pool.promise().query(
      `
      SELECT i.* 
      FROM inspections i
      WHERE i.id = ?
    `,
      [req.params.id]
    );

    if (inspections.length === 0) {
      return res.status(404).json({ error: "点検データが見つかりません" });
    }

    // 点検結果の詳細を取得
    const [results] = await pool.promise().query(
      `
      SELECT ir.*, d.device_name 
      FROM inspection_results ir
      JOIN devices d ON ir.device_id = d.id
      WHERE ir.inspection_id = ?
      ORDER BY ir.id
    `,
      [req.params.id]
    );

    // 点検データと結果をまとめて返す
    const inspectionData = {
      ...inspections[0],
      results,
    };

    res.json(inspectionData);
  } catch (err) {
    console.error(`点検ID:${req.params.id}の取得エラー:`, err);
    res.status(500).json({ error: "点検データの取得に失敗しました" });
  }
});

// 機器ごとの点検履歴取得
app.get("/api/devices/:deviceId/inspections", async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      `
      SELECT i.*, ir.device_id, d.device_name 
      FROM inspections i
      JOIN inspection_results ir ON i.id = ir.inspection_id
      JOIN devices d ON ir.device_id = d.id
      WHERE ir.device_id = ?
      GROUP BY i.id
      ORDER BY i.inspection_date DESC
    `,
      [req.params.deviceId]
    );

    res.json(rows);
  } catch (err) {
    console.error(`機器ID:${req.params.deviceId}の点検履歴取得エラー:`, err);
    res.status(500).json({ error: "点検履歴の取得に失敗しました" });
  }
});

// 点検作成
app.post("/api/inspections", async (req, res) => {
  try {
    const { inspection_date, start_time, end_time, inspector_name, results } =
      req.body;

    if (
      !inspection_date ||
      !inspector_name ||
      !results ||
      !Array.isArray(results) ||
      results.length === 0
    ) {
      return res.status(400).json({
        error: "点検日、点検者名、および少なくとも1つの点検結果は必須です",
      });
    }

    // トランザクション開始
    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {
      // 点検基本情報を登録
      const [inspection] = await connection.query(
        "INSERT INTO inspections (inspection_date, start_time, end_time, inspector_name) VALUES (?, ?, ?, ?)",
        [inspection_date, start_time || null, end_time || null, inspector_name]
      );

      const inspectionId = inspection.insertId;

      // 点検結果を登録
      for (const result of results) {
        if (!result.device_id || !result.check_item || !result.status) {
          throw new Error("点検結果には機器ID、確認項目、ステータスが必要です");
        }

        await connection.query(
          "INSERT INTO inspection_results (inspection_id, device_id, check_item, status) VALUES (?, ?, ?, ?)",
          [inspectionId, result.device_id, result.check_item, result.status]
        );
      }

      // トランザクションをコミット
      await connection.commit();

      res.status(201).json({
        id: inspectionId,
        inspection_date,
        start_time,
        end_time,
        inspector_name,
        results,
      });
    } catch (err) {
      // エラー発生時はロールバック
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("点検作成エラー:", err);
    res.status(500).json({ error: "点検の作成に失敗しました: " + err.message });
  }
});

// 点検更新
app.put("/api/inspections/:id", async (req, res) => {
  try {
    const { inspection_date, start_time, end_time, inspector_name, results } =
      req.body;

    if (!inspection_date || !inspector_name) {
      return res.status(400).json({ error: "点検日、点検者名は必須です" });
    }

    // トランザクション開始
    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {
      // 点検基本情報を更新
      const [result] = await connection.query(
        "UPDATE inspections SET inspection_date = ?, start_time = ?, end_time = ?, inspector_name = ? WHERE id = ?",
        [
          inspection_date,
          start_time || null,
          end_time || null,
          inspector_name,
          req.params.id,
        ]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: "点検データが見つかりません" });
      }

      // 既存の点検結果を削除
      await connection.query(
        "DELETE FROM inspection_results WHERE inspection_id = ?",
        [req.params.id]
      );

      // 新しい点検結果を登録
      if (results && Array.isArray(results) && results.length > 0) {
        for (const result of results) {
          if (!result.device_id || !result.check_item || !result.status) {
            throw new Error(
              "点検結果には機器ID、確認項目、ステータスが必要です"
            );
          }

          await connection.query(
            "INSERT INTO inspection_results (inspection_id, device_id, check_item, status) VALUES (?, ?, ?, ?)",
            [req.params.id, result.device_id, result.check_item, result.status]
          );
        }
      }

      // トランザクションをコミット
      await connection.commit();

      res.json({
        id: parseInt(req.params.id),
        inspection_date,
        start_time,
        end_time,
        inspector_name,
        results: results || [],
      });
    } catch (err) {
      // エラー発生時はロールバック
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(`点検ID:${req.params.id}の更新エラー:`, err);
    res.status(500).json({ error: "点検の更新に失敗しました: " + err.message });
  }
});

// 点検削除
app.delete("/api/inspections/:id", async (req, res) => {
  try {
    // トランザクション開始
    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {
      // 関連する点検結果を削除
      await connection.query(
        "DELETE FROM inspection_results WHERE inspection_id = ?",
        [req.params.id]
      );

      // 点検基本情報を削除
      const [result] = await connection.query(
        "DELETE FROM inspections WHERE id = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: "点検データが見つかりません" });
      }

      // トランザクションをコミット
      await connection.commit();

      res.json({ message: "点検データが削除されました" });
    } catch (err) {
      // エラー発生時はロールバック
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(`点検ID:${req.params.id}の削除エラー:`, err);
    res.status(500).json({ error: "点検の削除に失敗しました" });
  }
});
