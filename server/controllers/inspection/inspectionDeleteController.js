// server/controllers/inspection/inspectionDeleteController.js
const asyncHandler = require('express-async-handler');
const { sequelize, Inspection, InspectionResult } = require('../../models');

// @desc    点検の削除
// @route   DELETE /api/inspections/:id
// @access  Public
const deleteInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findByPk(req.params.id);
  
  if (!inspection) {
    res.status(404);
    throw new Error('点検が見つかりません');
  }
  
  // トランザクションを開始
  const t = await sequelize.transaction();
  
  try {
    // 関連する点検結果を削除
    await InspectionResult.destroy({
      where: { inspection_id: inspection.id },
      transaction: t
    });
    
    // 点検を削除
    await inspection.destroy({ transaction: t });
    
    // トランザクションをコミット
    await t.commit();
    
    res.json({ message: '点検を削除しました' });
  } catch (error) {
    // エラーが発生した場合はロールバック
    await t.rollback();
    throw error;
  }
});

module.exports = {
  deleteInspection
};
