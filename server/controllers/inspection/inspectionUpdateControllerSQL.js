// server/controllers/inspection/inspectionUpdateControllerSQL.js
const asyncHandler = require('express-async-handler');
const db = require('../../utils/db');

// @desc    点検の更新（SQLを使用）
// @route   PUT /api/inspections/:id
// @access  Public
const updateInspection = asyncHandler(async (req, res) => {
  const { inspection_date, start_time, end_time, inspector_name, device_id, results, status } = req.body;
  const inspectionId = req.params.id;
  
  // 点検の存在確認
  const inspectionSql = 'SELECT id FROM inspections WHERE id = ?';
  const inspection = await db.queryOne(inspectionSql, [inspectionId]);
  
  if (!inspection) {
    res.status(404);
    throw new Error('点検が見つかりません');
  }
  
  // 更新のための値を検証
  const fieldsToUpdate = {};
  
  if (inspection_date) fieldsToUpdate.inspection_date = inspection_date;
  if (start_time !== undefined) fieldsToUpdate.start_time = start_time || null;
  if (end_time !== undefined) fieldsToUpdate.end_time = end_time || null;
  if (inspector_name) fieldsToUpdate.inspector_name = inspector_name;
  if (status) fieldsToUpdate.status = status;
  
  // 機器IDが変更された場合、新しい機器の存在確認
  if (device_id) {
    const deviceSql = 'SELECT id FROM devices WHERE id = ?';
    const deviceExists = await db.queryOne(deviceSql, [device_id]);
    
    if (!deviceExists) {
      res.status(400);
      throw new Error('指定された機器が存在しません');
    }
    
    fieldsToUpdate.device_id = device_id;
  }
  
  // 結果を更新する場合、点検項目の存在確認と結果の検証
  if (results && results.length > 0) {
    for (const result of results) {
      const itemSql = 'SELECT id FROM inspection_items WHERE id = ?';
      const inspectionItemExists = await db.queryOne(itemSql, [result.inspection_item_id]);
      
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
  
  // トランザクションを使用して点検と結果を更新
  return await db.transaction(async (conn) => {
    try {
      // 点検レコードの更新
      if (Object.keys(fieldsToUpdate).length > 0) {
        // 更新するフィールドの設定
        const setClause = Object.keys(fieldsToUpdate)
          .map(key => `${key} = ?`)
          .join(', ');
        
        const updateInspectionSql = `
          UPDATE inspections
          SET ${setClause}, updated_at = NOW()
          WHERE id = ?
        `;
        
        const values = [...Object.values(fieldsToUpdate), inspectionId];
        await conn.query(updateInspectionSql, values);
      }
      
      // 結果を更新する場合
      if (results && results.length > 0) {
        // 既存の結果を削除
        const deleteResultsSql = 'DELETE FROM inspection_results WHERE inspection_id = ?';
        await conn.query(deleteResultsSql, [inspectionId]);
        
        // 新しい結果を作成
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
      }
      
      // 更新した点検の詳細情報を取得
      const updatedInspectionSql = `
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
      
      const inspectionData = await conn.query(updatedInspectionSql, [inspectionId]);
      const updatedInspection = inspectionData[0];
      
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
          device_id: updatedInspection.device_id,
          device_name: updatedInspection.device_name
        };
      });
      
      const formattedInspection = {
        id: updatedInspection.id,
        inspection_date: updatedInspection.inspection_date,
        start_time: updatedInspection.start_time,
        end_time: updatedInspection.end_time,
        inspector_name: updatedInspection.inspector_name,
        device_id: updatedInspection.device_id,
        device_name: updatedInspection.device_name,
        customer_id: updatedInspection.customer_id,
        customer_name: updatedInspection.customer_name,
        status: updatedInspection.status,
        results: formattedResults,
        created_at: updatedInspection.created_at,
        updated_at: updatedInspection.updated_at
      };
      
      res.json(formattedInspection);
    } catch (error) {
      console.error('点検更新エラー:', error);
      throw error;
    }
  });
});

module.exports = {
  updateInspection
};
