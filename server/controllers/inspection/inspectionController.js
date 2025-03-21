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
  // device_idカラムを明示的に指定せずに取得
  const inspections = await Inspection.findAll({
    attributes: ['id', 'inspection_date', 'start_time', 'end_time', 'inspector_name', 'status', 'created_at', 'updated_at'],
    include: [
      {
        model: InspectionResult,
        as: "results",
        include: [
          {
            model: InspectionItem,
            as: "inspection_item",
            include: [
              {
                model: Device,
                as: "device",
                include: [
                  {
                    model: Customer,
                    as: "customer",
                    attributes: ["id", "customer_name"],
                  },
                ],
              },
            ],
          },
        ],
        limit: 1, // 結果は1つだけ取得（顧客名取得用）
      },
    ],
    order: [
      ["inspection_date", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  // レスポンス形式を調整
  const formattedInspections = inspections.map((inspection) => {
    // 最初の結果から関連するデバイスと顧客情報を取得
    const firstResult = inspection.results && inspection.results.length > 0 ? inspection.results[0] : null;
    const device = firstResult?.inspection_item?.device || null;
    const customer = device?.customer || null;

    return {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      customer_id: customer?.id || null,
      customer_name: customer?.customer_name || null,
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
    attributes: ['id', 'inspection_date', 'start_time', 'end_time', 'inspector_name', 'status', 'created_at', 'updated_at'],
    include: [
      {
        model: InspectionResult,
        as: "results",
        include: [
          {
            model: InspectionItem,
            as: "inspection_item",
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
              }
            ]
          }
        ]
      },
    ],
  });

  if (inspection) {
    // レスポンス形式を調整
    const formattedResults = inspection.results.map((result) => {
      const device = result.inspection_item?.device || null;
      return {
        id: result.id,
        inspection_item_id: result.inspection_item_id,
        // 直接保存されたcheck_itemフィールドを使用
        check_item: result.check_item,
        status: result.status,
        checked_at: result.checked_at,
        device_id: device?.id || null,
        device_name: device?.device_name || null,
        customer_id: device?.customer?.id || null,
        customer_name: device?.customer?.customer_name || null,
        // 追加のデバイス情報
        rack_number: device?.rack_number || null,
        unit_position: device ? (
          device.unit_start_position === device.unit_end_position || !device.unit_end_position
            ? `U${device.unit_start_position || ''}`
            : `U${device.unit_start_position || ''}-U${device.unit_end_position || ''}`
        ) : null,
        model: device?.model || null,
      };
    });

    const formattedInspection = {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
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

  // 指定された機器に関連する点検項目を取得
  const inspectionItems = await InspectionItem.findAll({
    where: { device_id: deviceId },
    attributes: ['id'],
  });

  const inspectionItemIds = inspectionItems.map(item => item.id);

  // 点検項目に関連する点検結果を検索
  const inspectionResults = await InspectionResult.findAll({
    where: { 
      inspection_item_id: { [Op.in]: inspectionItemIds } 
    },
    attributes: ['inspection_id'],
    group: ['inspection_id'],
  });

  const inspectionIds = inspectionResults.map(result => result.inspection_id);

  // 関連する点検データを取得
  const inspections = await Inspection.findAll({
    attributes: ['id', 'inspection_date', 'start_time', 'end_time', 'inspector_name', 'status', 'created_at', 'updated_at'],
    where: { 
      id: { [Op.in]: inspectionIds } 
    },
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

  // 指定された機器に関連する点検項目を取得
  const inspectionItems = await InspectionItem.findAll({
    where: { device_id: deviceId },
    attributes: ['id'],
  });

  const inspectionItemIds = inspectionItems.map(item => item.id);

  // 点検項目に関連する点検結果を検索
  const inspectionResults = await InspectionResult.findAll({
    where: { 
      inspection_item_id: { [Op.in]: inspectionItemIds } 
    },
    attributes: ['inspection_id'],
    group: ['inspection_id'],
  });

  const inspectionIds = inspectionResults.map(result => result.inspection_id);

  // 関連する最新の点検データを取得
  const latestInspection = await Inspection.findOne({
    attributes: ['id', 'inspection_date', 'start_time', 'end_time', 'inspector_name', 'status', 'created_at', 'updated_at'],
    where: { 
      id: { [Op.in]: inspectionIds } 
    },
    include: [
      {
        model: InspectionResult,
        as: "results",
        include: [
          {
            model: InspectionItem,
            as: "inspection_item",
            where: { device_id: deviceId },
          }
        ]
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
