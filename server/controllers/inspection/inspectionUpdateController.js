// server/controllers/inspection/inspectionUpdateController.js
const asyncHandler = require('express-async-handler');
const { sequelize, Inspection, Device, Customer, InspectionItem, InspectionResult } = require('../../models');

// @desc    点検の更新
// @route   PUT /api/inspections/:id
// @access  Public
const updateInspection = asyncHandler(async (req, res) => {
  const { inspection_date, start_time, end_time, inspector_name, device_id, results, status } = req.body;
  
  const inspection = await Inspection.findByPk(req.params.id);
  
  if (!inspection) {
    res.status(404);
    throw new Error('点検が見つかりません');
  }
  
  // 機器IDが変更された場合、新しい機器の存在確認
  if (device_id && device_id !== inspection.device_id) {
    const deviceExists = await Device.findByPk(device_id);
    if (!deviceExists) {
      res.status(400);
      throw new Error('指定された機器が存在しません');
    }
  }
  
  // 結果を更新する場合、点検項目の存在確認と結果の検証
  if (results && results.length > 0) {
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
  }
  
  // トランザクションを開始
  const t = await sequelize.transaction();
  
  try {
    // 点検を更新
    inspection.inspection_date = inspection_date || inspection.inspection_date;
    inspection.start_time = start_time !== undefined ? start_time : inspection.start_time;
    inspection.end_time = end_time !== undefined ? end_time : inspection.end_time;
    inspection.inspector_name = inspector_name || inspection.inspector_name;
    inspection.device_id = device_id || inspection.device_id;
    inspection.status = status || inspection.status;
    
    await inspection.save({ transaction: t });
    
    // 結果を更新
    if (results && results.length > 0) {
      // 既存の結果を削除
      await InspectionResult.destroy({
        where: { inspection_id: inspection.id },
        transaction: t
      });
      
      // 新しい結果を作成
      for (const result of results) {
        await InspectionResult.create({
          inspection_id: inspection.id,
          inspection_item_id: result.inspection_item_id,
          status: result.status
        }, { transaction: t });
      }
    }
    
    // トランザクションをコミット
    await t.commit();
    
    // 更新した点検を詳細情報と共に取得
    const updatedInspection = await Inspection.findByPk(inspection.id, {
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
      results: formattedResults,
      created_at: updatedInspection.created_at,
      updated_at: updatedInspection.updated_at
    };
    
    res.json(formattedInspection);
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
  updateInspection
};
