// server/serverSQL.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

// 環境変数の読み込み
dotenv.config();

// ルーターのインポート
const customerRoutes = require("./routes/customerRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
// SQL版の点検ルーターを使用
const inspectionRoutes = require("./routes/inspectionRoutesSQL"); 
const inspectionItemRoutes = require("./routes/inspectionItemRoutes");

// エラーハンドラーのインポート
const { notFound, errorHandler } = require("./middleware/errorHandler");

// データベースモジュールの読み込みとテスト
const db = require('./utils/db');
db.testConnection().then(connected => {
  if (!connected) {
    console.error('データベース接続に失敗しました。サーバーを終了します。');
    process.exit(1);
  }
});

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ルート
app.use("/api/customers", customerRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/inspection-items", inspectionItemRoutes);

// 基本ルート
app.get("/", (req, res) => {
  res.send("API is running... (SQL版)");
});

// エラーハンドリングミドルウェア
app.use(notFound);
app.use(errorHandler);

// サーバーの起動
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT} (SQL版)`);
});
