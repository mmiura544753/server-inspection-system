// server/controllers/inspectionItem/inspectionItemDetailController.js
const asyncHandler = require("express-async-handler");
const { sequelize } = require("../../config/db");

// @desc    顧客・機器・点検項目の関連情報を階層化して取得
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
        d.unit_position,
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
        c.customer_name, d.rack_number, d.unit_position
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

  console.log("入力データ (items):", items); // 関数への入力データをログ出力

  const locationGroups = {};

  // まず設置場所でグループ化
  items.forEach((item) => {
    const locationKey =
      item.rack_number !== null && item.rack_number !== ""
        ? `ラックNo.${item.rack_number}`
        : "未設定";

    console.log("処理中の item:", item, "locationKey:", locationKey); // 各itemの処理をログ出力

    if (!locationGroups[locationKey]) {
      locationGroups[locationKey] = {
        locationId: `loc_${locationKey}`,
        locationName: locationKey,
        servers: {},
      };
      console.log(
        "新しい locationGroups[locationKey] を作成:",
        locationGroups[locationKey]
      ); // 新しいグループ作成をログ出力
    }

    // 次に各設置場所内で機器ごとにグループ化
    const deviceKey = item.device_id;
    if (!locationGroups[locationKey].servers[deviceKey]) {
      locationGroups[locationKey].servers[deviceKey] = {
        id: item.device_name,
        device_id: item.device_id,
        type: item.device_type,
        model: item.model || "",
        unit_position: item.unit_position || "",
        items: [],
        results: [],
      };
      console.log(
        "新しい locationGroups[locationKey].servers[deviceKey] を作成:",
        locationGroups[locationKey].servers[deviceKey]
      ); // 新しいサーバー作成をログ出力
    }

    // 点検項目を追加
    locationGroups[locationKey].servers[deviceKey].items.push(item.item_name);
    locationGroups[locationKey].servers[deviceKey].results.push(null); // 初期値はnull
    console.log("現在の locationGroups:", locationGroups);
  });

  console.log("グループ化完了後の locationGroups:", locationGroups); // グループ化完了後の状態をログ出力

  // 最終的なデータ構造に変換（配列形式に）
  return Object.values(locationGroups).map((location) => {
    // 各ロケーション内のサーバー配列をunit_positionでソート
    const sortedServers = Object.values(location.servers).sort((a, b) => {
      // ユニット位置をソート（数値または文字列として）
      const aPos = a.unit_position || "";
      const bPos = b.unit_position || "";

      // U1, U2 のような形式をソートするために数値部分を抽出
      const aMatch = aPos.match(/U(\d+)/i);
      const bMatch = bPos.match(/U(\d+)/i);

      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }

      // 数値抽出できない場合は文字列比較
      return aPos.localeCompare(bPos);
    });

    return {
      ...location,
      servers: sortedServers,
    };
  });
}

module.exports = {
  getAllInspectionItemsWithDetails,
};
