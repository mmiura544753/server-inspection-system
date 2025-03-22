// server/server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

// 環境変数の読み込み
dotenv.config();

// ルーターのインポート
const customerRoutes = require("./routes/customerRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const inspectionRoutes = require("./routes/inspectionRoutes");
const inspectionItemRoutes = require("./routes/inspectionItemRoutes");

// エラーハンドラーのインポート
const { notFound, errorHandler } = require("./middleware/errorHandler");

// データベース接続
const { connectDB } = require("./config/db");
connectDB();

const app = express();

// ミドルウェア
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

// ルート
app.use("/api/customers", customerRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/inspection-items", inspectionItemRoutes);

// 基本ルート
app.get("/", (req, res) => {
  res.send("API is running...");
});

// エラーハンドリングミドルウェア
app.use(notFound);
app.use(errorHandler);

// サーバーの起動
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
