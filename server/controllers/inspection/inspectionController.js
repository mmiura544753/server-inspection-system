// server/controllers/inspection/inspectionController.js (ORM版)
const asyncHandler = require("express-async-handler");
const {
  Inspection,
  Device,
  Customer,
  InspectionResult,
  InspectionItem,
  InspectionItemName,
} = require("../../models");
const { Op } = require("sequelize");

// @desc    全点検情報の取得
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
    order: [
      ["inspection_date", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  // レスポンス形式を調整（顧客名を追加）
  const formattedInspections = inspections.map((inspection) => {
    return {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: inspection.device_id,
      device_name: inspection.device ? inspection.device.device_name : null,
      customer_id: inspection.device ? inspection.device.customer_id : null,
      customer_name:
        inspection.device && inspection.device.customer
          ? inspection.device.customer.customer_name
          : null,
      status: inspection.status,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at,
    };
  });

  res.json(formattedInspections);
});

// @desc    点検IDによる点検情報の取得
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
      },
    ],
  });

  if (inspection) {
    // レスポンス形式を調整
    const formattedResults = inspection.results.map((result) => {
      return {
        id: result.id,
        inspection_item_id: result.inspection_item_id,
        // 直接保存されたcheck_itemフィールドを使用
        check_item: result.check_item,
        status: result.status,
        checked_at: result.checked_at,
        device_id: inspection.device_id,
        device_name: inspection.device ? inspection.device.device_name : null,
      };
    });

    const formattedInspection = {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: inspection.device_id,
      device_name: inspection.device ? inspection.device.device_name : null,
      customer_id: inspection.device ? inspection.device.customer_id : null,
      customer_name:
        inspection.device && inspection.device.customer
          ? inspection.device.customer.customer_name
          : null,
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

// @desc    機器IDによる点検情報の取得
// @route   GET /api/devices/:deviceId/inspections
// @access  Public
const getInspectionsByDeviceId = asyncHandler(async (req, res) => {
  const deviceId = req.params.deviceId;

  // 機器の存在確認
  const device = await Device.findByPk(deviceId, {
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

  // 指定された機器IDの点検データを検索
  const inspections = await Inspection.findAll({
    where: { device_id: deviceId },
    order: [
      ["inspection_date", "DESC"],
      ["created_at", "DESC"],
    ],
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

// @desc    機器IDによる最新の点検情報の取得
// @route   GET /api/devices/:deviceId/inspections/latest
// @access  Public
const getLatestInspectionByDeviceId = asyncHandler(async (req, res) => {
  const deviceId = req.params.deviceId;

  // 機器の存在確認
  const device = await Device.findByPk(deviceId, {
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

  // 指定された機器IDの最新点検データを検索
  const latestInspection = await Inspection.findOne({
    where: { device_id: deviceId },
    include: [
      {
        model: InspectionResult,
        as: "results",
      },
    ],
    order: [
      ["inspection_date", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  if (latestInspection) {
    // レスポンス形式を調整
    const formattedResults = latestInspection.results.map((result) => {
      return {
        id: result.id,
        inspection_item_id: result.inspection_item_id,
        // 直接保存されたcheck_itemフィールドを使用
        check_item: result.check_item,
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
      device_id: device.id,
      device_name: device.device_name,
      customer_id: device.customer.id,
      customer_name: device.customer.customer_name,
      status: latestInspection.status,
      results: formattedResults,
      created_at: latestInspection.created_at,
      updated_at: latestInspection.updated_at,
    };

    res.json(formattedInspection);
  } else {
    res.status(404);
    throw new Error("点検データが見つかりません");
  }
});

module.exports = {
  getInspections,
  getInspectionById,
  getInspectionsByDeviceId,
  getLatestInspectionByDeviceId,
};
