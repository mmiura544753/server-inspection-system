// server/controllers/inspectionItem/inspectionItemController.js
const asyncHandler = require("express-async-handler");
const {
  InspectionItem,
  Device,
  Customer,
  InspectionItemName,
} = require("../../models");

// @desc    全点検項目の取得
// @route   GET /api/inspection-items
// @access  Public
const getInspectionItems = asyncHandler(async (req, res) => {
  const items = await InspectionItem.findAll({
    include: [
      {
        model: Device,
        as: "device",
        attributes: ["id", "device_name", "customer_id", "rack_number", "unit_start_position", "unit_end_position", "model"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "customer_name"],
          },
        ],
      },
      {
        model: InspectionItemName,
        as: "item_name_master",
        attributes: ["id", "name"],
      },
    ],
    order: [
      [{ model: InspectionItemName, as: "item_name_master" }, "name", "ASC"],
    ],
  });

  // レスポンス形式を調整
  const formattedItems = items.map((item) => {
    // デバイスが null の場合があるため、安全にアクセス
    const device = item.device || {};
    const customer = device.customer || {};
    
    return {
      id: item.id,
      item_name: item.item_name_master ? item.item_name_master.name : "",
      item_name_id: item.item_name_id,
      device_id: item.device_id,
      device_name: device.device_name || null,
      rack_number: device.rack_number || null,
      unit_start_position: device.unit_start_position || null,
      unit_end_position: device.unit_end_position || null,
      model: device.model || null,
      customer_id: customer.id || null,
      customer_name: customer.customer_name || null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  });

  res.json(formattedItems);
});

// @desc    点検項目IDによる点検項目の取得
// @route   GET /api/inspection-items/:id
// @access  Public
const getInspectionItemById = asyncHandler(async (req, res) => {
  const item = await InspectionItem.findByPk(req.params.id, {
    include: [
      {
        model: Device,
        as: "device",
        attributes: ["id", "device_name", "customer_id", "rack_number", "unit_start_position", "unit_end_position", "model"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "customer_name"],
          },
        ],
      },
      {
        model: InspectionItemName,
        as: "item_name_master",
        attributes: ["id", "name"],
      },
    ],
  });

  if (item) {
    // レスポンス形式を調整
    // デバイスが null の場合があるため、安全にアクセス
    const device = item.device || {};
    const customer = device.customer || {};
    
    const formattedItem = {
      id: item.id,
      item_name: item.item_name_master ? item.item_name_master.name : "",
      item_name_id: item.item_name_id,
      device_id: item.device_id,
      device_name: device.device_name || null,
      rack_number: device.rack_number || null,
      unit_start_position: device.unit_start_position || null,
      unit_end_position: device.unit_end_position || null,
      model: device.model || null,
      customer_id: customer.id || null,
      customer_name: customer.customer_name || null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    res.json(formattedItem);
  } else {
    res.status(404);
    throw new Error("点検項目が見つかりません");
  }
});

// @desc    機器IDによる点検項目の取得
// @route   GET /api/devices/:deviceId/inspection-items
// @access  Public
const getInspectionItemsByDeviceId = asyncHandler(async (req, res) => {
  const device = await Device.findByPk(req.params.deviceId, {
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "customer_name"],
      },
    ],
  });

  if (!device) {
    res.status(404);
    throw new Error("機器が見つかりません");
  }

  const items = await InspectionItem.findAll({
    where: { device_id: req.params.deviceId },
    include: [
      {
        model: InspectionItemName,
        as: "item_name_master",
        attributes: ["id", "name"],
      },
    ],
    order: [
      [{ model: InspectionItemName, as: "item_name_master" }, "name", "ASC"],
    ],
  });

  // レスポンス形式を調整
  const formattedItems = items.map((item) => {
    return {
      id: item.id,
      item_name: item.item_name_master ? item.item_name_master.name : "",
      item_name_id: item.item_name_id,
      device_id: device.id,
      device_name: device.device_name,
      rack_number: device.rack_number || null,
      unit_start_position: device.unit_start_position || null,
      unit_end_position: device.unit_end_position || null,
      model: device.model || null,
      customer_id: device.customer.id,
      customer_name: device.customer.customer_name,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  });

  res.json(formattedItems);
});

module.exports = {
  getInspectionItems,
  getInspectionItemById,
  getInspectionItemsByDeviceId,
};
