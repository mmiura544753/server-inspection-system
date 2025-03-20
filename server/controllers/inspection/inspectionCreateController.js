// server/controllers/inspection/inspectionCreateController.js (ORM版 - 新規生成)
const asyncHandler = require("express-async-handler");
const {
  Inspection,
  Device,
  Customer,
  InspectionResult,
  InspectionItem,
} = require("../../models");
const { sequelize } = require("../../config/db");

// @desc    新規点検の作成
// @route   POST /api/inspections
// @access  Public
const createInspection = asyncHandler(async (req, res) => {
  const {
    inspection_date,
    start_time,
    end_time,
    inspector_name,
    device_id,
    status = "完了", // ステータスのデフォルト値
    results,
  } = req.body;

  // 必須フィールドのチェック
  if (!inspection_date || !inspector_name || !device_id) {
    res.status(400);
    throw new Error("必須フィールドが不足しています（inspection_date, inspector_name, device_id）");
  }
  
  console.log("点検作成リクエスト:", JSON.stringify(req.body, null, 2));

  // 機器の存在確認
  const device = await Device.findByPk(device_id, {
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "customer_name"],
      },
    ],
  });

  if (!device) {
    res.status(400);
    throw new Error("指定された機器が存在しません");
  }

  // 結果が空でないことを確認
  if (!results || !Array.isArray(results) || results.length === 0) {
    res.status(400);
    throw new Error("少なくとも1つの点検結果が必要です。点検項目にチェックを入れてください。");
  }
  
  console.log("点検結果データ:", JSON.stringify(results, null, 2));

  // 点検項目の存在確認と結果の検証
  for (const result of results) {
    const itemExists = await InspectionItem.findByPk(result.inspection_item_id);

    if (!itemExists) {
      res.status(400);
      throw new Error(`点検項目ID ${result.inspection_item_id} が存在しません`);
    }

    if (!result.status || !["正常", "異常"].includes(result.status)) {
      res.status(400);
      throw new Error(
        '点検結果ステータスは"正常"または"異常"である必要があります'
      );
    }
  }

  // トランザクションを使用して点検と結果を保存
  const transaction = await sequelize.transaction();

  try {
    // 点検レコードを作成
    const inspection = await Inspection.create(
      {
        inspection_date,
        start_time,
        end_time,
        inspector_name,
        device_id,
        status, // ステータスフィールド
      },
      { transaction }
    );

    // 点検結果を作成
    const inspectionResults = [];
    for (const result of results) {
      // 点検項目の情報を取得
      const inspectionItem = await InspectionItem.findByPk(result.inspection_item_id);
      
      const inspectionResult = await InspectionResult.create(
        {
          inspection_id: inspection.id,
          inspection_item_id: result.inspection_item_id,
          device_id: device_id, // 機器IDを追加
          check_item: inspectionItem ? inspectionItem.item_name : `点検項目${result.inspection_item_id}`, // 点検項目名を設定
          status: result.status,
          checked_at: new Date(),
        },
        { transaction }
      );

      // 結果データを取得
      const resultWithItem = await InspectionResult.findByPk(
        inspectionResult.id,
        {
          include: [
            {
              model: InspectionItem,
              as: "inspection_item",
              attributes: ["id", "item_name"],
            },
          ],
          transaction,
        }
      );

      inspectionResults.push({
        id: resultWithItem.id,
        inspection_item_id: resultWithItem.inspection_item_id,
        check_item: resultWithItem.inspection_item.item_name,
        status: resultWithItem.status,
        checked_at: resultWithItem.checked_at,
      });
    }

    // コミット
    await transaction.commit();

    // 作成した点検の詳細情報を取得（関連データ含む）
    const createdInspection = await Inspection.findByPk(inspection.id, {
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
      ],
      transaction,
    });

    // レスポンス形式を調整
    const formattedInspection = {
      id: createdInspection.id,
      inspection_date: createdInspection.inspection_date,
      start_time: createdInspection.start_time,
      end_time: createdInspection.end_time,
      inspector_name: createdInspection.inspector_name,
      device_id: createdInspection.device_id,
      device_name: createdInspection.device.device_name,
      customer_id: createdInspection.device.customer.id,
      customer_name: createdInspection.device.customer.customer_name,
      status: createdInspection.status,
      results: inspectionResults,
      created_at: createdInspection.created_at,
      updated_at: createdInspection.updated_at,
    };

    res.status(201).json(formattedInspection);
  } catch (error) {
    // トランザクションがまだアクティブな場合のみロールバック
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error("点検作成エラー:", error);
    throw error;
  }
});

module.exports = {
  createInspection,
};
