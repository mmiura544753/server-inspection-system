// server/controllers/inspectionItem/inspectionItemDetailController.js
const asyncHandler = require("express-async-handler");
const { sequelize } = require("../../config/db");

// @desc    顧客・機器・点検項目の関連情報を全て取得
// @route   GET /api/inspection-items/all-with-details
// @access  Public
const getAllInspectionItemsWithDetails = asyncHandler(async (req, res) => {
  try {
    // SQLクエリを直接実行
    const query = `
      SELECT 
        c.id as customer_id,
        c.customer_name,
        d.id as device_id, 
        d.device_name, 
        d.model,
        d.rack_number,
        ii.id as item_id, 
        ii.item_name, 
        d.device_type
      FROM 
        inspection_items ii
      JOIN 
        devices d ON ii.device_id = d.id
      JOIN 
        customers c ON d.customer_id = c.id
      ORDER BY 
        c.customer_name, d.device_name, ii.item_name
    `;

    // クエリを実行
    const items = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    // 結果をレスポンスとして返す
    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("点検項目詳細一覧取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "点検項目データの取得中にエラーが発生しました。",
      error: error.message,
    });
  }
});

module.exports = {
  getAllInspectionItemsWithDetails,
};
