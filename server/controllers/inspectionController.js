// server/controllers/inspectionController.js
const asyncHandler = require('express-async-handler');
const Inspection = require('../models/Inspection');
const Device = require('../models/Device');
const InspectionItem = require('../models/InspectionItem');

// @desc    全点検の取得
// @route   GET /api/inspections
// @access  Public
const getInspections = asyncHandler(async (req, res) => {
  const inspections = await Inspection.find({})
    .populate({
      path: 'device_id',
      select: 'device_name customer_id',
      populate: {
        path: 'customer_id',
        select: 'customer_name'
      }
    })
    .sort({ inspection_date: -1 }); // 最新の点検を先に表示
  
  // レスポンス形式を調整
  const formattedInspections = inspections.map(inspection => {
    return {
      id: inspection._id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: inspection.device_id._id,
      device_name: inspection.device_id.device_name,
      customer_id: inspection.device_id.customer_id._id,
      customer_name: inspection.device_id.customer_id.customer_name,
      status: inspection.status,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at
    };
  });
  
  res.json(formattedInspections);
});

// @desc    点検IDによる点検の取得
// @route   GET /api/inspections/:id
// @access  Public
const getInspectionById = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findById(req.params.id)
    .populate({
      path: 'device_id',
      select: 'device_name customer_id',
      populate: {
        path: 'customer_id',
        select: 'customer_name'
      }
    })
    .populate({
      path: 'results.inspection_item_id',
      select: 'item_name'
    });
  
  if (inspection) {
    // 結果データを整形
    const formattedResults = inspection.results.map(result => {
      return {
        id: result._id,
        inspection_item_id: result.inspection_item_id._id,
        check_item: result.inspection_item_id.item_name,
        status: result.status,
        checked_at: result.checked_at,
        device_id: inspection.device_id._id,
        device_name: inspection.device_id.device_name
      };
    });
    
    // レスポンス形式を調整
    const formattedInspection = {
      id: inspection._id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: inspection.device_id._id,
      device_name: inspection.device_id.device_name,
      customer_id: inspection.device_id.customer_id._id,
      customer_name: inspection.device_id.customer_id.customer_name,
      status: inspection.status,
      results: formattedResults,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at
    };
    
    res.json(formattedInspection);
  } else {
    res.status(404);
    throw new Error('点検が見つかりません');
  }
});

// @desc    機器IDによる点検の取得
// @route   GET /api/devices/:deviceId/inspections
// @access  Public
const getInspectionsByDeviceId = asyncHandler(async (req, res) => {
  const device = await Device.findById(req.params.deviceId)
    .populate('customer_id', 'customer_name');
  
  if (!device) {
    res.status(404);
    throw new Error('機器が見つかりません');
  }
  
  const inspections = await Inspection.find({ device_id: req.params.deviceId })
    .sort({ inspection_date: -1 });
  
  // レスポンス形式を調整
  const formattedInspections = inspections.map(inspection => {
    return {
      id: inspection._id,
      inspection_date: inspection.inspection_date,
      start_time: inspection.start_time,
      end_time: inspection.end_time,
      inspector_name: inspection.inspector_name,
      device_id: device._id,
      device_name: device.device_name,
      customer_id: device.customer_id._id,
      customer_name: device.customer_id.customer_name,
      status: inspection.status,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at
    };
  });
  
  res.json(formattedInspections);
});

// @desc    新規点検の作成
// @route   POST /api/inspections
// @access  Public
const createInspection = asyncHandler(async (req, res) => {
  const { inspection_date, start_time, end_time, inspector_name, device_id, results, status } = req.body;
  
  // 必須フィールドのチェック
  if (!inspection_date || !inspector_name || !device_id) {
    res.status(400);
    throw new Error('必須フィールドが不足しています');
  }
  
  // 機器の存在確認
  const deviceExists = await Device.findById(device_id);
  if (!deviceExists) {
    res.status(400);
    throw new Error('指定された機器が存在しません');
  }
  
  // 結果が空でないことを確認
  if (!results || results.length === 0) {
    res.status(400);
    throw new Error('少なくとも1つの点検結果が必要です');
  }
  
  // 点検項目の存在確認と結果の検証
  for (const result of results) {
    const inspectionItemExists = await InspectionItem.findById(result.inspection_item_id);
    if (!inspectionItemExists) {
      res.status(400);
      throw new Error(`点検項目ID ${result.inspection_item_id} が存在しません`);
    }
    
    if (!result.status || !['正常', '異常'].includes(result.status)) {
      res.status(400);
      throw new Error('点検結果ステータスは"正常"または"異常"である必要があります');
    }
  }
  
  // 点検を作成
  const inspection = await Inspection.create({
    inspection_date,
    start_time,
    end_time,
    inspector_name,
    device_id,
    status: status || '完了',
    results
  });
  
  if (inspection) {
    const populatedInspection = await Inspection.findById(inspection._id)
      .populate({
        path: 'device_id',
        select: 'device_name customer_id',
        populate: {
          path: 'customer_id',
          select: 'customer_name'
        }
      })
      .populate({
        path: 'results.inspection_item_id',
        select: 'item_name'
      });
    
    // 結果データを整形
    const formattedResults = populatedInspection.results.map(result => {
      return {
        id: result._id,
        inspection_item_id: result.inspection_item_id._id,
        check_item: result.inspection_item_id.item_name,
        status: result.status,
        checked_at: result.checked_at,
        device_id: populatedInspection.device_id._id,
        device_name: populatedInspection.device_id.device_name
      };
    });
    
    // レスポンス形式を調整
    const formattedInspection = {
      id: populatedInspection._id,
      inspection_date: populatedInspection.inspection_date,
      start_time: populatedInspection.start_time,
      end_time: populatedInspection.end_time,
      inspector_name: populatedInspection.inspector_name,
      device_id: populatedInspection.device_id._id,
      device_name: populatedInspection.device_id.device_name,
      customer_id: populatedInspection.device_id.customer_id._id,
      customer_name: populatedInspection.device_id.customer_id.customer_name,
      status: populatedInspection.status,
      results: formattedResults,
      created_at: populatedInspection.created_at,
      updated_at: populatedInspection.updated_at
    };
    
    res.status(201).json(formattedInspection);
  } else {
    res.status(400);
    throw new Error('無効な点検データです');
  }
});

