// services/api/customerAPI.js
import api from './index';

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
  
  // CSVエクスポート機能
  exportData: async (format = 'csv') => {
    try {
      console.log(`顧客エクスポート開始: 形式=${format}`);
      
      const response = await api.get(`/customers/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      console.log('顧客エクスポート成功:', response);
      return response.data;
    } catch (error) {
      console.error("顧客エクスポートエラー:", error);
      
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
