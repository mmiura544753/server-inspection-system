// server/controllers/inspection/inspectionCreateController.js (ORM版 - 新規生成)
const asyncHandler = require("express-async-handler");
const {
  Inspection,
  Device,
  Customer,
  InspectionResult,
  InspectionItem,
  InspectionItemName,
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
    device_id, // クライアントから送信されるが、今後はinspection_resultsのデータから取得
    status = "完了", // ステータスのデフォルト値
    results,
  } = req.body;

  // 必須フィールドのチェック
  if (!inspection_date || !inspector_name) {
    res.status(400);
    throw new Error("必須フィールドが不足しています（inspection_date, inspector_name）");
  }
  
  console.log("点検作成リクエスト:", JSON.stringify(req.body, null, 2));

  // device_idが指定されている場合のみ機器の存在確認
  let device = null;
  if (device_id) {
    device = await Device.findByPk(device_id, {
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
    // 点検レコードを作成 (device_id は含めない)
    const inspection = await Inspection.create(
      {
        inspection_date,
        start_time,
        end_time,
        inspector_name,
        status // ステータスフィールド
      },
      { transaction }
    );

    // 点検結果を作成
    const inspectionResults = [];
    for (const result of results) {
      // 点検項目の情報を取得（item_name_masterを含む）
      const inspectionItem = await InspectionItem.findByPk(result.inspection_item_id, {
        include: [
          {
            model: InspectionItemName,
            as: 'item_name_master',
            attributes: ['id', 'name']
          },
          {
            model: Device,
            as: 'device',
            attributes: ['id', 'device_name']
          }
        ]
      });
      
      // device_idを点検項目から取得
      const device_id = inspectionItem && inspectionItem.device ? inspectionItem.device.id : null;
      
      if (!device_id) {
        res.status(400);
        throw new Error(`点検項目ID ${result.inspection_item_id} に関連する機器情報が見つかりません`);
      }
      
      const inspectionResult = await InspectionResult.create(
        {
          inspection_id: inspection.id,
          inspection_item_id: result.inspection_item_id,
          device_id: device_id, // 点検項目から取得した機器IDを使用
          check_item: inspectionItem && inspectionItem.item_name_master ? inspectionItem.item_name_master.name : `点検項目${result.inspection_item_id}`, // 点検項目マスタから名前を取得
          status: result.status,
          checked_at: new Date(),
        },
        { transaction }
      );

      // 作成した結果を直接使用
      inspectionResults.push({
        id: inspectionResult.id,
        inspection_item_id: inspectionResult.inspection_item_id,
        check_item: inspectionResult.check_item, // 既に保存した値を使用
        status: inspectionResult.status,
        checked_at: inspectionResult.checked_at,
      });
    }

    // コミット
    await transaction.commit();

    // 点検データは既に保存されているため、直接使用
    // レスポンス形式を調整
    const formattedInspection = {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      status: inspection.status,
      results: inspectionResults,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at,
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
