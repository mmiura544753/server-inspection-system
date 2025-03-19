// server/controllers/inspection/inspectionDeleteController.js (ORM版 - 新規生成)
const asyncHandler = require("express-async-handler");
const { Inspection, InspectionResult } = require("../../models");
const { sequelize } = require("../../config/db");

// @desc    点検の削除
// @route   DELETE /api/inspections/:id
// @access  Public
const deleteInspection = asyncHandler(async (req, res) => {
  const inspectionId = req.params.id;

  // 点検の存在確認
  const inspection = await Inspection.findByPk(inspectionId);

  if (!inspection) {
    res.status(404);
    throw new Error("点検が見つかりません");
  }

  // トランザクションを使用して点検と関連データを削除
  const transaction = await sequelize.transaction();

  try {
    // 関連する点検結果を削除
    await InspectionResult.destroy({
      where: { inspection_id: inspectionId },
      transaction,
    });

    // 点検を削除
    await Inspection.destroy({
      where: { id: inspectionId },
      transaction,
    });

    // コミット
    await transaction.commit();

    res.json({ message: "点検を削除しました" });
  } catch (error) {
    // ロールバック
    await transaction.rollback();
    console.error("点検削除エラー:", error);
    throw error;
  }
});

module.exports = {
  deleteInspection,
};
