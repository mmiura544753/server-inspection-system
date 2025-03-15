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

export default api;
