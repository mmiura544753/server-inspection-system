// server/controllers/inspectionItem/inspectionItemExportController.js
const asyncHandler = require("express-async-handler");
const { Parser } = require("json2csv");
const iconv = require("iconv-lite");
const {
  InspectionItem,
  Device,
  Customer,
  InspectionItemName,
} = require("../../models");

// @desc    点検項目一覧のCSVエクスポート
// @route   GET /api/inspection-items/export
// @access  Public
const exportInspectionItemsToCsv = asyncHandler(async (req, res) => {
  const encoding = req.query.encoding || "shift_jis";

  // 全ての点検項目情報を取得（機器情報と顧客情報も含む）
  const items = await InspectionItem.findAll({
    include: [
      {
        model: Device,
        as: "device",
        attributes: ["id", "device_name", "customer_id"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "customer_name"],
          },
        ],
      },
      {
        model: InspectionItemName,
        as: "item_name_master",
        attributes: ["id", "name"],
      },
    ],
    order: [
      [{ model: InspectionItemName, as: "item_name_master" }, "name", "ASC"],
    ],
  });

  // レスポンス形式を調整（CSVに適した形式に変換）
  const formattedItems = items.map((item) => {
    return {
      id: item.id,
      item_name: item.item_name_master ? item.item_name_master.name : "",
      device_name: item.device.device_name,
      customer_name: item.device.customer.customer_name,
    };
  });

  // CSVフィールドの設定 - 日本語のヘッダーを使用
  const fields = [
    { label: "ID", value: "id" },
    { label: "点検項目名", value: "item_name" },
    { label: "機器名", value: "device_name" },
    { label: "顧客名", value: "customer_name" },
  ];

  // JSON to CSV Parserの設定
  const json2csvParser = new Parser({ fields });

  // CSVに変換
  const csv = json2csvParser.parse(formattedItems);

  // ファイル名の設定
  const date = new Date();
  const filename = `inspection_items_export_${date.getFullYear()}${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}.csv`;

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
  exportInspectionItemsToCsv,
};
