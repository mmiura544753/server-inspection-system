// server/controllers/inspectionItem/inspectionItemDeleteController.js
const asyncHandler = require('express-async-handler');
const { InspectionItem } = require('../../models');

// @desc    点検項目の削除
// @route   DELETE /api/inspection-items/:id
// @access  Public
const deleteInspectionItem = asyncHandler(async (req, res) => {
  const item = await InspectionItem.findByPk(req.params.id);
  
  if (item) {
    await item.destroy();
    res.json({ message: '点検項目を削除しました' });
  } else {
    res.status(404);
    throw new Error('点検項目が見つかりません');
  }
});

module.exports = {
  deleteInspectionItem
};
