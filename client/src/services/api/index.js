// services/api/index.js - APIの基本設定とエクスポート
import axios from "axios";

// 各APIサービスをインポート
import { customerAPI } from "./customerAPI";
import { deviceAPI } from "./deviceAPI";
import { inspectionAPI } from "./inspectionAPI";
import { inspectionItemAPI } from "./inspectionItemAPI";
import { inspectionFormAPI } from "./inspectionFormAPI";

// 絶対URLに変更（環境変数または明示的なURL）
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://3.115.76.39:5000/api";

// デバッグ用ログ
console.log("環境変数から読み込まれた API URL:", process.env.REACT_APP_API_URL);
console.log("使用する API URL:", API_BASE_URL);

// ベースとなるaxiosインスタンスを作成
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000, // 2分のタイムアウト
});

// インターセプターを追加して詳細なデバッグを行う
api.interceptors.request.use(
  request => {
    console.log('API リクエスト送信:', request);
    return request;
  },
  error => {
    console.error('API リクエストエラー:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log('API レスポンス受信:', response);
    return response;
  },
  error => {
    console.error('API レスポンスエラー:', error);
    return Promise.reject(error);
  }
);

// 全てのAPIサービスをエクスポート
export {
  api as default,
  customerAPI,
  deviceAPI,
  inspectionAPI,
  inspectionItemAPI,
  inspectionFormAPI,
};
