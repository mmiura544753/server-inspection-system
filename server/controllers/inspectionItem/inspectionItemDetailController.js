// server/controllers/inspectionItem/inspectionItemDetailController.js
const asyncHandler = require("express-async-handler");
const { sequelize } = require("../../config/db");

// @desc    顧客・機器・点検項目の関連情報を階層化して取得
// @route   GET /api/inspection-items/all-with-details
// @access  Public
const getAllInspectionItemsWithDetails = asyncHandler(async (req, res) => {
  try {
    // SQLクエリを直接実行 - customer_nameを削除し、ORDER BY句を変更
    const query = `
      SELECT 
        c.id as customer_id,
        d.id as device_id, 
        d.device_name, 
        d.model,
        d.rack_number,
        d.unit_start_position,
        d.unit_end_position,
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
        d.rack_number ASC, d.unit_start_position DESC
    `;

    // クエリを実行
    const items = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    // データを階層化
    const hierarchicalData = transformToHierarchy(items);

    // 結果をレスポンスとして返す
    res.json({
      success: true,
      data: hierarchicalData,
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

// データを階層化する関数
function transformToHierarchy(items) {
  // 顧客→ロケーション→サーバー→点検項目の階層構造に変換
  const locationGroups = {};

  // まず設置場所でグループ化
  items.forEach((item) => {
    const locationKey =
      item.rack_number !== null && item.rack_number !== undefined
        ? `ラックNo.${item.rack_number}`
        : "未設定";

    if (!locationGroups[locationKey]) {
      locationGroups[locationKey] = {
        locationId: `loc_${locationKey}`,
        locationName: locationKey,
        servers: {},
      };
    }

    // 次に各設置場所内で機器ごとにグループ化
    const deviceKey = item.device_id;
    if (!locationGroups[locationKey].servers[deviceKey]) {
      // ユニットポジションの表示形式を作成
      let unitPositionDisplay = "";
      if (
        item.unit_start_position !== null &&
        item.unit_start_position !== undefined
      ) {
        if (
          item.unit_end_position !== null &&
          item.unit_end_position !== undefined &&
          item.unit_start_position !== item.unit_end_position
        ) {
          unitPositionDisplay = `U${item.unit_start_position}-U${item.unit_end_position}`;
        } else {
          unitPositionDisplay = `U${item.unit_start_position}`;
        }
      }

      locationGroups[locationKey].servers[deviceKey] = {
        id: item.device_name,
        device_id: item.device_id,
        type: item.device_type,
        model: item.model || "",
        unit_position: unitPositionDisplay,
        items: [],
        results: [],
      };
    }

    // 点検項目を追加
    locationGroups[locationKey].servers[deviceKey].items.push(item.item_name);
    locationGroups[locationKey].servers[deviceKey].results.push(null); // 初期値はnull
  });

  // オブジェクトから配列に変換し、階層構造を作成
  const result = [];

  // 各ロケーションを配列に変換
  Object.values(locationGroups).forEach((location) => {
    // サーバーをオブジェクトから配列に変換、ユニット位置でソート
    // サーバーをオブジェクトから配列に変換、ユニット位置の降順でソート（上のユニットから下へ）
    const serverArray = Object.values(location.servers).sort((a, b) => {
      // ユニット開始位置でソート（数値がない場合は末尾に配置）
      const aPos = a.unit_position
        ? parseInt(a.unit_position.replace(/[^0-9]/g, ""))
        : 999;
      const bPos = b.unit_position
        ? parseInt(b.unit_position.replace(/[^0-9]/g, ""))
        : 999;
      return bPos - aPos; // 降順にするために順序を逆にする
    });

    // 配列をserversに設定
    location.servers = serverArray;

    // 結果に追加
    result.push(location);
  });

  return result;
}

module.exports = {
  getAllInspectionItemsWithDetails,
};
