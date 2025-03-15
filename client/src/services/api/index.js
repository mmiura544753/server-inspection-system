// services/api/index.js - APIの基本設定とエクスポート
import axios from "axios";

// 各APIサービスをインポート
import { customerAPI } from './customerAPI';
import { deviceAPI } from './deviceAPI';
import { inspectionAPI } from './inspectionAPI';
import { inspectionItemAPI } from './inspectionItemAPI';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// デバッグ用ログ
console.log("環境変数から読み込まれた API URL:", process.env.REACT_APP_API_URL);
console.log("使用する API URL:", API_BASE_URL);

// ベースとなるaxiosインスタンスを作成
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 全てのAPIサービスをエクスポート
export {
  api as default,
  customerAPI,
  deviceAPI,
  inspectionAPI,
  inspectionItemAPI
};
