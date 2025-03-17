// server/controllers/device/deviceCreateController.js
const asyncHandler = require('express-async-handler');
const { Device, Customer } = require('../../models');

// @desc    新規機器の作成
// @route   POST /api/devices
// @access  Public
const createDevice = asyncHandler(async (req, res) => {
  const { 
    customer_id, 
    device_name, 
    model, 
    location, 
    unit_position, 
    device_type, 
    hardware_type 
  } = req.body;
  
  // 必須フィールドのチェック
  if (!customer_id || !device_name || !device_type || !hardware_type) {
    res.status(400);
    throw new Error('必須フィールドが不足しています');
  }
  
  // 顧客の存在確認
  const customerExists = await Customer.findByPk(customer_id);
  if (!customerExists) {
    res.status(400);
    throw new Error('指定された顧客が存在しません');
  }
  
  try {
    // 機器を作成
    const device = await Device.create({
      customer_id,
      device_name,
      model,
      location,
      unit_position,
      device_type,
      hardware_type
    });
    
    // 作成した機器を顧客情報と一緒に取得
    const populatedDevice = await Device.findByPk(device.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name']
        }
      ]
    });
    
    // レスポンス形式を調整
    const formattedDevice = {
      id: populatedDevice.id,
      device_name: populatedDevice.device_name,
      customer_name: populatedDevice.customer.customer_name,
      customer_id: populatedDevice.customer_id,
      model: populatedDevice.model,
      location: populatedDevice.location,
      unit_position: populatedDevice.unit_position,
      device_type: populatedDevice.device_type,
      hardware_type: populatedDevice.hardware_type,
      created_at: populatedDevice.created_at,
      updated_at: populatedDevice.updated_at
    };
    
    res.status(201).json(formattedDevice);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(400);
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
});

module.exports = {
  createDevice
};
