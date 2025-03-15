// server/controllers/deviceController.js
const asyncHandler = require('express-async-handler');
const Device = require('../models/Device');
const Customer = require('../models/Customer');

// @desc    全機器情報の取得
// @route   GET /api/devices
// @access  Public
const getDevices = asyncHandler(async (req, res) => {
  const devices = await Device.find({})
    .populate('customer_id', 'customer_name')
    .sort({ device_name: 1 });
  
  // レスポンス形式を調整（顧客名を追加）
  const formattedDevices = devices.map(device => {
    return {
      id: device._id,
      device_name: device.device_name,
      customer_name: device.customer_id ? device.customer_id.customer_name : null,
      customer_id: device.customer_id ? device.customer_id._id : null,
      model: device.model,
      location: device.location,
      device_type: device.device_type,
      hardware_type: device.hardware_type,
      created_at: device.created_at,
      updated_at: device.updated_at
    };
  });
  
  res.json(formattedDevices);
});

// @desc    機器IDによる機器情報の取得
// @route   GET /api/devices/:id
// @access  Public
const getDeviceById = asyncHandler(async (req, res) => {
  const device = await Device.findById(req.params.id)
    .populate('customer_id', 'customer_name');
  
  if (device) {
    // レスポンス形式を調整（顧客名を追加）
    const formattedDevice = {
      id: device._id,
      device_name: device.device_name,
      customer_name: device.customer_id ? device.customer_id.customer_name : null,
      customer_id: device.customer_id ? device.customer_id._id : null,
      model: device.model,
      location: device.location,
      device_type: device.device_type,
      hardware_type: device.hardware_type,
      created_at: device.created_at,
      updated_at: device.updated_at
    };
    
    res.json(formattedDevice);
  } else {
    res.status(404);
    throw new Error('機器が見つかりません');
  }
});

// @desc    顧客IDによる機器情報の取得
// @route   GET /api/customers/:customerId/devices
// @access  Public
const getDevicesByCustomerId = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.customerId);
  
  if (!customer) {
    res.status(404);
    throw new Error('顧客が見つかりません');
  }
  
  const devices = await Device.find({ customer_id: req.params.customerId })
    .sort({ device_name: 1 });
  
  // レスポンス形式を調整
  const formattedDevices = devices.map(device => {
    return {
      id: device._id,
      device_name: device.device_name,
      customer_name: customer.customer_name,
      customer_id: customer._id,
      model: device.model,
      location: device.location,
      device_type: device.device_type,
      hardware_type: device.hardware_type,
      created_at: device.created_at,
      updated_at: device.updated_at
    };
  });
  
  res.json(formattedDevices);
});

// @desc    新規機器の作成
// @route   POST /api/devices
// @access  Public
const createDevice = asyncHandler(async (req, res) => {
  const { customer_id, device_name, model, location, device_type, hardware_type } = req.body;
  
  // 必須フィールドのチェック
  if (!customer_id || !device_name || !device_type || !hardware_type) {
    res.status(400);
    throw new Error('必須フィールドが不足しています');
  }
  
  // 顧客の存在確認
  const customerExists = await Customer.findById(customer_id);
  if (!customerExists) {
    res.status(400);
    throw new Error('指定された顧客が存在しません');
  }
  
  // 機器を作成
  const device = await Device.create({
    customer_id,
    device_name,
    model,
    location,
    device_type,
    hardware_type
  });
  
  if (device) {
    const populatedDevice = await Device.findById(device._id)
      .populate('customer_id', 'customer_name');
    
    // レスポンス形式を調整
    const formattedDevice = {
      id: populatedDevice._id,
      device_name: populatedDevice.device_name,
      customer_name: populatedDevice.customer_id.customer_name,
      customer_id: populatedDevice.customer_id._id,
      model: populatedDevice.model,
      location: populatedDevice.location,
      device_type: populatedDevice.device_type,
      hardware_type: populatedDevice.hardware_type,
      created_at: populatedDevice.created_at,
      updated_at: populatedDevice.updated_at
    };
    
    res.status(201).json(formattedDevice);
  } else {
    res.status(400);
    throw new Error('無効な機器データです');
  }
});

// @desc    機器情報の更新
// @route   PUT /api/devices/:id
// @access  Public
const updateDevice = asyncHandler(async (req, res) => {
  const { customer_id, device_name, model, location, device_type, hardware_type } = req.body;
  
  const device = await Device.findById(req.params.id);
  
  if (device) {
    // 顧客IDが変更された場合、新しい顧客の存在確認
    if (customer_id && customer_id !== device.customer_id.toString()) {
      const customerExists = await Customer.findById(customer_id);
      if (!customerExists) {
        res.status(400);
        throw new Error('指定された顧客が存在しません');
      }
    }
    
    device.customer_id = customer_id || device.customer_id;
    device.device_name = device_name || device.device_name;
    device.model = model !== undefined ? model : device.model;
    device.location = location !== undefined ? location : device.location;
    device.device_type = device_type || device.device_type;
    device.hardware_type = hardware_type || device.hardware_type;
    
    const updatedDevice = await device.save();
    const populatedDevice = await Device.findById(updatedDevice._id)
      .populate('customer_id', 'customer_name');
    
    // レスポンス形式を調整
    const formattedDevice = {
      id: populatedDevice._id,
      device_name: populatedDevice.device_name,
      customer_name: populatedDevice.customer_id.customer_name,
      customer_id: populatedDevice.customer_id._id,
      model: populatedDevice.model,
      location: populatedDevice.location,
      device_type: populatedDevice.device_type,
      hardware_type: populatedDevice.hardware_type,
      created_at: populatedDevice.created_at,
      updated_at: populatedDevice.updated_at
    };
    
    res.json(formattedDevice);
  } else {
    res.status(404);
    throw new Error('機器が見つかりません');
  }
});

// @desc    機器の削除
// @route   DELETE /api/devices/:id
// @access  Public
const deleteDevice = asyncHandler(async (req, res) => {
  const device = await Device.findById(req.params.id);
  
  if (device) {
    await device.deleteOne();
    res.json({ message: '機器を削除しました' });
  } else {
    res.status(404);
    throw new Error('機器が見つかりません');
  }
});

module.exports = {
  getDevices,
  getDeviceById,
  getDevicesByCustomerId,
  createDevice,
  updateDevice,
  deleteDevice
};
