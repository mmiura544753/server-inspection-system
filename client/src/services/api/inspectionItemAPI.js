// services/api/inspectionItemAPI.js
import api from './index';

export const inspectionItemAPI = {
  // 点検項目名一覧を取得
  getAllItemNames: async () => {
    try {
      const response = await api.get("/inspection-item-names");
      return response.data;
    } catch (error) {
      console.error("点検項目名一覧取得エラー:", error);
      throw error;
    }
  },
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
  exportData: async (format = 'csv', encoding = 'shift_jis') => {
    try {
      console.log(`点検項目エクスポート開始: 形式=${format}, エンコーディング=${encoding}`);
      
      const response = await api.get(`/inspection-items/export`, {
        params: { format, encoding },
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
  },

  // CSVファイルからデータをインポート
  importData: async (file) => {
    try {
      console.log("点検項目インポート開始", file);
      console.log("ファイル名:", file.name);
      console.log("ファイルサイズ:", file.size);
      console.log("ファイルタイプ:", file.type);

      // FormDataの作成
      const formData = new FormData();
      formData.append("file", file);

      // POSTリクエストの実行
      console.log("インポートリクエスト送信中...");
      const response = await api.post("/inspection-items/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // タイムアウトを3分に延長
        timeout: 180000,
      });

      console.log("点検項目インポート成功:", response);
      return response.data;
    } catch (error) {
      console.error("点検項目インポートエラー:", error);

      if (error.code === "ECONNABORTED") {
        console.error(
          "タイムアウトが発生しました。サーバー処理に時間がかかっている可能性があります。"
        );
        throw new Error(
          "リクエストがタイムアウトしました。大きなファイルの場合は処理に時間がかかることがあります。"
        );
      }

      // エラーが発生した場合、エラーメッセージを取得して表示
      if (error.response) {
        console.error("エラーレスポンス:", error.response);
        console.error("ステータスコード:", error.response.status);

        if (error.response.data instanceof Blob) {
          // Blobからテキストを抽出
          const text = await new Response(error.response.data).text();
          console.error("Blobレスポンスのテキスト:", text);

          let errorMsg;
          try {
            // JSONにパースできるかチェック
            const json = JSON.parse(text);
            errorMsg =
              json.error || json.message || "未知のエラーが発生しました";
          } catch {
            // JSONでない場合はそのまま表示
            errorMsg = text;
          }
          console.error("インポートエラー詳細:", errorMsg);
          throw new Error(errorMsg);
        } else if (error.response.data) {
          console.error("エラーデータ:", error.response.data);
          throw new Error(
            error.response.data.message || "未知のエラーが発生しました"
          );
        }
      }

      throw error;
    }
  }
};
