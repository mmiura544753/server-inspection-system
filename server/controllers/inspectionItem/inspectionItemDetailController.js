// server/controllers/inspectionItem/inspectionItemDetailController.js
const asyncHandler = require("express-async-handler");
const { InspectionItem, Device, Customer, InspectionItemName } = require("../../models");

// @desc    顧客・機器・点検項目の関連情報を階層化して取得
// @route   GET /api/inspection-items/all-with-details
// @access  Public
const getAllInspectionItemsWithDetails = asyncHandler(async (req, res) => {
  try {
    // Sequelize ORMを使用して同等のクエリを実行
    const inspectionItems = await InspectionItem.findAll({
      attributes: ['id'],
      include: [
        {
          model: Device,
          as: 'device',
          attributes: [
            'id', 
            'device_name', 
            'model', 
            'rack_number', 
            'unit_start_position', 
            'unit_end_position',
            'device_type'
          ],
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: ['id', 'customer_name']
            }
          ]
        },
        {
          model: InspectionItemName,
          as: 'item_name_master',
          attributes: ['id', 'name']
        }
      ],
      order: [
        [{ model: Device, as: 'device' }, 'rack_number', 'ASC'],
        [{ model: Device, as: 'device' }, 'unit_start_position', 'DESC']
      ]
    });

    // Sequelize結果をSQLクエリ結果と同じ形式に変換
    const items = inspectionItems.map(item => {
      return {
        customer_id: item.device.customer.id,
        device_id: item.device.id,
        device_name: item.device.device_name,
        model: item.device.model,
        rack_number: item.device.rack_number,
        unit_start_position: item.device.unit_start_position,
        unit_end_position: item.device.unit_end_position,
        item_id: item.id,
        item_name: item.item_name_master.name,
        device_type: item.device.device_type
      };
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
        unit_start_position: item.unit_start_position,
        items: [],
        results: [],
        item_ids: [], // 点検項目IDを保存する配列を追加
      };
    }

    // 点検項目を追加
    locationGroups[locationKey].servers[deviceKey].items.push(item.item_name);
    locationGroups[locationKey].servers[deviceKey].results.push(null); // 初期値はnull
    locationGroups[locationKey].servers[deviceKey].item_ids.push(item.item_id); // 点検項目IDを保存
  });

  // オブジェクトから配列に変換し、階層構造を作成
  const result = [];

  // 各ロケーションを配列に変換
  Object.values(locationGroups).forEach((location) => {
    // サーバーをオブジェクトから配列に変換、ユニット位置でソート
    const serverArray = Object.values(location.servers).sort((a, b) => {
      // unit_start_positionが存在しない場合は最後に表示
      const aPos =
        a.unit_start_position !== null && a.unit_start_position !== undefined
          ? a.unit_start_position
          : -1;
      const bPos =
        b.unit_start_position !== null && b.unit_start_position !== undefined
          ? b.unit_start_position
          : -1;

      // 降順にするために b - a とする
      return bPos - aPos;
    });

    // 配列をserversに設定
    location.servers = serverArray;

    // 結果に追加
    result.push(location);
  });

  // ラック番号でロケーションを並べ替え
  result.sort((a, b) => {
    // ラック番号を取得（"ラックNo.X"から数値部分を抽出）
    const aRackNum = parseInt(a.locationName.replace(/[^0-9]/g, "")) || 0;
    const bRackNum = parseInt(b.locationName.replace(/[^0-9]/g, "")) || 0;

    // 昇順に並べ替え
    return aRackNum - bRackNum;
  });

  return result;
}

module.exports = {
  getAllInspectionItemsWithDetails,
};
