// server/controllers/inspection/inspectionCreateController.js
const asyncHandler = require('express-async-handler');
const { Inspection, Device, Customer, InspectionResult, InspectionItem } = require('../../models');
const { sequelize } = require('../../config/db');

// @desc    新規点検の作成
// @route   POST /api/inspections
// @access  Public
const createInspection = asyncHandler(async (req, res) => {
  const { inspection_date, start_time, end_time, inspector_name, device_id, results, status = '完了' } = req.body;
  
  // 必須フィールドのチェック
  if (!inspection_date || !inspector_name || !device_id) {
    res.status(400);
    throw new Error('必須フィールドが不足しています');
  }
  
  // 機器の存在確認
  const deviceExists = await Device.findByPk(device_id, {
    include: [
      {
        model: Customer,
        as: 'customer'
      }
    ]
  });
  
  if (!deviceExists) {
    res.status(400);
    throw new Error('指定された機器が存在しません');
  }
  
  // 結果が空でないことを確認
  if (!results || results.length === 0) {
    res.status(400);
    throw new Error('少なくとも1つの点検結果が必要です');
  }
  
  // 点検項目の存在確認と結果の検証
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
  
  // トランザクションを使用して点検と結果を保存
  const transaction = await sequelize.transaction();
  
  try {
    // 点検レコードを作成
    const inspection = await Inspection.create({
      inspection_date,
      start_time,
      end_time,
      inspector_name,
      device_id,
      status
    }, { transaction });
    
    // 点検結果を作成
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
        device_id: deviceExists.id,
        device_name: deviceExists.device_name
      });
    }
    
    // コミット
    await transaction.commit();
    
    // レスポンス形式を調整
    const formattedInspection = {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: deviceExists.id,
      device_name: deviceExists.device_name,
      customer_id: deviceExists.customer.id,
      customer_name: deviceExists.customer.customer_name,
      status: inspection.status,
      results: inspectionResults,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at
    };
    
    res.status(201).json(formattedInspection);
  } catch (error) {
    // ロールバック
    await transaction.rollback();
    console.error('点検作成エラー:', error);
    throw error;
  }
});

module.exports = {
  createInspection
};
