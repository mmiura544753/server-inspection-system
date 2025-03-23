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

  // 機器ID参照の削除 - 点検はdevice_idを持たないため

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
    // 点検レコードを更新 (device_idなし)
    await inspection.update(
      {
        inspection_date: inspection_date || inspection.inspection_date,
        start_time:
          start_time !== undefined ? start_time : inspection.start_time,
        end_time: end_time !== undefined ? end_time : inspection.end_time,
        inspector_name: inspector_name || inspection.inspector_name,
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

        // 点検項目から機器IDを取得
        const itemDevice = await InspectionItem.findByPk(result.inspection_item_id, {
          include: [{ model: Device, as: "device" }]
        });
        
        const device_id = itemDevice && itemDevice.device ? itemDevice.device.id : null;
        
        if (!device_id) {
          console.warn(`点検項目ID ${result.inspection_item_id} に関連する機器情報が見つかりません`);
        }
        
        const inspectionResult = await InspectionResult.create(
          {
            inspection_id: inspectionId,
            inspection_item_id: result.inspection_item_id,
            device_id: device_id, // 点検項目から取得した機器ID
            check_item: inspectionItem && inspectionItem.item_name_master ? inspectionItem.item_name_master.name : `点検項目${result.inspection_item_id}`, // 点検項目マスタから名前を取得
            status: result.status,
            checked_at: result.checked_at || new Date(),
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

      // 更新された点検データを再取得
      const updatedInspection = await Inspection.findByPk(inspectionId);

      // 点検結果から最初のデバイス情報を取得（表示用）
      const firstResult = await InspectionResult.findOne({
        where: { inspection_id: inspectionId },
        include: [
          {
            model: InspectionItem,
            as: "inspection_item",
            include: [
              {
                model: Device,
                as: "device",
                include: [
                  {
                    model: Customer,
                    as: "customer",
                  }
                ]
              }
            ]
          }
        ]
      });
      
      let deviceInfo = { id: null, device_name: "-", customer_id: null, customer_name: "-" };
      
      if (firstResult && firstResult.inspection_item && firstResult.inspection_item.device) {
        const device = firstResult.inspection_item.device;
        deviceInfo = {
          id: device.id,
          device_name: device.device_name,
          customer_id: device.customer ? device.customer.id : null,
          customer_name: device.customer ? device.customer.customer_name : "-"
        };
      }

      // レスポンス形式を調整
      const formattedInspection = {
        id: updatedInspection.id,
        inspection_date: updatedInspection.inspection_date,
        start_time: updatedInspection.start_time,
        end_time: updatedInspection.end_time,
        inspector_name: updatedInspection.inspector_name,
        device_id: deviceInfo.id,
        device_name: deviceInfo.device_name,
        customer_id: deviceInfo.customer_id,
        customer_name: deviceInfo.customer_name,
        status: updatedInspection.status,
        results: inspectionResults,
        created_at: updatedInspection.created_at,
        updated_at: updatedInspection.updated_at,
      };

      res.json(formattedInspection);
    } else {
      // 結果を更新しない場合、トランザクションをコミット
      await transaction.commit();

      // 更新された点検データと結果を再取得
      const updatedInspection = await Inspection.findByPk(inspectionId, {
        include: [
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
                  },
                  {
                    model: Device,
                    as: "device",
                    include: [
                      {
                        model: Customer,
                        as: "customer",
                      }
                    ]
                  }
                ],
              },
            ],
          },
        ],
      });

      // レスポンス形式を調整
      const formattedResults = updatedInspection.results.map((result) => {
        const device = result.inspection_item?.device || null;
        
        return {
          id: result.id,
          inspection_item_id: result.inspection_item_id,
          check_item: result.check_item, // 直接保存されたcheck_itemフィールドを使用
          status: result.status,
          checked_at: result.checked_at,
          device_id: device?.id || null,
          device_name: device?.device_name || null,
          rack_number: device?.rack_number || null,
          unit_position: device?.unit_start_position || null,
          model: device?.model || null,
        };
      });

      // 点検結果から最初のデバイス情報を取得（表示用）
      let deviceInfo = { id: null, device_name: "-", customer_id: null, customer_name: "-" };
      
      if (updatedInspection.results && updatedInspection.results.length > 0) {
        const firstResult = updatedInspection.results[0];
        if (firstResult.inspection_item && firstResult.inspection_item.device) {
          const device = firstResult.inspection_item.device;
          deviceInfo = {
            id: device.id,
            device_name: device.device_name,
            customer_id: device.customer ? device.customer.id : null,
            customer_name: device.customer ? device.customer.customer_name : "-"
          };
        }
      }

      const formattedInspection = {
        id: updatedInspection.id,
        inspection_date: updatedInspection.inspection_date,
        start_time: updatedInspection.start_time,
        end_time: updatedInspection.end_time,
        inspector_name: updatedInspection.inspector_name,
        device_id: deviceInfo.id,
        device_name: deviceInfo.device_name,
        customer_id: deviceInfo.customer_id,
        customer_name: deviceInfo.customer_name,
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
