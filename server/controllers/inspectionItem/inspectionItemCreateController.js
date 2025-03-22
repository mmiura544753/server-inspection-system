// server/controllers/inspectionItem/inspectionItemCreateController.js
const asyncHandler = require('express-async-handler');
const { InspectionItem, Device, Customer, InspectionItemName } = require('../../models');

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
    // 点検項目名の取得または作成
    let itemNameRecord;
    try {
      // 既存の点検項目名を検索
      itemNameRecord = await InspectionItemName.findOne({
        where: { name: item_name }
      });
      
      // 存在しない場合は新規作成
      if (!itemNameRecord) {
        console.log(`新規点検項目名を作成します: ${item_name}`);
        itemNameRecord = await InspectionItemName.create({
          name: item_name
        });
      }
    } catch (err) {
      console.error('点検項目名の取得/作成エラー:', err);
      res.status(500);
      throw new Error('点検項目名の処理中にエラーが発生しました');
    }
    
    // 重複チェック
    const existingItem = await InspectionItem.findOne({
      where: {
        device_id,
        item_name_id: itemNameRecord.id
      }
    });

    if (existingItem) {
      res.status(400);
      throw new Error('同じ機器に対して同じ点検項目名がすでに存在します');
    }

    // 点検項目を作成
    const item = await InspectionItem.create({
      device_id,
      item_name_id: itemNameRecord.id,
      item_name: item_name // レガシーフィールドにも保存
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
    // Sequelizeのユニーク制約違反のエラーをキャッチ
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400);
      throw new Error('同じ機器に対して同じ点検項目名がすでに存在します');
    }
    
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