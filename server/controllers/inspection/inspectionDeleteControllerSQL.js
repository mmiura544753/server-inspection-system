// server/controllers/inspection/inspectionDeleteControllerSQL.js
const asyncHandler = require('express-async-handler');
const db = require('../../utils/db');

// @desc    点検の削除（SQLを使用）
// @route   DELETE /api/inspections/:id
// @access  Public
const deleteInspection = asyncHandler(async (req, res) => {
  const inspectionId = req.params.id;
  
  // 点検の存在確認
  const inspectionSql = 'SELECT id FROM inspections WHERE id = ?';
  const inspection = await db.queryOne(inspectionSql, [inspectionId]);
  
  if (!inspection) {
    res.status(404);
    throw new Error('点検が見つかりません');
  }
  
  // トランザクションを使用して関連レコードを削除
  return await db.transaction(async (conn) => {
    try {
      // 関連する点検結果を削除
      const deleteResultsSql = 'DELETE FROM inspection_results WHERE inspection_id = ?';
      await conn.query(deleteResultsSql, [inspectionId]);
      
      // 点検を削除
      const deleteInspectionSql = 'DELETE FROM inspections WHERE id = ?';
      await conn.query(deleteInspectionSql, [inspectionId]);
      
      res.json({ message: '点検を削除しました' });
    } catch (error) {
      console.error('点検削除エラー:', error);
      throw error;
    }
  });
});

module.exports = {
  deleteInspection
};
