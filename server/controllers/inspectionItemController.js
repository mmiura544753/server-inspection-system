// server/controllers/inspectionItemController.js
const asyncHandler = require('express-async-handler');
const InspectionItem = require('../models/InspectionItem');
const Device = require('../models/Device');
const Customer = require('../models/Customer');

// @desc    全点検項目の取得
// @route   GET /api/inspection-items
// @access  Public
const getInspectionItems = asyncHandler(async (req, res) => {
  const items = await InspectionItem.find({})
    .populate({
      path: 'device_id',
      select: 'device_name customer_id',
      populate: {
        path: 'customer_id',
        select: 'customer_name'
      }
    })
    .sort({ item_name: 1 });
  
  // レスポンス形式を調整
  const formattedItems = items.map(item => {
    return {
      id: item._id,
      item_name: item.item_name,
      device_id: item.device_id._id,
      device_name: item.device_id.device_name,
      customer_id: item.device_id.customer_id._id,
      customer_name: item.device_id.customer_id.customer_name,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  });
  
  res.json(formattedItems);
});

// @desc    点検項目IDによる点検項目の取得
// @route   GET /api/inspection-items/:id
// @access  Public
const getInspectionItemById = asyncHandler(async (req, res) => {
  const item = await InspectionItem.findById(req.params.id)
    .populate({
      path: 'device_id',
      select: 'device_name customer_id',
      populate: {
        path: 'customer_id',
        select: 'customer_name'
      }
    });
  
  if (item) {
    // レスポンス形式を調整
    const formattedItem = {
      id: item._id,
      item_name: item.item_name,
      device_id: deviceExists._id,
      device_name: deviceExists.device_name,
      customer_id: deviceExists.customer_id._id,
      customer_name: deviceExists.customer_id.customer_name,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
    
    res.status(201).json(formattedItem);
  } else {
    res.status(400);
    throw new Error('無効な点検項目データです');
  }
});

// @desc    点検項目の更新
// @route   PUT /api/inspection-items/:id
// @access  Public
const updateInspectionItem = asyncHandler(async (req, res) => {
  const { device_id, item_name } = req.body;
  
  const item = await InspectionItem.findById(req.params.id);
  
  if (item) {
    // 機器IDが変更された場合、新しい機器の存在確認
    let deviceData = null;
    if (device_id && device_id !== item.device_id.toString()) {
      deviceData = await Device.findById(device_id)
        .populate('customer_id', 'customer_name');
      if (!deviceData) {
        res.status(400);
        throw new Error('指定された機器が存在しません');
      }
    } else {
      deviceData = await Device.findById(item.device_id)
        .populate('customer_id', 'customer_name');
    }
    
    item.device_id = device_id || item.device_id;
    item.item_name = item_name || item.item_name;
    
    const updatedItem = await item.save();
    
    // レスポンス形式を調整
    const formattedItem = {
      id: updatedItem._id,
      item_name: updatedItem.item_name,
      device_id: deviceData._id,
      device_name: deviceData.device_name,
      customer_id: deviceData.customer_id._id,
      customer_name: deviceData.customer_id.customer_name,
      created_at: updatedItem.created_at,
      updated_at: updatedItem.updated_at
    };
    
    res.json(formattedItem);
  } else {
    res.status(404);
    throw new Error('点検項目が見つかりません');
  }
});

// @desc    点検項目の削除
// @route   DELETE /api/inspection-items/:id
// @access  Public
const deleteInspectionItem = asyncHandler(async (req, res) => {
  const item = await InspectionItem.findById(req.params.id);
  
  if (item) {
    await item.deleteOne();
    res.json({ message: '点検項目を削除しました' });
  } else {
    res.status(404);
    throw new Error('点検項目が見つかりません');
  }
});

module.exports = {
  getInspectionItems,
  getInspectionItemById,
  getInspectionItemsByDeviceId,
  createInspectionItem,
  updateInspectionItem,
  deleteInspectionItem
};
      id: item._id,
      item_name: item.item_name,
      device_id: item.device_id._id,
      device_name: item.device_id.device_name,
      customer_id: item.device_id.customer_id._id,
      customer_name: item.device_id.customer_id.customer_name,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
    
    res.json(formattedItem);
  } else {
    res.status(404);
    throw new Error('点検項目が見つかりません');
  }
});

// @desc    機器IDによる点検項目の取得
// @route   GET /api/devices/:deviceId/inspection-items
// @access  Public
const getInspectionItemsByDeviceId = asyncHandler(async (req, res) => {
  const device = await Device.findById(req.params.deviceId)
    .populate('customer_id', 'customer_name');
  
  if (!device) {
    res.status(404);
    throw new Error('機器が見つかりません');
  }
  
  const items = await InspectionItem.find({ device_id: req.params.deviceId })
    .sort({ item_name: 1 });
  
  // レスポンス形式を調整
  const formattedItems = items.map(item => {
    return {
      id: item._id,
      item_name: item.item_name,
      device_id: device._id,
      device_name: device.device_name,
      customer_id: device.customer_id._id,
      customer_name: device.customer_id.customer_name,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  });
  
  res.json(formattedItems);
});

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
  const deviceExists = await Device.findById(device_id)
    .populate('customer_id', 'customer_name');
    
  if (!deviceExists) {
    res.status(400);
    throw new Error('指定された機器が存在しません');
  }
  
  // 点検項目を作成
  const item = await InspectionItem.create({
    device_id,
    item_name
  });
  
  if (item) {
    // レスポンス形式を調整
    const formattedItem = {