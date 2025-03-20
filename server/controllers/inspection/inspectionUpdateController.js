// server/controllers/inspection/inspectionUpdateController.js (ORM版 - 新規生成)
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

// @desc    点検情報の更新
// @route   PUT /api/inspections/:id
// @access  Public
const updateInspection = asyncHandler(async (req, res) => {
  const {
    inspection_date,
    start_time,
    end_time,
    inspector_name,
    device_id,
    results,
    status,
  } = req.body;
  const inspectionId = req.params.id;

  // 点検の存在確認
  const inspection = await Inspection.findByPk(inspectionId);

  if (!inspection) {
    res.status(404);
    throw new Error("点検が見つかりません");
  }

  // 機器IDが変更された場合、新しい機器の存在確認
  let device;
  if (device_id && device_id !== inspection.device_id) {
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
  } else {
    device = await Device.findByPk(inspection.device_id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "customer_name"],
        },
      ],
    });
  }

  // 結果データが提供されている場合、各点検項目の存在確認
  if (results && results.length > 0) {
    for (const result of results) {
      const itemExists = await InspectionItem.findByPk(
        result.inspection_item_id,
        {
          include: [
            {
              model: InspectionItemName,
              as: "item_name_master",
              attributes: ["id", "name"],
            }
          ]
        }
      );

      if (!itemExists) {
        res.status(400);
        throw new Error(
          `点検項目ID ${result.inspection_item_id} が存在しません`
        );
      }

      if (!result.status || !["正常", "異常"].includes(result.status)) {
        res.status(400);
        throw new Error(
          '点検結果ステータスは"正常"または"異常"である必要があります'
        );
      }
    }
  }

  // トランザクションを使用して点検と結果を更新
  const transaction = await sequelize.transaction();

  try {
    // 点検レコードを更新
    await inspection.update(
      {
        inspection_date: inspection_date || inspection.inspection_date,
        start_time:
          start_time !== undefined ? start_time : inspection.start_time,
        end_time: end_time !== undefined ? end_time : inspection.end_time,
        inspector_name: inspector_name || inspection.inspector_name,
        device_id: device_id || inspection.device_id,
        status: status || inspection.status,
      },
      { transaction }
    );

    // 結果を更新する場合
    if (results && results.length > 0) {
      // 既存の結果を削除
      await InspectionResult.destroy({
        where: { inspection_id: inspectionId },
        transaction,
      });

      // 新しい結果を作成
      const inspectionResults = [];

      for (const result of results) {
        // 点検項目の情報を取得
        const inspectionItem = await InspectionItem.findByPk(result.inspection_item_id, {
          include: [
            {
              model: InspectionItemName,
              as: 'item_name_master',
              attributes: ['id', 'name']
            }
          ]
        });

        const inspectionResult = await InspectionResult.create(
          {
            inspection_id: inspectionId,
            inspection_item_id: result.inspection_item_id,
            device_id: device_id || inspection.device_id, // 機器IDを追加
            check_item: inspectionItem && inspectionItem.item_name_master ? inspectionItem.item_name_master.name : `点検項目${result.inspection_item_id}`, // 点検項目マスタから名前を取得
            status: result.status,
            checked_at: new Date(),
          },
          { transaction }
        );

        // 結果を直接使用
        inspectionResults.push({
          id: inspectionResult.id,
          inspection_item_id: inspectionResult.inspection_item_id,
          check_item: inspectionResult.check_item, // 直接保存されたcheck_itemフィールドを使用
          status: inspectionResult.status,
          checked_at: inspectionResult.checked_at,
        });
      }
      // コミット
      await transaction.commit();

      // 更新された点検データを再取得（関連データ含む）
      const updatedInspection = await Inspection.findByPk(inspectionId, {
        include: [
          {
            model: Device,
            as: "device",
            include: [
              {
                model: Customer,
                as: "customer",
                attributes: ["id", "customer_name"],
              },
            ],
          },
        ],
      });

      // レスポンス形式を調整
      const formattedInspection = {
        id: updatedInspection.id,
        inspection_date: updatedInspection.inspection_date,
        start_time: updatedInspection.start_time,
        end_time: updatedInspection.end_time,
        inspector_name: updatedInspection.inspector_name,
        device_id: updatedInspection.device_id,
        device_name: updatedInspection.device.device_name,
        customer_id: updatedInspection.device.customer.id,
        customer_name: updatedInspection.device.customer.customer_name,
        status: updatedInspection.status,
        results: inspectionResults,
        created_at: updatedInspection.created_at,
        updated_at: updatedInspection.updated_at,
      };

      res.json(formattedInspection);
    } else {
      // 結果を更新しない場合、トランザクションをコミット
      await transaction.commit();

      // 更新された点検データを再取得（関連データ含む）
      const updatedInspection = await Inspection.findByPk(inspectionId, {
        include: [
          {
            model: Device,
            as: "device",
            include: [
              {
                model: Customer,
                as: "customer",
                attributes: ["id", "customer_name"],
              },
            ],
          },
          {
            model: InspectionResult,
            as: "results",
            include: [
              {
                model: InspectionItem,
                as: "inspection_item",
                include: [
                  {
                    model: InspectionItemName,
                    as: "item_name_master",
                    attributes: ["id", "name"],
                  }
                ],
              },
            ],
          },
        ],
      });

      // レスポンス形式を調整
      const formattedResults = updatedInspection.results.map((result) => {
        return {
          id: result.id,
          inspection_item_id: result.inspection_item_id,
          check_item: result.check_item, // 直接保存されたcheck_itemフィールドを使用
          status: result.status,
          checked_at: result.checked_at,
        };
      });

      const formattedInspection = {
        id: updatedInspection.id,
        inspection_date: updatedInspection.inspection_date,
        start_time: updatedInspection.start_time,
        end_time: updatedInspection.end_time,
        inspector_name: updatedInspection.inspector_name,
        device_id: updatedInspection.device_id,
        device_name: updatedInspection.device.device_name,
        customer_id: updatedInspection.device.customer.id,
        customer_name: updatedInspection.device.customer.customer_name,
        status: updatedInspection.status,
        results: formattedResults,
        created_at: updatedInspection.created_at,
        updated_at: updatedInspection.updated_at,
      };

      res.json(formattedInspection);
    }
  } catch (error) {
    // ロールバック
    await transaction.rollback();
    console.error("点検更新エラー:", error);
    throw error;
  }
});

module.exports = {
  updateInspection,
};