// @desc    点検の更新
// @route   PUT /api/inspections/:id
// @access  Public
const updateInspection = asyncHandler(async (req, res) => {
  const { inspection_date, start_time, end_time, inspector_name, device_id, results, status } = req.body;
  
  const inspection = await Inspection.findById(req.params.id);
  
  if (inspection) {
    // 機器IDが変更された場合、新しい機器の存在確認
    if (device_id && device_id !== inspection.device_id.toString()) {
      const deviceExists = await Device.findById(device_id);
      if (!deviceExists) {
        res.status(400);
        throw new Error('指定された機器が存在しません');
      }
    }
    
    // 結果を更新する場合、点検項目の存在確認と結果の検証
    if (results && results.length > 0) {
      for (const result of results) {
        const inspectionItemExists = await InspectionItem.findById(result.inspection_item_id);
        if (!inspectionItemExists) {
          res.status(400);
          throw new Error(`点検項目ID ${result.inspection_item_id} が存在しません`);
        }
        
        if (!result.status || !['正常', '異常'].includes(result.status)) {
          res.status(400);
          throw new Error('点検結果ステータスは"正常"または"異常"である必要があります');
        }
      }
    }
    
    inspection.inspection_date = inspection_date || inspection.inspection_date;
    inspection.start_time = start_time !== undefined ? start_time : inspection.start_time;
    inspection.end_time = end_time !== undefined ? end_time : inspection.end_time;
    inspection.inspector_name = inspector_name || inspection.inspector_name;
    inspection.device_id = device_id || inspection.device_id;
    inspection.status = status || inspection.status;
    
    // 結果を更新
    if (results && results.length > 0) {
      inspection.results = results;
    }
    
    const updatedInspection = await inspection.save();
    const populatedInspection = await Inspection.findById(updatedInspection._id)
      .populate({
        path: 'device_id',
        select: 'device_name customer_id',
        populate: {
          path: 'customer_id',
          select: 'customer_name'
        }
      })
      .populate({
        path: 'results.inspection_item_id',
        select: 'item_name'
      });
    
    // 結果データを整形
    const formattedResults = populatedInspection.results.map(result => {
      return {
        id: result._id,
        inspection_item_id: result.inspection_item_id._id,
        check_item: result.inspection_item_id.item_name,
        status: result.status,
        checked_at: result.checked_at,
        device_id: populatedInspection.device_id._id,
        device_name: populatedInspection.device_id.device_name
      };
    });
    
    // レスポンス形式を調整
    const formattedInspection = {
      id: populatedInspection._id,
      inspection_date: populatedInspection.inspection_date,
      start_time: populatedInspection.start_time,
      end_time: populatedInspection.end_time,
      inspector_name: populatedInspection.inspector_name,
      device_id: populatedInspection.device_id._id,
      device_name: populatedInspection.device_id.device_name,
      customer_id: populatedInspection.device_id.customer_id._id,
      customer_name: populatedInspection.device_id.customer_id.customer_name,
      status: populatedInspection.status,
      results: formattedResults,
      created_at: populatedInspection.created_at,
      updated_at: populatedInspection.updated_at
    };
    
    res.json(formattedInspection);
  } else {
    res.status(404);
    throw new Error('点検が見つかりません');
  }
});

// @desc    点検の削除
// @route   DELETE /api/inspections/:id
// @access  Public
const deleteInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findById(req.params.id);
  
  if (inspection) {
    await inspection.deleteOne();
    res.json({ message: '点検を削除しました' });
  } else {
    res.status(404);
    throw new Error('点検が見つかりません');
  }
});

module.exports = {
  getInspections,
  getInspectionById,
  getInspectionsByDeviceId,
  createInspection,
  updateInspection,
  deleteInspection
};
