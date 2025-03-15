// server/controllers/inspectionItem/inspectionItemCreateController.js
const asyncHandler = require('express-async-handler');
const { InspectionItem, Device, Customer } = require('../../models');

// @desc    新規点検項目の作成
// @route   POST /api/inspection-items
// @access  Public
const createInspectionItem = asyncHandler(async (req, res) => {
  const { device_id, item_name } = req.body;
  
  // 必須フィールドのチェック
  if (!device_id || !item_name) {
    res.status(400);
    throw new Error('必須フィールドが不足しています');
  }
  
  // 機器の存在確認
  const deviceExists = await Device.findByPk(device_id, {
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'customer_name']
      }
    ]
  });
    
  if (!deviceExists) {
    res.status(400);
    throw new Error('指定された機器が存在しません');
  }
  
  try {
    // 点検項目を作成
    const item = await InspectionItem.create({
      device_id,
      item_name
    });
    
    // レスポンス形式を調整
    const formattedItem = {
      id: item.id,
      item_name: item.item_name,
      device_id: deviceExists.id,
      device_name: deviceExists.device_name,
      customer_id: deviceExists.customer.id,
      customer_name: deviceExists.customer.customer_name,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
    
    res.status(201).json(formattedItem);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(400);
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
});

module.exports = {
  createInspectionItem
};
