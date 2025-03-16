// server/controllers/inspection/indexSQL.js
const {
  getInspections,
  getInspectionById,
  getInspectionsByDeviceId,
  getLatestInspectionByDeviceId
} = require('./inspectionControllerSQL');
const { createInspection } = require('./inspectionCreateControllerSQL');
const { updateInspection } = require('./inspectionUpdateControllerSQL');
const { deleteInspection } = require('./inspectionDeleteControllerSQL');

// 全てのSQL版点検コントローラー関数をエクスポート
module.exports = {
  getInspections,
  getInspectionById,
  getInspectionsByDeviceId,
  getLatestInspectionByDeviceId,
  createInspection,
  updateInspection,
  deleteInspection
};
