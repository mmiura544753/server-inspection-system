// src/services/api/inspectionAPI.js
import api from './index';

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

  // 機器の最新点検結果を取得
  getLatestByDeviceId: async (deviceId) => {
    try {
      const response = await api.get(`/devices/${deviceId}/inspections/latest`);
      return response.data;
    } catch (error) {
      console.error(`機器ID:${deviceId}の最新点検取得エラー:`, error);
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

  // 点検項目一覧を取得（SQL結果と同じ形式のデータを返す）
  getInspectionItems: async () => {
    try {
      // このエンドポイントは新しく追加する必要があります
      const response = await api.get("/inspection-items/all-with-details");
      return response;
    } catch (error) {
      console.error("点検項目一覧取得エラー:", error);
      throw error;
    }
  }
};
