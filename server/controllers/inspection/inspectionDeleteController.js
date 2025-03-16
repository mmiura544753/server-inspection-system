// server/controllers/inspection/inspectionDeleteController.js
const asyncHandler = require('express-async-handler');
const { Inspection, InspectionResult } = require('../../models');
const { sequelize } = require('../../config/db');

// @desc    点検の削除
// @route   DELETE /api/inspections/:id
// @access  Public
const deleteInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findByPk(req.params.id);
  
  if (inspection) {
    // トランザクションを使用して点検と関連データを削除
    const transaction = await sequelize.transaction();
    
    try {
      // 関連する点検結果を削除
      await InspectionResult.destroy({
        where: { inspection_id: inspection.id },
        transaction
      });
      
      // 点検を削除
      await inspection.destroy({ transaction });
      
      // コミット
      await transaction.commit();
      
      res.json({ message: '点検を削除しました' });
    } catch (error) {
      // ロールバック
      await transaction.rollback();
      console.error('点検削除エラー:', error);
      throw error;
    }
  } else {
    res.status(404);
    throw new Error('点検が見つかりません');
  }
});

module.exports = {
  deleteInspection
};
