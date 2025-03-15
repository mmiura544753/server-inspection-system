// services/api/inspectionAPI.js
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
  
  // 点検エクスポート機能
  exportData: async (format = 'csv') => {
    try {
      console.log(`点検エクスポート開始: 形式=${format}`);
      
      const response = await api.get(`/inspections/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      console.log('点検エクスポート成功:', response);
      return response.data;
    } catch (error) {
      console.error("点検エクスポートエラー:", error);
      
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
