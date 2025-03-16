// server/controllers/inspection/inspectionController.js
const asyncHandler = require("express-async-handler");
const {
  Inspection,
  Device,
  Customer,
  InspectionItem,
  InspectionResult,
} = require("../../models");

// @desc    全点検の取得
// @route   GET /api/inspections
// @access  Public
const getInspections = asyncHandler(async (req, res) => {
  const inspections = await Inspection.findAll({
    include: [
      {
        model: Device,
        as: "device",
        attributes: ["id", "device_name", "customer_id"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "customer_name"],
          },
        ],
      },
    ],
    order: [["inspection_date", "DESC"]], // 最新の点検を先に表示
  });

  // レスポンス形式を調整
  const formattedInspections = inspections.map((inspection) => {
    return {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: inspection.device_id,
      device_name: inspection.device.device_name,
      customer_id: inspection.device.customer_id,
      customer_name: inspection.device.customer.customer_name,
      status: inspection.status,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at,
    };
  });

  res.json(formattedInspections);
});

// @desc    点検IDによる点検の取得
// @route   GET /api/inspections/:id
// @access  Public
const getInspectionById = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findByPk(req.params.id, {
    include: [
      {
        model: Device,
        as: "device",
        attributes: ["id", "device_name", "customer_id"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "customer_name"],
          },
        ],
      },
      {
        model: InspectionResult,
        as: "results",
        include: [
          {
            model: InspectionItem,
            as: "inspection_item",
            attributes: ["id", "item_name"],
          },
        ],
      },
    ],
  });

  if (inspection) {
    // 結果データを整形
    const formattedResults = inspection.results.map((result) => {
      return {
        id: result.id,
        inspection_item_id: result.inspection_item_id,
        check_item: result.inspection_item.item_name,
        status: result.status,
        checked_at: result.checked_at,
        device_id: inspection.device_id,
        device_name: inspection.device.device_name,
      };
    });

    // レスポンス形式を調整
    const formattedInspection = {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: inspection.device_id,
      device_name: inspection.device.device_name,
      customer_id: inspection.device.customer.id,
      customer_name: inspection.device.customer.customer_name,
      status: inspection.status,
      results: formattedResults,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at,
    };

    res.json(formattedInspection);
  } else {
    res.status(404);
    throw new Error("点検が見つかりません");
  }
});

// @desc    機器IDによる点検の取得
// @route   GET /api/devices/:deviceId/inspections
// @access  Public
const getInspectionsByDeviceId = asyncHandler(async (req, res) => {
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

  const inspections = await Inspection.findAll({
    where: { device_id: req.params.deviceId },
    order: [["inspection_date", "DESC"]],
  });

  // レスポンス形式を調整
  const formattedInspections = inspections.map((inspection) => {
    return {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: device.id,
      device_name: device.device_name,
      customer_id: device.customer.id,
      customer_name: device.customer.customer_name,
      status: inspection.status,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at,
    };
  });

  res.json(formattedInspections);
});

// 機器IDによる最新の点検結果を取得
const getLatestInspectionByDeviceId = asyncHandler(async (req, res) => {
  const deviceId = req.params.deviceId;

  const device = await Device.findByPk(deviceId);
  if (!device) {
    res.status(404);
    throw new Error("指定された機器が存在しません");
  }

  // 最新の点検を取得
  const latestInspection = await Inspection.findOne({
    where: { device_id: deviceId },
    include: [
      {
        model: Device,
        as: "device",
        attributes: ["id", "device_name", "customer_id"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "customer_name"],
          },
        ],
      },
      {
        model: InspectionResult,
        as: "results",
        include: [
          {
            model: InspectionItem,
            as: "inspection_item",
            attributes: ["id", "item_name"],
          },
        ],
      },
    ],
    order: [
      ["inspection_date", "DESC"],
      ["created_at", "DESC"],
    ],
    limit: 1,
  });

  if (!latestInspection) {
    res.status(404);
    throw new Error("点検データが見つかりません");
  }

  // レスポンス形式を調整
  const formattedResults = latestInspection.results.map((result) => {
    return {
      id: result.id,
      inspection_item_id: result.inspection_item_id,
      check_item: result.inspection_item.item_name,
      status: result.status,
      checked_at: result.checked_at,
    };
  });

  const formattedInspection = {
    id: latestInspection.id,
    inspection_date: latestInspection.inspection_date,
    start_time: latestInspection.start_time,
    end_time: latestInspection.end_time,
    inspector_name: latestInspection.inspector_name,
    device_id: latestInspection.device_id,
    device_name: latestInspection.device.device_name,
    customer_id: latestInspection.device.customer.id,
    customer_name: latestInspection.device.customer.customer_name,
    status: latestInspection.status,
    results: formattedResults,
    created_at: latestInspection.created_at,
    updated_at: latestInspection.updated_at,
  };

  res.json(formattedInspection);
});

// server/controllers/inspection/index.js にエクスポートを追加
module.exports = {
  getInspections,
  getInspectionById,
  getInspectionsByDeviceId,
  getLatestInspectionByDeviceId,
};
