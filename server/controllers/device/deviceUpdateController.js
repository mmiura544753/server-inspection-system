// server/controllers/device/deviceUpdateController.js
const asyncHandler = require('express-async-handler');
const { Device, Customer } = require('../../models');

// @desc    機器情報の更新
// @route   PUT /api/devices/:id
// @access  Public
const updateDevice = asyncHandler(async (req, res) => {
  const { 
    customer_id, 
    device_name, 
    model, 
    location, 
    unit_position, 
    device_type, 
    hardware_type 
  } = req.body;
  
  const device = await Device.findByPk(req.params.id);
  
  if (device) {
    // 顧客IDが変更された場合、新しい顧客の存在確認
    if (customer_id && customer_id !== device.customer_id) {
      const customerExists = await Customer.findByPk(customer_id);
      if (!customerExists) {
        res.status(400);
        throw new Error('指定された顧客が存在しません');
      }
    }
    
    try {
      device.customer_id = customer_id || device.customer_id;
      device.device_name = device_name || device.device_name;
      device.model = model !== undefined ? model : device.model;
      device.location = location !== undefined ? location : device.location;
      device.unit_position = unit_position !== undefined ? unit_position : device.unit_position;
      device.device_type = device_type || device.device_type;
      device.hardware_type = hardware_type || device.hardware_type;
      
      await device.save();
      
      // 更新した機器を顧客情報と一緒に取得
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
      
      res.json(formattedDevice);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        res.status(400);
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  } else {
    res.status(404);
    throw new Error('機器が見つかりません');
  }
});

module.exports = {
  updateDevice
};
