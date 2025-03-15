// server/controllers/inspection/inspectionCreateController.js
const asyncHandler = require('express-async-handler');
const { sequelize, Inspection, Device, Customer, InspectionItem, InspectionResult } = require('../../models');

// @desc    新規点検の作成
// @route   POST /api/inspections
// @access  Public
const createInspection = asyncHandler(async (req, res) => {
  const { inspection_date, start_time, end_time, inspector_name, device_id, results, status } = req.body;
  
  // 必須フィールドのチェック
  if (!inspection_date || !inspector_name || !device_id) {
    res.status(400);
    throw new Error('必須フィールドが不足しています');
  }
  
  // 機器の存在確認
  const deviceExists = await Device.findByPk(device_id);
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
    const inspectionItemExists = await InspectionItem.findByPk(result.inspection_item_id);
    if (!inspectionItemExists) {
      res.status(400);
      throw new Error(`点検項目ID ${result.inspection_item_id} が存在しません`);
    }
    
    if (!result.status || !['正常', '異常'].includes(result.status)) {
      res.status(400);
      throw new Error('点検結果ステータスは"正常"または"異常"である必要があります');
    }
  }
  
  // トランザクションを開始
  const t = await sequelize.transaction();
  
  try {
    // 点検を作成
    const inspection = await Inspection.create({
      inspection_date,
      start_time,
      end_time,
      inspector_name,
      device_id,
      status: status || '完了'
    }, { transaction: t });
    
    // 点検結果を作成
    for (const result of results) {
      await InspectionResult.create({
        inspection_id: inspection.id,
        inspection_item_id: result.inspection_item_id,
        status: result.status
      }, { transaction: t });
    }
    
    // トランザクションをコミット
    await t.commit();
    
    // 作成した点検を詳細情報と共に取得
    const createdInspection = await Inspection.findByPk(inspection.id, {
      include: [
        {
          model: Device,
          as: 'device',
          attributes: ['id', 'device_name', 'customer_id'],
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: ['id', 'customer_name']
            }
          ]
        },
        {
          model: InspectionResult,
          as: 'results',
          include: [
            {
              model: InspectionItem,
              as: 'inspection_item',
              attributes: ['id', 'item_name']
            }
          ]
        }
      ]
    });
    
    // 結果データを整形
    const formattedResults = createdInspection.results.map(result => {
      return {
        id: result.id,
        inspection_item_id: result.inspection_item_id,
        check_item: result.inspection_item.item_name,
        status: result.status,
        checked_at: result.checked_at,
        device_id: createdInspection.device_id,
        device_name: createdInspection.device.device_name
      };
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
      results: formattedResults,
      created_at: createdInspection.created_at,
      updated_at: createdInspection.updated_at
    };
    
    res.status(201).json(formattedInspection);
    
  } catch (error) {
    // エラーが発生した場合はロールバック
    await t.rollback();
    
    if (error.name === 'SequelizeValidationError') {
      res.status(400);
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
});

module.exports = {
  createInspection
};
