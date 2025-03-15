// server/controllers/device/deviceExportController.js
const asyncHandler = require("express-async-handler");
const { Parser } = require("json2csv");
const iconv = require("iconv-lite");
const { Device, Customer } = require("../../models");

// @desc    機器一覧のCSVエクスポート
// @route   GET /api/devices/export
// @access  Public
const exportDevicesToCsv = asyncHandler(async (req, res) => {
  const encoding = req.query.encoding || "shift_jis";

  // 全ての機器情報を取得（顧客情報も含む）
  const devices = await Device.findAll({
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "customer_name"],
      },
    ],
    order: [["device_name", "ASC"]],
  });

  // レスポンス形式を調整（CSVに適した形式に変換）- 顧客ID、作成日時、更新日時を除外
  const formattedDevices = devices.map((device) => {
    return {
      ID: device.id,
      機器名: device.device_name,
      顧客名: device.customer ? device.customer.customer_name : "",
      モデル: device.model || "",
      設置場所: device.location || "",
      機器種別: device.device_type,
      ハードウェアタイプ: device.hardware_type,
    };
  });

  // CSVフィールドの設定 - 日本語のヘッダーを使用
  const fields = [
    { label: "ID", value: "ID" },
    { label: "機器名", value: "機器名" },
    { label: "顧客名", value: "顧客名" },
    { label: "モデル", value: "モデル" },
    { label: "設置場所", value: "設置場所" },
    { label: "機器種別", value: "機器種別" },
    { label: "ハードウェアタイプ", value: "ハードウェアタイプ" },
  ];

  // JSON to CSV Parserの設定
  const json2csvParser = new Parser({ fields });

  // CSVに変換
  const csv = json2csvParser.parse(formattedDevices);

  // ファイル名の設定
  const date = new Date();
  const filename = `devices_export_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}.csv`;

  // エンコーディングの処理
  let outputData;
  if (
    encoding.toLowerCase() === "shift_jis" ||
    encoding.toLowerCase() === "sjis"
  ) {
    // SHIFT-JISに変換
    outputData = iconv.encode(csv, "Shift_JIS");
    res.setHeader("Content-Type", "text/csv; charset=Shift_JIS");
  } else {
    outputData = csv;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
  }

  // ヘッダーの設定
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

  // CSVデータを送信
  res.send(outputData);
});

module.exports = {
  exportDevicesToCsv,
};
