// services/api/inspectionItemAPI.js
import api from './index';

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

  // 点検項目詳細を取得
  getById: async (id) => {
    try {
      const response = await api.get(`/inspection-items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`点検項目ID:${id}の取得エラー:`, error);
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

  // 点検項目を更新
  update: async (id, itemData) => {
    try {
      const response = await api.put(`/inspection-items/${id}`, itemData);
      return response.data;
    } catch (error) {
      console.error(`点検項目ID:${id}の更新エラー:`, error);
      throw error;
    }
  },

  // 点検項目を削除
  delete: async (id) => {
    try {
      const response = await api.delete(`/inspection-items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`点検項目ID:${id}の削除エラー:`, error);
      throw error;
    }
  },
  
  // 点検項目エクスポート機能
  exportData: async (format = 'csv') => {
    try {
      console.log(`点検項目エクスポート開始: 形式=${format}`);
      
      const response = await api.get(`/inspection-items/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      console.log('点検項目エクスポート成功:', response);
      return response.data;
    } catch (error) {
      console.error("点検項目エクスポートエラー:", error);
      
      if (error.response && error.response.data) {
        // Blobからテキストを抽出
        const text = await new Response(error.response.data).text();
        let errorMsg;
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || json.message || '未知のエラーが発生しました';
        } catch {
          errorMsg = text;
        }
        console.error("エクスポートエラー詳細:", errorMsg);
        throw new Error(errorMsg);
      }
      
      throw error;
    }
  }
};
