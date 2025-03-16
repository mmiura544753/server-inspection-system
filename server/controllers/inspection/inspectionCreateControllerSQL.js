// server/controllers/inspection/inspectionCreateControllerSQL.js
const asyncHandler = require('express-async-handler');
const db = require('../../utils/db');

// @desc    新規点検の作成（SQLを使用）
// @route   POST /api/inspections
// @access  Public
const createInspection = asyncHandler(async (req, res) => {
  const { inspection_date, start_time, end_time, inspector_name, device_id, results, status = '完了' } = req.body;
  
  // 必須フィールドのチェック
  if (!inspection_date || !inspector_name || !device_id) {
    res.status(400);
    throw new Error('必須フィールドが不足しています');
  }
  
  // 機器の存在確認
  const deviceSql = 'SELECT id FROM devices WHERE id = ?';
  const device = await db.queryOne(deviceSql, [device_id]);
  if (!device) {
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
    const itemSql = 'SELECT id FROM inspection_items WHERE id = ?';
    const inspectionItem = await db.queryOne(itemSql, [result.inspection_item_id]);
    if (!inspectionItem) {
      res.status(400);
      throw new Error(`点検項目ID ${result.inspection_item_id} が存在しません`);
    }
    
    if (!result.status || !['正常', '異常'].includes(result.status)) {
      res.status(400);
      throw new Error('点検結果ステータスは"正常"または"異常"である必要があります');
    }
  }
  
  // トランザクションを使用して点検と結果を保存
  return await db.transaction(async (conn) => {
    try {
      // 点検レコードの挿入
      const insertInspectionSql = `
        INSERT INTO inspections 
        (inspection_date, start_time, end_time, inspector_name, device_id, status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const inspectionResult = await conn.query(insertInspectionSql, [
        inspection_date,
        start_time || null,
        end_time || null,
        inspector_name,
        device_id,
        status
      ]);
      
      const inspectionId = inspectionResult.insertId;
      
      // 点検結果の挿入
      const insertResultSql = `
        INSERT INTO inspection_results 
        (inspection_id, inspection_item_id, status, checked_at, created_at, updated_at) 
        VALUES (?, ?, ?, NOW(), NOW(), NOW())
      `;
      
      for (const result of results) {
        await conn.query(insertResultSql, [
          inspectionId,
          result.inspection_item_id,
          result.status
        ]);
      }
      
      // 作成した点検の詳細情報を取得
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
      
      const inspection = await conn.query(inspectionSql, [inspectionId]);
      const createdInspection = inspection[0];
      
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
      
      const resultsList = await conn.query(resultsSql, [inspectionId]);
      
      // レスポンス形式を調整
      const formattedResults = resultsList.map(result => {
        return {
          id: result.id,
          inspection_item_id: result.inspection_item_id,
          check_item: result.check_item,
          status: result.status,
          checked_at: result.checked_at,
          device_id: createdInspection.device_id,
          device_name: createdInspection.device_name
        };
      });
      
      const formattedInspection = {
        id: createdInspection.id,
        inspection_date: createdInspection.inspection_date,
        start_time: createdInspection.start_time,
        end_time: createdInspection.end_time,
        inspector_name: createdInspection.inspector_name,
        device_id: createdInspection.device_id,
        device_name: createdInspection.device_name,
        customer_id: createdInspection.customer_id,
        customer_name: createdInspection.customer_name,
        status: createdInspection.status,
        results: formattedResults,
        created_at: createdInspection.created_at,
        updated_at: createdInspection.updated_at
      };
      
      res.status(201).json(formattedInspection);
    } catch (error) {
      console.error('点検作成エラー:', error);
      throw error;
    }
  });
});

module.exports = {
  createInspection
};
