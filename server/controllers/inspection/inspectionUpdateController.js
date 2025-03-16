// server/controllers/inspection/inspectionUpdateController.js
const asyncHandler = require('express-async-handler');
const { Inspection, Device, Customer, InspectionResult, InspectionItem } = require('../../models');
const { sequelize } = require('../../config/db');

// @desc    点検情報の更新
// @route   PUT /api/inspections/:id
// @access  Public
const updateInspection = asyncHandler(async (req, res) => {
  const { inspection_date, start_time, end_time, inspector_name, device_id, results, status } = req.body;
  
  const inspection = await Inspection.findByPk(req.params.id);
  
  if (inspection) {
    // 機器IDが変更された場合、新しい機器の存在確認
    let deviceData;
    if (device_id && device_id !== inspection.device_id) {
      deviceData = await Device.findByPk(device_id, {
        include: [
          {
            model: Customer,
            as: 'customer'
          }
        ]
      });
      
      if (!deviceData) {
        res.status(400);
        throw new Error('指定された機器が存在しません');
      }
    } else {
      deviceData = await Device.findByPk(inspection.device_id, {
        include: [
          {
            model: Customer,
            as: 'customer'
          }
        ]
      });
    }
    
    // 結果データが提供されている場合、各点検項目の存在確認
    if (results && results.length > 0) {
      for (const result of results) {
        const itemExists = await InspectionItem.findByPk(result.inspection_item_id);
        
        if (!itemExists) {
          res.status(400);
          throw new Error(`点検項目ID ${result.inspection_item_id} が存在しません`);
        }
        
        if (!result.status || !['正常', '異常'].includes(result.status)) {
          res.status(400);
          throw new Error('点検結果ステータスは"正常"または"異常"である必要があります');
        }
      }
    }
    
    // トランザクションを使用して点検と結果を更新
    const transaction = await sequelize.transaction();
    
    try {
      // 点検レコードを更新
      inspection.inspection_date = inspection_date || inspection.inspection_date;
      inspection.start_time = start_time !== undefined ? start_time : inspection.start_time;
      inspection.end_time = end_time !== undefined ? end_time : inspection.end_time;
      inspection.inspector_name = inspector_name || inspection.inspector_name;
      inspection.device_id = device_id || inspection.device_id;
      inspection.status = status || inspection.status;
      
      await inspection.save({ transaction });
      
      // 結果を更新する場合
      if (results && results.length > 0) {
        // 既存の結果を削除
        await InspectionResult.destroy({
          where: { inspection_id: inspection.id },
          transaction
        });
        
        // 新しい結果を作成
        const inspectionResults = [];
        
        for (const result of results) {
          const inspectionResult = await InspectionResult.create({
            inspection_id: inspection.id,
            inspection_item_id: result.inspection_item_id,
            status: result.status,
            checked_at: new Date()
          }, { transaction });
          
          // 結果データを取得
          const resultWithItem = await InspectionResult.findByPk(inspectionResult.id, {
            include: [
              {
                model: InspectionItem,
                as: 'inspection_item',
                attributes: ['id', 'item_name']
              }
            ],
            transaction
          });
          
          inspectionResults.push({
            id: resultWithItem.id,
            inspection_item_id: resultWithItem.inspection_item_id,
            check_item: resultWithItem.inspection_item.item_name,
            status: resultWithItem.status,
            checked_at: resultWithItem.checked_at,
            device_id: deviceData.id,
            device_name: deviceData.device_name
          });
        }
        
        // コミット
        await transaction.commit();
        
        // 更新された点検データを再取得（関連データ含む）
        const updatedInspection = await Inspection.findByPk(inspection.id, {
          include: [
            {
              model: Device,
              as: 'device',
              include: [
                {
                  model: Customer,
                  as: 'customer'
                }
              ]
            },
            {
              model: InspectionResult,
              as: 'results',
              include: [
                {
                  model: InspectionItem,
                  as: 'inspection_item'
                }
              ]
            }
          ]
        });
        
        // レスポンス形式を調整
        const formattedResults = inspectionResults.length > 0 ? inspectionResults : updatedInspection.results.map(result => {
          return {
            id: result.id,
            inspection_item_id: result.inspection_item_id,
            check_item: result.inspection_item.item_name,
            status: result.status,
            checked_at: result.checked_at,
            device_id: updatedInspection.device_id,
            device_name: updatedInspection.device.device_name
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
          updated_at: updatedInspection.updated_at
        };
        
        res.json(formattedInspection);
      } else {
        // 結果を更新しない場合、トランザクションをコミット
        await transaction.commit();
        
        // 更新された点検データを再取得（関連データ含む）
        const updatedInspection = await Inspection.findByPk(inspection.id, {
          include: [
            {
              model: Device,
              as: 'device',
              include: [
                {
                  model: Customer,
                  as: 'customer'
                }
              ]
            },
            {
              model: InspectionResult,
              as: 'results',
              include: [
                {
                  model: InspectionItem,
                  as: 'inspection_item'
                }
              ]
            }
          ]
        });
        
        // レスポンス形式を調整
        const formattedResults = updatedInspection.results.map(result => {
          return {
            id: result.id,
            inspection_item_id: result.inspection_item_id,
            check_item: result.inspection_item.item_name,
            status: result.status,
            checked_at: result.checked_at,
            device_id: updatedInspection.device_id,
            device_name: updatedInspection.device.device_name
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
          updated_at: updatedInspection.updated_at
        };
        
        res.json(formattedInspection);
      }
    } catch (error) {
      // ロールバック
      await transaction.rollback();
      console.error('点検更新エラー:', error);
      throw error;
    }
  } else {
    res.status(404);
    throw new Error('点検が見つかりません');
  }
});

module.exports = {
  updateInspection
};
