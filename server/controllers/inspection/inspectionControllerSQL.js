// server/controllers/inspection/inspectionControllerSQL.js
const asyncHandler = require('express-async-handler');
const db = require('../../utils/db');

// @desc    全点検の取得（SQLを使用）
// @route   GET /api/inspections
// @access  Public
const getInspections = asyncHandler(async (req, res) => {
  // SQLクエリで複数テーブルを結合して点検情報を取得
  const sql = `
    SELECT 
      i.id, i.inspection_date, i.start_time, i.end_time, i.inspector_name, 
      i.device_id, i.status, i.created_at, i.updated_at,
      d.device_name, d.customer_id,
      c.customer_name
    FROM 
      inspections i
    JOIN 
      devices d ON i.device_id = d.id
    JOIN 
      customers c ON d.customer_id = c.id
    ORDER BY 
      i.inspection_date DESC, i.created_at DESC
  `;

  const inspections = await db.query(sql);

  // 日付フォーマットを調整
  const formattedInspections = inspections.map(inspection => {
    return {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: inspection.device_id,
      device_name: inspection.device_name,
      customer_id: inspection.customer_id,
      customer_name: inspection.customer_name,
      status: inspection.status,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at
    };
  });

  res.json(formattedInspections);
});

// @desc    点検IDによる点検の取得（SQLを使用）
// @route   GET /api/inspections/:id
// @access  Public
const getInspectionById = asyncHandler(async (req, res) => {
  // 点検データの取得
  const inspectionSql = `
    SELECT 
      i.id, i.inspection_date, i.start_time, i.end_time, i.inspector_name, 
      i.device_id, i.status, i.created_at, i.updated_at,
      d.device_name, d.customer_id,
      c.customer_name
    FROM 
      inspections i
    JOIN 
      devices d ON i.device_id = d.id
    JOIN 
      customers c ON d.customer_id = c.id
    WHERE 
      i.id = ?
  `;

  const inspection = await db.queryOne(inspectionSql, [req.params.id]);

  if (!inspection) {
    res.status(404);
    throw new Error('点検が見つかりません');
  }

  // 点検結果の取得
  const resultsSql = `
    SELECT 
      r.id, r.inspection_item_id, r.status, r.checked_at,
      ii.item_name as check_item
    FROM 
      inspection_results r
    JOIN 
      inspection_items ii ON r.inspection_item_id = ii.id
    WHERE 
      r.inspection_id = ?
  `;

  const results = await db.query(resultsSql, [req.params.id]);

  // レスポンス形式を調整
  const formattedResults = results.map(result => {
    return {
      id: result.id,
      inspection_item_id: result.inspection_item_id,
      check_item: result.check_item,
      status: result.status,
      checked_at: result.checked_at,
      device_id: inspection.device_id,
      device_name: inspection.device_name
    };
  });

  const formattedInspection = {
    id: inspection.id,
    inspection_date: inspection.inspection_date,
    start_time: inspection.start_time,
    end_time: inspection.end_time,
    inspector_name: inspection.inspector_name,
    device_id: inspection.device_id,
    device_name: inspection.device_name,
    customer_id: inspection.customer_id,
    customer_name: inspection.customer_name,
    status: inspection.status,
    results: formattedResults,
    created_at: inspection.created_at,
    updated_at: inspection.updated_at
  };

  res.json(formattedInspection);
});

// @desc    機器IDによる点検の取得（SQLを使用）
// @route   GET /api/devices/:deviceId/inspections
// @access  Public
const getInspectionsByDeviceId = asyncHandler(async (req, res) => {
  const deviceId = req.params.deviceId;

  // まず機器が存在するか確認
  const deviceSql = `
    SELECT 
      d.id, d.device_name, d.customer_id,
      c.customer_name
    FROM 
      devices d
    JOIN
      customers c ON d.customer_id = c.id
    WHERE 
      d.id = ?
  `;

  const device = await db.queryOne(deviceSql, [deviceId]);

  if (!device) {
    res.status(404);
    throw new Error('機器が見つかりません');
  }

  // 機器に関連する点検を取得
  const inspectionsSql = `
    SELECT 
      id, inspection_date, start_time, end_time, inspector_name, 
      device_id, status, created_at, updated_at
    FROM 
      inspections
    WHERE 
      device_id = ?
    ORDER BY 
      inspection_date DESC, created_at DESC
  `;

  const inspections = await db.query(inspectionsSql, [deviceId]);

  // レスポンス形式を調整
  const formattedInspections = inspections.map(inspection => {
    return {
      id: inspection.id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: device.id,
      device_name: device.device_name,
      customer_id: device.customer_id,
      customer_name: device.customer_name,
      status: inspection.status,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at
    };
  });

  res.json(formattedInspections);
});

// @desc    機器IDによる最新の点検結果を取得（SQLを使用）
// @route   GET /api/devices/:deviceId/inspections/latest
// @access  Public
const getLatestInspectionByDeviceId = asyncHandler(async (req, res) => {
  const deviceId = req.params.deviceId;

  // まず機器が存在するか確認
  const deviceSql = `
    SELECT 
      d.id, d.device_name, d.customer_id,
      c.customer_name
    FROM 
      devices d
    JOIN
      customers c ON d.customer_id = c.id
    WHERE 
      d.id = ?
  `;

  const device = await db.queryOne(deviceSql, [deviceId]);

  if (!device) {
    res.status(404);
    throw new Error('指定された機器が存在しません');
  }

  // 最新の点検を取得
  const latestInspectionSql = `
    SELECT 
      id, inspection_date, start_time, end_time, inspector_name, 
      device_id, status, created_at, updated_at
    FROM 
      inspections
    WHERE 
      device_id = ?
    ORDER BY 
      inspection_date DESC, created_at DESC
    LIMIT 1
  `;

  const latestInspection = await db.queryOne(latestInspectionSql, [deviceId]);

  if (!latestInspection) {
    res.status(404);
    throw new Error('点検データが見つかりません');
  }

  // 点検結果の取得
  const resultsSql = `
    SELECT 
      r.id, r.inspection_item_id, r.status, r.checked_at,
      ii.item_name as check_item
    FROM 
      inspection_results r
    JOIN 
      inspection_items ii ON r.inspection_item_id = ii.id
    WHERE 
      r.inspection_id = ?
  `;

  const results = await db.query(resultsSql, [latestInspection.id]);

  // レスポンス形式を調整
  const formattedResults = results.map(result => {
    return {
      id: result.id,
      inspection_item_id: result.inspection_item_id,
      check_item: result.check_item,
      status: result.status,
      checked_at: result.checked_at
    };
  });

  const formattedInspection = {
    id: latestInspection.id,
    inspection_date: latestInspection.inspection_date,
    start_time: latestInspection.start_time,
    end_time: latestInspection.end_time,
    inspector_name: latestInspection.inspector_name,
    device_id: latestInspection.device_id,
    device_name: device.device_name,
    customer_id: device.customer_id,
    customer_name: device.customer_name,
    status: latestInspection.status,
    results: formattedResults,
    created_at: latestInspection.created_at,
    updated_at: latestInspection.updated_at
  };

  res.json(formattedInspection);
});

module.exports = {
  getInspections,
  getInspectionById,
  getInspectionsByDeviceId,
  getLatestInspectionByDeviceId
};
