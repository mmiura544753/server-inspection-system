// services/api/deviceAPI.js
import api from "./index";

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

  // 機器エクスポート機能
  exportData: async (format = "csv", encoding = "shift_jis") => {
    try {
      console.log(
        `機器エクスポート開始: 形式=${format}, エンコーディング=${encoding}`
      );
      // 特殊なレスポンスタイプを指定してBlobを取得
      const response = await api.get(`/devices/export`, {
        params: { format, encoding },
        responseType: "blob",
      });

      console.log("機器エクスポート成功:", response);
      return response.data;
    } catch (error) {
      console.error("機器エクスポートエラー:", error);

      // エラーが発生した場合、エラーメッセージを取得して表示
      if (error.response && error.response.data) {
        // Blobからテキストを抽出
        const text = await new Response(error.response.data).text();
        let errorMsg;
        try {
          // JSONにパースできるかチェック
          const json = JSON.parse(text);
          errorMsg = json.error || json.message || "未知のエラーが発生しました";
        } catch {
          // JSONでない場合はそのまま表示
          errorMsg = text;
        }
        console.error("エクスポートエラー詳細:", errorMsg);
        throw new Error(errorMsg);
      }

      throw error;
    }
  },
};
