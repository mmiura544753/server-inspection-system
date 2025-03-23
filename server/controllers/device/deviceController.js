// server/controllers/device/deviceController.js
const asyncHandler = require("express-async-handler");
const { Device, Customer } = require("../../models");

// @desc    全機器情報の取得
// @route   GET /api/devices
// @access  Public
const getDevices = asyncHandler(async (req, res) => {
  const devices = await Device.findAll({
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "customer_name"],
      },
    ],
    order: [["device_name", "ASC"]],
  });

  // レスポンス形式を調整（顧客名を追加）
  const formattedDevices = devices.map((device) => {
    return {
      id: device.id,
      device_name: device.device_name,
      customer_name: device.customer ? device.customer.customer_name : null,
      customer_id: device.customer_id,
      model: device.model,
      rack_number: device.rack_number,
      unit_position: device.getUnitPositionDisplay(),
      device_type: device.device_type,
      hardware_type: device.hardware_type,
      created_at: device.created_at,
      updated_at: device.updated_at,
    };
  });

  res.json(formattedDevices);
});

// @desc    機器IDによる機器情報の取得
// @route   GET /api/devices/:id
// @access  Public
const getDeviceById = asyncHandler(async (req, res) => {
  const device = await Device.findByPk(req.params.id, {
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "customer_name"],
      },
    ],
  });

  if (device) {
    // レスポンス形式を調整（顧客名を追加）
    const formattedDevice = {
      id: device.id,
      device_name: device.device_name,
      customer_name: device.customer ? device.customer.customer_name : null,
      customer_id: device.customer_id,
      model: device.model,
      rack_number: device.rack_number,
      unit_start_position: device.unit_start_position,
      unit_end_position: device.unit_end_position,
      unit_position: device.getUnitPositionDisplay(), // 関数を使用
      device_type: device.device_type,
      hardware_type: device.hardware_type,
      created_at: device.created_at,
      updated_at: device.updated_at,
    };

    res.json(formattedDevice);
  } else {
    res.status(404);
    throw new Error("機器が見つかりません");
  }
});

// @desc    顧客IDによる機器情報の取得
// @route   GET /api/customers/:customerId/devices
// @access  Public
const getDevicesByCustomerId = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.customerId);

  if (!customer) {
    res.status(404);
    throw new Error("顧客が見つかりません");
  }

  const devices = await Device.findAll({
    where: { customer_id: req.params.customerId },
    order: [["device_name", "ASC"]],
  });

  // レスポンス形式を調整
  const formattedDevices = devices.map((device) => {
    return {
      id: device.id,
      device_name: device.device_name,
      customer_name: customer.customer_name,
      customer_id: customer.id,
      model: device.model,
      rack_number: device.rack_number,
      unit_start_position: device.unit_start_position,
      unit_end_position: device.unit_end_position,
      unit_position: device.getUnitPositionDisplay(), // 関数を使用
      device_type: device.device_type,
      hardware_type: device.hardware_type,
      created_at: device.created_at,
      updated_at: device.updated_at,
    };
  });

  res.json(formattedDevices);
});

module.exports = {
  getDevices,
  getDeviceById,
  getDevicesByCustomerId,
};
