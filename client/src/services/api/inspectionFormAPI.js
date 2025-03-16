// src/services/api/inspectionFormAPI.js
import api from "./index";

export const inspectionFormAPI = {
  // 顧客の最新点検データを取得
  getLatestInspection: async (customerId) => {
    try {
      const response = await api.get(
        `/inspection-results/latest?customerId=${customerId}`
      );
      return response.data;
    } catch (error) {
      console.error("最新点検データ取得エラー:", error);
      throw error;
    }
  },

  // 点検結果を保存
  saveInspectionResult: async (data) => {
    try {
      const response = await api.post("/inspection-results", data);
      return response.data;
    } catch (error) {
      console.error("点検結果保存エラー:", error);
      throw error;
    }
  },

  // 点検項目を顧客IDで取得
  getInspectionItemsByCustomer: async (customerId) => {
    try {
      const response = await api.get(
        `/inspection-items?customerId=${customerId}`
      );
      return response.data;
    } catch (error) {
      console.error(`顧客ID:${customerId}の点検項目取得エラー:`, error);
      throw error;
    }
  },
};
