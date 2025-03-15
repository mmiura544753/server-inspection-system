// src/services/api.js
import axios from "axios";

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// サーバーの実際のIPアドレスとポートを指定
// デバッグ用
console.log("環境変数から読み込まれた API URL:", process.env.REACT_APP_API_URL);

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// さらにデバッグ用
console.log("使用する API URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// デバッグログを追加
console.log("API Base URL:", API_BASE_URL);

// 顧客関連のAPI
export const customerAPI = {
  // 顧客一覧を取得
  getAll: async () => {
    try {
      const response = await api.get("/customers");
      return response.data;
    } catch (error) {
      console.error("顧客一覧取得エラー:", error);
      throw error;
    }
  },

  // 顧客詳細を取得
  getById: async (id) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`顧客ID:${id}の取得エラー:`, error);
      throw error;
    }
  },

  // 顧客を新規作成
  create: async (customerData) => {
    try {
      console.log("API呼び出し - 顧客作成:", customerData);
      console.log("使用URL:", `${API_BASE_URL}/customers`);

      const response = await api.post("/customers", customerData);
      console.log("API応答:", response);

      return response.data;
    } catch (error) {
      console.error("顧客作成エラー（詳細）:", error);
      if (error.response) {
        console.error("サーバーレスポンス:", error.response.data);
        console.error("ステータスコード:", error.response.status);
      }
      throw error;
    }
  },

  // 顧客を更新
  update: async (id, customerData) => {
    try {
      const response = await api.put(`/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      console.error(`顧客ID:${id}の更新エラー:`, error);
      throw error;
    }
  },

  // 顧客を削除
  delete: async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`顧客ID:${id}の削除エラー:`, error);
      throw error;
    }
  },
};

// src/services/api.js に追加

// 機器関連のAPI
export const deviceAPI = {
  // 機器一覧を取得
  getAll: async () => {
    try {
      const response = await api.get("/devices");
      return response.data;
    } catch (error) {
      console.error("機器一覧取得エラー:", error);
      throw error;
    }
  },

  // 機器詳細を取得
  getById: async (id) => {
    try {
      const response = await api.get(`/devices/${id}`);
      return response.data;
    } catch (error) {
      console.error(`機器ID:${id}の取得エラー:`, error);
      throw error;
    }
  },

  // 顧客に紐づく機器一覧を取得
  getByCustomerId: async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}/devices`);
      return response.data;
    } catch (error) {
      console.error(`顧客ID:${customerId}の機器一覧取得エラー:`, error);
      throw error;
    }
  },

  // 機器を新規作成
  create: async (deviceData) => {
    try {
      const response = await api.post("/devices", deviceData);
      return response.data;
    } catch (error) {
      console.error("機器作成エラー:", error);
      throw error;
    }
  },

  // 機器を更新
  update: async (id, deviceData) => {
    try {
      const response = await api.put(`/devices/${id}`, deviceData);
      return response.data;
    } catch (error) {
      console.error(`機器ID:${id}の更新エラー:`, error);
      throw error;
    }
  },

  // 機器を削除
  delete: async (id) => {
    try {
      const response = await api.delete(`/devices/${id}`);
      return response.data;
    } catch (error) {
      console.error(`機器ID:${id}の削除エラー:`, error);
      throw error;
    }
  },
};

// src/services/api.js に追加

// 点検関連のAPI
export const inspectionAPI = {
  // 点検一覧を取得
  getAll: async () => {
    try {
      const response = await api.get("/inspections");
      return response.data;
    } catch (error) {
      console.error("点検一覧取得エラー:", error);
      throw error;
    }
  },

  // 点検詳細を取得
  getById: async (id) => {
    try {
      const response = await api.get(`/inspections/${id}`);
      return response.data;
    } catch (error) {
      console.error(`点検ID:${id}の取得エラー:`, error);
      throw error;
    }
  },

  // 機器ごとの点検履歴を取得
  getByDeviceId: async (deviceId) => {
    try {
      const response = await api.get(`/devices/${deviceId}/inspections`);
      return response.data;
    } catch (error) {
      console.error(`機器ID:${deviceId}の点検履歴取得エラー:`, error);
      throw error;
    }
  },

  // 点検を新規作成
  create: async (inspectionData) => {
    try {
      const response = await api.post("/inspections", inspectionData);
      return response.data;
    } catch (error) {
      console.error("点検作成エラー:", error);
      throw error;
    }
  },

  // 点検を更新
  update: async (id, inspectionData) => {
    try {
      const response = await api.put(`/inspections/${id}`, inspectionData);
      return response.data;
    } catch (error) {
      console.error(`点検ID:${id}の更新エラー:`, error);
      throw error;
    }
  },

  // 点検を削除
  delete: async (id) => {
    try {
      const response = await api.delete(`/inspections/${id}`);
      return response.data;
    } catch (error) {
      console.error(`点検ID:${id}の削除エラー:`, error);
      throw error;
    }
  },
};

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

// 点検作業のAPI（修正）

// 点検作業作成
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
        if (!result.inspection_item_id || !result.status) {
          throw new Error("点検結果には点検項目IDとステータスが必要です");
        }

        await connection.query(
          "INSERT INTO inspection_results (inspection_id, device_id, inspection_item_id, check_item, status) VALUES (?, ?, ?, ?, ?)",
          [
            inspectionId,
            result.device_id,
            result.inspection_item_id,
            result.check_item,
            result.status,
          ]
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
    console.error("点検作業作成エラー:", err);
    res
      .status(500)
      .json({ error: "点検作業の作成に失敗しました: " + err.message });
  }
});

// 点検詳細取得（修正）
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
      SELECT ir.*, d.device_name, ii.item_name
      FROM inspection_results ir
      JOIN devices d ON ir.device_id = d.id
      LEFT JOIN inspection_items ii ON ir.inspection_item_id = ii.id
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

// 点検項目マスタ関連のAPI
export const inspectionItemAPI = {
  // 点検項目一覧を取得
  getAll: async () => {
    try {
      const response = await api.get("/inspection-items");
      return response.data;
    } catch (error) {
      console.error("点検項目一覧取得エラー:", error);
      throw error;
    }
  },

  // 機器ごとの点検項目を取得
  getByDeviceId: async (deviceId) => {
    try {
      const response = await api.get(`/devices/${deviceId}/inspection-items`);
      return response.data;
    } catch (error) {
      console.error(`機器ID:${deviceId}の点検項目取得エラー:`, error);
      throw error;
    }
  },

  // 点検項目を新規作成
  create: async (itemData) => {
    try {
      const response = await api.post("/inspection-items", itemData);
      return response.data;
    } catch (error) {
      console.error("点検項目作成エラー:", error);
      throw error;
    }
  },
};

export default api;
